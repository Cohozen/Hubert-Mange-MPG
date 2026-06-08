import { Fragment, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { api, eurosToCents, formatMoney } from "../api/client";
import { canEditCagnotte, useAuth } from "../auth/useAuth";
import { ManagerLabel } from "../components/Manager";

interface SeasonRow {
  id: string;
  name: string;
  year: number;
  closed: boolean;
  poolId: string | null;
}
interface Contribution {
  id: string;
  managerId: string;
  manager: string;
  username: string | null;
  avatarUrl: string | null;
  amount: number;
  paid: boolean;
}
interface Payout {
  id: string;
  managerId: string;
  manager: string;
  username: string | null;
  avatarUrl: string | null;
  amount: number;
  reason: string;
  paid: boolean;
}
interface PoolDetail {
  id: string;
  season: string;
  closed: boolean;
  buyInAmount: number;
  totalExpected: number;
  totalCollected: number;
  totalPaidOut: number;
  balance: number;
  contributions: Contribution[];
  payouts: Payout[];
}

export default function CagnottePage() {
  const { data: me } = useAuth();
  const editor = canEditCagnotte(me);
  const [selId, setSelId] = useState<string | null>(null);

  const seasons = useQuery({
    queryKey: ["cagnotte-seasons"],
    queryFn: () => api<SeasonRow[]>("/api/cagnotte/seasons"),
  });

  // Onglets : membres → saisons avec cagnotte ; éditeurs → toutes les saisons (pour en créer).
  // Triés par année croissante ; par défaut on ouvre la saison la plus récente.
  const tabs = (seasons.data ?? [])
    .filter((s) => s.poolId || editor)
    .sort((a, b) => a.year - b.year);
  const current = tabs.find((s) => s.id === selId) ?? tabs[tabs.length - 1];

  if (seasons.isLoading) return null;
  if (!tabs.length) {
    return (
      <p className="text-sm opacity-60 bg-base-100 rounded-box shadow p-6">
        Aucune cagnotte disponible.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((s) => {
          const active = current?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelId(s.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                active
                  ? "bg-primary text-primary-content shadow"
                  : "bg-base-100 border border-base-300 hover:bg-base-200"
              }`}
            >
              {s.name}
              {s.closed && <span className="ml-1">🔒</span>}
            </button>
          );
        })}
      </div>

      {current && <SeasonView key={current.id} season={current} editor={editor} />}
    </div>
  );
}

function SeasonView({ season, editor }: { season: SeasonRow; editor: boolean }) {
  const qc = useQueryClient();
  const detail = useQuery({
    queryKey: ["pool", season.poolId],
    queryFn: () => api<PoolDetail>(`/api/cagnotte/${season.poolId}`),
    enabled: !!season.poolId,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["cagnotte-seasons"] });
    if (season.poolId) qc.invalidateQueries({ queryKey: ["pool", season.poolId] });
  };

  if (!season.poolId) {
    if (!editor) {
      return (
        <p className="text-sm opacity-60 bg-base-100 rounded-box shadow p-6">
          Pas encore de cagnotte pour cette saison.
        </p>
      );
    }
    return <CreatePool season={season} onCreated={refresh} />;
  }

  if (!detail.data) return null;
  return <PoolView pool={detail.data} editor={editor} onChange={refresh} />;
}

// Démarrage d'une cagnotte : on enregistre la mise (crée la cagnotte au passage).
function CreatePool({ season, onCreated }: { season: SeasonRow; onCreated: () => void }) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    try {
      await api("/api/cagnotte", {
        method: "POST",
        body: JSON.stringify({ realSeasonId: season.id, buyInAmount: eurosToCents(val) }),
      });
      onCreated();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="bg-base-100 rounded-box shadow p-6 space-y-3">
      <h3 className="font-semibold">Démarrer la cagnotte {season.name}</h3>
      <p className="text-sm opacity-60">Indique la mise par joueur pour créer la cagnotte.</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="opacity-70">Mise par joueur (€)</span>
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="input input-bordered input-sm mt-1 block w-32"
          />
        </label>
        <button onClick={create} disabled={busy || !val} className="btn btn-sm btn-primary">
          Enregistrer la mise
        </button>
      </div>
    </div>
  );
}

function PoolView({
  pool,
  editor,
  onChange,
}: {
  pool: PoolDetail;
  editor: boolean;
  onChange: () => void;
}) {
  const canEdit = editor && !pool.closed;

  async function setClosed(closed: boolean) {
    await api(`/api/cagnotte/${pool.id}/closed`, { method: "PUT", body: JSON.stringify({ closed }) });
    onChange();
  }

  return (
    <div className="space-y-6">
      {pool.closed && (
        <div className="flex items-center justify-between gap-2 text-sm bg-warning/20 text-warning border border-warning/30 rounded-lg px-4 py-2">
          <span>🔒 Cagnotte clôturée — consultation seule.</span>
          {editor && (
            <button onClick={() => setClosed(false)} className="btn btn-xs">Rouvrir</button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Mise / joueur" value={formatMoney(pool.buyInAmount)} />
        <Stat
          label="Collecté"
          value={formatMoney(pool.totalCollected)}
          sub={`/ ${formatMoney(pool.totalExpected)} attendu`}
        />
        <Stat label="Reversé" value={formatMoney(pool.totalPaidOut)} />
        <Stat label="Solde" value={formatMoney(pool.balance)} />
      </div>

      {canEdit && <BuyInEditor pool={pool} onChange={onChange} />}
      <ContributionsPanel pool={pool} canEdit={canEdit} onChange={onChange} />
      {canEdit && <RulesEditor poolId={pool.id} onChange={onChange} />}
      <PayoutsPanel pool={pool} canEdit={canEdit} onChange={onChange} />

      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => setClosed(true)} className="btn btn-sm btn-outline btn-warning">
            🔒 Clôturer la cagnotte
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-base-100 rounded-box shadow p-4">
      <div className="text-xs opacity-60">{label}</div>
      <div className="text-lg font-bold text-base-content whitespace-nowrap">{value}</div>
      {sub && <div className="text-xs opacity-50 whitespace-nowrap">{sub}</div>}
    </div>
  );
}

function BuyInEditor({ pool, onChange }: { pool: PoolDetail; onChange: () => void }) {
  const [val, setVal] = useState(String(pool.buyInAmount / 100));
  const [busy, setBusy] = useState(false);
  const saved = eurosToCents(val) === pool.buyInAmount;
  const canInit = pool.buyInAmount > 0 && saved;

  async function saveMise() {
    setBusy(true);
    try {
      await api(`/api/cagnotte/${pool.id}`, {
        method: "PUT",
        body: JSON.stringify({ buyInAmount: eurosToCents(val) }),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  }
  async function initParticipants() {
    setBusy(true);
    try {
      await api(`/api/cagnotte/${pool.id}/init-participants`, { method: "POST" });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-base-100 rounded-box shadow p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
      <label className="text-sm">
        <span className="opacity-70">Mise par joueur (€)</span>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="input input-bordered input-sm mt-1 block w-full sm:w-32"
        />
      </label>
      <div className="flex gap-2">
        <button onClick={saveMise} disabled={busy || saved} className="btn btn-sm flex-1 sm:flex-none">
          Enregistrer la mise
        </button>
        <button
          onClick={initParticipants}
          disabled={busy || !canInit}
          className="btn btn-sm btn-primary flex-1 sm:flex-none"
          title={canInit ? "Crée une ligne par membre actif de la saison" : "Enregistre d'abord la mise"}
        >
          Initialiser les participants
        </button>
      </div>
    </div>
  );
}

function ContributionsPanel({
  pool,
  canEdit,
  onChange,
}: {
  pool: PoolDetail;
  canEdit: boolean;
  onChange: () => void;
}) {
  async function togglePaid(c: Contribution) {
    await api(`/api/cagnotte/${pool.id}/contributions/${c.managerId}`, {
      method: "PUT",
      body: JSON.stringify({ paid: !c.paid }),
    });
    onChange();
  }
  return (
    <div className="collapse collapse-arrow bg-base-100 rounded-box shadow">
      <input type="checkbox" defaultChecked />
      <div className="collapse-title font-semibold bg-base-200 min-h-0 py-3">
        Mises ({pool.contributions.filter((c) => c.paid).length}/{pool.contributions.length} payées)
      </div>
      <div className="collapse-content !p-0">
      {pool.contributions.length ? (
        <ul className="divide-y divide-base-200">
          {pool.contributions.map((c) => (
            <li key={c.id} className="flex items-center gap-2 p-3 text-sm">
              <span className="flex-1 min-w-0">
                <ManagerLabel name={c.manager} username={c.username} avatarUrl={c.avatarUrl} size={26} />
              </span>
              <span className="opacity-60 shrink-0">{formatMoney(c.amount)}</span>
              {canEdit ? (
                <button
                  onClick={() => togglePaid(c)}
                  className={`shrink-0 text-xs rounded-full px-3 py-1 ${
                    c.paid ? "bg-success text-success-content" : "bg-base-300"
                  }`}
                >
                  {c.paid ? "✓ payé" : "à payer"}
                </button>
              ) : (
                <span className={`shrink-0 ${c.paid ? "text-success" : "opacity-40"}`}>
                  {c.paid ? "✓" : "—"}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-3 text-sm opacity-60">
          Aucun participant. {canEdit && "Définis la mise puis « initialiser les participants »."}
        </p>
      )}
      </div>
    </div>
  );
}

function PayoutsPanel({
  pool,
  canEdit,
  onChange,
}: {
  pool: PoolDetail;
  canEdit: boolean;
  onChange: () => void;
}) {
  const [qrFor, setQrFor] = useState<string | null>(null);

  async function togglePaid(p: Payout) {
    await api(`/api/cagnotte/payouts/${p.id}`, { method: "PUT", body: JSON.stringify({ paid: !p.paid }) });
    onChange();
  }
  async function remove(p: Payout) {
    await api(`/api/cagnotte/payouts/${p.id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="collapse collapse-arrow bg-base-100 rounded-box shadow">
      <input type="checkbox" defaultChecked />
      <div className="collapse-title font-semibold bg-base-200 min-h-0 py-3">
        Reversements ({pool.payouts.filter((p) => p.paid).length}/{pool.payouts.length} versés)
      </div>
      <div className="collapse-content !p-0">
      {pool.payouts.length ? (
        <ul className="divide-y divide-base-200">
          {pool.payouts.map((p) => (
            <Fragment key={p.id}>
              <li className="flex flex-wrap items-center gap-2 p-3 text-sm">
                <span className="flex-1 min-w-0">
                  <ManagerLabel name={p.manager} username={p.username} avatarUrl={p.avatarUrl} size={26} />
                  <span className="block text-xs opacity-60 ml-8 -mt-0.5">{p.reason}</span>
                </span>
                <span className="font-medium shrink-0">{formatMoney(p.amount)}</span>
                {canEdit ? (
                  <span className="flex gap-1 shrink-0">
                    <button onClick={() => setQrFor(qrFor === p.id ? null : p.id)} className="btn btn-xs">💳 Payer</button>
                    <button
                      onClick={() => togglePaid(p)}
                      className={`btn btn-xs ${p.paid ? "btn-success" : "btn-ghost bg-base-300"}`}
                    >
                      {p.paid ? "✓ versé" : "à verser"}
                    </button>
                    <button onClick={() => remove(p)} className="btn btn-xs btn-ghost text-error">
                      <Trash2 size={14} />
                    </button>
                  </span>
                ) : (
                  <span className={`shrink-0 ${p.paid ? "text-success" : "opacity-40"}`}>
                    {p.paid ? "✓ versé" : "—"}
                  </span>
                )}
              </li>
              {qrFor === p.id && (
                <li className="p-3 bg-base-200">
                  <PayQr managerId={p.managerId} />
                </li>
              )}
            </Fragment>
          ))}
        </ul>
      ) : (
        <p className="p-3 text-sm opacity-60">
          Aucun reversement. {canEdit && "Règle la grille de gains puis « Générer les reversements »."}
        </p>
      )}
      </div>
    </div>
  );
}

function RulesEditor({ poolId, onChange }: { poolId: string; onChange: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["rules", poolId],
    queryFn: () =>
      api<{
        rules: { scope: string; divisionLevel: number | null; amount: number }[];
        divisionLevels: number[];
        competitions: string[];
      }>(`/api/cagnotte/${poolId}/rules`),
  });
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [ldc, setLdc] = useState("");
  const [uefa, setUefa] = useState("");
  const [busy, setBusy] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const m: Record<number, string> = {};
    for (const r of data.rules) {
      if (r.scope === "DIVISION" && r.divisionLevel) m[r.divisionLevel] = String(r.amount / 100);
      if (r.scope === "LDC") setLdc(String(r.amount / 100));
      if (r.scope === "UEFA") setUefa(String(r.amount / 100));
    }
    setAmounts(m);
  }, [data]);

  async function saveRules() {
    setBusy(true);
    try {
      const rules: any[] = (data?.divisionLevels ?? []).map((l) => ({
        scope: "DIVISION",
        divisionLevel: l,
        amount: eurosToCents(amounts[l] || "0"),
        label: `Vainqueur D${l}`,
      }));
      if (ldc) rules.push({ scope: "LDC", amount: eurosToCents(ldc), label: "Vainqueur Ligue des Crampons" });
      if (uefa) rules.push({ scope: "UEFA", amount: eurosToCents(uefa), label: "Vainqueur Heureux papa's League" });
      await api(`/api/cagnotte/${poolId}/rules`, { method: "PUT", body: JSON.stringify({ rules }) });
      qc.invalidateQueries({ queryKey: ["rules", poolId] });
    } finally {
      setBusy(false);
    }
  }
  async function generate() {
    setBusy(true);
    setGenMsg(null);
    try {
      const r = await api<{ created: number; updated: number }>(
        `/api/cagnotte/${poolId}/generate-payouts`,
        { method: "POST" }
      );
      setGenMsg(`${r.created} créé(s), ${r.updated} mis à jour.`);
      onChange();
    } catch (e: any) {
      setGenMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-base-100 rounded-box shadow p-4 space-y-3">
      <h3 className="font-semibold">Grille de gains (montants fixes)</h3>
      <p className="text-xs opacity-60">
        Montant en € du vainqueur de chaque division et de chaque coupe. « Générer » crée les
        reversements des gagnants une fois les saisons et coupes terminées (sans toucher aux
        gains déjà versés).
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {data?.divisionLevels.map((l) => (
          <label key={l} className="text-sm">
            <span className="opacity-70">Vainqueur D{l}</span>
            <input
              value={amounts[l] ?? ""}
              onChange={(e) => setAmounts((a) => ({ ...a, [l]: e.target.value }))}
              className="input input-bordered input-sm w-full mt-1"
            />
          </label>
        ))}
        <label className="text-sm">
          <span className="opacity-70">⭐ Ligue des Crampons</span>
          <input value={ldc} onChange={(e) => setLdc(e.target.value)} className="input input-bordered input-sm w-full mt-1" />
        </label>
        <label className="text-sm">
          <span className="opacity-70">🎖️ Heureux papa's League</span>
          <input value={uefa} onChange={(e) => setUefa(e.target.value)} className="input input-bordered input-sm w-full mt-1" />
        </label>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={saveRules} disabled={busy} className="btn btn-sm">Enregistrer la grille</button>
        <button onClick={generate} disabled={busy} className="btn btn-sm btn-primary">Générer les reversements</button>
        {genMsg && <span className="text-sm opacity-70">{genMsg}</span>}
      </div>
    </div>
  );
}

function PayQr({ managerId }: { managerId: string }) {
  const payment = useQuery({
    queryKey: ["payment", managerId],
    queryFn: () =>
      api<{ iban: string | null; phone: string | null; weroUrl: string | null; ibanHolder: string | null }>(
        `/api/profile/${managerId}/payment`
      ),
  });
  const p = payment.data;
  const wero = useQuery({
    queryKey: ["wero-qr", managerId],
    queryFn: () => api<{ dataUrl: string }>(`/api/profile/${managerId}/wero-qr`),
    enabled: !!p?.weroUrl,
  });

  if (payment.isLoading) return <p className="text-sm opacity-60">Chargement…</p>;
  if (!p?.iban && !p?.weroUrl && !p?.phone) {
    return (
      <p className="text-sm opacity-60">
        Aucune coordonnée de paiement — le membre doit compléter son profil.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      {wero.data && (
        <div className="text-center">
          <img src={wero.data.dataUrl} alt="QR Wero" className="w-36 h-36 rounded" />
          <div className="text-xs font-bold mt-1">WERO — scanne pour payer</div>
        </div>
      )}
      <div className="text-sm opacity-80 space-y-1 min-w-0">
        {p.ibanHolder && <p>Titulaire : {p.ibanHolder}</p>}
        {p.iban && (
          <p>
            IBAN : <span className="font-mono text-xs break-all">{p.iban}</span>
          </p>
        )}
        {p.phone && <p>Wero (tél) : {p.phone}</p>}
      </div>
    </div>
  );
}
