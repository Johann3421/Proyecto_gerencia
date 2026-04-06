"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { ROLE_LABELS } from "@/types";
import { User, Mail, Shield, Save, Loader2, Camera } from "lucide-react";
import type { RoleType } from "@prisma/client";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { data: me } = trpc.users.me.useQuery();

  const [name, setName] = useState(me?.name ?? session?.user?.name ?? "");
  const [phone, setPhone] = useState(me?.phone ?? "");

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      updateSession();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate({
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
  }

  const role = session?.user?.role as RoleType | undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
      <div style={{ 
        fontSize: 13, fontWeight: 600, color: "var(--text-2)",
        letterSpacing: "0.2px", textTransform: "uppercase", marginBottom: 24, marginTop: 24 
      }}>
        Configuración del Sistema
      </div>

      {/* Profile Card */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r)", padding: 32, marginBottom: 24
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", margin: "0 0 24px 0" }}>
          Perfil de Usuario
        </h2>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{ position: "relative" }}>
            {me?.avatar ? (
              <img
                src={me.avatar}
                alt={me.name}
                style={{ height: 64, width: 64, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }}
              />
            ) : (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 64, width: 64, borderRadius: "50%",
                background: "var(--accent)", color: "#fff",
                fontSize: 20, fontWeight: 700
              }}>
                {(me?.name ?? session?.user?.name ?? "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", margin: "0 0 4px 0" }}>
              {me?.name ?? session?.user?.name}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 8px 0" }}>
              {me?.email ?? session?.user?.email}
            </p>
            {role && (
              <span style={{
                padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                background: "var(--surface-alt)", color: "var(--text-2)", border: "1px solid var(--border)"
              }}>
                {ROLE_LABELS[role]}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%", height: 40, padding: "0 12px",
                fontSize: 14, background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--r)", outline: "none", color: "var(--text-1)",
                transition: "border-color 0.15s"
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)" }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--border)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
              Email Institucional
            </label>
            <input
              type="email"
              value={me?.email ?? session?.user?.email ?? ""}
              disabled
              style={{
                width: "100%", height: 40, padding: "0 12px",
                fontSize: 14, background: "var(--surface-alt)", border: "1px solid var(--border)",
                borderRadius: "var(--r)", outline: "none", color: "var(--text-3)",
                opacity: 0.8, cursor: "not-allowed"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
              Teléfono (Opcional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+51 999 999 999"
              style={{
                width: "100%", height: 40, padding: "0 12px",
                fontSize: 14, background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--r)", outline: "none", color: "var(--text-1)",
                transition: "border-color 0.15s"
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)" }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--border)" }}
            />
          </div>

          {updateProfile.error && (
            <div style={{ padding: "10px 14px", borderRadius: 6, fontSize: 13, background: "#fef2f2", color: "var(--bad)", border: "1px solid #fca5a5" }}>
              {updateProfile.error.message}
            </div>
          )}

          {updateProfile.isSuccess && (
            <div style={{ padding: "10px 14px", borderRadius: 6, fontSize: 13, background: "#f0fdf4", color: "var(--ok)", border: "1px solid #86efac" }}>
              Perfil actualizado correctamente.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 8 }}>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "0 20px", height: 40,
                fontSize: 14, fontWeight: 500, color: "#fff", background: "var(--text-1)",
                border: "none", borderRadius: "var(--r)", cursor: updateProfile.isPending ? "not-allowed" : "pointer",
                opacity: updateProfile.isPending ? 0.7 : 1
              }}
            >
              {updateProfile.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      {/* Info card */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r)", padding: 32
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", margin: "0 0 20px 0" }}>
          Información Operativa
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 16 }}>
            <span style={{ fontSize: 14, color: "var(--text-3)" }}>Área Operativa</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>
              {me?.area?.name ?? "—"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 16 }}>
            <span style={{ fontSize: 14, color: "var(--text-3)" }}>Departamento</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>
              {me?.department?.name ?? "—"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 16 }}>
            <span style={{ fontSize: 14, color: "var(--text-3)" }}>Nivel de Acceso</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>
              {role ? ROLE_LABELS[role] : "—"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, color: "var(--text-3)" }}>Estado de Cuenta</span>
            <span style={{
              padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 600,
              background: "#f0fdf4", color: "var(--ok)", border: "1px solid #bbf7d0"
            }}>
              Activo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
