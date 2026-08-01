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

  // ฟังก์ชันสำหรับก๊อปปี้ข้อความ
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      title: "คัดลอกสำเร็จ",
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      background: "#1a1a2e",
      color: "#fff"
    });
  };

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
                <th style={{ textAlign: "left", padding: "1rem", color: "#9ca3af" }}>เลขอ้างอิง</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#9ca3af" }}>ข้อมูลลูกค้า</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#9ca3af" }}>ธนาคารที่โอนออก</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#9ca3af" }}>ยอดถอน</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#9ca3af" }}>สถานะ</th>
                <th style={{ textAlign: "left", padding: "1rem", color: "#9ca3af", textAlign: "right" }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} style={{ borderBottom: "1px solid #1f2937", transition: "all 0.2s" }}>
                  
                  {/* 1. เลขอ้างอิง และ วันที่ */}
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#cbd5e1" }}>{w.reference_id}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px" }}>
                      {new Date(w.created_at).toLocaleString("th-TH")}
                    </div>
                  </td>

                  {/* 2. ข้อมูลลูกค้า */}
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{w.user?.username}</div>
                    <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>{w.user?.phone}</div>
                  </td>

                  {/* 3. ธนาคารลูกค้า (รวมโลโก้ + เลขบัญชี + ปุ่มก๊อปปี้) */}
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img 
                        src={`/logos/${w.to_bank}.webp`} 
                        alt={w.to_bank} 
                        style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{w.to_bank}</div>
                        <div style={{ fontWeight: 500, color: "#e2e8f0", fontSize: "0.9rem" }}>{w.to_name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#3b82f6", fontWeight: "bold" }}>{w.to_account}</span>
                          <button 
                            onClick={() => handleCopy(w.to_account)}
                            style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem" }}
                          >
                            คัดลอก
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 4. ยอดถอน */}
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#fb923c", fontWeight: "bold", fontSize: "1.1rem" }}>
                        ฿{fmt(w.amount)}
                      </span>
                      <button 
                        onClick={() => handleCopy(w.amount.toString())}
                        style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#cbd5e1", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem" }}
                      >
                        คัดลอก
                      </button>
                    </div>
                  </td>

                  {/* 5. สถานะ */}
                  <td style={{ padding: "1rem" }}>
                    <span className={w.status === "pending" ? "badge-pending" : w.status === "approved" ? "badge-approved" : "badge-rejected"}>
                      {w.status === "pending" ? "⏳ รอดำเนินการ" : w.status === "approved" ? "✅ สำเร็จ" : "❌ ปฏิเสธ"}
                    </span>
                  </td>

                  {/* 6. จัดการ */}
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    {w.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button onClick={() => handleApprove(w.id)} style={{ background: "#10b981", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" }}>
                          โอนสำเร็จ
                        </button>
                        <button onClick={() => setRejectId(w.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem" }}>
                          ปฏิเสธ
                        </button>
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