"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
} from "recharts";

/* ---------- ตัวช่วย (ย้ายมาจาก page.tsx) ---------- */

const shortNum = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `฿${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `฿${(v / 1_000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  return `฿${v}`;
};

const baht = (v: number) =>
  "฿" + Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,23,42,0.96)",
      borderRadius: "10px",
      padding: "0.75rem 1rem",
      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
      minWidth: "170px",
    }}>
      <div style={{ color: "#94a3b8", fontSize: "0.72rem", marginBottom: "0.5rem", fontWeight: 600 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.25rem", marginBottom: "0.25rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#cbd5e1", fontSize: "0.78rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
            {p.name}
          </span>
          <span style={{ color: "white", fontWeight: 700, fontSize: "0.82rem" }}>{baht(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

/* ---------- กราฟฝาก-ถอน ---------- */

export function DepositChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }} barGap={6}>
          <defs>
            <linearGradient id="gDeposit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="gWithdraw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eef2f7" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11.5, fontWeight: 500 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} width={58} tick={{ fill: "#94a3b8", fontSize: 11.5, fontWeight: 500 }} tickFormatter={shortNum} />
          <RechartsTooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} content={<ChartTip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12.5px", paddingTop: "16px", fontWeight: 500, color: "#475569" }} />
          <Bar dataKey="deposit" name="ยอดฝาก" fill="url(#gDeposit)" radius={[6, 6, 0, 0]} maxBarSize={38} />
          <Bar dataKey="withdraw" name="ยอดถอน" fill="url(#gWithdraw)" radius={[6, 6, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- กราฟเดิมพัน-ชนะ ---------- */

export function BetWinChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gBet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gWin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eef2f7" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11.5, fontWeight: 500 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} width={58} tick={{ fill: "#94a3b8", fontSize: 11.5, fontWeight: 500 }} tickFormatter={shortNum} />
          <RechartsTooltip content={<ChartTip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12.5px", paddingTop: "16px", fontWeight: 500, color: "#475569" }} />
          <Area type="monotone" dataKey="bet" name="ยอดเดิมพัน" stroke="none" fill="url(#gBet)" />
          <Area type="monotone" dataKey="win" name="ยอดชนะ" stroke="none" fill="url(#gWin)" legendType="none" />
          <Line type="monotone" dataKey="bet" name="ยอดเดิมพัน" stroke="#6366f1" strokeWidth={3} dot={{ r: 3.5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} legendType="none" />
          <Line type="monotone" dataKey="win" name="ยอดชนะ" stroke="#ec4899" strokeWidth={3} dot={{ r: 3.5, fill: "#ec4899", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}