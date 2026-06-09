import { Avatar } from "@/components/ui/Avatar";

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
