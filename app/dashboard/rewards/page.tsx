"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface RewardUser {
  id: number;
  username: string;
  phone: string;
}

interface RewardRow {
  id: number;
  user_id: number;
  type: "cashback" | "referral";
  amount: string;
  status: "pending" | "claimed" | "expired";
  description: string;
  meta: {
    date?: string;
    loss?: number;
    percent?: number;
    bet?: string;
    win?: string;
    from_username?: string;
  } | null;
  claimed_at: string | null;
  created_at: string;
  user: RewardUser | null;
}

interface SummaryRow {
  type: string;
  status: string;
  count: number;
  total: string;
}

interface ByUserRow {
  user_id: number;
  cashback_total: string;
  referral_total: string;
  pending_total: string;
  claimed_total: string;
  expired_total: string;
  reward_count: number;
  user: RewardUser | null;
}

const inputStyle = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #cbd5e1",
  borderRadius: "0.375rem",
  fontSize: "0.875rem",
  color: "#334155",
  outline: "none",
  background: "#ffffff",
};

const thStyle = { padding: "1rem", color: "#475569", fontWeight: 600 } as const;
const tdStyle = { padding: "1rem", color: "#64748b" } as const;

const pageBtn = (disabled: boolean) => ({
  padding: "0.5rem 0.875rem",
  border: "1px solid #cbd5e1",
  borderRadius: "0.375rem",
  background: disabled ? "#f1f5f9" : "white",
  color: disabled ? "#94a3b8" : "#334155",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
});

const money = (v: string | number) =>
  "฿" + Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#fef9c3", color: "#854d0e", label: "รอรับ" },
    claimed: { bg: "#dcfce7", color: "#166534", label: "รับแล้ว" },
    expired: { bg: "#fee2e2", color: "#991b1b", label: "หมดอายุ" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#64748b", label: status };
  return (
    <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const typeBadge = (type: string) => {
  const isCashback = type === "cashback";
  return (
    <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600, backgroundColor: isCashback ? "#dbeafe" : "#f3e8ff", color: isCashback ? "#1e40af" : "#6b21a8" }}>
      {isCashback ? "คืนยอดเสีย" : "ค่าแนะนำ"}
    </span>
  );
};

export default function RewardsPage() {
  const [tab, setTab] = useState<"list" | "byUser">("list");
  const [rows, setRows] = useState<RewardRow[]>([]);
  const [byUser, setByUser] = useState<ByUserRow[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [perPage, setPerPage] = useState("50");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const params = () => ({
    search: search || undefined,
    type: type || undefined,
    status: status || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    per_page: perPage,
    page,
  });

  const fetchAll = () => {
    setLoading(true);
    const p = params();

    api.get("/admin/rewards/summary", { params: { date_from: p.date_from, date_to: p.date_to } })
      .then((res) => setSummary(res.data.data || []))
      .catch(() => setSummary([]));

    if (tab === "list") {
      api.get("/admin/rewards", { params: p })
        .then((res) => {
          const d = res.data.data;
          setRows(d.data || []);
          setLastPage(d.last_page || 1);
          setTotal(d.total || 0);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      api.get("/admin/rewards/by-user", { params: { date_from: p.date_from, date_to: p.date_to, per_page: p.per_page, page } })
        .then((res) => {
          const d = res.data.data;
          setByUser(d.data || []);
          setLastPage(d.last_page || 1);
          setTotal(d.total || 0);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  };

  useEffect(() => { fetchAll(); }, [tab, perPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAll();
  };

  const totalOf = (t: string, s: string) =>
    Number(summary.find((r) => r.type === t && r.status === s)?.total || 0);

  const cards = [
    { label: "ยอดเสีย - รอรับ", value: totalOf("cashback", "pending"), color: "#854d0e", bg: "#fef9c3" },
    { label: "ยอดเสีย - รับแล้ว", value: totalOf("cashback", "claimed"), color: "#166534", bg: "#dcfce7" },
    { label: "ยอดเสีย - หมดอายุ", value: totalOf("cashback", "expired"), color: "#991b1b", bg: "#fee2e2" },
    { label: "ค่าแนะนำ - รอรับ", value: totalOf("referral", "pending"), color: "#6b21a8", bg: "#f3e8ff" },
    { label: "ค่าแนะนำ - รับแล้ว", value: totalOf("referral", "claimed"), color: "#166534", bg: "#dcfce7" },
    { label: "ค่าแนะนำ - หมดอายุ", value: totalOf("referral", "expired"), color: "#991b1b", bg: "#fee2e2" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>ยอดเสีย &amp; ค่าแนะนำ</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          ตรวจสอบรายการคืนยอดเสียและค่าแนะนำเพื่อนของลูกค้า
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1rem", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>{c.label}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: c.color }}>{money(c.value)}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #e2e8f0" }}>
        {[
          { key: "list" as const, label: "รายการทั้งหมด" },
          { key: "byUser" as const, label: "สรุปรายผู้เล่น" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "0.625rem 1.25rem",
              border: "none",
              background: "transparent",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              color: tab === t.key ? "#10b981" : "#64748b",
              borderBottom: tab === t.key ? "2px solid #10b981" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        {tab === "list" && (
          <>
            <input className="input" style={{ width: "200px", flex: "0 0 auto" }} placeholder="ค้นหา Username..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input" style={{ width: "150px", flex: "0 0 auto" }} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">ทุกประเภท</option>
              <option value="cashback">คืนยอดเสีย</option>
              <option value="referral">ค่าแนะนำ</option>
            </select>
            <select className="input" style={{ width: "150px", flex: "0 0 auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">ทุกสถานะ</option>
              <option value="pending">รอรับ</option>
              <option value="claimed">รับแล้ว</option>
              <option value="expired">หมดอายุ</option>
            </select>
          </>
        )}
        <input type="date" className="input" style={{ width: "160px", flex: "0 0 auto" }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>ถึง</span>
        <input type="date" className="input" style={{ width: "160px", flex: "0 0 auto" }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <select className="input" style={{ width: "130px", flex: "0 0 auto" }} value={perPage} onChange={(e) => setPerPage(e.target.value)}>
          <option value="10">10 รายการ</option>
          <option value="50">50 รายการ</option>
          <option value="100">100 รายการ</option>
          <option value="200">200 รายการ</option>
        </select>
        <button type="submit" style={{ background: "#10b981", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.5rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
          ค้นหา
        </button>
      </form>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#64748b", fontSize: "0.875rem" }}>กำลังโหลดข้อมูล...</div>
        ) : tab === "list" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>ประเภท</th>
                  <th style={thStyle}>ยอดได้รับ</th>
                  <th style={thStyle}>ยอดเสีย</th>
                  <th style={thStyle}>เดิมพัน / ชนะ</th>
                  <th style={thStyle}>%</th>
                  <th style={thStyle}>สถานะ</th>
                  <th style={thStyle}>วันที่</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "#0f172a" }}>
                      {r.user?.username || "-"}
                      {r.meta?.from_username && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 400 }}>
                          จาก {r.meta.from_username}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>{typeBadge(r.type)}</td>
                    <td style={{ padding: "1rem", fontWeight: 700, color: "#059669" }}>{money(r.amount)}</td>
                    <td style={tdStyle}>{r.meta?.loss != null ? money(r.meta.loss) : "-"}</td>
                    <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.8rem" }}>
                      {r.meta?.bet != null ? `${money(r.meta.bet)} / ${money(r.meta.win || 0)}` : "-"}
                    </td>
                    <td style={tdStyle}>{r.meta?.percent != null ? `${r.meta.percent}%` : "-"}</td>
                    <td style={{ padding: "1rem" }}>{statusBadge(r.status)}</td>
                    <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.8rem" }}>
                      {r.meta?.date || new Date(r.created_at).toLocaleDateString("th-TH")}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>ไม่พบข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>เบอร์โทร</th>
                  <th style={thStyle}>คืนยอดเสีย</th>
                  <th style={thStyle}>ค่าแนะนำ</th>
                  <th style={thStyle}>รอรับ</th>
                  <th style={thStyle}>รับแล้ว</th>
                  <th style={thStyle}>หมดอายุ</th>
                  <th style={thStyle}>จำนวนรายการ</th>
                </tr>
              </thead>
              <tbody>
                {byUser.length > 0 ? byUser.map((u) => (
                  <tr key={u.user_id} style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "#0f172a" }}>{u.user?.username || `#${u.user_id}`}</td>
                    <td style={tdStyle}>{u.user?.phone || "-"}</td>
                    <td style={{ padding: "1rem", color: "#1e40af", fontWeight: 600 }}>{money(u.cashback_total)}</td>
                    <td style={{ padding: "1rem", color: "#6b21a8", fontWeight: 600 }}>{money(u.referral_total)}</td>
                    <td style={{ padding: "1rem", color: "#854d0e" }}>{money(u.pending_total)}</td>
                    <td style={{ padding: "1rem", color: "#166534", fontWeight: 600 }}>{money(u.claimed_total)}</td>
                    <td style={{ padding: "1rem", color: "#991b1b" }}>{money(u.expired_total)}</td>
                    <td style={tdStyle}>{u.reward_count}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>ไม่พบข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", paddingBottom: "2rem" }}>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>
            ทั้งหมด {total.toLocaleString("th-TH")} รายการ — หน้า {page} / {lastPage}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              style={pageBtn(page === 1)}
            >
              หน้าแรก
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={pageBtn(page === 1)}
            >
              ‹ ก่อนหน้า
            </button>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a", padding: "0 0.5rem" }}>
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              style={pageBtn(page >= lastPage)}
            >
              ถัดไป ›
            </button>
            <button
              onClick={() => setPage(lastPage)}
              disabled={page >= lastPage}
              style={pageBtn(page >= lastPage)}
            >
              หน้าสุดท้าย
            </button>
          </div>
        </div>
      )}
    </div>
  );
}