import Prando from "prando";

export function randomBuffer(size: number, seed: string) {
  const random = new Prando(seed);
  const hash = Buffer.alloc(size);
  for (let i = 0; i < hash.length; i++) {
    hash[i] = random.nextInt(0, 255);
  }
  return hash;
}
