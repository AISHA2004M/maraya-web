import { useEffect, useState } from "react";
import { getTryOnSessions } from "../api/analytics";
import {
  Sparkles, RefreshCw, Clock, CheckCircle, XCircle,
  ExternalLink, Cpu, Zap, AlertTriangle
} from "lucide-react";

/**
 * TryOnMonitor — Admin AI Try-On Dashboard
 * ==========================================
 * Displays all AI virtual try-on sessions with:
 *  - Status breakdown stats (completed / processing / failed)
 *  - Avg inference time metric
 *  - Card grid with result image, product thumbnail, status badge, timing
 *  - Download link for each result
 *  - Auto-refresh every 30s while any session is pending
 */
export default function TryOnMonitor() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getTryOnSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Auto-refresh every 30s when there are pending sessions
  useEffect(() => {
    const hasPending = sessions.some((s) => s.status === "processing" || s.status === "queued");
    if (!hasPending) return;
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [sessions]);

  const statusConfig = {
    completed:  { icon: CheckCircle,    color: "text-green-400", bg: "bg-green-500/10",  label: "Completed" },
    processing: { icon: Clock,          color: "text-amber-400", bg: "bg-amber-500/10",  label: "Processing" },
    queued:     { icon: Zap,            color: "text-blue-400",  bg: "bg-blue-500/10",   label: "Queued" },
    failed:     { icon: AlertTriangle,  color: "text-red-400",   bg: "bg-red-500/10",    label: "Failed" },
  };

  const getStatusConfig = (s) => statusConfig[s] || statusConfig.processing;

  const completed   = sessions.filter((s) => s.status === "completed");
  const failed      = sessions.filter((s) => s.status === "failed");
  const pending     = sessions.filter((s) => s.status === "processing" || s.status === "queued");
  const avgInferMs  = completed.length
    ? Math.round(completed.reduce((a, s) => a + (s.inference_time_ms || 0), 0) / completed.length)
    : 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
            <Sparkles size={22} className="text-primary" />
            AI Try-On Monitor
          </h1>
          <p className="text-secondary text-sm">
            {sessions.length} total sessions &middot; real-time inference tracking
          </p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Completed",    value: completed.length,      color: "text-green-400", icon: CheckCircle },
          { label: "In Progress",  value: pending.length,        color: "text-amber-400", icon: Clock },
          { label: "Failed",       value: failed.length,         color: "text-red-400",   icon: XCircle },
          { label: "Avg. Inference",
            value: avgInferMs ? `${(avgInferMs / 1000).toFixed(1)}s` : "—",
            color: "text-primary",
            icon: Cpu,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={color} />
              <p className="text-xs text-secondary">{label}</p>
            </div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="admin-card !p-0 overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-surface-container-low" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-surface-container-low rounded w-3/4" />
                <div className="h-2 bg-surface-container-low rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="admin-card text-center py-20">
          <Sparkles size={32} className="text-secondary mx-auto mb-3 opacity-40" />
          <p className="text-secondary text-sm font-medium">No try-on sessions yet</p>
          <p className="text-secondary text-xs mt-1 font-light">
            Sessions appear here after customers generate try-ons from product pages.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {sessions.map((s) => {
            const cfg = getStatusConfig(s.status);
            const StatusIcon = cfg.icon;
            const dateStr = s.created_at
              ? new Date(s.created_at).toLocaleString(undefined, {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })
              : "—";

            return (
              <div
                key={s.id}
                className="admin-card !p-0 overflow-hidden hover:border-primary transition-all duration-200 flex flex-col"
              >
                {/* Result image */}
                <div className="relative aspect-[3/4] bg-surface-container-low overflow-hidden">
                  {s.result_image_url ? (
                    <>
                      <img
                        src={s.result_image_url}
                        alt="Try-On Result"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300";
                        }}
                      />
                      {/* Download overlay */}
                      <a
                        href={s.result_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                        title="Open result"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {s.status === "processing" || s.status === "queued" ? (
                        <div className="space-y-2 text-center">
                          <Sparkles size={20} className="text-secondary mx-auto animate-pulse" />
                          <p className="text-[9px] text-secondary uppercase tracking-widest">Processing...</p>
                        </div>
                      ) : (
                        <Sparkles size={24} className="text-secondary opacity-30" />
                      )}
                    </div>
                  )}

                  {/* Status badge overlay */}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 ${cfg.bg} px-2 py-1 rounded-full`}>
                    <StatusIcon size={10} className={cfg.color} />
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Session metadata */}
                <div className="p-3 space-y-1.5 flex-1">
                  <p className="text-[10px] text-secondary font-light">{dateStr}</p>
                  {s.inference_time_ms && (
                    <div className="flex items-center gap-1.5">
                      <Cpu size={10} className="text-secondary" />
                      <p className="text-[10px] text-secondary">
                        {(s.inference_time_ms / 1000).toFixed(1)}s &middot;{" "}
                        <span className="opacity-60">{s.ai_model_version || "—"}</span>
                      </p>
                    </div>
                  )}
                  {s.result_image_url && (
                    <a
                      href={s.result_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[9px] text-primary hover:underline font-semibold uppercase tracking-wide"
                    >
                      <ExternalLink size={9} />
                      View Result
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
