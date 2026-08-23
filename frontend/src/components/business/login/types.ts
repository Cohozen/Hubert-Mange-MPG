/** Chiffres d'ambiance du hero de connexion (GET /api/public/teaser, non authentifié). */
export type LoginTeaser = {
    /** Saison réelle en cours, ex. "2026/2027". */
    saison: string | null;
    /** Nombre d'équipes de la saison jeu en cours. */
    equipes: number;
    /** Nombre de ligues MPG successives au palmarès (une ligue = une édition). */
    editions: number;
    /** Nombre de divisions de la saison jeu en cours. */
    divisions: number;
};
