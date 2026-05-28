export const PHONE_TILTS = [-4, 3, -2, 5, -3, 2, -1, 4] as const;

export function phoneTilt(index: number): number {
  return PHONE_TILTS[index % PHONE_TILTS.length];
}
