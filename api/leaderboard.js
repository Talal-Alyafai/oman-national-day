import { redis, K, fromComposite, playerSummary, validDevice, send } from "./_lib/db.js";

// GET /api/leaderboard?device=ID  ->  { top:[{n,s}], total, me }
export default async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "method" });
  try {
    const flat = await redis.zrange(K.scores, 0, 9, { rev: true, withScores: true });
    const members = [], scores = [];
    for (let i = 0; i < flat.length; i += 2) { members.push(String(flat[i])); scores.push(flat[i + 1]); }
    const names = members.length ? await redis.hmget(K.names, ...members) : {};
    const top = members.map((m, i) => ({ n: names?.[m] ?? m, s: fromComposite(scores[i]) }));
    const total = await redis.zcard(K.scores);

    let me = null;
    const device = req.query?.device;
    if (validDevice(device)) {
      const norm = await redis.hget(K.devices, device);
      if (norm) me = await playerSummary(String(norm));
    }
    send(res, 200, { top, total, me });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "server" });
  }
}
