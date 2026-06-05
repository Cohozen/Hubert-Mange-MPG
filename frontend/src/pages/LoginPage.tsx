import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await qc.invalidateQueries({ queryKey: ["me"] });
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <form onSubmit={onSubmit} className="card-body gap-3">
          <h1 className="text-2xl font-bold text-primary">MPG Enhanced</h1>
          <p className="text-sm opacity-70">Connecte-toi avec ton compte Mon Petit Gazon.</p>

          <label className="form-control">
            <span className="label-text">Email MPG</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full"
              required
            />
          </label>

          <label className="form-control">
            <span className="label-text">Mot de passe MPG</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered w-full"
              required
            />
          </label>

          {error && <p className="text-sm text-error">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading && <span className="loading loading-spinner loading-sm" />}
            {loading ? "Connexion…" : "Se connecter"}
          </button>

          <p className="text-xs opacity-50">
            Tes identifiants servent uniquement à vérifier ton compte MPG. Ils ne sont jamais
            stockés.
          </p>
        </form>
      </div>
    </div>
  );
}
