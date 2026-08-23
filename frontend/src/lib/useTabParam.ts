import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Onglet actif porté par l'URL (`?tab=trophees`) plutôt que par un état local.
 *
 * Deux bénéfices : le bouton retour du navigateur reparcourt les onglets, et une URL d'onglet
 * peut être mise en favori ou partagée. Une valeur inconnue retombe sur la valeur par défaut, qui
 * n'est jamais écrite dans l'URL (une page fraîche reste propre).
 */
export function useTabParam<K extends string>(key: string, fallback: K, valid: readonly K[]): [K, (next: K) => void] {
    const [params, setParams] = useSearchParams();
    const raw = params.get(key) as K | null;
    const value = raw && valid.includes(raw) ? raw : fallback;

    const setValue = useCallback(
        (next: K) => {
            const updated = new URLSearchParams(params);
            if (next === fallback) updated.delete(key);
            else updated.set(key, next);
            setParams(updated); // push : le retour navigateur revient à l'onglet précédent
        },
        [params, setParams, key, fallback],
    );

    return [value, setValue];
}
