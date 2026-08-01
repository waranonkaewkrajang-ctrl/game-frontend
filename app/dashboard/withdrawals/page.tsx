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

  const fetchWithdrawals = () => {
    setLoading(true);
    api.get("/admin/withdrawals", { params: { status: filter || undefined } }).then((res) => {
      setWithdrawals(res.data.data.data || res.data.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchWithdrawals(); }, [filter]);

  const handleApprove = async (id: number) => {
    const result = await Swal.fire({
      title: "ยืนยันอนุมัติถอนเงิน?",
      text: "เงินจะถูกโอนให้ลูกค้า",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "อนุมัติ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    try {
      await api.post(`/admin/withdrawals/${id}/approve`);
      Swal.fire({ icon: "success", title: "อนุมัติสำเร็จ", timer: 1500, showConfirmButton: false });
      fetchWithdrawals();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
    }
  };

  const handleReject = async (id: number) => {
    const result = await Swal.fire({
      title: "คืนเครดิตให้ลูกค้า",
      text: "เงินจะคืนกลับเข้ากระเป๋าลูกค้าอัตโนมัติ",
      input: "text",
      inputPlaceholder: "ระบุเหตุผล เช่น ข้อมูลบัญชีไม่ตรง",
      inputValidator: (value) => !value ? "กรุณาระบุเหตุผล" : null,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "ยืนยันคืนเครดิต",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    try {
      await api.post(`/admin/withdrawals/${id}/reject`, { reason: result.value });
      Swal.fire({ icon: "success", title: "คืนเครดิตสำเร็จ", timer: 1500, showConfirmButton: false });
      fetchWithdrawals();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "ย้ายลงถังขยะ?",
      input: "text",
      inputPlaceholder: "ระบุเหตุผล (ถ้ามี)",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยันลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/admin/withdrawals/${id}`);
      Swal.fire({ icon: "success", title: "ย้ายลงถังขยะแล้ว", timer: 1500, showConfirmButton: false });
      fetchWithdrawals();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
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
                    
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#111827", fontSize: "0.95rem", fontWeight: "bold" }}>
                      {withdrawals.length - withdrawals.indexOf(w)}
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
                            onClick={() => handleReject(w.id)}
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
    </div>
  );
}