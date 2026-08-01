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
  reject_reason: string | null;
  balance_before: string | null;
  balance_after: string | null;
  approved_at: string | null;
  created_at: string;
  user: { username: string; phone: string; bank_code: string; bank_account: string; bank_name: string; full_name: string | null };
  approver: { username: string } | null;
  processing_by: number | null;
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
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>ยอด</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>คงเหลือ</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>วันที่เข้าระบบ</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>ธนาคารถอน</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>วันที่ยืนยัน</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>ดำเนินการโดย</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>หมายเหตุ</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>สถานะ</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold" }}>Action</th>
                </tr>
              </thead>
              <tbody style={{ background: "#ffffff" }}>
                {withdrawals.map((w, index) => (
                  <tr key={w.id} style={{ borderBottom: "1px solid #e5e7eb", transition: "all 0.2s" }}>

                    {/* # ลำดับ */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#111827", fontSize: "0.95rem", fontWeight: "bold" }}>
                      {withdrawals.length - index}
                    </td>

                    {/* ธนาคารลูกค้า + logo */}
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                        <img
                          src={`/logos/${w.to_bank}.webp`}
                          alt={w.to_bank}
                          style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "contain", background: "#fff", padding: "2px", border: "1px solid #e5e7eb" }}
                          onError={(e) => { e.currentTarget.src = "/logos/BBL.webp"; }}
                        />
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{w.to_bank}</div>
                          <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.85rem" }}>{w.to_name}</div>
                          <div style={{ color: "#2563eb", fontWeight: "bold", fontSize: "0.85rem", marginTop: "2px" }}>{w.to_account}</div>
                        </div>
                      </div>
                    </td>

                    {/* ข้อมูลลูกค้า + ชื่อจริง */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.85rem" }}>{w.user?.bank_name || w.user?.full_name || "-"}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{w.user?.username}</div>
                      <div style={{ fontSize: "0.75rem", color: "#2563eb" }}>{w.user?.phone}</div>
                    </td>

                    {/* ก่อน */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#111827", fontWeight: 500 }}>
                      {w.balance_before ? fmt(w.balance_before) : "-"}
                    </td>

                    {/* ยอด */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <span style={{ color: "#dc2626", fontWeight: "bold", fontSize: "1rem" }}>
                        {fmt(w.amount)}
                      </span>
                    </td>

                    {/* คงเหลือ */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#111827", fontWeight: 500 }}>
                      {w.balance_after ? fmt(w.balance_after) : "-"}
                    </td>

                    {/* วันที่เข้าระบบ */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280", fontSize: "0.8rem" }}>
                      {new Date(w.created_at).toLocaleString("th-TH")}
                    </td>

                    {/* ธนาคารถอน */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280", fontSize: "0.8rem" }}>
                      {w.to_bank}
                    </td>

                    {/* วันที่ยืนยัน */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280", fontSize: "0.8rem" }}>
                      {w.approved_at ? new Date(w.approved_at).toLocaleString("th-TH") : "-"}
                    </td>

                    {/* ดำเนินการโดย */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#4f46e5", fontWeight: 600, fontSize: "0.8rem" }}>
                      {w.approver?.username || "-"}
                    </td>

                    {/* หมายเหตุ */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280", fontSize: "0.8rem" }}>
                      {w.reject_reason || "-"}
                    </td>

                    {/* สถานะ */}
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <span style={{
                        padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold",
                        background: w.status === "pending" ? "#fef3c7" : w.status === "approved" ? "#dcfce3" : "#fee2e2",
                        color: w.status === "pending" ? "#d97706" : w.status === "approved" ? "#166534" : "#991b1b"
                      }}>
                        {w.status === "pending" ? "รอดำเนินการ" : w.status === "approved" ? "สำเร็จ" : "ปฏิเสธ"}
                      </span>
                    </td>

                    {/* Action */}
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