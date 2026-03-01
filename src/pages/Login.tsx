import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-twitch border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/collection" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-3xl font-bold">Connexion</h1>
      <p className="text-gray-400 text-center max-w-md">
        Connecte-toi avec ton compte Twitch pour voir ta collection de badges,
        tes points, et echanger avec d'autres viewers.
      </p>
      <button
        onClick={login}
        className="flex items-center gap-3 px-6 py-3 bg-twitch hover:bg-twitch-dark text-white font-semibold rounded-xl transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
        </svg>
        Se connecter avec Twitch
      </button>
    </div>
  );
}
