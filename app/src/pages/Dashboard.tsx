import { Link } from "react-router";
import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { fmtNum, fmtTons, countryFlag, countryName } from "@/lib/geo";
import {
  Activity,
  AlertTriangle,
  Bird,
  Flame,
  Gauge,
  Globe2,
  Scale,
  Skull,
  TrendingUp,
  Warehouse,
} from "lucide-react";

function KpiCard({ icon: Icon, label, value, sub, accent, onClick }: {
  icon: any; label: string; value: string; sub?: string; accent?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`app-card p-4 transition-all hover:border-zinc-600 ${accent ? "border-red-900/60 bg-gradient-to-br from-red-950/30 to-zinc-900/70" : ""} ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-2 text-zinc-400">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? "bg-red-600/15 text-red-400" : "bg-zinc-800 text-zinc-400"}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={`mt-3 text-2xl font-bold ${accent ? "text-red-100" : "text-zinc-50"}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

function AlertBadge({ type }: { type: string }) {
  const cls = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${cls[type as keyof typeof cls]}`}>
      {type}
    </span>
  );
}

export default function Dashboard() {
  const kpis = trpc.farm.dashboard.kpis.useQuery();
  const mapData = trpc.farm.dashboard.mapData.useQuery();
  const alerts = trpc.farm.dashboard.alerts.useQuery();
  const trends = trpc.farm.dashboard.trends.useQuery();
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  const k = kpis.data;
  const allAlerts = alerts.data ?? [];
  const filteredAlerts = filter === "all" ? allAlerts : allAlerts.filter((a) => a.type === filter);

  const criticalCount = allAlerts.filter((a) => a.type === "critical").length;
  const warningCount = allAlerts.filter((a) => a.type === "warning").length;
  const infoCount = allAlerts.filter((a) => a.type === "info").length;

  return (
    <div className="space-y-6">
      <div className="border-l-2 border-red-500 pl-4">
        <div className="app-section-title text-red-400">Panel operacyjny</div>
        <h1 className="mt-1 text-3xl font-bold">Dashboard operacyjny</h1>
        <p className="text-sm text-zinc-500">
          Bloody Turkey Group S.A. — {k?.countriesCount ?? "…"} krajów · {k?.farmsCount ?? "…"} ferm · czas rzeczywisty
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Bird} label="Ptaki w chowie" value={k ? fmtNum(k.activeBirds) : "…"} sub={`${k?.activeBatches ?? "…"} aktywnych rzutów`} accent />
        <KpiCard icon={Scale} label="Biomasa" value={k ? fmtTons(k.biomassTons) : "…"} sub="cała grupa, EUR" />
        <KpiCard icon={Gauge} label="FCR (ważone)" value={k ? k.avgFcr.toFixed(2) : "…"} sub="kg paszy / kg przyrostu" />
        <KpiCard icon={Skull} label="Śmiertelność" value={k ? `${k.avgMortality.toFixed(2)}%` : "…"} sub="średnia z rzutów" />
        <KpiCard icon={TrendingUp} label="EPEF / PEI" value={k ? fmtNum(k.avgEpef) : "…"} sub="indeks efektywności" />
        <KpiCard icon={Warehouse} label="Fermy" value={k ? String(k.farmsCount) : "…"} sub={`${k?.countriesCount ?? "…"} krajów Europy`} />
        <KpiCard icon={Globe2} label="Zasięg" value={k ? `${k.countriesCount}` : "…"} sub="kraje UE + UK" accent />
        <KpiCard icon={Flame} label="Alerty" value={alerts.data ? String(alerts.data.length) : "…"} sub={`${criticalCount} krytycznych · ${warningCount} ostrzeżeń`} accent={criticalCount > 0} />
      </div>

      {criticalCount > 0 && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
            <Activity className="h-4 w-4" /> Rzuty wymagające natychmiastowej interwencji
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {allAlerts
              .filter((a) => a.type === "critical")
              .slice(0, 6)
              .map((a, i) => (
                <div key={i} className="rounded-lg border border-red-800/50 bg-red-950/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-red-200">{a.title}</span>
                    <AlertBadge type={a.type} />
                  </div>
                  <p className="mt-2 text-xs text-red-200/80">{a.detail}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="app-card p-5 lg:col-span-2">
          <h2 className="app-section-title mb-1">Mapa ferm — Europa</h2>
          <div className="relative mt-4 flex h-[320px] items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950/45">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.08),_transparent_50%)]" />
            <div className="relative text-center">
              <Globe2 className="mx-auto mb-2 h-10 w-10 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-400">Mapa gospodarstw</p>
              <p className="mt-1 text-xs text-zinc-600">Europejski zasięg operacyjny</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(mapData.data ?? []).map((f) => (
              <div key={f.id} className="rounded-lg border border-zinc-800 bg-zinc-950/55 px-3 py-2 text-xs">
                <span className="mr-1">{countryFlag(f.countryCode)}</span>
                <span className="font-medium">{f.city}</span>
                <span className="ml-1 text-zinc-500">({countryName(f.countryCode)})</span>
                <div className="mt-0.5 text-zinc-400">
                  {fmtNum(f.activeBirds)} szt. · {fmtTons(f.biomassTons)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="app-section-title">Centrum alertów</h2>
            <div className="flex gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
              {(["all", "critical", "warning", "info"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded border px-2 py-1 ${filter === value ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-zinc-700 bg-zinc-900 text-zinc-500"}`}
                >
                  {value === "all" ? "wszystkie" : value}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-red-400">Critical</div>
              <div className="text-xl font-bold text-red-100">{criticalCount}</div>
            </div>
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-amber-400">Warning</div>
              <div className="text-xl font-bold text-amber-100">{warningCount}</div>
            </div>
            <div className="rounded-lg border border-sky-900/40 bg-sky-950/20 p-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-sky-400">Info</div>
              <div className="text-xl font-bold text-sky-100">{infoCount}</div>
            </div>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {filteredAlerts.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-500">
                Brak aktywnych alertów. Wszystkie parametry w normie.
              </div>
            ) : (
              filteredAlerts.map((a, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 text-sm ${
                    a.type === "critical"
                      ? "border-red-900/60 bg-red-950/40"
                      : a.type === "warning"
                        ? "border-amber-900/60 bg-amber-950/30"
                        : "border-sky-900/60 bg-sky-950/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className={`h-4 w-4 ${a.type === "critical" ? "text-red-400" : a.type === "warning" ? "text-amber-400" : "text-sky-400"}`} />
                      {a.title}
                    </div>
                    <AlertBadge type={a.type} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-300">{a.detail}</p>
                </div>
              ))
            )}
          </div>

          <Link
            to="/produkcja"
            className="block rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_8px_20px_rgba(220,38,38,0.20)] transition-colors hover:bg-red-500"
          >
            Przejdź do produkcji →
          </Link>
        </div>
      </div>

      {trends.data && trends.data.length > 0 && (
        <div className="app-card p-5">
          <h2 className="app-section-title mb-3">Trend ADG — aktywne rzuty</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trends.data.map((t) => (
              <div key={t.batchId} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-zinc-200">{t.code}</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">ADG</span>
                </div>
                <div className="text-2xl font-bold text-zinc-50">{Number(t.adg).toFixed(2)} g/d</div>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                  <span>{t.ageDays} dni</span>
                  <span>{t.avgWeightG} g avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
