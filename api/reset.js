import { timingSafeEqual } from "node:crypto";
import { redis, K, readBody, send } from "./_lib/db.js";

// POST /api/reset {key}  — organiser only, key is the ADMIN_KEY env var
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  const expected = process.env.ADMIN_KEY || "";
  const key = String(readBody(req).key || "");
  const ok = expected.length >= 12 && key.length === expected.length &&
    timingSafeEqual(Buffer.from(key), Buffer.from(expected));
  if (!ok) return send(res, 403, { error: "forbidden" });
  await redis.del(K.names, K.devices, K.scores, K.raw);
  send(res, 200, { ok: true });
}
