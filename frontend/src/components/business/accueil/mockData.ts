/**
 * Données FACTICES du dashboard Accueil.
 *
 * TODO backend : ces données ne sont pas (encore) exposées par l'API. Le rang en
 * cours, le budget mercato, le dernier/prochain match et le compte à rebours sont
 * des placeholders. À remplacer par de vrais endpoints (état de la saison, mercato,
 * calendrier) — voir le hors-périmètre du plan V2. Le palmarès pourra être branché
 * sur /api/palmares quand on câblera la vraie donnée.
 */

export type SeasonPhase = "enCours" | "inter" | "estivale";

/** Phase de saison simulée — flip pour prévisualiser les 3 états. */
export const PHASE: SeasonPhase = "enCours";

export interface CupSummary {
    code: "LDC" | "UEFA" | "CONFERENCE";
    label: string;
    icon: string;
    count: number;
    years: string;
    color: string; // var(--color-*)
}

export interface DivisionSummary {
    code: string;
    title: string;
    note: string;
    value: string;
    valueLabel: string;
    accent: string; // var(--color-*)
}

export interface FormResult {
    r: "V" | "N" | "D";
}

export const accueilMock = {
    division: "Division 1",
    context: {
        enCours: "Saison 2025/2026 · Edition 3 · Journée 34",
        inter: "Saison 3 terminée · Saison 4 à venir",
        estivale: "Trêve estivale · reprise à venir",
    } satisfies Record<SeasonPhase, string>,

    rank: {
        position: 2,
        suffix: "e",
        delta: 1,
        points: 38,
        progressPct: 72,
        journeesLeft: 4,
        nextOpponent: "M. Leroy",
        nextJournee: 35,
    },

    mercato: {
        budget: "14,2",
        unit: "M€",
        closesIn: "2j 04h 12m",
    },

    cagnotte: {
        estimate: "+45€",
        note: "Finir sur le podium = +20€",
    },

    lastMatch: {
        journee: 34,
        me: { initials: "HM", name: "Hubert Mange", score: 3 },
        opponent: { initials: "JD", name: "J. Dupont", score: 1 },
        form: ["V", "V", "N", "V", "D"] as FormResult["r"][],
        next: { initials: "ML", name: "M. Leroy", journee: 35, inDays: 3 },
    },

    interSeason: {
        badge: "Saison 3 terminée",
        title: "Saison 4\nen préparation",
        text: "Classement final figé. Promotions et relégations en cours de calcul — le nouveau calendrier arrive très vite.",
        finalPosition: "2e · D1",
        finalNote: "Maintenu en élite",
        kickoff: "~3 sem.",
        kickoffNote: "Calendrier à venir",
    },

    summerBreak: {
        countdown: { days: 42, hours: 12, minutes: 30 },
        text: "On attend le coup d'envoi de la nouvelle saison réelle pour relancer la Ligue Hubert Mange.",
    },

    palmares: {
        trophies: 7,
        cups: [
            { code: "LDC", label: "LDC", icon: "⭐", count: 1, years: "2024", color: "var(--color-menthe)" },
            { code: "UEFA", label: "EUROPA", icon: "🎖️", count: 2, years: "2023 · 25", color: "var(--color-jaune)" },
            {
                code: "CONFERENCE",
                label: "CONF.",
                icon: "🍐",
                count: 1,
                years: "2022",
                color: "var(--color-violet-clair)",
            },
        ] satisfies CupSummary[],
        divisions: [
            {
                code: "D1",
                title: "Division 1 · Élite",
                note: "Champion en titre",
                value: "×3",
                valueLabel: "Titres",
                accent: "var(--color-jaune)",
            },
            {
                code: "D2",
                title: "Division 2",
                note: "Promu en D1",
                value: "×1",
                valueLabel: "Montée",
                accent: "var(--color-violet-clair)",
            },
            {
                code: "D5",
                title: "Division 5",
                note: "Division de départ",
                value: "2021",
                valueLabel: "Début",
                accent: "var(--color-texte-2)",
            },
        ] satisfies DivisionSummary[],
    },
};
