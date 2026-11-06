import { redis, validDevice, readBody, send } from "./_lib/db.js";
import { W } from "./_lib/wishes.js";

// POST /api/wish-like {id, device} -> {l, me}   (toggles this device's like)
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  try {
    const { id, device } = readBody(req);
    if (typeof id !== "string" || id.length > 40 || !validDevice(device)) return send(res, 400, { error: "bad" });
    if (!(await redis.hexists(W.data, id))) return send(res, 404, { error: "gone" });
    const added = await redis.sadd(W.liked(device), id);
    let l;
    if (added) l = await redis.hincrby(W.likes, id, 1);
    else { await redis.srem(W.liked(device), id); l = Math.max(0, await redis.hincrby(W.likes, id, -1)); }
    send(res, 200, { l, me: !!added });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "server" });
  }
}
