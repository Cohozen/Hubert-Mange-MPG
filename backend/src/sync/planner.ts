import { Cron } from "croner";
import { config } from "../config.js";
import { prisma } from "../db/client.js";

/**
 * Planificateur du sync automatique : décide, à chaque tick, s'il faut synchroniser et sur quel
 * périmètre. La décision ne coûte **aucun appel MPG** — uniquement deux lectures en base.
 *
 * Pourquoi pas un simple cron ? Parce que MPG ne date les matchs qu'à la **journée**, jamais au
 * match (cf. `championshipGameWeekDates` dans sync.ts) : le seul horodatage disponible est le coup
 * d'envoi du premier match de la journée L1. On croise donc deux sources :
 *  - une **grille de créneaux** calée sur les horaires Ligue 1, fixes toute la saison ;
 *  - une **garde « journée en cours »** lue en base, qui éteint la grille hors journée.
 *
 * C'est cette garde qui rend le planning auto-adaptatif : trêve internationale, intersaison ou
 * journée décalée au mardi n'exigent aucun réglage — un cron hebdomadaire fixe, lui, tape dans le
 * vide ou rate la journée.
 */

export type SyncScope = "full" | "current";

export interface Slot {
    /** Expression cron du créneau (une seule occurrence hebdomadaire ou quotidienne). */
    cron: string;
    scope: SyncScope;
    /** Le créneau ne déclenche que si une journée est effectivement en cours. */
    requiresWindow: boolean;
    label: string;
}

/**
 * Fenêtre de rattrapage : un créneau reste « à honorer » pendant ce délai. Couvre un redémarrage
 * Railway, un tick manqué, et surtout une indisponibilité MPG passagère — un run échoué ne met pas
 * à jour `lastSuccess`, donc le tick suivant retente le même créneau jusqu'à expiration.
 * ⚠️ Doit rester inférieur à l'écart minimal entre deux créneaux de la grille (2 h 15).
 */
export const CATCH_UP_MS = 2 * 60 * 60 * 1000;

/** Au-delà, une journée non close est considérée abandonnée (MPG n'a jamais posé `finalResult`). */
const WINDOW_MAX_AGE_MS = 4 * 24 * 60 * 60 * 1000;

/**
 * Créneaux « journée en cours », calés ~10 min après la fin de chaque créneau Ligue 1 2026-2027
 * (ven 20h45 · sam 17h15 et 20h45 · dim 15h00, 17h15 et 20h45), plus les soirées de semaine pour
 * les journées de rattrapage. Surchargeable par `SYNC_SLOTS`.
 * Jour cron : 0 = dimanche … 6 = samedi.
 */
const DEFAULT_MATCHDAY_SLOTS: Slot[] = [
    { cron: "45 22 * * 5", scope: "current", requiresWindow: true, label: "ven 22:45" },
    { cron: "15 19 * * 6", scope: "current", requiresWindow: true, label: "sam 19:15" },
    { cron: "45 22 * * 6", scope: "current", requiresWindow: true, label: "sam 22:45" },
    { cron: "0 17 * * 0", scope: "current", requiresWindow: true, label: "dim 17:00" },
    { cron: "15 19 * * 0", scope: "current", requiresWindow: true, label: "dim 19:15" },
    { cron: "45 22 * * 0", scope: "current", requiresWindow: true, label: "dim 22:45" },
    { cron: "30 20 * * 2,3,4", scope: "current", requiresWindow: true, label: "mar–jeu 20:30" },
    { cron: "15 23 * * 2,3,4", scope: "current", requiresWindow: true, label: "mar–jeu 23:15" },
];

/**
 * Créneaux inconditionnels (sans garde). Le lundi matin fait le run **complet** : MPG a clos la
 * journée (`finalResult`) et c'est le seul moment où l'on re-parcourt tout l'historique. Les autres
 * matins font un run léger de battement de cœur, qui rattrape une panne de la veille.
 */
const BASE_SLOTS: Slot[] = [
    { cron: "30 8 * * 1", scope: "full", requiresWindow: false, label: "lun 08:30 (complet)" },
    { cron: "30 8 * * 0,2,3,4,5,6", scope: "current", requiresWindow: false, label: "tous les jours 08:30" },
];

const DAYS: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

/**
 * Parse la surcharge `SYNC_SLOTS` : "fri 22:45, sat 19:15, sat 22:45".
 * Une entrée = un jour + une heure ; plusieurs jours ⇒ plusieurs entrées.
 * Une entrée invalide est ignorée avec un avertissement : un réglage d'env mal tapé ne doit pas
 * empêcher le serveur de démarrer, mais il ne doit pas non plus passer inaperçu.
 */
export function parseSlots(raw: string): Slot[] {
    const slots: Slot[] = [];
    for (const entry of raw.split(",").map((s) => s.trim())) {
        if (!entry) continue;
        const m = entry.match(/^([a-z]{3})\s+(\d{1,2}):(\d{2})$/i);
        if (!m) {
            console.warn(`SYNC_SLOTS : entrée ignorée « ${entry} » (format attendu : "fri 22:45").`);
            continue;
        }
        const day = DAYS[m[1].toLowerCase()];
        const hour = Number(m[2]);
        const min = Number(m[3]);
        if (day === undefined || hour > 23 || min > 59) {
            console.warn(`SYNC_SLOTS : entrée hors bornes « ${entry} » (jours : mon…sun, heure : 0-23).`);
            continue;
        }
        slots.push({ cron: `${min} ${hour} * * ${day}`, scope: "current", requiresWindow: true, label: entry });
    }
    return slots;
}

/**
 * Grille effective : créneaux inconditionnels + créneaux de journée (surchargés ou par défaut),
 * chacun avec sa sonde croner. Construite une seule fois : la config est figée au démarrage, et on
 * ne veut ni reparser `SYNC_SLOTS` (ni re-logguer ses avertissements) à chaque tick.
 * Les sondes n'ont pas de handler : elles ne planifient rien, elles calculent des occurrences.
 */
let compiled: { slot: Slot; probe: Cron }[] | null = null;

function grid(): { slot: Slot; probe: Cron }[] {
    if (!compiled) {
        const custom = config.syncSlots.trim() ? parseSlots(config.syncSlots) : [];
        const all = [...BASE_SLOTS, ...(custom.length ? custom : DEFAULT_MATCHDAY_SLOTS)];
        compiled = all.map((slot) => ({ slot, probe: new Cron(slot.cron, { timezone: config.syncTz }) }));
    }
    return compiled;
}

export function slots(): Slot[] {
    return grid().map((g) => g.slot);
}

/** Résumé lisible de la grille, pour les logs et `GET /api/sync/config`. */
export function describeSlots(): string {
    return slots()
        .map((s) => s.label)
        .join(" · ");
}

/**
 * Vérifie que deux créneaux ne sont jamais espacés de moins que la fenêtre de rattrapage : sinon
 * `crossedSlot` ne retient que le plus récent et le premier est silencieusement perdu. La grille
 * par défaut respecte cette contrainte (2 h 15 au minimum) ; une surcharge `SYNC_SLOTS` peut la
 * violer, et ça ne se verrait nulle part ailleurs. Contrôlé sur 14 jours d'occurrences réelles.
 */
export function validateGrid(): string[] {
    const from = new Date();
    const until = new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
    const occurrences: { at: Date; label: string }[] = [];
    for (const { slot, probe } of grid()) {
        let at = probe.nextRun(from);
        while (at && at < until) {
            occurrences.push({ at, label: slot.label });
            at = probe.nextRun(at);
        }
    }
    occurrences.sort((a, b) => a.at.getTime() - b.at.getTime());
    const seen = new Set<string>();
    const warnings: string[] = [];
    for (let i = 1; i < occurrences.length; i++) {
        const gap = occurrences[i].at.getTime() - occurrences[i - 1].at.getTime();
        if (gap >= CATCH_UP_MS) continue;
        const pair = `${occurrences[i - 1].label} → ${occurrences[i].label}`;
        if (seen.has(pair)) continue;
        seen.add(pair);
        warnings.push(`« ${pair} » sont espacés de moins de ${CATCH_UP_MS / 3600000} h : le premier sera ignoré.`);
    }
    return warnings;
}

/**
 * Dernier créneau franchi dans la fenêtre de rattrapage, ou `null`. Fonction pure (pas de base).
 *
 * Croner gère lui-même le fuseau et l'heure d'été : on lui demande la première occurrence après
 * `now - CATCH_UP_MS` et on la retient si elle est déjà passée. Comme deux créneaux de la grille
 * sont toujours espacés de plus de `CATCH_UP_MS`, au plus un candidat par créneau.
 */
export function crossedSlot(now: Date): { slot: Slot; at: Date } | null {
    const since = new Date(now.getTime() - CATCH_UP_MS);
    let best: { slot: Slot; at: Date } | null = null;
    for (const { slot, probe } of grid()) {
        const at = probe.nextRun(since);
        if (!at || at > now) continue;
        if (!best || at > best.at) best = { slot, at };
    }
    return best;
}

/** Prochaine occurrence de la grille après `now`, tous créneaux confondus. */
export function nextSlot(now: Date = new Date()): { slot: Slot; at: Date } | null {
    let best: { slot: Slot; at: Date } | null = null;
    for (const { slot, probe } of grid()) {
        const at = probe.nextRun(now);
        if (!at) continue;
        if (!best || at < best.at) best = { slot, at };
    }
    return best;
}

/**
 * Une journée est-elle en cours à l'instant `at` ?
 *
 * Un match dont le coup d'envoi est passé mais qui n'est pas encore clos (`played: false` — ce qui
 * couvre aussi les matchs `live`) signe une journée ouverte. Dès que MPG pose `finalResult` sur
 * toute la journée, la fenêtre se referme et les créneaux du soir redeviennent silencieux.
 */
export async function isMatchdayWindowOpen(at: Date): Promise<boolean> {
    const started = await prisma.match.count({
        where: {
            played: false,
            kickoffAt: { lte: at, gte: new Date(at.getTime() - WINDOW_MAX_AGE_MS) },
        },
    });
    return started > 0;
}

/** Date de début du dernier sync réussi ; `scope: "full"` restreint aux runs complets. */
export async function lastSuccessAt(scope?: SyncScope): Promise<Date | null> {
    const run = await prisma.syncRun.findFirst({
        where: {
            status: "success",
            // `scope: null` = run antérieur au planner, donc complet par construction.
            ...(scope === "full" ? { OR: [{ scope: "full" }, { scope: null }] } : {}),
        },
        orderBy: { startedAt: "desc" },
        select: { startedAt: true },
    });
    return run?.startedAt ?? null;
}

export type SyncDecision = { run: false; reason: string } | { run: true; scope: SyncScope; reason: string };

export interface DecisionInput {
    crossed: { slot: Slot; at: Date } | null;
    windowOpen: boolean;
    /** Début du dernier sync réussi, tous périmètres confondus. */
    lastAnyAt: Date | null;
    /** Début du dernier sync **complet** réussi. */
    lastFullAt: Date | null;
}

/**
 * Règle de décision, isolée de toute I/O pour être rejouable (`npm run sync:plan`).
 *
 * Un run complet satisfait aussi un créneau léger : on compare donc au dernier succès du bon
 * périmètre. On compare sur `startedAt` et non `finishedAt` : un run démarré avant le créneau a lu
 * les données d'avant le créneau, il ne l'honore pas.
 */
export function decide(input: DecisionInput): SyncDecision {
    const { crossed, windowOpen, lastAnyAt, lastFullAt } = input;
    if (!crossed) return { run: false, reason: "aucun créneau franchi" };
    const { slot, at } = crossed;
    if (slot.requiresWindow && !windowOpen) {
        return { run: false, reason: `créneau ${slot.label} — hors journée` };
    }
    const covered = slot.scope === "full" ? lastFullAt : lastAnyAt;
    if (covered && covered >= at) {
        return { run: false, reason: `créneau ${slot.label} déjà honoré` };
    }
    return { run: true, scope: slot.scope, reason: `créneau ${slot.label}` };
}

/** Décision pour l'instant `now`, en lisant l'état réel de la base. */
export async function decideSync(now: Date = new Date()): Promise<SyncDecision> {
    const crossed = crossedSlot(now);
    if (!crossed) return { run: false, reason: "aucun créneau franchi" };
    const [windowOpen, lastAnyAt, lastFullAt] = await Promise.all([
        crossed.slot.requiresWindow ? isMatchdayWindowOpen(now) : Promise.resolve(true),
        lastSuccessAt(),
        lastSuccessAt("full"),
    ]);
    return decide({ crossed, windowOpen, lastAnyAt, lastFullAt });
}
