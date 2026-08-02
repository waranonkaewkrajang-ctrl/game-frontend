"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface Prize {
  id: number;
  label: string;
  type: string;
  value: number;
  color: string;
  icon: string;
  probability: number;
  sort_order: number;
  is_active: boolean;
}

interface Settings {
  enabled: boolean;
  condition: string;
  deposit_min: number;
  daily_limit: number;
}

interface Summary {
  today_spins: number;
  today_credit: number;
  total_spins: number;
  total_credit: number;
  prizes_count: number;
}

export default function SpinWheelAdminPage() {
  const [tab, setTab] = useState<"prizes" | "settings" | "history">("prizes");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [settings, setSettings] = useState<Settings>({ enabled: true, condition: "free_daily", deposit_min: 0, daily_limit: 3 });
  const [summary, setSummary] = useState<Summary>({ today_spins: 0, today_credit: 0, total_spins: 0, total_credit: 0, prizes_count: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrizes = () => {
    api.get("/admin/spin-wheel/prizes").then((res) => {
      setPrizes(res.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const fetchSettings = () => {
    api.get("/admin/spin-wheel/settings").then((res) => {
      if (res.data.data) setSettings(res.data.data);
    });
  };

  const fetchSummary = () => {
    api.get("/admin/spin-wheel/summary").then((res) => {
      if (res.data.data) setSummary(res.data.data);
    });
  };

  const fetchHistory = () => {
    api.get("/admin/spin-wheel/history").then((res) => {
      setHistory(res.data.data?.data || res.data.data || []);
    });
  };

  useEffect(() => { fetchPrizes(); fetchSettings(); fetchSummary(); }, []);
  useEffect(() => { if (tab === "history") fetchHistory(); }, [tab]);

  const typeLabels: Record<string, string> = {
    credit: "เครดิต",
    bonus: "โบนัส",
    free_spin: "หมุนฟรี",
    nothing: "เสียใจด้วย",
  };

  const typeColors: Record<string, { bg: string; text: string }> = {
    credit: { bg: "#dcfce7", text: "#166534" },
    bonus: { bg: "#e0e7ff", text: "#3730a3" },
    free_spin: { bg: "#fef3c7", text: "#92400e" },
    nothing: { bg: "#f3f4f6", text: "#6b7280" },
  };

  const handleAddPrize = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มรางวัล",
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left;padding:4px 0">
          <div>
            <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">ชื่อรางวัล</label>
            <input id="swal-label" class="swal2-input" placeholder="เช่น 50 บาท" style="margin:0;width:100%;box-sizing:border-box">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">ประเภท</label>
              <select id="swal-type" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px">
                <option value="credit">เครดิต (บาท)</option>
                <option value="bonus">โบนัส</option>
                <option value="free_spin">หมุนฟรี</option>
                <option value="nothing">เสียใจด้วย</option>
              </select>
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">มูลค่า</label>
              <input id="swal-value" class="swal2-input" type="number" placeholder="0" style="margin:0;width:100%;box-sizing:border-box">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">สีช่อง</label>
              <input id="swal-color" type="color" value="#7c3aed" style="width:100%;height:42px;padding:2px;border:1px solid #d1d5db;border-radius:8px;cursor:pointer">
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">Icon</label>
              <input id="swal-icon" class="swal2-input" placeholder="★" style="margin:0;width:100%;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">โอกาส %</label>
              <input id="swal-prob" class="swal2-input" type="number" placeholder="10" style="margin:0;width:100%;box-sizing:border-box">
            </div>
          </div>
        </div>
      `,
      width: 520,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "เพิ่มรางวัล",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
      preConfirm: () => {
        const label = (document.getElementById("swal-label") as HTMLInputElement).value;
        if (!label) { Swal.showValidationMessage("กรุณาใส่ชื่อรางวัล"); return false; }
        return {
          label,
          type: (document.getElementById("swal-type") as HTMLSelectElement).value,
          value: parseFloat((document.getElementById("swal-value") as HTMLInputElement).value) || 0,
          color: (document.getElementById("swal-color") as HTMLInputElement).value,
          icon: (document.getElementById("swal-icon") as HTMLInputElement).value || "★",
          probability: parseFloat((document.getElementById("swal-prob") as HTMLInputElement).value) || 10,
          sort_order: prizes.length,
          is_active: true,
        };
      },
    });
    if (formValues) {
      try {
        await api.post("/admin/spin-wheel/prizes", formValues);
        Swal.fire({ icon: "success", title: "เพิ่มรางวัลสำเร็จ", timer: 1500, showConfirmButton: false });
        fetchPrizes(); fetchSummary();
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
      }
    }
  };

  const handleEditPrize = async (prize: Prize) => {
    const { value: formValues } = await Swal.fire({
      title: "แก้ไขรางวัล",
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left;padding:4px 0">
          <div>
            <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">ชื่อรางวัล</label>
            <input id="swal-label" class="swal2-input" value="${prize.label}" style="margin:0;width:100%;box-sizing:border-box">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">ประเภท</label>
              <select id="swal-type" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px">
                <option value="credit" ${prize.type === "credit" ? "selected" : ""}>เครดิต (บาท)</option>
                <option value="bonus" ${prize.type === "bonus" ? "selected" : ""}>โบนัส</option>
                <option value="free_spin" ${prize.type === "free_spin" ? "selected" : ""}>หมุนฟรี</option>
                <option value="nothing" ${prize.type === "nothing" ? "selected" : ""}>เสียใจด้วย</option>
              </select>
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">มูลค่า</label>
              <input id="swal-value" class="swal2-input" type="number" value="${prize.value}" style="margin:0;width:100%;box-sizing:border-box">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">สีช่อง</label>
              <input id="swal-color" type="color" value="${prize.color}" style="width:100%;height:42px;padding:2px;border:1px solid #d1d5db;border-radius:8px;cursor:pointer">
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">Icon</label>
              <input id="swal-icon" class="swal2-input" value="${prize.icon || ""}" style="margin:0;width:100%;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">โอกาส %</label>
              <input id="swal-prob" class="swal2-input" type="number" value="${prize.probability}" style="margin:0;width:100%;box-sizing:border-box">
            </div>
          </div>
        </div>
      `,
      width: 520,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#4f46e5",
      preConfirm: () => ({
        label: (document.getElementById("swal-label") as HTMLInputElement).value,
        type: (document.getElementById("swal-type") as HTMLSelectElement).value,
        value: parseFloat((document.getElementById("swal-value") as HTMLInputElement).value) || 0,
        color: (document.getElementById("swal-color") as HTMLInputElement).value,
        icon: (document.getElementById("swal-icon") as HTMLInputElement).value || "★",
        probability: parseFloat((document.getElementById("swal-prob") as HTMLInputElement).value) || 10,
      }),
    });
    if (formValues) {
      try {
        await api.put(`/admin/spin-wheel/prizes/${prize.id}`, formValues);
        Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
        fetchPrizes();
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
      }
    }
  };

  const handleDeletePrize = async (id: number) => {
    const result = await Swal.fire({
      title: "ลบรางวัลนี้?",
      text: "รางวัลจะถูกลบออกจากวงล้อ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/admin/spin-wheel/prizes/${id}`);
      Swal.fire({ icon: "success", title: "ลบแล้ว", timer: 1500, showConfirmButton: false });
      fetchPrizes(); fetchSummary();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ" });
    }
  };

  const handleTogglePrize = async (prize: Prize) => {
    await api.put(`/admin/spin-wheel/prizes/${prize.id}`, { is_active: !prize.is_active });
    fetchPrizes();
  };

  const handleSaveSettings = async () => {
    try {
      await api.post("/admin/spin-wheel/settings", settings);
      Swal.fire({ icon: "success", title: "บันทึกตั้งค่าสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
    }
  };

  const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2 });
  const totalProb = prizes.filter(p => p.is_active).reduce((sum, p) => sum + Number(p.probability), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "0 0 4px" }}>จัดการวงล้อ</h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "0.9rem" }}>ตั้งค่ารางวัล เงื่อนไข และดูประวัติการหมุน</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "หมุนวันนี้", value: summary.today_spins.toString(), sub: "ครั้ง", accent: "#4f46e5" },
          { label: "แจกวันนี้", value: fmt(summary.today_credit), sub: "บาท", accent: "#dc2626" },
          { label: "หมุนทั้งหมด", value: summary.total_spins.toString(), sub: "ครั้ง", accent: "#2563eb" },
          { label: "แจกทั้งหมด", value: fmt(summary.total_credit), sub: "บาท", accent: "#d97706" },
        ].map((card, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6",
            padding: "16px 20px", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: card.accent }} />
            <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 6px", fontWeight: 500 }}>{card.label}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#111827", margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "#f3f4f6", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
        {[
          { v: "prizes" as const, l: "รางวัล" },
          { v: "settings" as const, l: "ตั้งค่า" },
          { v: "history" as const, l: "ประวัติ" },
        ].map((t) => (
          <button key={t.v} onClick={() => setTab(t.v)}
            style={{
              padding: "8px 20px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 500,
              border: "none", cursor: "pointer",
              background: tab === t.v ? "#fff" : "transparent",
              color: tab === t.v ? "#111827" : "#6b7280",
              boxShadow: tab === t.v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Tab: Prizes */}
      {tab === "prizes" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <div>
              <span style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>รางวัลในวงล้อ</span>
              <span style={{ color: "#9ca3af", fontSize: "0.85rem", marginLeft: "8px" }}>{prizes.length} ช่อง</span>
            </div>
            <button onClick={handleAddPrize}
              style={{ background: "#4f46e5", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem" }}>
              + เพิ่มรางวัล
            </button>
          </div>

          {prizes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
              <p style={{ fontSize: "0.9rem", margin: "0 0 4px" }}>ยังไม่มีรางวัล</p>
              <p style={{ fontSize: "0.8rem", margin: 0 }}>กดเพิ่มรางวัลเพื่อเริ่มต้นใช้งานวงล้อ</p>
            </div>
          ) : (
            <>
              <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>สี</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>รางวัล</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>ประเภท</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>มูลค่า</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>โอกาส</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>สถานะ</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {prizes.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "8px", background: p.color,
                          margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontSize: "14px", fontWeight: "bold",
                        }}>
                          {p.icon || "★"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827" }}>{p.label}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
                          background: typeColors[p.type]?.bg || "#f3f4f6",
                          color: typeColors[p.type]?.text || "#6b7280",
                        }}>
                          {typeLabels[p.type] || p.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#4f46e5" }}>
                        {p.value > 0 ? fmt(p.value) : "-"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", color: "#111827", fontWeight: 500 }}>{p.probability}%</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button onClick={() => handleTogglePrize(p)} style={{
                          background: "none", border: "none", cursor: "pointer", padding: 0,
                        }}>
                          <div style={{
                            width: "36px", height: "20px", borderRadius: "10px",
                            background: p.is_active ? "#10b981" : "#d1d5db",
                            position: "relative", transition: "background 0.2s",
                          }}>
                            <div style={{
                              width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
                              position: "absolute", top: "2px",
                              left: p.is_active ? "18px" : "2px",
                              transition: "left 0.2s",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                            }} />
                          </div>
                        </button>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button onClick={() => handleEditPrize(p)} style={{
                            background: "#f3f4f6", color: "#374151", border: "none",
                            padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500,
                          }}>
                            แก้ไข
                          </button>
                          <button onClick={() => handleDeletePrize(p.id)} style={{
                            background: "#fef2f2", color: "#dc2626", border: "none",
                            padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500,
                          }}>
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{
                padding: "12px 20px", borderTop: "1px solid #f3f4f6",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: totalProb === 100 ? "#f0fdf4" : "#fffbeb",
              }}>
                <span style={{ fontSize: "0.85rem", color: totalProb === 100 ? "#166534" : "#92400e", fontWeight: 500 }}>
                  รวมโอกาส: {totalProb.toFixed(1)}%
                </span>
                <span style={{ fontSize: "0.8rem", color: totalProb === 100 ? "#16a34a" : "#d97706" }}>
                  {totalProb === 100 ? "ถูกต้อง" : "ควรรวมได้ 100%"}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Settings */}
      {tab === "settings" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6", padding: "24px", maxWidth: "480px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "20px", color: "#111827" }}>ตั้งค่าวงล้อ</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", background: "#fafafa", borderRadius: "10px",
            }}>
              <div>
                <p style={{ fontWeight: 500, margin: "0 0 2px", color: "#111827", fontSize: "0.9rem" }}>เปิดใช้งานวงล้อ</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>ลูกค้าจะเห็นวงล้อในหน้าเว็บ</p>
              </div>
              <button onClick={() => setSettings({ ...settings, enabled: !settings.enabled })} style={{
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}>
                <div style={{
                  width: "44px", height: "24px", borderRadius: "12px",
                  background: settings.enabled ? "#10b981" : "#d1d5db",
                  position: "relative", transition: "background 0.2s",
                }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "50%", background: "#fff",
                    position: "absolute", top: "2px",
                    left: settings.enabled ? "22px" : "2px",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }} />
                </div>
              </button>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "6px", fontSize: "0.9rem", color: "#111827" }}>เงื่อนไขการหมุน</label>
              <select value={settings.condition} onChange={(e) => setSettings({ ...settings, condition: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#111827", fontSize: "0.9rem" }}>
                <option value="free_daily">หมุนฟรีทุกวัน</option>
                <option value="deposit_min">ฝากขั้นต่ำถึงหมุนได้</option>
              </select>
            </div>

            {settings.condition === "deposit_min" && (
              <div>
                <label style={{ display: "block", fontWeight: 500, marginBottom: "6px", fontSize: "0.9rem", color: "#111827" }}>ฝากขั้นต่ำ (บาท)</label>
                <input type="number" value={settings.deposit_min} onChange={(e) => setSettings({ ...settings, deposit_min: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9rem", boxSizing: "border-box" }} />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "6px", fontSize: "0.9rem", color: "#111827" }}>จำนวนครั้ง / วัน</label>
              <input type="number" value={settings.daily_limit} onChange={(e) => setSettings({ ...settings, daily_limit: parseInt(e.target.value) || 1 })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9rem", boxSizing: "border-box" }} />
            </div>

            <button onClick={handleSaveSettings} style={{
              background: "#4f46e5", color: "white", border: "none",
              padding: "12px", borderRadius: "8px", cursor: "pointer",
              fontWeight: 600, fontSize: "0.9rem", marginTop: "4px",
            }}>
              บันทึกตั้งค่า
            </button>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {tab === "history" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6", overflow: "hidden" }}>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
              <p style={{ fontSize: "0.9rem", margin: 0 }}>ยังไม่มีประวัติการหมุน</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>#</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>ผู้เล่น</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>รางวัล</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>ประเภท</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>มูลค่า</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>วันที่</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any, i: number) => (
                    <tr key={h.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 16px", textAlign: "center", color: "#9ca3af" }}>{history.length - i}</td>
                      <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: 600, color: "#111827" }}>{h.user?.username || "-"}</td>
                      <td style={{ padding: "10px 16px", textAlign: "center", color: "#111827" }}>{h.prize_label}</td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
                          background: typeColors[h.prize_type]?.bg || "#f3f4f6",
                          color: typeColors[h.prize_type]?.text || "#6b7280",
                        }}>
                          {typeLabels[h.prize_type] || h.prize_type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: 600, color: "#4f46e5" }}>{h.prize_value > 0 ? fmt(h.prize_value) : "-"}</td>
                      <td style={{ padding: "10px 16px", textAlign: "center", color: "#9ca3af", fontSize: "0.8rem" }}>{new Date(h.created_at).toLocaleString("th-TH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}