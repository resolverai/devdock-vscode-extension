import { ec as EC } from "elliptic";
const ec = new EC("p256");

export const keyGen = (): { privateKey: string; publicKey: string } => {
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate("hex");
  const publicKey = keyPair.getPublic("hex").slice(2);
  return { privateKey, publicKey };
};
