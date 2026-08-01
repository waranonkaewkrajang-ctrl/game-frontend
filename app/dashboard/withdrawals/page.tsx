"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface Withdrawal {
  id: number; 
  reference_id: string; 
  amount: string; 
  to_bank: string; 
  to_account: string; 
  to_name: string; 
  status: string; 
  created_at: string;
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
    if (!confirm("ยืนยันอนุมัติการถอนเงิน?")) return;
    try { 
      await api.post(`/admin/withdrawals/${id}/approve`); 
      fetchWithdrawals(); 
    } catch (err: any) { 
      alert(err.response?.data?.message || "ทำรายการไม่สำเร็จ"); 
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason) return;
    try { 
      await api.post(`/admin/withdrawals/${rejectId}/reject`, { reason: rejectReason }); 
      setRejectId(null); 
      setRejectReason(""); 
      fetchWithdrawals(); 
    } catch (err: any) { 
      alert(err.response?.data?.message || "ทำรายการไม่สำเร็จ"); 
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันย้ายรายการนี้ลงถังขยะใช่หรือไม่?")) return;
    try { 
      await api.delete(`/admin/withdrawals/${id}`); 
      fetchWithdrawals(); 
    } catch (err: any) { 
      alert(err.response?.data?.message || "ลบข้อมูลไม่สำเร็จ"); 
    }
  };

  const fmt = (n: string) => parseFloat(n).toLocaleString("th-TH", { minimumFractionDigits: 2 });

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
          <p style={{ color: "#6b7280" }}>อนุมัติ คืนเครดิต หรือลบคำขอถอนเงิน</p>
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
        {loading ? <p style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>กำลังโหลดข้อมูล...</p> : withdrawals.length === 0 ? <p style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>ไม่มีรายการ</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
              <thead style={{ backgroundColor: "#fee2e2", color: "#000000", borderBottom: "2px solid #fca5a5" }}>
                <tr>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>#</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>ธนาคารลูกค้า</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>ข้อมูลลูกค้า</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>ก่อน</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold", cursor: "pointer" }}>ยอด ↕</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>คงเหลือ</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold", cursor: "pointer" }}>วันที่เข้าระบบ ↕</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>ธนาคารถอน</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold", cursor: "pointer" }}>วันที่ยืนยัน ↕</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>ดำเนินการ</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>หมายเหตุ</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>สถานะ</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>Action</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>QRCODE</th>
                </tr>
              </thead>
              <tbody style={{ background: "#ffffff" }}>
                {withdrawals.map((w) => (
                  <tr key={w.id} style={{ borderBottom: "1px solid #e5e7eb", transition: "all 0.2s" }}>
                    
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280", fontSize: "0.85rem", fontFamily: "monospace" }}>
                      {w.reference_id}
                    </td>

                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                        <img 
                          src={`/logos/${w.to_bank}.webp`} 
                          alt={w.to_bank} 
                          style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover" }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{w.to_bank}</div>
                          <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.85rem" }}>{w.to_name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                            <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "0.85rem" }}>{w.to_account}</span>
                            <button 
                              onClick={() => handleCopy(w.to_account)} 
                              style={{ background: "#f3f4f6", border: "1px solid #d1d5db", color: "#4b5563", cursor: "pointer", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}
                            >
                              คัดลอก
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.85rem" }}>{w.user?.phone}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{w.user?.username}</div>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#9ca3af" }}>-</td>

                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <span style={{ color: "#dc2626", fontWeight: "bold", fontSize: "1rem" }}>
                          {fmt(w.amount)}
                        </span>
                        <button 
                          onClick={() => handleCopy(w.amount.toString())} 
                          style={{ background: "#f3f4f6", border: "1px solid #d1d5db", color: "#4b5563", cursor: "pointer", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}
                        >
                          คัดลอก
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#9ca3af" }}>-</td>

                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280", fontSize: "0.8rem" }}>
                      {new Date(w.created_at).toLocaleString("th-TH")}
                    </td>

                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#9ca3af" }}>-</td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#9ca3af" }}>-</td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#9ca3af" }}>-</td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#9ca3af" }}>-</td>

                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold",
                        background: w.status === "pending" ? "#fef3c7" : w.status === "approved" ? "#dcfce3" : "#fee2e2",
                        color: w.status === "pending" ? "#d97706" : w.status === "approved" ? "#166534" : "#991b1b"
                      }}>
                        {w.status === "pending" ? "รอดำเนินการ" : w.status === "approved" ? "สำเร็จ" : "ปฏิเสธ"}
                      </span>
                    </td>

                    <td style={{ padding: "0.5rem", textAlign: "center" }}>
                      {w.status === "pending" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "70px", margin: "0 auto" }}>
                          <button 
                            onClick={() => handleApprove(w.id)} 
                            style={{ background: "#10b981", color: "white", border: "none", padding: "4px 6px", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                          >
                            อนุมัติ
                          </button>
                          <button 
                            onClick={() => setRejectId(w.id)} 
                            style={{ background: "#f59e0b", color: "white", border: "none", padding: "4px 6px", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                          >
                            คืนเครดิต
                          </button>
                          <button 
                            onClick={() => handleDelete(w.id)} 
                            style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 6px", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                          >
                            ถังขยะ
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#9ca3af" }}>-</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal สำหรับปุ่ม คืนเครดิต */}
      {rejectId && (
        <div onClick={() => setRejectId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="card" style={{ width: "100%", maxWidth: "400px", background: "#fff", padding: "2rem", borderRadius: "12px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", marginBottom: "1rem", color: "#000" }}>คืนเครดิตให้ลูกค้า</h3>
            <p style={{ color: "#d97706", fontSize: "0.875rem", marginBottom: "0.75rem" }}>เงินจะถูกคืนกลับเข้ากระเป๋าของลูกค้าโดยอัตโนมัติ</p>
            <input className="input" placeholder="ระบุเหตุผล (เช่น ข้อมูลบัญชีไม่ตรง)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ marginBottom: "1rem", width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", color: "#000" }} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handleReject} style={{ flex: 1, background: "#f59e0b", color: "white", border: "none", borderRadius: "0.5rem", padding: "0.5rem", cursor: "pointer", fontWeight: "bold" }}>ยืนยันคืนเครดิต</button>
              <button onClick={() => setRejectId(null)} style={{ flex: 1, background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "0.5rem", padding: "0.5rem", cursor: "pointer", fontWeight: "bold" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}