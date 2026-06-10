import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";

export function ManagerLabel({
    name,
    username,
    avatarUrl,
    managerId,
    size = 24,
    showPseudo = true,
}: {
    name?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
    managerId?: string | null;
    size?: number;
    showPseudo?: boolean;
}) {
    const content = (
        <>
            <Avatar url={avatarUrl} name={name} size={size} />
            <span className="truncate">
                {name ?? "—"}
                {showPseudo && username && <span className="opacity-50 text-xs ml-1">{username}</span>}
            </span>
        </>
    );

    if (managerId) {
        return (
            <Link to={`/profil/${managerId}`} className="inline-flex items-center gap-2 min-w-0 hover:underline">
                {content}
            </Link>
        );
    }

    return <span className="inline-flex items-center gap-2 min-w-0">{content}</span>;
}
