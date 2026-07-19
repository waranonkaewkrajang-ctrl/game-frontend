"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Deposit {
  id: number; reference_id: string; amount: string; channel: string; status: string; created_at: string;
  user: { username: string; phone: string };
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchDeposits = () => {
    setLoading(true);
    api.get("/admin/deposits", { params: { status: filter || undefined } }).then((res) => {
      setDeposits(res.data.data.data || res.data.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchDeposits(); }, [filter]);

  const handleApprove = async (id: number) => {
    if (!confirm("ยืนยันอนุมัติ?")) return;
    try { await api.post(`/admin/deposits/${id}/approve`); fetchDeposits(); }
    catch (err: any) { alert(err.response?.data?.message || "ไม่สำเร็จ"); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason) return;
    try { await api.post(`/admin/deposits/${rejectId}/reject`, { reason: rejectReason }); setRejectId(null); setRejectReason(""); fetchDeposits(); }
    catch (err: any) { alert(err.response?.data?.message || "ไม่สำเร็จ"); }
  };

  const fmt = (n: string) => parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>จัดการฝากเงิน</h1>
          <p style={{ color: "#6b7280" }}>อนุมัติหรือปฏิเสธคำขอฝากเงิน</p>
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
        {loading ? <p style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>⏳ กำลังโหลด...</p> : deposits.length === 0 ? <p style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>ไม่มีรายการ</p> : (
          <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(31,41,55,0.5)" }}>
                {["เลขอ้างอิง", "สมาชิก", "จำนวนเงิน", "ช่องทาง", "สถานะ", "วันที่", "จัดการ"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "1rem", color: "#9ca3af", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #1f2937" }}>
                  <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{d.reference_id}</td>
                  <td style={{ padding: "1rem", fontWeight: 500 }}>{d.user?.username}</td>
                  <td style={{ padding: "1rem", color: "#34d399", fontWeight: 500 }}>฿{fmt(d.amount)}</td>
                  <td style={{ padding: "1rem", color: "#9ca3af" }}>{d.channel}</td>
                  <td style={{ padding: "1rem" }}><span className={d.status === "pending" ? "badge-pending" : d.status === "approved" ? "badge-approved" : "badge-rejected"}>{d.status}</span></td>
                  <td style={{ padding: "1rem", color: "#9ca3af" }}>{new Date(d.created_at).toLocaleString("th-TH")}</td>
                  <td style={{ padding: "1rem" }}>
                    {d.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleApprove(d.id)} className="btn-success" style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}>✅ อนุมัติ</button>
                        <button onClick={() => setRejectId(d.id)} className="btn-danger" style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}>❌ ปฏิเสธ</button>
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
            <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", marginBottom: "1rem" }}>ปฏิเสธการฝากเงิน</h3>
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