import Prando from "prando";

export function randomInt(seed: string) {
  const random = new Prando(seed);
  return random.nextInt(0, Number.MAX_SAFE_INTEGER);
}
