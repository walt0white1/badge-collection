interface Props {
  seasons: string[];
  active: string;
  onChange: (s: string) => void;
}

export default function SeasonTabs({ seasons, active, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-gray-900/60 rounded-lg p-1 w-fit">
      {seasons.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active === s
              ? "bg-twitch text-white"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
          }`}
        >
          {s.replace("saison", "Saison ")}
        </button>
      ))}
    </div>
  );
}
