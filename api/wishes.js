import { randomUUID } from "node:crypto";
import { redis, validDevice, readBody, send } from "./_lib/db.js";
import { W, cleanText, hasLink, listWishes } from "./_lib/wishes.js";

// GET  /api/wishes?device=ID          -> {wishes:[{id,n,w,t,l,me}]}
// POST /api/wishes {name,text,device} -> {wish} | 400 {error} | 429 {error:"slow_down"}
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const device = validDevice(req.query?.device) ? req.query.device : null;
      return send(res, 200, { wishes: await listWishes(device) });
    }
    if (req.method !== "POST") return send(res, 405, { error: "method" });

    const body = readBody(req);
    const n = cleanText(body.name, 30), w = cleanText(body.text, 140);
    if (n.length < 2 || w.length < 3) return send(res, 400, { error: "too_short" });
    if (hasLink(n) || hasLink(w)) return send(res, 400, { error: "no_links" });
    if (!validDevice(body.device)) return send(res, 400, { error: "device" });

    const count = await redis.incr(W.rate(body.device));
    if (count === 1) await redis.expire(W.rate(body.device), 600);
    if (count > 5) return send(res, 429, { error: "slow_down" });

    const id = randomUUID().slice(0, 12);
    const wish = { n, w, t: Date.now() };
    await redis.hset(W.data, { [id]: wish });
    await redis.lpush(W.list, id);
    send(res, 200, { wish: { id, ...wish, l: 0, me: false } });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "server" });
  }
}
