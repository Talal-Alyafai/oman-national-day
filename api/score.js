import { redis, K, composite, playerSummary, readBody, send } from "./_lib/db.js";

// POST /api/score {token, score, correct, final}  ->  {me}
// Called after every answer. Scores can only go up and must be consistent
// with the scoring rules (50-100 points per correct answer, 10 questions).
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  try {
    const { token, score, correct, final } = readBody(req);
    if (typeof token !== "string" || token.length > 64) return send(res, 400, { error: "token" });
    const norm = await redis.get(K.tok(token));
    if (!norm) return send(res, 410, { error: "expired" });

    const s = Number(score), c = Number(correct);
    const raw = (await redis.hget(K.raw, String(norm))) || { s: 0, c: 0, final: false };
    const valid = Number.isInteger(s) && Number.isInteger(c) && c >= 0 && c <= 10 &&
      s >= c * 50 && s <= c * 100 && s >= raw.s && c >= raw.c && !raw.final;
    if (!valid) return send(res, 422, { error: "invalid" });

    const next = { ...raw, s, c, final: !!final };
    await Promise.all([
      redis.hset(K.raw, { [String(norm)]: next }),
      redis.zadd(K.scores, { score: composite(s), member: String(norm) }),
      final ? redis.del(K.tok(token)) : null,
    ]);
    send(res, 200, { me: await playerSummary(String(norm)) });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "server" });
  }
}
