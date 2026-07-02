/** Interrupteur on/off Broadcast (contrôlé). */
export function ToggleSwitch({
    on,
    onChange,
    disabled,
    label,
}: {
    on: boolean;
    onChange: (on: boolean) => void;
    disabled?: boolean;
    label?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!on)}
            className={`relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                on ? "border-menthe/60 bg-menthe/30" : "border-bord bg-nuit"
            }`}
        >
            <span
                className={`absolute size-[22px] rounded-full transition-all ${
                    on ? "left-[26px] bg-menthe" : "left-1 bg-texte-2"
                }`}
            />
        </button>
    );
}
