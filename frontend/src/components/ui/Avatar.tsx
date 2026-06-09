export function Avatar({ url, name, size = 24 }: { url?: string | null; name?: string | null; size?: number }) {
    if (url) {
        return (
            <img
                src={url}
                alt={name ?? ""}
                className="rounded-full object-cover bg-base-300 shrink-0"
                style={{ width: size, height: size }}
                loading="lazy"
            />
        );
    }
    const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
    return (
        <div
            className="rounded-full bg-base-300 text-base-content/70 grid place-items-center shrink-0 font-semibold"
            style={{ width: size, height: size, fontSize: size * 0.45 }}
        >
            {initial}
        </div>
    );
}
