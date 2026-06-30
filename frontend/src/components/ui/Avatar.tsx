export function Avatar({ url, name, size = 24 }: { url?: string | null; name?: string | null; size?: number }) {
    if (url) {
        return (
            <img
                src={url}
                alt={name ?? ""}
                className="shrink-0 rounded-full bg-bord object-cover"
                style={{ width: size, height: size }}
                loading="lazy"
            />
        );
    }
    const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
    return (
        <div
            className="grid shrink-0 place-items-center rounded-full font-display font-black text-white grad-banner"
            style={{ width: size, height: size, fontSize: size * 0.42 }}
        >
            {initial}
        </div>
    );
}
