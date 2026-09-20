"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
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
  Cell,
} from "recharts";
import { 
  Users, 
  UserPlus,
  Activity,
  Star,
  Receipt,
  CreditCard,
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Wallet, 
  CircleDollarSign, 
  Gamepad2, 
  Trophy,
  AlertCircle,
  Calendar,
  TrendingUp
} from "lucide-react";

interface DashboardData {
  today: { 
    new_users: number; 
    total_deposit: number; 
    total_withdraw: number; 
    total_bet: number; 
    total_win: number;
    // สิ่งที่ต้องส่งเพิ่มมาจาก Backend
    deposit_count: number; 
    withdraw_count: number; 
    first_deposit_count: number; 
  };
  this_month: { new_users: number; total_deposit: number; total_withdraw: number; total_bet: number; total_win: number };
  overall: { total_users: number; active_users: number; total_balance: number };
  pending: { deposits: number; withdrawals: number };
    chart_data: { name: string; deposit: number; withdraw: number; bet: number; win: number }[];
}

// ─── Helper สำหรับกราฟ ───────────────────────────
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

const ChartSummary = ({ items }: { items: { label: string; value: number; color: string }[] }) => (
  <div style={{ display: "flex", gap: "1.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
    {items.map((it) => (
      <div key={it.label}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: it.color, display: "inline-block" }} />
          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>{it.label}</span>
        </div>
        <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>{baht(it.value)}</div>
      </div>
    ))}
  </div>
);
// ─────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
 // 🇹🇭 วันนี้ตามเวลาไทย (Bangkok)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const fetchDashboardData = () => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (startDate) params.append("from", startDate);
    if (endDate) params.append("to", endDate);

    api
      .get(`/admin/dashboard?${params.toString()}`)
      .then((res) => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#64748b", fontSize: "1rem", fontWeight: 500 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "20px", height: "20px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          กำลังโหลดข้อมูลบอร์ด...
        </div>
      </div>
    );
    
  if (!data)
    return <p style={{ color: "#dc2626", padding: "2rem", background: "#fee2e2", borderRadius: "0.5rem", margin: "1rem" }}>ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>;

  // แยก format เป็น 2 แบบ: จำนวนเงิน (มีทศนิยม) และ จำนวนนับ (ไม่มีทศนิยม)
  const fmtAmt = (n: number) => (n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCount = (n: number) => (n || 0).toLocaleString("th-TH");

  const profitToday = data.today.total_bet - data.today.total_win;
  const netToday = data.today.total_deposit - data.today.total_withdraw;
  const totalProfit = profitToday + netToday;

  // ฟังก์ชันช่วยสร้างการ์ดสถิติให้สวยงาม
  const StatCard = ({ title, value, subtext, color, Icon }: { title: string, value: string | number, subtext: string, color: string, Icon: any }) => (
    <div style={{
      background: "white",
      border: "1px solid #f1f5f9",
      borderRadius: "1rem",
      padding: "1.25rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "default",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.05)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.02)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600, margin: "0 0 0.5rem 0" }}>{title}</p>
          <p style={{ fontSize: "1.4rem", fontWeight: 700, color: color, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
        </div>
        <div style={{ background: `${color}15`, padding: "0.6rem", borderRadius: "0.75rem", color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.75rem 0 0 0", fontWeight: 500 }}>{subtext}</p>
    </div>
  );

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    border: "1px solid #cbd5e1",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    color: "#334155",
    outline: "none",
    background: "white",
    fontFamily: "inherit"
  };

  const gridRowStyle = {
    display: "grid", 
    gridTemplateColumns: "repeat(4, 1fr)", // ฟิกซ์แถวละ 4 กล่อง
    gap: "1.25rem",
    marginBottom: "1.5rem"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "0.5rem" }}>
      
      {/* ===== Header & Filters ===== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", background: "white", padding: "1.25rem 1.5rem", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>ภาพรวมระบบ</h1>
          <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>ดูสถิติและผลประกอบการทั้งหมด</p>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#f8fafc", padding: "0.25rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
            <Calendar size={18} color="#64748b" style={{ marginLeft: "0.5rem" }} />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, border: "none", background: "transparent" }} />
            <span style={{ color: "#cbd5e1" }}>-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, border: "none", background: "transparent" }} />
          </div>
          
          <button onClick={fetchDashboardData} style={{ background: "#0f172a", border: "none", borderRadius: "0.5rem", padding: "0.6rem 1.25rem", fontSize: "0.875rem", color: "white", cursor: "pointer", fontWeight: 600, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#1e293b"} onMouseLeave={(e) => e.currentTarget.style.background = "#0f172a"}>
            กรองข้อมูล
          </button>
        </div>
      </div>

      {/* ===== แจ้งเตือนรอดำเนินการ ===== */}
      {(data.pending.deposits > 0 || data.pending.withdrawals > 0) && (
        <div style={{ background: "linear-gradient(to right, #fffbeb, #fef3c7)", border: "1px solid #fde68a", borderRadius: "1rem", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 6px -1px rgba(251, 191, 36, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "#f59e0b", padding: "0.5rem", borderRadius: "50%", color: "white", display: "flex" }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#92400e" }}>มีรายการรอดำเนินการ</h3>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#b45309" }}>กรุณาตรวจสอบและอนุมัติรายการ</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ background: "white", border: "1px solid #fcd34d", color: "#d97706", padding: "0.4rem 1rem", borderRadius: "99px", fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              รอฝาก <span style={{ background: "#f59e0b", color: "white", padding: "0.1rem 0.5rem", borderRadius: "10px", marginLeft: "0.25rem" }}>{fmtCount(data.pending.deposits)}</span>
            </div>
            <div style={{ background: "white", border: "1px solid #fcd34d", color: "#d97706", padding: "0.4rem 1rem", borderRadius: "99px", fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              รอถอน <span style={{ background: "#ef4444", color: "white", padding: "0.1rem 0.5rem", borderRadius: "10px", marginLeft: "0.25rem" }}>{fmtCount(data.pending.withdrawals)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== แถวที่ 1: ข้อมูลผู้ใช้งาน ===== */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "4px", height: "16px", background: "#3b82f6", borderRadius: "2px" }}></div>
          ข้อมูลสมาชิก
        </h2>
        <div style={gridRowStyle}>
          <StatCard title="สมาชิกทั้งหมด" value={fmtCount(data.overall.total_users)} subtext="บัญชีทั้งหมดในระบบ" color="#0ea5e9" Icon={Users} />
          <StatCard title="สมาชิกใหม่" value={fmtCount(data.today.new_users)} subtext="สมัครใหม่ช่วงเวลานี้" color="#3b82f6" Icon={UserPlus} />
          <StatCard title="ลูกค้าเข้าใช้งาน" value={fmtCount(data.overall.active_users)} subtext="Login ในช่วงเวลานี้" color="#14b8a6" Icon={Activity} />
          <StatCard title="ยอดฝากแรก (First Deposit)" value={fmtCount(data.today.first_deposit_count)} subtext="จำนวนบิลฝากครั้งแรก" color="#eab308" Icon={Star} />
        </div>
      </div>

      {/* ===== แถวที่ 2: ข้อมูลธุรกรรม ===== */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "4px", height: "16px", background: "#10b981", borderRadius: "2px" }}></div>
          ข้อมูลธุรกรรม
        </h2>
        <div style={gridRowStyle}>
          <StatCard title="จำนวนฝาก" value={`${fmtCount(data.today.deposit_count)} บิล`} subtext="รายการฝากที่สำเร็จ" color="#8b5cf6" Icon={Receipt} />
          <StatCard title="ยอดฝาก" value={`฿${fmtAmt(data.today.total_deposit)}`} subtext="ยอดเงินฝากรวม" color="#10b981" Icon={ArrowDownToLine} />
          <StatCard title="จำนวนถอน" value={`${fmtCount(data.today.withdraw_count)} บิล`} subtext="รายการถอนที่สำเร็จ" color="#f43f5e" Icon={CreditCard} />
          <StatCard title="ยอดถอน" value={`฿${fmtAmt(data.today.total_withdraw)}`} subtext="ยอดเงินถอนรวม" color="#f59e0b" Icon={ArrowUpFromLine} />
        </div>
      </div>

      {/* ===== แถวที่ 3: สรุปผลประกอบการและการเล่น ===== */}
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "4px", height: "16px", background: "#f59e0b", borderRadius: "2px" }}></div>
          สรุปผลประกอบการ (แยกกระแสเงินสด / กำไรเกม)
        </h2>
        <div style={gridRowStyle}>
          <StatCard title="กำไรรวมจริง" value={`฿${fmtAmt(totalProfit)}`} subtext="กำไรเกม + (ฝาก-ถอน)" color={totalProfit >= 0 ? "#059669" : "#dc2626"} Icon={TrendingUp} />
          <StatCard title="กระแสเงินสด (ฝาก-ถอน)" value={`฿${fmtAmt(netToday)}`} subtext={netToday >= 0 ? "รับเข้ามากกว่าจ่ายออก" : "จ่ายออกมากกว่ารับเข้า"} color={netToday >= 0 ? "#8b5cf6" : "#ef4444"} Icon={Wallet} />
          <StatCard title="กำไรจากเกม" value={`฿${fmtAmt(profitToday)}`} subtext="ยอดเดิมพัน - ยอดจ่ายรางวัล" color={profitToday >= 0 ? "#10b981" : "#ef4444"} Icon={CircleDollarSign} />
          <StatCard title="ยอดเดิมพันรวม" value={`฿${fmtAmt(data.today.total_bet)}`} subtext="เงินที่สมาชิกแทงทั้งหมด" color="#6366f1" Icon={Gamepad2} />
          <StatCard title="ยอดจ่ายรางวัล" value={`฿${fmtAmt(data.today.total_win)}`} subtext="เงินที่จ่ายให้สมาชิกที่ชนะ" color="#ec4899" Icon={Trophy} />
        </div>
      </div>

            {/* ===== กราฟสถิติ ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem", marginTop: "0.5rem" }}>

        {/* ฝาก-ถอน */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem", margin: 0 }}>สถิติการฝาก-ถอน</h3>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>ย้อนหลัง {data.chart_data?.length || 0} วัน</p>
            </div>
            {(() => {
              const dep = (data.chart_data || []).reduce((s: number, d: any) => s + (d.deposit || 0), 0);
              const wdr = (data.chart_data || []).reduce((s: number, d: any) => s + (d.withdraw || 0), 0);
              const net = dep - wdr;
              return (
                <div style={{
                  background: net >= 0 ? "#dcfce7" : "#fee2e2",
                  color: net >= 0 ? "#166534" : "#991b1b",
                  padding: "0.35rem 0.8rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}>
                  สุทธิ {net >= 0 ? "+" : ""}{baht(net)}
                </div>
              );
            })()}
          </div>

          <ChartSummary items={[
            { label: "ยอดฝากรวม", value: (data.chart_data || []).reduce((s: number, d: any) => s + (d.deposit || 0), 0), color: "#10b981" },
            { label: "ยอดถอนรวม", value: (data.chart_data || []).reduce((s: number, d: any) => s + (d.withdraw || 0), 0), color: "#f59e0b" },
          ]} />

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data.chart_data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }} barGap={6}>
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
        </div>

        {/* เดิมพัน-ชนะ */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem", margin: 0 }}>สถิติการเดิมพัน-ชนะ</h3>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>ย้อนหลัง {data.chart_data?.length || 0} วัน</p>
            </div>
            {(() => {
              const bet = (data.chart_data || []).reduce((s: number, d: any) => s + (d.bet || 0), 0);
              const win = (data.chart_data || []).reduce((s: number, d: any) => s + (d.win || 0), 0);
              const edge = bet > 0 ? ((bet - win) / bet) * 100 : 0;
              return (
                <div style={{
                  background: edge >= 0 ? "#eef2ff" : "#fee2e2",
                  color: edge >= 0 ? "#4338ca" : "#991b1b",
                  padding: "0.35rem 0.8rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}>
                  กำไรขั้นต้น {edge.toFixed(1)}%
                </div>
              );
            })()}
          </div>

          <ChartSummary items={[
            { label: "ยอดเดิมพันรวม", value: (data.chart_data || []).reduce((s: number, d: any) => s + (d.bet || 0), 0), color: "#6366f1" },
            { label: "ยอดชนะรวม", value: (data.chart_data || []).reduce((s: number, d: any) => s + (d.win || 0), 0), color: "#ec4899" },
          ]} />

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={data.chart_data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
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
        </div>

      </div>
    </div>
  );
}