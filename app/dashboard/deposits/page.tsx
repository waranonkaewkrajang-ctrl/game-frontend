"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchDeposits = () => {
    setLoading(true);
    api.get("/admin/deposits", { params: { status: filter || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined } }).then((res) => {
      setDeposits(res.data.data.data || res.data.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchDeposits(); }, [filter]);

  const handleApprove = async (id: number) => {
    const result = await Swal.fire({ title: "ยืนยันอนุมัติ?", icon: "question", showCancelButton: true, confirmButtonText: "อนุมัติ", cancelButtonText: "ยกเลิก", confirmButtonColor: "#10b981" });
    if (!result.isConfirmed) return;
    try { await api.post(`/admin/deposits/${id}/approve`); Swal.fire({ icon: "success", title: "อนุมัติสำเร็จ", timer: 1500, showConfirmButton: false }); fetchDeposits(); }
    catch (err: any) { Swal.fire({ icon: "error", title: err.response?.data?.message || "ไม่สำเร็จ" }); }
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
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", fontSize: "0.85rem", background: "white", color: "#0f172a", cursor: "pointer" }}>
            <option value="pending">รอดำเนินการ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
            <option value="">ทั้งหมด</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
          <span style={{ color: "#64748b" }}>→</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
          <button onClick={() => fetchDeposits()} style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: "#2563eb", color: "white", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>ค้นหา</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <p style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>⏳ กำลังโหลด...</p> : deposits.length === 0 ? <p style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>ไม่มีรายการ</p> : (
          <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#dbeafe" }}>
                {["เลขอ้างอิง", "สมาชิก", "จำนวนเงิน", "ช่องทาง", "สถานะ", "วันที่", "จัดการ"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "1rem", color: "#1e40af", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{d.reference_id}</td>
                  <td style={{ padding: "1rem", fontWeight: 500 }}>{d.user?.username}</td>
                  <td style={{ padding: "1rem", color: "#34d399", fontWeight: 500 }}>฿{fmt(d.amount)}</td>
                  <td style={{ padding: "1rem", color: "#9ca3af" }}>{d.channel}</td>
                  <td style={{ padding: "1rem" }}><span className={d.status === "pending" ? "badge-pending" : d.status === "approved" ? "badge-approved" : "badge-rejected"}>{d.status}</span></td>
                  <td style={{ padding: "1rem", color: "#9ca3af" }}>{new Date(d.created_at).toLocaleString("th-TH")}</td>
                  <td style={{ padding: "1rem" }}>
                    {d.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleApprove(d.id)} className="btn-success" style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}>อนุมัติ</button>
                        <button onClick={() => setRejectId(d.id)} className="btn-danger" style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}>ปฏิเสธ</button>
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