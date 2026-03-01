export const BADGE_IMAGES: Record<string, Record<string, string>> = {
  saison1: {
    COMMON:    "/s1-badge-common.png",
    RARE:      "/s1-badge-rare.png",
    EPIC:      "/s1-badge-epic.png",
    LEGENDARY: "/s1-badge-legendary.png",
    UNIQUE:    "/s1-badge-unique.png",
  },
  saison2: {
    COMMON:    "/badge-common.png",
    RARE:      "/badge-rare.png",
    EPIC:      "/badge-epic.png",
    LEGENDARY: "/badge-legendary.gif",
    UNIQUE:    "/badge-unique.gif",
  },
};

export function getBadgeImage(rarity: string, season: string): string {
  const s = season?.toLowerCase() || "saison2";
  const r = rarity?.toUpperCase() || "COMMON";
  return (BADGE_IMAGES[s] ?? BADGE_IMAGES.saison2)[r] ?? BADGE_IMAGES.saison2.COMMON;
}
