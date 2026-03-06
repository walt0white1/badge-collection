export interface ArcInfo {
  name: string;
  subtitle: string;
  status: "active" | "archive";
}

export const ARC_CONFIG: Record<string, ArcInfo> = {
  saison2: {
    name: "Kuroko",
    subtitle: "Kuroko no Basket",
    status: "active",
  },
  saison1: {
    name: "Sub Badges",
    subtitle: "Les originaux",
    status: "archive",
  },
};
