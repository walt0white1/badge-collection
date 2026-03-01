import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-6xl font-extrabold text-gray-700">404</h1>
      <p className="text-gray-400">Cette page n'existe pas.</p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-twitch hover:bg-twitch-dark text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Retour a l'accueil
      </Link>
    </div>
  );
}
