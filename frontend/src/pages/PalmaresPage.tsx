import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { api } from "../api/client";
import { ManagerLabel } from "../components/Manager";

interface DivisionWinner {
  season: string;
  realSeason: string;
  division: string;
  level: number;
  winner: string | null;
  username: string | null;
  avatarUrl: string | null;
  team: string | null;
  mpgUrl: string | null;
}
interface CupRow {
  id: string;
  name: string;
  competition: string;
  year: number;
  winner: string | null;
  username: string | null;
  avatarUrl: string | null;
  mpgUrl: string | null;
}
interface CupCount {
  managerId: string;
  manager: string;
  ldc: number;
  uefa: number;
  conference: number;
  total: number;
}

export default function PalmaresPage() {
  const winners = useQuery({
    queryKey: ["winners"],
    queryFn: () => api<{ divisionWinners: DivisionWinner[] }>("/api/palmares/winners"),
  });
  const cups = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => api<{ list: CupRow[]; ranking: CupCount[] }>("/api/palmares/tournaments"),
  });

  const [fSeason, setFSeason] = useState("");
  const [fDiv, setFDiv] = useState("");
  const allWinners = winners.data?.divisionWinners ?? [];
  const seasonOptions = [...new Set(allWinners.map((w) => w.realSeason))];
  const divisionOptions = [...new Set(allWinners.map((w) => w.division))].sort();
  const filteredWinners = allWinners.filter(
    (w) => (!fSeason || w.realSeason === fSeason) && (!fDiv || w.division === fDiv)
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-3">🏆 Coupes</h2>
        {cups.data?.ranking.length ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {cups.data.ranking.map((m) => (
              <span key={m.managerId} className="badge badge-lg gap-1">
                {m.manager} · {"⭐".repeat(m.ldc)}{"🎖️".repeat(m.uefa)}{"🏵️".repeat(m.conference)}
              </span>
            ))}
          </div>
        ) : null}
        <div className="grid sm:grid-cols-3 gap-4">
          <CupColumn
            title="Ligue des Crampons"
            icon="⭐"
            rows={cups.data?.list.filter((c) => c.competition === "LDC")}
          />
          <CupColumn
            title="Heureux papa's League"
            icon="🎖️"
            rows={cups.data?.list.filter((c) => c.competition === "UEFA")}
          />
          <CupColumn
            title="Heureux papa's League Conference"
            icon="🏵️"
            rows={cups.data?.list.filter((c) => c.competition === "CONFERENCE")}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Vainqueurs par saison</h2>
        {allWinners.length ? (
          <>
            <div className="flex gap-2 mb-3">
              <select
                value={fSeason}
                onChange={(e) => setFSeason(e.target.value)}
                className="select select-bordered select-sm flex-1 min-w-0"
              >
                <option value="">Toutes les saisons</option>
                {seasonOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={fDiv}
                onChange={(e) => setFDiv(e.target.value)}
                className="select select-bordered select-sm flex-1 min-w-0"
              >
                <option value="">Toutes les divisions</option>
                {divisionOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {(fSeason || fDiv) && (
                <button
                  onClick={() => { setFSeason(""); setFDiv(""); }}
                  className="btn btn-sm btn-square btn-ghost shrink-0"
                  aria-label="Réinitialiser"
                >
                  ✕
                </button>
              )}
            </div>
            {/* Mobile : cartes */}
            <div className="sm:hidden space-y-2">
              {filteredWinners.map((w, i) => (
                <div key={i} className="card bg-base-100 shadow">
                  <div className="card-body p-3">
                    <div className="flex justify-between items-center gap-2">
                      <ManagerLabel name={w.winner} username={w.username} avatarUrl={w.avatarUrl} size={26} />
                      <span className="badge badge-sm shrink-0">{w.division}</span>
                    </div>
                    {w.team && <div className="text-sm opacity-80 italic">🏟️ {w.team}</div>}
                    <div className="flex justify-between items-center">
                      <span className="text-xs opacity-60">{w.season}</span>
                      {w.mpgUrl && (
                        <a
                          href={w.mpgUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="link link-primary text-xs inline-flex items-center gap-1"
                        >
                          MPG <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop : tableau */}
            <div className="hidden sm:block card bg-base-100 shadow overflow-x-auto">
              <table className="table table-md">
                <thead>
                  <tr>
                    <th>Saison</th>
                    <th>Division</th>
                    <th>Vainqueur</th>
                    <th>Équipe</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWinners.map((w, i) => (
                    <tr key={i}>
                      <td className="whitespace-nowrap">{w.season}</td>
                      <td>{w.division}</td>
                      <td>
                        <ManagerLabel name={w.winner} username={w.username} avatarUrl={w.avatarUrl} size={26} />
                      </td>
                      <td className="italic opacity-80">{w.team ?? "—"}</td>
                      <td>
                        {w.mpgUrl && (
                          <a
                            href={w.mpgUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="link link-primary inline-flex items-center gap-1"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <Empty />
        )}
      </section>
    </div>
  );
}

function CupColumn({ title, icon, rows }: { title: string; icon: string; rows?: CupRow[] }) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4">
        <h3 className="font-semibold mb-1">{title}</h3>
        {rows?.length ? (
          <ul className="space-y-2">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="opacity-60 w-10 shrink-0">{c.year}</span>
                <span className="flex-1 min-w-0 flex items-center gap-1">
                  <span className="shrink-0">{icon}</span>
                  <ManagerLabel name={c.winner} username={c.username} avatarUrl={c.avatarUrl} size={22} />
                </span>
                <a
                  href={c.mpgUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="link link-primary shrink-0"
                  aria-label="Voir sur MPG"
                >
                  <ExternalLink size={14} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm opacity-60">Pas encore de données.</p>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body text-sm opacity-60">Pas encore de données.</div>
    </div>
  );
}
