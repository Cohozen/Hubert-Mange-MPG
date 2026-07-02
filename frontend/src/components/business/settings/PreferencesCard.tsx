import { SETTINGS_BARS, SettingsCard } from "@/components/business/settings/SettingsCard";

/** Interrupteur visuel désactivé (préférences pas encore branchées). */
function FakeSwitch({ on }: { on?: boolean }) {
    return (
        <span
            className={`relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full border transition ${
                on ? "border-menthe/50 bg-menthe/30" : "border-bord bg-nuit"
            }`}
            aria-hidden
        >
            <span
                className={`absolute size-[22px] rounded-full bg-texte-2 transition-all ${on ? "left-[26px]" : "left-1"}`}
            />
        </span>
    );
}

function SoonBadge() {
    return (
        <span className="rounded-full border border-violet-clair/40 bg-violet-clair/[0.12] px-2.5 py-1 font-display text-[9px] font-black uppercase tracking-[1px] text-violet-clair lg:text-[10px]">
            Bientôt
        </span>
    );
}

/** Préférences (thème + notifications) — affichées mais désactivées pour l'instant. */
export function PreferencesCard() {
    return (
        <SettingsCard bar={SETTINGS_BARS.preferences} title="Préférences">
            <div className="flex items-center justify-between border-b border-bord py-3.5 opacity-70">
                <div>
                    <div className="text-sm font-bold text-white lg:text-[15px]">Thème de l'application</div>
                    <div className="mt-1 text-[11px] text-texte-2 lg:text-xs">Sombre · par défaut</div>
                </div>
                <div className="flex items-center gap-2.5">
                    <SoonBadge />
                    <FakeSwitch />
                </div>
            </div>
            <div className="flex items-center justify-between py-3.5">
                <div>
                    <div className="text-sm font-bold text-[#C7CEEF] lg:text-[15px]">Notifications</div>
                    <div className="mt-1 text-[11px] text-texte-2 lg:text-xs">Résultats, mercato, rappels de mise</div>
                </div>
                <SoonBadge />
            </div>
        </SettingsCard>
    );
}
