import { redis } from "./db.js";

export const W = {
  list: "w:list",                 // list of wish ids, newest first
  data: "w:data",                 // hash id -> {n, w, t}
  likes: "w:likes",               // hash id -> like count
  liked: (d) => `w:liked:${d}`,   // set of ids this device liked
  rate: (d) => `w:rate:${d}`,     // posts by this device in the last 10 min
};
export const MAX_SHOWN = 300;

export const cleanText = (s, max) =>
  String(s || "").replace(/[\u0000-\u001F\u007F<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
export const hasLink = (s) => /(https?:\/\/|www\.|\.[a-z]{2,6}\/|@[a-z0-9_]{3,})/i.test(s);

export async function listWishes(device) {
  const ids = (await redis.lrange(W.list, 0, MAX_SHOWN - 1)).map(String);
  if (!ids.length) return [];
  const [data, likes, mine] = await Promise.all([
    redis.hmget(W.data, ...ids),
    redis.hmget(W.likes, ...ids),
    device ? redis.smembers(W.liked(device)) : Promise.resolve([]),
  ]);
  const mineSet = new Set((mine || []).map(String));
  return ids
    .filter((id) => data?.[id])
    .map((id) => ({ id, n: data[id].n, w: data[id].w, t: data[id].t, l: Number(likes?.[id] || 0), me: mineSet.has(id) }));
}
