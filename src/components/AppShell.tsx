"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useUser, useClerk } from "@clerk/nextjs";



type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string;
};

const PILOTAGE_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="#f5f6f8" strokeWidth="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="#f5f6f8" strokeWidth="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="#f5f6f8" strokeWidth="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="#f5f6f8" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/agents",
    label: "Mes agents",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.5" stroke="#f5f6f8" strokeWidth="1.5" />
        <path d="M5 20C5 15.8 8.1 13 12 13C15.9 13 19 15.8 19 20" stroke="#f5f6f8" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/workflows",
    label: "Workflows",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="6" cy="6" r="2.4" stroke="#f5f6f8" strokeWidth="1.5" />
        <circle cx="18" cy="6" r="2.4" stroke="#f5f6f8" strokeWidth="1.5" />
        <circle cx="12" cy="18" r="2.4" stroke="#f5f6f8" strokeWidth="1.5" />
        <path d="M8.2 7.2L11 16.2M15.8 7.2L13 16.2" stroke="#f5f6f8" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/tasks",
    label: "Tâches",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M5 12L10 17L19 7" stroke="#f5f6f8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/approvals",
    label: "Approbations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#f5f6f8" strokeWidth="1.5" />
        <path d="M4 20C4 15.6 7.6 13 12 13C16.4 13 20 15.6 20 20" stroke="#f5f6f8" strokeWidth="1.5" />
      </svg>
    ),
    badge: "3",
  },
  {
    href: "/deliverables",
    label: "Livrables",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 4H18V20L12 16.5L6 20V4Z" stroke="#f5f6f8" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const SYSTEM_ITEMS: NavItem[] = [
  {
    href: "/integrations",
    label: "Intégrations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 12H20M4 6H20M4 18H20" stroke="#f5f6f8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 19L9 9L13 15L16 10L20 19"
          stroke="#f5f6f8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Paramètres",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="#f5f6f8" strokeWidth="1.5" />
        <path
          d="M12 4V6.5M12 17.5V20M20 12H17.5M6.5 12H4M17 7L15.2 8.8M8.8 15.2L7 17M17 17L15.2 15.2M8.8 8.8L7 7"
          stroke="#f5f6f8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
   {
    href: "/onboarding",
    label: "Onboarding",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 20V4M6 5H17L14.5 9L17 13H6" stroke="#f5f6f8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className="nav-link"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "5px 6px 5px 5px",
        borderRadius: 8,
        background: active
          ? "linear-gradient(90deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))"
          : "transparent",
        borderLeft: active ? "3px solid #9fc4e8" : "3px solid transparent",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? "#f5f6f8" : "rgba(245,246,248,0.72)",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {item.icon}
        {item.label}
      </span>
      {item.badge && (
        <span
          style={{
            background: "#c9846c",
            color: "#241a14",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 700,
            padding: "1px 4px",
            borderRadius: 999,
            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function AppShell({
  children,
  searchPlaceholder = "Rechercher un agent, un workflow…",
  topbarAction,
  topbar,
}: {
  children: ReactNode;
  searchPlaceholder?: string;
  topbarAction?: ReactNode;
  topbar?: ReactNode;
}) {

 
  const pathname = usePathname();

   const { user } = useUser();
  const { signOut } = useClerk();

  const initials = (user?.fullName || user?.primaryEmailAddress?.emailAddress || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        display: "flex",
        background: "var(--paper)",
        color: "var(--ink)",
        alignItems: "flex-start",
      }}
    >
      <style>{`
        .nav-link:hover {
          background: rgba(255,255,255,0.07);
        }
      `}</style>

      {/* SIDEBAR */}
      <div
        style={{
          width: 236,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--steel-deep)",
          color: "#f5f6f8",
          boxSizing: "border-box",
          padding: "20px 14px",
          boxShadow: "2px 0 8px rgba(15, 23, 42, 0.08)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 22px" }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="5" r="3" stroke="#f5f6f8" strokeWidth="1.6" />
              <circle cx="19" cy="12" r="3" stroke="#f5f6f8" strokeWidth="1.6" />
              <circle cx="5" cy="19" r="3" stroke="#f5f6f8" strokeWidth="1.6" />
              <path d="M8 6.2L16.2 11" stroke="#f5f6f8" strokeWidth="1.6" />
              <path d="M16.2 13L8 17.8" stroke="#f5f6f8" strokeWidth="1.6" />
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: "-0.01em" }}>
            IAChain
          </span>
        </Link>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "rgba(245,246,248,0.4)",
              padding: "10px 10px 6px",
            }}
          >
            PILOTAGE
          </span>
          {PILOTAGE_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}

          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "rgba(245,246,248,0.4)",
              padding: "18px 10px 6px",
            }}
          >
            SYSTÈME
          </span>
          {SYSTEM_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 10,
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #9fc4e8, #3d5f80)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 700,
              color: "#0f1a24",
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.fullName || user?.primaryEmailAddress?.emailAddress || "…"}
            </div>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              style={{
                fontSize: 11,
                color: "rgba(245,246,248,0.5)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              SOCYTAY · Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* TOPBAR */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 28px",
            borderBottom: "1px solid var(--line)",
            background: "rgba(245,246,248,0.92)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          }}
        >
          {topbar ?? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 9,
                  padding: "8px 14px",
                  width: 320,
                  maxWidth: "40vw",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="#5b6472" strokeWidth="1.6" />
                  <path d="M20 20L16.5 16.5" stroke="#5b6472" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 13, color: "var(--graphite)" }}>{searchPlaceholder}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 10C6 6.7 8.5 4 12 4C15.5 4 18 6.7 18 10C18 15 20 16 20 16H4C4 16 6 15 6 10Z"
                    stroke="#5b6472"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path d="M10 19C10.3 19.6 11.1 20 12 20C12.9 20 13.7 19.6 14 19" stroke="#5b6472" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                {topbarAction ?? (
                  <a
                    href="#"
                    style={{
                      background: "var(--steel-deep)",
                      color: "#f5f6f8",
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "9px 16px",
                      borderRadius: 8,
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.18)",
                    }}
                  >
                    + Nouvelle exécution
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* BODY */}
        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24, boxSizing: "border-box" }}>
          {children}
        </div>
      </div>
    </div>
  );
}