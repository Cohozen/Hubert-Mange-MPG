import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, Link } from "react-router-dom";
import { Wallet, Trophy, BarChart3, User, Settings, LogOut, Sun, Moon } from "lucide-react";
import { isLeagueAdmin, useAuth, useLogout } from "./auth/useAuth";
import { Avatar } from "./components/Manager";
import LoginPage from "./pages/LoginPage";
import CagnottePage from "./pages/CagnottePage";
import PalmaresPage from "./pages/PalmaresPage";
import StatsPage from "./pages/StatsPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Wallet;
  end?: boolean;
  desktopHidden?: boolean;
}

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "emerald");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "emerald" : "dark")) };
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="btn btn-sm btn-ghost btn-circle" aria-label="Thème">
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function App() {
  const { data: me, isLoading } = useAuth();
  const logout = useLogout();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!me) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  const items: NavItem[] = [
    { to: "/", label: "Palmarès", icon: Trophy, end: true },
    { to: "/stats", label: "Stats", icon: BarChart3 },
    { to: "/cagnotte", label: "Cagnotte", icon: Wallet },
    { to: "/profil", label: "Profil", icon: User, desktopHidden: true },
    ...(isLeagueAdmin(me) ? [{ to: "/admin", label: "Admin", icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-base-200">
      {/* Barre du haut */}
      <header className="navbar bg-base-100 border-b border-base-300 px-4 sticky top-0 z-30">
        <div className="flex-1">
          <Link to="/" className="text-lg font-bold text-primary">
            Hubert Mange MPG
          </Link>
        </div>
        {/* Onglets desktop */}
        <nav className="hidden sm:flex items-center gap-1">
          {items.filter((it) => !it.desktopHidden).map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `btn btn-sm btn-ghost gap-2 ${isActive ? "btn-active text-primary" : ""}`
              }
            >
              <it.icon size={16} />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1 ml-2">
          <Link to="/profil" className="hidden sm:flex items-center gap-2 mr-1 hover:opacity-80">
            <Avatar url={me.avatarUrl} name={me.displayName} size={28} />
            <span className="text-sm opacity-70">{me.displayName}</span>
          </Link>
          <ThemeToggle />
          <button onClick={logout} className="btn btn-sm btn-ghost btn-circle" aria-label="Déconnexion">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Contenu (padding bas pour la nav mobile) */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6">
        <Routes>
          <Route path="/" element={<PalmaresPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/cagnotte" element={<CagnottePage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/admin" element={isLeagueAdmin(me) ? <AdminPage /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Nav mobile (barre du bas) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-base-100 border-t border-base-300 flex justify-around">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 flex-1 text-xs ${
                isActive ? "text-primary" : "opacity-60"
              }`
            }
          >
            <it.icon size={20} />
            {it.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
