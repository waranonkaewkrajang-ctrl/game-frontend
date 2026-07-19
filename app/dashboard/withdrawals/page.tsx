"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Withdrawal {
  id: number; reference_id: string; amount: string; to_bank: string; to_account: string; to_name: string; status: string; created_at: string;
  user: { username: string; phone: string };
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchWithdrawals = () => {
    setLoading(true);
    api.get("/admin/withdrawals", { params: { status: filter || undefined } }).then((res) => {
      setWithdrawals(res.data.data.data || res.data.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchWithdrawals(); }, [filter]);

  const handleApprove = async (id: number) => {
    if (!confirm("ยืนยันอนุมัติ?")) return;
    try { await api.post(`/admin/withdrawals/${id}/approve`); fetchWithdrawals(); }
    catch (err: any) { alert(err.response?.data?.message || "ไม่สำเร็จ"); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason) return;
    try { await api.post(`/admin/withdrawals/${rejectId}/reject`, { reason: rejectReason }); setRejectId(null); setRejectReason(""); fetchWithdrawals(); }
    catch (err: any) { alert(err.response?.data?.message || "ไม่สำเร็จ"); }
  };

  const fmt = (n: string) => parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>จัดการถอนเงิน</h1>
          <p style={{ color: "#6b7280" }}>อนุมัติหรือปฏิเสธคำขอถอนเงิน</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[{ v: "pending", l: "รอดำเนินการ" }, { v: "approved", l: "อนุมัติแล้ว" }, { v: "rejected", l: "ปฏิเสธ" }, { v: "", l: "ทั้งหมด" }].map((s) => (
            <button key={s.v} onClick={() => setFilter(s.v)}
              style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, border: "none", cursor: "pointer", background: filter === s.v ? "#4f46e5" : "#1f2937", color: filter === s.v ? "white" : "#9ca3af" }}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <p style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>⏳ กำลังโหลด...</p> : withdrawals.length === 0 ? <p style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>ไม่มีรายการ</p> : (
          <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(31,41,55,0.5)" }}>
                {["เลขอ้างอิง", "สมาชิก", "จำนวนเงิน", "ธนาคาร", "เลขบัญชี", "ชื่อบัญชี", "สถานะ", "จัดการ"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "1rem", color: "#9ca3af", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} style={{ borderBottom: "1px solid #1f2937" }}>
                  <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{w.reference_id}</td>
                  <td style={{ padding: "1rem", fontWeight: 500 }}>{w.user?.username}</td>
                  <td style={{ padding: "1rem", color: "#fb923c", fontWeight: 500 }}>฿{fmt(w.amount)}</td>
                  <td style={{ padding: "1rem", color: "#9ca3af" }}>{w.to_bank}</td>
                  <td style={{ padding: "1rem", color: "#9ca3af" }}>{w.to_account}</td>
                  <td style={{ padding: "1rem", color: "#9ca3af" }}>{w.to_name}</td>
                  <td style={{ padding: "1rem" }}><span className={w.status === "pending" ? "badge-pending" : w.status === "approved" ? "badge-approved" : "badge-rejected"}>{w.status}</span></td>
                  <td style={{ padding: "1rem" }}>
                    {w.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleApprove(w.id)} className="btn-success" style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}>✅ อนุมัติ</button>
                        <button onClick={() => setRejectId(w.id)} className="btn-danger" style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}>❌ ปฏิเสธ</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejectId && (
        <div onClick={() => setRejectId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ width: "100%", maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", marginBottom: "1rem" }}>ปฏิเสธการถอนเงิน</h3>
            <p style={{ color: "#facc15", fontSize: "0.875rem", marginBottom: "0.75rem" }}>⚠️ เงินจะถูกคืนกลับเข้า wallet อัตโนมัติ</p>
            <input className="input" placeholder="เหตุผลที่ปฏิเสธ" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ marginBottom: "0.75rem" }} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handleReject} className="btn-danger" style={{ flex: 1 }}>ยืนยันปฏิเสธ</button>
              <button onClick={() => setRejectId(null)} style={{ flex: 1, background: "#1f2937", color: "white", border: "none", borderRadius: "0.75rem", padding: "0.5rem", cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}