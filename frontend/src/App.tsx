import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth, useLogout } from "@/auth/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import AccueilPage from "@/pages/AccueilPage";
import CagnottePage from "@/pages/CagnottePage";
import LoginPage from "@/pages/LoginPage";
import PalmaresPage from "@/pages/PalmaresPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import StatsPage from "@/pages/StatsPage";

/** Force le thème sombre « Broadcast » (dark-only au départ). */
function useDarkTheme() {
    useEffect(() => {
        document.documentElement.classList.add("dark");
    }, []);
}

function FullScreenLoader() {
    return (
        <div className="grid min-h-screen place-items-center bg-nuit">
            <div className="size-10 animate-spin rounded-full border-4 border-bord border-t-rose" />
        </div>
    );
}

export default function App() {
    useDarkTheme();
    const { data: me, isLoading } = useAuth();
    const logout = useLogout();

    if (isLoading) {
        return <FullScreenLoader />;
    }

    if (!me) {
        return (
            <Routes>
                <Route path="*" element={<LoginPage />} />
            </Routes>
        );
    }

    return (
        <AppShell me={me} onLogout={logout}>
            <Routes>
                <Route path="/" element={<AccueilPage />} />
                <Route path="/palmares" element={<PalmaresPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/cagnotte" element={<CagnottePage />} />
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="/profil/:managerId" element={<ProfilePage />} />
                <Route path="/parametres" element={<SettingsPage />} />
                <Route path="/admin" element={<Navigate to="/parametres" />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </AppShell>
    );
}
