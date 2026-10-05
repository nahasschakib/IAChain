import type { ReactNode } from "react";

// ── Catégories de Sofia ─────────────────────────────────────────────
const CAT_STYLES: Record<string, string> = {
  "Presse": "bg-amber-50 text-amber-800 border-amber-200",
  "Réseaux sociaux": "bg-sky-50 text-sky-800 border-sky-200",
  "Rapports sectoriels": "bg-emerald-50 text-emerald-800 border-emerald-200",
};
const CAT_DEFAULT = "bg-slate-50 text-slate-600 border-slate-200";

export function CategoryChip({ label }: { label: string }) {
  const style = CAT_STYLES[label] ?? CAT_DEFAULT;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}

// ── Liens sociaux d'Ilyas ───────────────────────────────────────────
type Network = "linkedin" | "facebook" | "instagram";

const NET: Record<Network, { label: string; cls: string; badge: string; badgeCls: string }> = {
  linkedin: {
    label: "LinkedIn",
    cls: "border-[#0A66C2]/30 bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20",
    badge: "in",
    badgeCls: "bg-[#0A66C2] text-white",
  },
  facebook: {
    label: "Facebook",
    cls: "border-[#1877F2]/30 bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20",
    badge: "f",
    badgeCls: "bg-[#1877F2] text-white",
  },
  instagram: {
    label: "Instagram",
    cls: "border-[#E4405F]/30 bg-[#E4405F]/10 text-[#C13584] hover:bg-[#E4405F]/20",
    badge: "ig",
    badgeCls: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
  },
};

export function SocialLink({ network, href }: { network: Network; href: string }) {
  const n = NET[network];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${n.cls}`}
    >
      <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-bold leading-none ${n.badgeCls}`}>
        {n.badge}
      </span>
      {n.label}
    </a>
  );
}

export function SocialMissing({ children }: { children: ReactNode }) {
  return <span className="text-xs italic text-slate-400">{children}</span>;
}