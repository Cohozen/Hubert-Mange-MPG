import { useId } from "react";
import { cn } from "@/lib/utils";

const SHIELD = "M150 16 L264 50 L264 180 Q264 268 150 320 Q36 268 36 180 L36 50 Z";

/**
 * Logo « Broadcast » (art officiel — docs/mockups/logo/lhm-logo-broadcast-transparent.svg).
 * - variant "mark" (défaut) : écusson dégradé + étoiles + « LHM » (pour la coquille).
 * - variant "full" : badge complet avec « LIGUE HUBERT MANGE » + année (login / splash).
 */
export function Logo({
    size = 38,
    variant = "mark",
    className,
}: {
    size?: number;
    variant?: "mark" | "full";
    className?: string;
}) {
    const gradId = useId();
    const clipId = useId();
    const vbHeight = variant === "full" ? 340 : 322;
    return (
        <svg
            viewBox={`0 0 300 ${vbHeight}`}
            height={size}
            width={(size * 300) / vbHeight}
            className={cn("shrink-0", className)}
            role="img"
            aria-label="Ligue Hubert Mange"
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#6d28d9" />
                    <stop offset="0.55" stopColor="#ff2d78" />
                    <stop offset="1" stopColor="#ff6b35" />
                </linearGradient>
                <clipPath id={clipId}>
                    <path d={SHIELD} />
                </clipPath>
            </defs>
            <path d={SHIELD} fill={`url(#${gradId})`} />
            <g clipPath={`url(#${clipId})`} opacity="0.12">
                <line x1="36" y1="90" x2="264" y2="90" stroke="#fff" strokeWidth="20" />
                <line x1="36" y1="150" x2="264" y2="150" stroke="#fff" strokeWidth="20" />
                <line x1="36" y1="210" x2="264" y2="210" stroke="#fff" strokeWidth="20" />
            </g>
            <polygon points="90,70 93,79 102,79 95,85 98,94 90,88 82,94 85,85 78,79 87,79" fill="#fff" />
            <polygon points="150,56 153,65 162,65 155,71 158,80 150,74 142,80 145,71 138,65 147,65" fill="#fff" />
            <polygon points="210,70 213,79 222,79 215,85 218,94 210,88 202,94 205,85 198,79 207,79" fill="#fff" />
            <text
                x="150"
                y="205"
                textAnchor="middle"
                fontFamily="Archivo, 'Arial Black', sans-serif"
                fontSize="74"
                fontWeight="900"
                fill="#fff"
                letterSpacing="-2"
            >
                LHM
            </text>
            {variant === "full" && (
                <>
                    <text
                        x="150"
                        y="250"
                        textAnchor="middle"
                        fontFamily="Archivo, 'Arial Black', sans-serif"
                        fontSize="13"
                        fontWeight="800"
                        fill="#fff"
                        letterSpacing="1"
                        opacity="0.95"
                    >
                        LIGUE HUBERT MANGE
                    </text>
                    <text
                        x="150"
                        y="278"
                        textAnchor="middle"
                        fontFamily="Archivo, 'Arial Black', sans-serif"
                        fontSize="13"
                        fontWeight="900"
                        fill="#0a0e27"
                        letterSpacing="3"
                    >
                        2023
                    </text>
                </>
            )}
        </svg>
    );
}
