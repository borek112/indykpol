import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtEur } from "@/lib/geo";
import { FlaskConical, Info, Scale, Droplets, Wheat, TrendingUp, ShieldCheck, AlertTriangle, BrainCircuit, Bird, Coins } from "lucide-react";
import FeedIntelligence from "@/components/FeedIntelligence";

const num = (v: unknown) => Number(v ?? 0);

type Sex = "toms" | "hens";
type AgeGroup =
  | "chick0_3" | "chick4_7" | "chick8_14"
  | "starter15_21" | "starter22_28"
  | "grower29_56" | "finisher57_84" | "finisher85_110" | "finisher113_140"
  | "prestarter" | "starter" | "grower1" | "grower2" | "finisher1" | "finisher2";
const GROUPS_BY_SEX: Record<Sex, { key: AgeGroup; label: string }[]> = {
  toms: [
    { key: "chick0_3", label: "Pisklę 0–3 d" },
    { key: "chick4_7", label: "Pisklę 4–7 d" },
    { key: "chick8_14", label: "Pisklę 8–14 d" },
    { key: "starter15_21", label: "Starter 15–21 d" },
    { key: "starter22_28", label: "Starter 22–28 d" },
    { key: "grower29_56", label: "Grower 29–56 d" },
    { key: "finisher57_84", label: "Finisher 57–84 d" },
    { key: "finisher113_140", label: "Finisher 113–140 d" },
  ],
  hens: [
    { key: "chick0_3", label: "Pisklę 0–3 d" },
    { key: "chick4_7", label: "Pisklę 4–7 d" },
    { key: "chick8_14", label: "Pisklę 8–14 d" },
    { key: "starter15_21", label: "Starter 15–21 d" },
    { key: "starter22_28", label: "Starter 22–28 d" },
    { key: "grower29_56", label: "Grower 29–56 d" },
    { key: "finisher57_84", label: "Finisher 57–84 d" },
    { key: "finisher85_110", label: "Finisher 85–110 d" },
  ],
};

export default function NutritionLab() {
  const ings = trpc.nutrition.ingredients.useQuery();
  const [sex, setSex] = useState<Sex>("toms");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("finisher113_140");
  const [shares, setShares] = useState<Record<number, number>>({});
  const [showWhy, setShowWhy] = useState(false);
  const [birds, setBirds] = useState(10000);
  const [days, setDays] = useState(140);

  const items = useMemo(
    () => Object.entries(shares).map(([id, percent]) => ({ ingredientId: Number(id), percent })).filter((x) => x.percent > 0),
    [shares],
  );

  const GROUPS = GROUPS_BY_SEX[sex];

  useEffect(() => {
    setAgeGroup(sex === "toms" ? "finisher113_140" : "finisher85_110");
  }, [sex]);

  const sim = trpc.nutrition.simulate.useQuery(
    { items: items.length ? items : [{ ingredientId: 1, percent: 100 }], ageGroup, sex },
    { enabled: !!ings.data },
  );
  const batchSim = trpc.nutrition.batchSimulation.useQuery(
    { items: items.length ? items : [{ ingredientId: 1, percent: 100 }], ageGroup, birds, days, sex },
    { enabled: !!ings.data && items.length > 0 },
  );

  const list = ings.data ?? [];
  const total = items.reduce((a, i) => a + i.percent, 0);
  const p = sim.data?.profile;
  const prod = sim.data?.production;
  const balance = sim.data?.balance ?? [];

  const setShare = (id: number, v: number) => setShares((s) => ({ ...s, [id]: v }));

  const kpis = p && prod ? [
    { label: "FCR", value: prod.fcr.toFixed(2), icon: Wheat, bad: prod.fcr > 2.6 },
    { label: "ADG", value: `${prod.adgG.toFixed(0)} g/d`, icon: TrendingUp, bad: prod.adgG < 110 },
    { label: "EPEF", value: prod.epef.toFixed(0), icon: Scale, bad: prod.epef < 300 },
    { label: "Koszt tony", value: fmtEur(p.costPerTon), icon: Coins, bad: p.costPerTon * 4.28 > 1930 },
    { label: "Koszt kg żywca", value: `${(num(sim.data?.costPerKgLive)*4.28).toFixed(2)} zł`, icon: Bird, bad: num(sim.data?.costPerKgLive) > 1.2 },
    { label: "Pobór wody", value: `${prod.waterMl.toFixed(0)} ml`, icon: Droplets, bad: false },
    { label: "Ryzyko metaboliczne", value: `${prod.metabolicRisk.toFixed(0)}/100`, icon: AlertTriangle, bad: prod.metabolicRisk > 25 },
    { label: "Bezpieczeństwo", value: `${prod.safety.toFixed(0)}/100`, icon: ShieldCheck, bad: prod.safety < 70 },
  ] : [];

  const bs = batchSim.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <FlaskConical className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Nutrition Lab — wirtualne laboratorium żywienia</h1>
          <p className="text-sm text-zinc-500">Przesuń suwaki udziałów surowców — FCR, ADG, EPEF, koszty i ryzyka przeliczają się natychmiast.</p>
        </div>
      </div>

      {/* grupa wiekowa */}
      <div className="flex flex-wrap gap-2">
        <div className="mr-2 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
          {(["toms", "hens"] as const).map((s) => (
            <button key={s} onClick={() => setSex(s)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${sex === s ? "bg-emerald-500/15 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"}`}>
              {s === "toms" ? "Indory" : "Indyczki"}
            </button>
          ))}
        </div>
        {GROUPS.map((g) => (
          <button key={g.key} onClick={() => setAgeGroup(g.key)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${ageGroup === g.key ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
            {g.label}
          </button>
        ))}
        <button
          onClick={() => {
            const byName = Object.fromEntries(list.map((i) => [i.name, i.id]));
            const preset: [string, number][] = [
              ["Kukurydza", 35],
              ["Pszenica", 14],
              ["Jęczmień", 8],
              ["Śruta sojowa 46%", 24],
              ["Śruta rzepakowa", 8],
              ["Groszek żółty", 4],
              ["Mączka rybna 65%", 3],
              ["Olej sojowy", 2.5],
              ["Otręby pszenne", 3],
              ["Lizyna HCL", 0.6],
              ["Metionina DL", 0.4],
              ["Treonina", 0.2],
              ["Węglan wapnia", 1.1],
              ["Fosforan jednowapniowy", 0.7],
              ["Sól", 0.2],
              ["Premiks", 1.5],
            ];
            const next: Record<number, number> = {};
            for (const [n, v] of preset) if (byName[n]) next[byName[n]] = v;
            setShares(next);
          }}
          className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20">
          Załaduj typową recepturę
        </button>
        <div className={`ml-auto rounded-lg px-3 py-2 text-sm font-bold ${Math.abs(total - 100) < 0.5 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
          Suma: {total.toFixed(0)}%
        </div>
      </div>

      {sim.data?.warnings.map((w, i) => (
        <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-sm text-amber-400">{w}</div>
      ))}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* suwaki */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Udziały surowców</h2>
          {ings.isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          {list.map((ing) => {
            const v = shares[ing.id] ?? 0;
            return (
              <div key={ing.id} className={`rounded-xl border p-4 transition-colors ${v > 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/60"}`}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{ing.name}</div>
                    <div className="text-xs text-zinc-500">{num(ing.proteinPct).toFixed(0)}% białka · {ing.energyKcal} kcal · {fmtEur(num(ing.pricePerTon))}/t</div>
                  </div>
                  <span className={`text-lg font-bold ${v > 0 ? "text-emerald-400" : "text-zinc-600"}`}>{v.toFixed(0)}%</span>
                </div>
                <Slider value={[v]} max={80} step={1} onValueChange={([x]) => setShare(ing.id, x)} />
              </div>
            );
          })}
        </div>

        {/* wyniki */}
        <div className="space-y-6 lg:col-span-3">
          {/* KPI live */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Wyniki — aktualizacja na żywo</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(sim.isLoading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
                kpis.map((k) => (
                  <div key={k.label} className={`rounded-xl border p-3 ${k.bad ? "border-red-500/30 bg-red-500/5" : "border-zinc-800 bg-zinc-900/60"}`}>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">{k.label}<k.icon className={`h-3.5 w-3.5 ${k.bad ? "text-red-400" : "text-emerald-400"}`} /></div>
                    <div className={`mt-1 text-lg font-bold ${k.bad ? "text-red-400" : ""}`}>{k.value}</div>
                  </div>
                )))}
            </div>
          </div>

          {/* profil */}
          {p && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Profil mieszanki</h2>
              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                {[["Białko", `${p.protein.toFixed(1)}%`], ["Energia", `${p.energy.toFixed(0)} kcal`], ["Lizyna", `${p.lysine.toFixed(2)}%`], ["Metionina", `${p.methionine.toFixed(2)}%`], ["Włókno", `${p.fiber.toFixed(1)}%`], ["Tłuszcz", `${p.fat.toFixed(1)}%`], ["Wapń", `${p.calcium.toFixed(2)}%`], ["Fosfor", `${p.phosphorus.toFixed(2)}%`]].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-zinc-950/60 px-3 py-2"><span className="text-zinc-500">{l}: </span><span className="font-semibold">{v}</span></div>
                ))}
              </div>
            </div>
          )}
          {balance.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Bilans żywieniowy</h2>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                  {balance.every((r) => r.status === "PASS") ? "PASS" : "CHECK"}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-950/80 text-zinc-400">
                    <tr>
                      <th className="px-3 py-2">Parametr</th>
                      <th className="px-3 py-2">Wymaganie</th>
                      <th className="px-3 py-2">Receptura</th>
                      <th className="px-3 py-2">Różnica</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balance.map((row) => (
                      <tr key={row.key} className="border-t border-zinc-800 bg-zinc-900/40">
                        <td className="px-3 py-2 font-medium text-zinc-200">{row.label}</td>
                        <td className="px-3 py-2 text-zinc-400">{row.required.toFixed(2)} {row.unit}</td>
                        <td className="px-3 py-2 text-zinc-200">{row.value.toFixed(2)} {row.unit}</td>
                        <td className={`px-3 py-2 font-medium ${row.diff >= 0 ? "text-emerald-400" : "text-amber-400"}`}>{row.diff >= 0 ? "+" : ""}{row.diff.toFixed(2)} {row.unit}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${row.status === "PASS" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : row.status === "WARNING" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : row.status === "DEFICIT" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-violet-500/30 bg-violet-500/10 text-violet-400"}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* AI tłumaczy */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-400"><BrainCircuit className="h-4 w-4" /> AI tłumaczy decyzję</h2>
              <button onClick={() => setShowWhy(!showWhy)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">
                <Info className="h-3.5 w-3.5" /> {showWhy ? "Ukryj" : "Dlaczego?"}
              </button>
            </div>
            {showWhy && (
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">{sim.data?.explanation}</p>
            )}
          </div>

          {/* symulator rzutu */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-3 flex flex-wrap items-center gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Symulator całego rzutu</h2>
              <label className="flex items-center gap-2 text-xs text-zinc-400">sztuki
                <input type="number" value={birds} onChange={(e) => setBirds(Number(e.target.value) || 0)} className="w-24 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-400">dni chowu
                <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value) || 0)} className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm" />
              </label>
            </div>
            {!items.length ? <p className="text-sm text-zinc-500">Ustaw suwaki, aby zasymulować rzut.</p> : batchSim.isLoading ? <Skeleton className="h-24 w-full" /> : bs && (
              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                {[
                  ["Masa końcowa", `${bs.finalWeightKg.toFixed(1)} kg`],
                  ["Śmiertelność", `${bs.mortalityPct.toFixed(1)}%`],
                  ["Zużycie paszy", `${bs.feedTons.toFixed(0)} t`],
                  ["Zużycie wody", `${bs.waterTons.toFixed(0)} m³`],
                  ["Koszt paszy", fmtEur(bs.feedCostEur)],
                  ["Koszt kg żywca", `${(bs.costPerKgLive*4.28).toFixed(2)} zł`],
                  ["Przychód", fmtEur(bs.revenueEur)],
                  ["Marża brutto", fmtEur(bs.grossMarginEur)],
                  ["Emisja NH₃", `${bs.ammoniaTons.toFixed(1)} kg`],
                  ["Pewność prognozy", `${bs.certaintyPct}%`],
                ].map(([l, v]) => (
                  <div key={l} className={`rounded-lg px-3 py-2 ${l === "Marża brutto" ? (bs.grossMarginEur >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400") : "bg-zinc-950/60"}`}>
                    <span className="text-zinc-500">{l}: </span><span className="font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FeedIntelligence />
    </div>
  );
}
