import { timingSafeEqual } from "node:crypto";
import { redis, readBody, send } from "./_lib/db.js";
import { W } from "./_lib/wishes.js";

// POST /api/wish-delete {id, key}  — organiser only
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  const { id, key } = readBody(req);
  const expected = process.env.ADMIN_KEY || "";
  const k = String(key || "");
  const ok = expected.length >= 12 && k.length === expected.length && timingSafeEqual(Buffer.from(k), Buffer.from(expected));
  if (!ok) return send(res, 403, { error: "forbidden" });
  if (typeof id !== "string") return send(res, 400, { error: "bad" });
  await Promise.all([redis.lrem(W.list, 0, id), redis.hdel(W.data, id), redis.hdel(W.likes, id)]);
  send(res, 200, { ok: true });
}
