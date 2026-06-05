export function Avatar({
  url,
  name,
  size = 24,
}: {
  url?: string | null;
  name?: string | null;
  size?: number;
}) {
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

export function ManagerLabel({
  name,
  username,
  avatarUrl,
  size = 24,
  showPseudo = true,
}: {
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  size?: number;
  showPseudo?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <Avatar url={avatarUrl} name={name} size={size} />
      <span className="truncate">
        {name ?? "—"}
        {showPseudo && username && (
          <span className="opacity-50 text-xs ml-1">{username}</span>
        )}
      </span>
    </span>
  );
}
