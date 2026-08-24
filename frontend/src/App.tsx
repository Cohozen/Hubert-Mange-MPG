import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { isLeagueAdmin, useAuth, useLogout } from "@/auth/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { Loader } from "@/components/ui/Loader";
import AccueilPage from "@/pages/AccueilPage";
import AdministrationPage from "@/pages/AdministrationPage";
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

export default function App() {
    useDarkTheme();
    const { data: me, isLoading } = useAuth();
    const logout = useLogout();

    if (isLoading) {
        return <Loader fullScreen />;
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
                <Route
                    path="/administration"
                    element={isLeagueAdmin(me) ? <AdministrationPage /> : <Navigate to="/" />}
                />
                <Route path="/admin" element={<Navigate to="/administration" />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </AppShell>
    );
}
