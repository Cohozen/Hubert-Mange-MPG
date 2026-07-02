/**
 * Styles dérivés pour l'affichage des joueurs dans la Rétro (maquette V2) :
 * tuile à initiales dégradée déterministe + chips titres/coupes color-codés.
 * (Cf. convention « initiales colorées partout + pseudo ».)
 */

export interface Chip {
    label: string;
    count: string;
    c: string;
    bg: string;
    bd: string;
}

const GRADIENTS: { grad: string; txt: string }[] = [
    { grad: "linear-gradient(135deg,#6D28D9,#FF2D78,#FF6B35)", txt: "#ffffff" },
    { grad: "linear-gradient(135deg,#6D28D9,#A78BFA)", txt: "#ffffff" },
    { grad: "linear-gradient(135deg,#FF2D78,#FF6B35)", txt: "#ffffff" },
    { grad: "linear-gradient(135deg,#FFD23F,#FF6B35)", txt: "#3D2E00" },
    { grad: "linear-gradient(135deg,#00E5A0,#34D399)", txt: "#06251A" },
    { grad: "linear-gradient(135deg,#A78BFA,#FF2D78)", txt: "#ffffff" },
    { grad: "linear-gradient(135deg,#00E5A0,#6D28D9)", txt: "#ffffff" },
    { grad: "linear-gradient(135deg,#FF6B35,#FFD23F)", txt: "#3D2E00" },
];

/** Dégradé de tuile stable pour un joueur (dérivé de son id/nom). */
export function playerGradient(seed: string): { grad: string; txt: string } {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return GRADIENTS[h % GRADIENTS.length];
}

export function initials(name?: string | null): string {
    if (!name) return "—";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

const DIV: Record<number, { c: string; bg: string; bd: string }> = {
    1: { c: "#FFD23F", bg: "rgba(255,210,63,.13)", bd: "rgba(255,210,63,.42)" },
    2: { c: "#A78BFA", bg: "rgba(167,139,250,.13)", bd: "rgba(167,139,250,.42)" },
    3: { c: "#FF2D78", bg: "rgba(255,45,120,.13)", bd: "rgba(255,45,120,.42)" },
    4: { c: "#FF6B35", bg: "rgba(255,107,53,.13)", bd: "rgba(255,107,53,.42)" },
    5: { c: "#00E5A0", bg: "rgba(0,229,160,.13)", bd: "rgba(0,229,160,.42)" },
    6: { c: "#8B92C4", bg: "rgba(139,146,196,.13)", bd: "rgba(139,146,196,.42)" },
};
const DIV_NEUTRAL = { c: "#8B92C4", bg: "rgba(139,146,196,.13)", bd: "rgba(139,146,196,.42)" };
const CUP = {
    ldc: { c: "#00E5A0", bg: "rgba(0,229,160,.13)", bd: "rgba(0,229,160,.42)" },
    uefa: { c: "#FFD23F", bg: "rgba(255,210,63,.13)", bd: "rgba(255,210,63,.42)" },
    conference: { c: "#A78BFA", bg: "rgba(167,139,250,.13)", bd: "rgba(167,139,250,.42)" },
};

/** Chips de titres par division (index 0 = D1). */
export function divChips(titles: number[]): Chip[] {
    const out: Chip[] = [];
    titles.forEach((n, i) => {
        if (n > 0) out.push({ label: `D${i + 1}`, count: n > 1 ? `×${n}` : "", ...(DIV[i + 1] ?? DIV_NEUTRAL) });
    });
    return out;
}

/** Chips de coupes (⭐ LDC · 🎖️ Europa · 🍐 Conférence). */
export function cupChips(cups: { ldc: number; uefa: number; conference: number }): Chip[] {
    const out: Chip[] = [];
    if (cups.ldc > 0) out.push({ label: "⭐", count: cups.ldc > 1 ? `×${cups.ldc}` : "", ...CUP.ldc });
    if (cups.uefa > 0) out.push({ label: "🎖️", count: cups.uefa > 1 ? `×${cups.uefa}` : "", ...CUP.uefa });
    if (cups.conference > 0)
        out.push({ label: "🍐", count: cups.conference > 1 ? `×${cups.conference}` : "", ...CUP.conference });
    return out;
}
