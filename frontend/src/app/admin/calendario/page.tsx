"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, CheckCircle2, XCircle, RefreshCw, ExternalLink, Unlink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface CalendarStatus {
  configurado: boolean;
  conectado: boolean;
  calendarId: string | null;
  mensaje: string;
}

export default function CalendarioPage() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.calendarStatus();
      setStatus(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      const { authUrl } = await api.calendarConnect();

      // Abrir ventana OAuth de Google
      const popup = window.open(authUrl, "google-auth", "width=500,height=650,left=400,top=100");

      // Polling hasta que se cierre la ventana
      const interval = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(interval);
          setActionLoading(false);
          setTimeout(() => fetchStatus(), 1500);
        }
      }, 800);
    } catch (e: any) {
      setError(e.message);
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("¿Desconectar Google Calendar? Las reservas futuras no se añadirán al calendario.")) return;
    try {
      setActionLoading(true);
      await api.calendarDisconnect();
      await fetchStatus();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-accent-muted)" }}
          >
            <Calendar size={20} style={{ color: "var(--color-accent)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
              Google Calendar
            </h1>
            <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
              Sincroniza reservas y bloquea tiempo ocupado
            </p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-2 rounded-lg transition-colors cursor-pointer"
          style={{ color: "var(--color-secondary)" }}
          title="Actualizar estado"
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      {/* Card de estado */}
      <div
        className="rounded-2xl border p-6 mb-6"
        style={{
          backgroundColor: "var(--color-bg)",
          borderColor: "var(--color-border)",
        }}
      >
        {loading ? (
          <div className="flex items-center gap-3 py-2">
            <div
              className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }}
            />
            <span style={{ color: "var(--color-secondary)" }}>Comprobando conexión…</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3">
            <XCircle size={20} className="text-red-400 shrink-0" />
            <div>
              <p className="font-semibold text-red-400">Error</p>
              <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{error}</p>
            </div>
          </div>
        ) : !status?.configurado ? (
          <NotConfigured />
        ) : status.conectado ? (
          <Connected calendarId={status.calendarId} />
        ) : (
          <Disconnected />
        )}
      </div>

      {/* Acciones */}
      {!loading && !error && status?.configurado && (
        <div className="flex flex-col gap-3">
          {status.conectado ? (
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              className={cn(
                "flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl border text-sm font-medium transition-all cursor-pointer",
                "border-red-500/20 text-red-400 hover:bg-red-500/10",
                actionLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Unlink size={16} />
              {actionLoading ? "Desconectando…" : "Desconectar Google Calendar"}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className={cn(
                "flex items-center justify-center gap-2 w-full py-4 px-5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all cursor-pointer",
                "bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg",
                actionLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {actionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin" />
                  Esperando autorización…
                </>
              ) : (
                <>
                  {/* Google G logo */}
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  Conectar con Google
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Explicación de funcionamiento */}
      <div
        className="mt-6 rounded-xl border p-4 flex gap-3"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}
      >
        <Info size={16} className="shrink-0 mt-0.5" style={{ color: "var(--color-accent)" }} />
        <div className="text-sm space-y-1" style={{ color: "var(--color-secondary)" }}>
          <p className="font-medium" style={{ color: "var(--color-primary)" }}>¿Cómo funciona?</p>
          <p>Cuando hay conexión activa, los huecos bloqueados en Google Calendar se ocultan automáticamente en el selector de citas del cliente.</p>
          <p>Las nuevas reservas confirmadas también se añaden a tu calendario con los datos del cliente.</p>
        </div>
      </div>

    </div>
  );
}

function Connected({ calendarId }: { calendarId: string | null }) {
  return (
    <div className="flex items-start gap-4">
      <CheckCircle2 size={22} className="text-green-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold" style={{ color: "var(--color-primary)" }}>
          Google Calendar conectado
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-secondary)" }}>
          Sincronizando con calendario: <span className="font-mono text-xs">{calendarId || "primary"}</span>
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Activo — los slots ocupados se ocultan automáticamente</span>
        </div>
      </div>
    </div>
  );
}

function Disconnected() {
  return (
    <div className="flex items-start gap-4">
      <XCircle size={22} className="text-neutral-500 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold" style={{ color: "var(--color-primary)" }}>
          No conectado
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-secondary)" }}>
          Conecta tu Google Calendar para bloquear automáticamente los huecos ocupados.
        </p>
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <XCircle size={22} className="text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold" style={{ color: "var(--color-primary)" }}>
            Credenciales no configuradas
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--color-secondary)" }}>
            Para habilitar la integración, necesitas añadir tus credenciales de Google en el fichero <code className="text-xs bg-white/10 px-1 py-0.5 rounded">.env</code> del servidor.
          </p>
        </div>
      </div>
      <div
        className="rounded-xl p-4 font-mono text-xs space-y-1 border"
        style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: "var(--color-border)", color: "var(--color-secondary)" }}
      >
        <p><span className="text-yellow-400">GOOGLE_CLIENT_ID</span>=tu-client-id.apps.googleusercontent.com</p>
        <p><span className="text-yellow-400">GOOGLE_CLIENT_SECRET</span>=tu-client-secret</p>
        <p><span className="text-yellow-400">GOOGLE_REDIRECT_URI</span>=http://localhost:3001/api/calendars/callback</p>
      </div>
      <a
        href="https://console.cloud.google.com/apis/credentials"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline"
      >
        <ExternalLink size={12} />
        Abrir Google Cloud Console → Credenciales
      </a>
    </div>
  );
}
