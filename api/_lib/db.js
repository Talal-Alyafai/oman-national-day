import { Redis } from "@upstash/redis";

// Works with either env var naming that the Upstash/Vercel integration provides.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export const K = {
  names: "lb:names",     // hash   normName -> display name
  devices: "lb:devices", // hash   deviceId -> normName
  scores: "lb:scores",   // zset   normName -> composite score
  raw: "lb:raw",         // hash   normName -> {s, c, final, t0}
  tok: (t) => `lb:tok:${t}`, // string token -> normName (expires)
};

export const normName = (n) => n.trim().replace(/\s+/g, " ").toLowerCase();
export const cleanName = (n) =>
  String(n || "").replace(/[\u0000-\u001F\u007F<>]/g, "").trim().replace(/\s+/g, " ").slice(0, 24);
export const validDevice = (d) => typeof d === "string" && /^[A-Za-z0-9-]{8,64}$/.test(d);

// Higher score first; for equal scores, whoever reached it earlier ranks higher.
export const composite = (s, now = Date.now()) => s * 1e10 + (1e10 - Math.floor(now / 1000));
export const fromComposite = (c) => Math.floor(Number(c) / 1e10);

export async function playerSummary(norm) {
  const [name, raw, rank, total] = await Promise.all([
    redis.hget(K.names, norm),
    redis.hget(K.raw, norm),
    redis.zrevrank(K.scores, norm),
    redis.zcard(K.scores),
  ]);
  if (!name) return null;
  return { n: name, s: raw?.s ?? 0, final: !!raw?.final, rank: rank == null ? null : rank + 1, total };
}

export function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

export function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return {}; }
}
