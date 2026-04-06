"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { ROLE_LABELS } from "@/types";
import {
  Users,
  Search,
  ChevronDown,
  Mail,
  Shield,
  Loader2,
  UserCircle,
} from "lucide-react";
import type { RoleType } from "@prisma/client";

const ROLE_OPTIONS: RoleType[] = [
  "SUPER_ADMIN",
  "ADMIN_AREA",
  "SUPERVISOR",
  "OPERARIO",
  "AUDITOR",
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  ADMIN_AREA: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  SUPERVISOR: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  OPERARIO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  AUDITOR: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleType | "">("");

  const { data, isLoading } = trpc.users.list.useQuery({
    search: search || undefined,
    role: roleFilter || undefined,
    limit: 100,
  });

  const users = data?.users ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ 
        fontSize: 13, fontWeight: 600, color: "var(--text-2)",
        letterSpacing: "0.2px", textTransform: "uppercase", marginBottom: 16, marginTop: 24 
      }}>
        Gestión de Equipo ({data?.pagination?.total ?? 0})
      </div>

      {/* Search & Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 350 }}>
          <Search size={14} color="var(--text-3)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            style={{
              width: "100%", height: 36, paddingLeft: 30, paddingRight: 10,
              fontSize: 14, background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--r)", outline: "none", color: "var(--text-1)",
              transition: "border-color 0.15s"
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)" }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--border)" }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleType | "")}
            style={{
              height: 36, padding: "0 32px 0 12px", background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: "var(--r)", color: "var(--text-1)",
              fontSize: 14, outline: "none", appearance: "none", minWidth: 160
            }}
          >
            <option value="">Todos los roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <ChevronDown size={14} color="var(--text-3)" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      {/* Users list */}
      {isLoading ? (
        <div className="skel" style={{ height: 400, width: "100%" }} />
      ) : users.length === 0 ? (
        <div style={{ padding: 64, textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", color: "var(--text-3)", fontSize: 14 }}>
          No se encontraron miembros de equipo.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Avatar */}
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ height: 40, width: 40, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    height: 40, width: 40, borderRadius: "50%",
                    background: "var(--surface-alt)", color: "var(--text-2)",
                    fontSize: 14, fontWeight: 700, border: "1px solid var(--border-light)"
                  }}>
                    {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, color: "var(--text-3)", fontSize: 12 }}>
                    <Mail size={12} />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid var(--border-light)" }}>
                <span
                  style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: "var(--surface-alt)", color: "var(--text-2)", border: "1px solid var(--border)"
                  }}
                >
                  {ROLE_LABELS[user.role as RoleType] ?? user.role}
                </span>
                {user.area && (
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500,
                    background: `${user.area.color}15`, color: user.area.color,
                  }}>
                    {user.area.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
