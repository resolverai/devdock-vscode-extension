// File: ./sign.js
import { ec as EC } from "elliptic";
import { hash } from "./hash";
const ex = new EC("p256");

export const sign = (privateKey: string, message: string) => {
  const key = ex.keyFromPrivate(Buffer.from(privateKey, "hex"));
  const sig = key.sign(hash(message));
  const n = 32;
  const r = sig.r.toArrayLike(Buffer, "be", n);
  const s = sig.s.toArrayLike(Buffer, "be", n);
  return Buffer.concat([r, s]).toString("hex");
};
