/**
 * DESIGN: Liquid Glass — Analytics Charts
 * Rich demographic breakdown charts: age distribution, occupation, education, geographic spread
 * Uses Recharts with custom dark theme styling
 */

import type { PersonaResponse } from "@/lib/types";
import { STATE_NAMES, EDUCATION_LABELS } from "@/lib/types";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { BarChart3, Users, GraduationCap, MapPin, ChevronDown, ChevronUp } from "lucide-react";

const CHART_COLORS = {
  positive: "#34D399",
  neutral: "#FBBF24",
  negative: "#F87171",
  cyan: "#22D3EE",
  blue: "#60A5FA",
  purple: "#A78BFA",
  pink: "#F472B6",
  emerald: "#34D399",
  amber: "#FBBF24",
  slate: "#94A3B8",
};

const PIE_COLORS = ["#22D3EE", "#60A5FA", "#A78BFA", "#F472B6", "#34D399", "#FBBF24", "#F87171", "#FB923C", "#94A3B8", "#818CF8"];

function formatOcc(occ: string) {
  return occ.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="liquid-glass rounded-lg px-3 py-2 text-[11px] border border-white/10">
      <p className="text-white/70 font-display mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-white/90" style={{ color: entry.color || entry.fill }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="liquid-glass rounded-lg px-3 py-2 text-[11px] border border-white/10">
      <p className="text-white/90">
        <span style={{ color: item.payload.fill }}>{item.name}</span>: <span className="font-semibold">{item.value}</span>
        <span className="text-white/40 ml-1">({((item.value / item.payload.total) * 100).toFixed(1)}%)</span>
      </p>
    </div>
  );
}

function ChartSection({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="liquid-glass-subtle rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 hover:bg-white/3 transition-colors"
      >
        <Icon size={13} className="text-cyan-400/50" />
        <span className="text-[11px] font-display text-cyan-300/70 tracking-wider uppercase flex-1 text-left">
          {title}
        </span>
        {open ? <ChevronUp size={13} className="text-white/30" /> : <ChevronDown size={13} className="text-white/30" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnalyticsCharts({ responses }: { responses: PersonaResponse[] }) {
  if (responses.length < 2) return null;

  // Age distribution — bucket into ranges
  const ageBuckets: Record<string, { positive: number; neutral: number; negative: number }> = {};
  const bucketOrder = ["18-24", "25-34", "35-44", "45-54", "55-64", "65-74", "75+"];
  for (const b of bucketOrder) ageBuckets[b] = { positive: 0, neutral: 0, negative: 0 };

  for (const r of responses) {
    const age = r.persona.age;
    let bucket = "75+";
    if (age < 25) bucket = "18-24";
    else if (age < 35) bucket = "25-34";
    else if (age < 45) bucket = "35-44";
    else if (age < 55) bucket = "45-54";
    else if (age < 65) bucket = "55-64";
    else if (age < 75) bucket = "65-74";
    ageBuckets[bucket][r.sentiment]++;
  }

  const ageData = bucketOrder.map((b) => ({
    name: b,
    positive: ageBuckets[b].positive,
    neutral: ageBuckets[b].neutral,
    negative: ageBuckets[b].negative,
  })).filter((d) => d.positive + d.neutral + d.negative > 0);

  // Top occupations
  const occCounts: Record<string, number> = {};
  for (const r of responses) {
    const occ = formatOcc(r.persona.occupation);
    occCounts[occ] = (occCounts[occ] || 0) + 1;
  }
  const topOccs = Object.entries(occCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({
      name: name.length > 20 ? name.slice(0, 18) + "…" : name,
      fullName: name,
      value,
      total: responses.length,
    }));

  // Education breakdown
  const eduCounts: Record<string, { positive: number; neutral: number; negative: number }> = {};
  for (const r of responses) {
    const edu = EDUCATION_LABELS[r.persona.education_level] || r.persona.education_level;
    if (!eduCounts[edu]) eduCounts[edu] = { positive: 0, neutral: 0, negative: 0 };
    eduCounts[edu][r.sentiment]++;
  }
  const eduData = Object.entries(eduCounts)
    .map(([name, counts]) => ({
      name: name.length > 18 ? name.slice(0, 16) + "…" : name,
      fullName: name,
      ...counts,
      total: counts.positive + counts.neutral + counts.negative,
    }))
    .sort((a, b) => b.total - a.total);

  // Geographic spread — top states
  const stateCounts: Record<string, number> = {};
  for (const r of responses) {
    const st = STATE_NAMES[r.persona.state] || r.persona.state;
    stateCounts[st] = (stateCounts[st] || 0) + 1;
  }
  const topStates = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name: name.length > 14 ? name.slice(0, 12) + "…" : name,
      fullName: name,
      value,
      total: responses.length,
    }));

  // Sex distribution for pie chart
  const sexCounts: Record<string, number> = {};
  for (const r of responses) {
    sexCounts[r.persona.sex] = (sexCounts[r.persona.sex] || 0) + 1;
  }
  const sexData = Object.entries(sexCounts).map(([name, value]) => ({
    name,
    value,
    total: responses.length,
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={12} className="text-cyan-400/40" />
        <span className="text-micro text-cyan-300/40 font-display">Demographic Analysis</span>
      </div>

      {/* Age Distribution with Sentiment Stacking */}
      <ChartSection title="Age Distribution by Sentiment" icon={Users} defaultOpen={true}>
        <div className="h-[180px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} barSize={16}>
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="positive" stackId="a" fill={CHART_COLORS.positive} radius={[0, 0, 0, 0]} name="Positive" />
              <Bar dataKey="neutral" stackId="a" fill={CHART_COLORS.neutral} radius={[0, 0, 0, 0]} name="Neutral" />
              <Bar dataKey="negative" stackId="a" fill={CHART_COLORS.negative} radius={[4, 4, 0, 0]} name="Negative" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 justify-center">
          {[
            { label: "Positive", color: CHART_COLORS.positive },
            { label: "Neutral", color: CHART_COLORS.neutral },
            { label: "Negative", color: CHART_COLORS.negative },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-[9px] text-white/35 font-display">{l.label}</span>
            </div>
          ))}
        </div>
      </ChartSection>

      {/* Education Breakdown */}
      <ChartSection title="Education Level Breakdown" icon={GraduationCap}>
        <div className="h-[180px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eduData} layout="vertical" barSize={14}>
              <XAxis
                type="number"
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="positive" stackId="a" fill={CHART_COLORS.positive} name="Positive" />
              <Bar dataKey="neutral" stackId="a" fill={CHART_COLORS.neutral} name="Neutral" />
              <Bar dataKey="negative" stackId="a" fill={CHART_COLORS.negative} radius={[0, 4, 4, 0]} name="Negative" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      {/* Top Occupations */}
      <ChartSection title="Top Occupations" icon={Users}>
        <div className="space-y-1.5">
          {topOccs.map((occ, i) => {
            const pct = (occ.value / responses.length) * 100;
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/50 truncate max-w-[200px]" title={occ.fullName}>
                    {occ.name}
                  </span>
                  <span className="text-[10px] text-white/30 font-display">{occ.value} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ChartSection>

      {/* Geographic Spread + Sex Distribution side by side */}
      <ChartSection title="Geographic & Demographic Spread" icon={MapPin}>
        <div className="grid grid-cols-2 gap-3">
          {/* Top States */}
          <div>
            <span className="text-[9px] text-white/25 font-display tracking-wider uppercase block mb-2">Top States</span>
            <div className="space-y-1">
              {topStates.slice(0, 6).map((st, i) => {
                const pct = (st.value / responses.length) * 100;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] text-white/40 w-[60px] truncate" title={st.fullName}>{st.name}</span>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        className="h-full rounded-full bg-cyan-400/50"
                      />
                    </div>
                    <span className="text-[9px] text-white/25 font-display w-[20px] text-right">{st.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sex Distribution Pie */}
          <div>
            <span className="text-[9px] text-white/25 font-display tracking-wider uppercase block mb-2">Sex Distribution</span>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sexData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {sexData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#60A5FA" : "#F472B6"} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-3 justify-center mt-1">
              {sexData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: i === 0 ? "#60A5FA" : "#F472B6" }} />
                  <span className="text-[9px] text-white/35">{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ChartSection>
    </div>
  );
}
