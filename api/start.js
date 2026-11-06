import { randomUUID } from "node:crypto";
import { redis, K, normName, cleanName, validDevice, composite, playerSummary, readBody, send } from "./_lib/db.js";

// POST /api/start {name, device}
//  200 {token}  |  409 {error:"name_taken"}  |  409 {error:"device_played", me}
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  try {
    const body = readBody(req);
    const name = cleanName(body.name);
    if (name.length < 2) return send(res, 400, { error: "name_required" });
    const norm = normName(name);
    const device = validDevice(body.device) ? body.device : null;

    if (device) {
      const prev = await redis.hget(K.devices, device);
      if (prev) return send(res, 409, { error: "device_played", me: await playerSummary(String(prev)) });
    }
    // reserve the name atomically
    const gotName = await redis.hsetnx(K.names, norm, name);
    if (!gotName) return send(res, 409, { error: "name_taken" });
    if (device) {
      const gotDevice = await redis.hsetnx(K.devices, device, norm);
      if (!gotDevice) {
        await redis.hdel(K.names, norm);
        const prev = await redis.hget(K.devices, device);
        return send(res, 409, { error: "device_played", me: prev ? await playerSummary(String(prev)) : null });
      }
    }
    const token = randomUUID();
    const now = Date.now();
    await Promise.all([
      redis.set(K.tok(token), norm, { ex: 3600 }),
      redis.hset(K.raw, { [norm]: { s: 0, c: 0, final: false, t0: now } }),
      // counted from the very start: leaving or reloading mid-game keeps the score so far
      redis.zadd(K.scores, { score: composite(0, now), member: norm }),
    ]);
    send(res, 200, { token });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "server" });
  }
}
