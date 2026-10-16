"use client";

import { useState, useTransition } from "react";
import { enregistrerProfil, enregistrerTache, supprimerProfil, supprimerTache } from "@/lib/roi-actions";

export type ProfilItem = { profil: string; coutMensuel: number; heures: number; source: string };
export type TacheItem = {
  agentId: number;
  agentNom: string;
  tache: string;
  profil: string;
  humainMin: number;
  controleMin: number;
  source: string;
};
export type AgentOption = { id: number; nom: string };

const SOURCES = [
  { v: "hypothese", l: "Hypothèse" },
  { v: "client", l: "Saisi par le client" },
  { v: "mesure", l: "Mesuré" },
];

const champ: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 14,
  background: "transparent",
  color: "inherit",
  width: "100%",
};
const etiquette: React.CSSProperties = { fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4, display: "block" };
const carte: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "16px 18px",
  marginBottom: 16,
};
const bouton: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "#111",
  color: "#fff",
  fontSize: 14,
  cursor: "pointer",
};
const lien: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--muted-foreground)",
  textDecoration: "underline",
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
  marginLeft: 10,
};

function libelleSource(v: string) {
  return SOURCES.find((s) => s.v === v)?.l ?? v;
}

export default function RoiReferentiel({
  profils,
  taches,
  agents,
}: {
  profils: ProfilItem[];
  taches: TacheItem[];
  agents: AgentOption[];
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  // Formulaire profil
  const [pNom, setPNom] = useState("");
  const [pCout, setPCout] = useState("");
  const [pHeures, setPHeures] = useState("140");
  const [pSource, setPSource] = useState("hypothese");

  // Formulaire tâche
  const [tAgent, setTAgent] = useState("");
  const [tTache, setTTache] = useState("");
  const [tProfil, setTProfil] = useState("");
  const [tHumain, setTHumain] = useState("");
  const [tControle, setTControle] = useState("0");
  const [tSource, setTSource] = useState("hypothese");

  function lancer(action: () => Promise<{ ok: boolean; error?: string }>, apres?: () => void) {
    setMessage(null);
    start(async () => {
      const r = await action();
      if (r.ok) {
        setMessage("Enregistré.");
        apres?.();
      } else {
        setMessage(r.error ?? "Erreur.");
      }
    });
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 4px" }}>Référentiel du ROI</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted-foreground)" }}>
        Renseignez d&apos;abord les profils métier (coût employeur mensuel), puis une tâche de référence par agent
        (temps humain et temps de contrôle, en minutes). Indiquez la source de chaque chiffre.
      </p>

      {message && <div style={{ marginBottom: 12, fontSize: 14 }}>{message}</div>}

      <div style={carte}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>1. Profils métier</div>
        {profils.length > 0 && (
          <div style={{ marginBottom: 14, fontSize: 14 }}>
            {profils.map((p) => (
              <div key={p.profil} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <strong>{p.profil}</strong> · {new Intl.NumberFormat("fr-FR").format(p.coutMensuel)} MAD/mois ·{" "}
                {p.heures} h · {libelleSource(p.source)}
                <button
                  type="button"
                  style={lien}
                  onClick={() => {
                    setPNom(p.profil);
                    setPCout(String(p.coutMensuel));
                    setPHeures(String(p.heures));
                    setPSource(p.source);
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  style={lien}
                  disabled={pending}
                  onClick={() => lancer(() => supprimerProfil(p.profil))}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <label>
            <span style={etiquette}>Profil (ex. Support client)</span>
            <input style={champ} value={pNom} onChange={(e) => setPNom(e.target.value)} />
          </label>
          <label>
            <span style={etiquette}>Coût employeur mensuel (MAD)</span>
            <input style={champ} inputMode="decimal" value={pCout} onChange={(e) => setPCout(e.target.value)} />
          </label>
          <label>
            <span style={etiquette}>Heures productives / mois</span>
            <input style={champ} inputMode="numeric" value={pHeures} onChange={(e) => setPHeures(e.target.value)} />
          </label>
          <label>
            <span style={etiquette}>Source</span>
            <select style={champ} value={pSource} onChange={(e) => setPSource(e.target.value)}>
              {SOURCES.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            style={bouton}
            disabled={pending}
            onClick={() =>
              lancer(
                () => enregistrerProfil(pNom, Number(pCout.replace(",", ".")), Number(pHeures), pSource),
                () => {
                  setPNom("");
                  setPCout("");
                  setPHeures("140");
                  setPSource("hypothese");
                }
              )
            }
          >
            Enregistrer le profil
          </button>
        </div>
      </div>

      <div style={carte}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>2. Tâches de référence par agent</div>
        {taches.length > 0 && (
          <div style={{ marginBottom: 14, fontSize: 14 }}>
            {taches.map((t) => (
              <div key={t.agentId} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <strong>{t.agentNom}</strong> · {t.tache} · {t.profil} · humain {t.humainMin} min, contrôle{" "}
                {t.controleMin} min · {libelleSource(t.source)}
                <button
                  type="button"
                  style={lien}
                  onClick={() => {
                    setTAgent(String(t.agentId));
                    setTTache(t.tache);
                    setTProfil(t.profil);
                    setTHumain(String(t.humainMin));
                    setTControle(String(t.controleMin));
                    setTSource(t.source);
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  style={lien}
                  disabled={pending}
                  onClick={() => lancer(() => supprimerTache(t.agentId))}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
        {profils.length === 0 ? (
          <div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
            Enregistrez d&apos;abord au moins un profil métier.
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
              <label>
                <span style={etiquette}>Agent</span>
                <select style={champ} value={tAgent} onChange={(e) => setTAgent(e.target.value)}>
                  <option value="">Choisir…</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span style={etiquette}>Tâche de référence</span>
                <input style={champ} value={tTache} onChange={(e) => setTTache(e.target.value)} />
              </label>
              <label>
                <span style={etiquette}>Profil</span>
                <select style={champ} value={tProfil} onChange={(e) => setTProfil(e.target.value)}>
                  <option value="">Choisir…</option>
                  {profils.map((p) => (
                    <option key={p.profil} value={p.profil}>
                      {p.profil}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span style={etiquette}>Temps humain (min)</span>
                <input style={champ} inputMode="decimal" value={tHumain} onChange={(e) => setTHumain(e.target.value)} />
              </label>
              <label>
                <span style={etiquette}>Temps de contrôle (min)</span>
                <input style={champ} inputMode="decimal" value={tControle} onChange={(e) => setTControle(e.target.value)} />
              </label>
              <label>
                <span style={etiquette}>Source</span>
                <select style={champ} value={tSource} onChange={(e) => setTSource(e.target.value)}>
                  {SOURCES.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                style={bouton}
                disabled={pending}
                onClick={() =>
                  lancer(
                    () =>
                      enregistrerTache(
                        Number(tAgent),
                        tTache,
                        tProfil,
                        Number(tHumain.replace(",", ".")),
                        Number(tControle.replace(",", ".")),
                        tSource
                      ),
                    () => {
                      setTAgent("");
                      setTTache("");
                      setTProfil("");
                      setTHumain("");
                      setTControle("0");
                      setTSource("hypothese");
                    }
                  )
                }
              >
                Enregistrer la tâche
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}