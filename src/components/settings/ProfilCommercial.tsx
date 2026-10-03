"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveOffer, addOption, setOptionActive } from "@/app/settings/profile-actions";
import type { OrgOption } from "@/lib/org-profile";

const MAX_OFFER = 2000;

type Msg = { ok: boolean; text: string } | null;

function OptionList({
  title,
  hint,
  kind,
  options,
  canEdit,
  onResult,
}: {
  title: string;
  hint: string;
  kind: "segment" | "enjeu";
  options: OrgOption[];
  canEdit: boolean;
  onResult: (m: Msg) => void;
}) {
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (o: OrgOption) =>
    startTransition(async () => {
      const r = await setOptionActive(o.id, !o.active);
      onResult(r.ok ? null : { ok: false, text: r.error });
    });

  const add = () =>
    startTransition(async () => {
      const r = await addOption(kind, label);
      if (r.ok) {
        setLabel("");
        onResult(null);
      } else onResult({ ok: false, text: r.error });
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--graphite)" }}>{hint}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={!canEdit || pending}
            onClick={() => toggle(o)}
            title={canEdit ? (o.active ? "Cliquer pour désactiver" : "Cliquer pour réactiver") : undefined}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: 13,
              border: "1px solid var(--line)",
              cursor: canEdit ? "pointer" : "default",
              background: o.active ? "var(--steel)" : "transparent",
              color: o.active ? "#fff" : "var(--graphite)",
              textDecoration: o.active ? "none" : "line-through",
              opacity: pending ? 0.6 : 1,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {canEdit && (
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            value={label}
            maxLength={60}
            placeholder="Ajouter une valeur…"
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && label.trim() && !pending) {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button type="button" variant="outline" disabled={pending || label.trim().length < 2} onClick={add}>
            Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProfilCommercial({
  offer,
  options,
  canEdit,
}: {
  offer: string;
  options: OrgOption[];
  canEdit: boolean;
}) {
  const [text, setText] = useState(offer);
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const r = await saveOffer(text);
      setMsg(r.ok ? { ok: true, text: "Offre enregistrée." } : { ok: false, text: r.error });
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontSize: 13 }}>
      {!canEdit && (
        <div style={{ color: "var(--graphite)" }}>
          Lecture seule : seuls les administrateurs de l&apos;organisation peuvent modifier le profil commercial.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Notre offre</div>
        <div style={{ fontSize: 12, color: "var(--graphite)" }}>
          Ce que vous vendez, en quelques phrases. L&apos;IA s&apos;en sert pour rédiger des propositions concrètes plutôt que
          génériques.
        </div>
        <Textarea
          value={text}
          rows={5}
          maxLength={MAX_OFFER}
          disabled={!canEdit}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex. : nous installons un module de relance automatique des impayés pour cabinets comptables…"
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {canEdit && (
            <Button type="button" disabled={pending || text.trim() === offer.trim()} onClick={save}>
              {pending ? "Enregistrement…" : "Enregistrer l'offre"}
            </Button>
          )}
          <span style={{ fontSize: 12, color: "var(--graphite)" }}>
            {text.length} / {MAX_OFFER}
          </span>
        </div>
      </div>

      <OptionList
        title="Segments de marché"
        hint="Les valeurs actives sont celles que l'IA peut retenir et que le commercial peut choisir."
        kind="segment"
        options={options.filter((o) => o.kind === "segment")}
        canEdit={canEdit}
        onResult={setMsg}
      />
      <OptionList
        title="Enjeux prioritaires"
        hint="Les enjeux que vous traitez réellement : l'IA ne retient que ceux de cette liste."
        kind="enjeu"
        options={options.filter((o) => o.kind === "enjeu")}
        canEdit={canEdit}
        onResult={setMsg}
      />

      {msg && (
        <div style={{ color: msg.ok ? "var(--steel)" : "#b42318", fontSize: 12 }} role="status">
          {msg.text}
        </div>
      )}
    </div>
  );
}