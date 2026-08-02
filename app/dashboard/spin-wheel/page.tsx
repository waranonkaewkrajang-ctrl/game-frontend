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

  useEffect(() => {
    fetchPrizes();
    fetchSettings();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab]);

  const typeLabels: Record<string, string> = {
    credit: "เครดิต (บาท)",
    bonus: "โบนัส",
    free_spin: "หมุนฟรี",
    nothing: "ไม่ได้รางวัล",
  };

  const handleAddPrize = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มรางวัล",
      html: `
        <div style="display:flex;flex-direction:column;gap:10px;text-align:left">
          <label style="font-size:13px;color:#374151;font-weight:500">ชื่อรางวัล</label>
          <input id="swal-label" class="swal2-input" placeholder="เช่น 50 บาท" style="margin:0">
          <label style="font-size:13px;color:#374151;font-weight:500">ประเภท</label>
          <select id="swal-type" class="swal2-select" style="margin:0;padding:8px;border:1px solid #d1d5db;border-radius:6px">
            <option value="credit">เครดิต (บาท)</option>
            <option value="bonus">โบนัส</option>
            <option value="free_spin">หมุนฟรี</option>
            <option value="nothing">ไม่ได้รางวัล</option>
          </select>
          <label style="font-size:13px;color:#374151;font-weight:500">มูลค่า</label>
          <input id="swal-value" class="swal2-input" type="number" placeholder="0" style="margin:0">
          <label style="font-size:13px;color:#374151;font-weight:500">สีช่อง</label>
          <input id="swal-color" class="swal2-input" type="color" value="#7c3aed" style="margin:0;height:40px;padding:2px">
          <label style="font-size:13px;color:#374151;font-weight:500">Emoji/Icon</label>
          <input id="swal-icon" class="swal2-input" placeholder="💰" style="margin:0">
          <label style="font-size:13px;color:#374151;font-weight:500">โอกาส (%)</label>
          <input id="swal-prob" class="swal2-input" type="number" placeholder="10" style="margin:0">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "เพิ่มรางวัล",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#7c3aed",
      preConfirm: () => {
        const label = (document.getElementById("swal-label") as HTMLInputElement).value;
        if (!label) { Swal.showValidationMessage("กรุณาใส่ชื่อรางวัล"); return false; }
        return {
          label,
          type: (document.getElementById("swal-type") as HTMLSelectElement).value,
          value: parseFloat((document.getElementById("swal-value") as HTMLInputElement).value) || 0,
          color: (document.getElementById("swal-color") as HTMLInputElement).value,
          icon: (document.getElementById("swal-icon") as HTMLInputElement).value || "🎁",
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
        fetchPrizes();
        fetchSummary();
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
      }
    }
  };

  const handleEditPrize = async (prize: Prize) => {
    const { value: formValues } = await Swal.fire({
      title: "แก้ไขรางวัล",
      html: `
        <div style="display:flex;flex-direction:column;gap:10px;text-align:left">
          <label style="font-size:13px;color:#374151;font-weight:500">ชื่อรางวัล</label>
          <input id="swal-label" class="swal2-input" value="${prize.label}" style="margin:0">
          <label style="font-size:13px;color:#374151;font-weight:500">ประเภท</label>
          <select id="swal-type" class="swal2-select" style="margin:0;padding:8px;border:1px solid #d1d5db;border-radius:6px">
            <option value="credit" ${prize.type === "credit" ? "selected" : ""}>เครดิต (บาท)</option>
            <option value="bonus" ${prize.type === "bonus" ? "selected" : ""}>โบนัส</option>
            <option value="free_spin" ${prize.type === "free_spin" ? "selected" : ""}>หมุนฟรี</option>
            <option value="nothing" ${prize.type === "nothing" ? "selected" : ""}>ไม่ได้รางวัล</option>
          </select>
          <label style="font-size:13px;color:#374151;font-weight:500">มูลค่า</label>
          <input id="swal-value" class="swal2-input" type="number" value="${prize.value}" style="margin:0">
          <label style="font-size:13px;color:#374151;font-weight:500">สีช่อง</label>
          <input id="swal-color" class="swal2-input" type="color" value="${prize.color}" style="margin:0;height:40px;padding:2px">
          <label style="font-size:13px;color:#374151;font-weight:500">Emoji/Icon</label>
          <input id="swal-icon" class="swal2-input" value="${prize.icon || ""}" style="margin:0">
          <label style="font-size:13px;color:#374151;font-weight:500">โอกาส (%)</label>
          <input id="swal-prob" class="swal2-input" type="number" value="${prize.probability}" style="margin:0">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#7c3aed",
      preConfirm: () => ({
        label: (document.getElementById("swal-label") as HTMLInputElement).value,
        type: (document.getElementById("swal-type") as HTMLSelectElement).value,
        value: parseFloat((document.getElementById("swal-value") as HTMLInputElement).value) || 0,
        color: (document.getElementById("swal-color") as HTMLInputElement).value,
        icon: (document.getElementById("swal-icon") as HTMLInputElement).value,
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
      fetchPrizes();
      fetchSummary();
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>🎰 จัดการวงล้อ</h1>
          <p style={{ color: "#6b7280" }}>ตั้งค่ารางวัล เงื่อนไข และดูประวัติการหมุน</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {[
          { label: "หมุนวันนี้", value: summary.today_spins, color: "#7c3aed" },
          { label: "แจกวันนี้", value: `฿${fmt(summary.today_credit)}`, color: "#ef4444" },
          { label: "หมุนทั้งหมด", value: summary.total_spins, color: "#3b82f6" },
          { label: "แจกทั้งหมด", value: `฿${fmt(summary.total_credit)}`, color: "#f59e0b" },
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "0.25rem" }}>{card.label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {[
          { v: "prizes" as const, l: "🎁 รางวัล" },
          { v: "settings" as const, l: "⚙️ ตั้งค่า" },
          { v: "history" as const, l: "📋 ประวัติ" },
        ].map((t) => (
          <button key={t.v} onClick={() => setTab(t.v)}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: 500, border: "none", cursor: "pointer", background: tab === t.v ? "#7c3aed" : "#1f2937", color: tab === t.v ? "white" : "#9ca3af" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Tab: Prizes */}
      {tab === "prizes" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>รางวัลในวงล้อ ({prizes.length} ช่อง)</h2>
            <button onClick={handleAddPrize}
              style={{ background: "#7c3aed", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.875rem" }}>
              + เพิ่มรางวัล
            </button>
          </div>

          {prizes.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>ยังไม่มีรางวัล กดเพิ่มรางวัลเพื่อเริ่มต้น</p>
          ) : (
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>สี</th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>รางวัล</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>ประเภท</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>มูลค่า</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>โอกาส %</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>สถานะ</th>
                  <th style={{ padding: "0.75rem", textAlign: "center" }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {prizes.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: p.color, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                        {p.icon || "🎁"}
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 600, color: "#111827" }}>{p.label}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center", color: "#6b7280" }}>{typeLabels[p.type] || p.type}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center", fontWeight: "bold", color: "#7c3aed" }}>{p.value > 0 ? fmt(p.value) : "-"}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center", color: "#111827" }}>{p.probability}%</td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      <button onClick={() => handleTogglePrize(p)}
                        style={{ background: p.is_active ? "#dcfce7" : "#fee2e2", color: p.is_active ? "#166534" : "#991b1b", border: "none", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}>
                        {p.is_active ? "เปิด" : "ปิด"}
                      </button>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button onClick={() => handleEditPrize(p)}
                          style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}>
                          แก้ไข
                        </button>
                        <button onClick={() => handleDeletePrize(p.id)}
                          style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}>
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {prizes.length > 0 && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fef3c7", borderRadius: "8px", fontSize: "0.85rem", color: "#92400e" }}>
              ⚠️ รวมโอกาส: {prizes.filter(p => p.is_active).reduce((sum, p) => sum + Number(p.probability), 0).toFixed(1)}% (ควรรวมได้ 100%)
            </div>
          )}
        </div>
      )}

      {/* Tab: Settings */}
      {tab === "settings" && (
        <div className="card" style={{ padding: "1.5rem", maxWidth: "500px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "1.25rem" }}>ตั้งค่าวงล้อ</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* เปิด/ปิด */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 500 }}>เปิดใช้งานวงล้อ</span>
              <button onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                style={{ background: settings.enabled ? "#10b981" : "#6b7280", color: "white", border: "none", padding: "6px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                {settings.enabled ? "เปิด" : "ปิด"}
              </button>
            </div>

            {/* เงื่อนไข */}
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}>เงื่อนไขการหมุน</label>
              <select value={settings.condition} onChange={(e) => setSettings({ ...settings, condition: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff", color: "#111827" }}>
                <option value="free_daily">หมุนฟรีทุกวัน</option>
                <option value="deposit_min">ฝากขั้นต่ำถึงหมุนได้</option>
              </select>
            </div>

            {/* ฝากขั้นต่ำ */}
            {settings.condition === "deposit_min" && (
              <div>
                <label style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}>ฝากขั้นต่ำ (บาท)</label>
                <input type="number" value={settings.deposit_min} onChange={(e) => setSettings({ ...settings, deposit_min: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", color: "#111827" }} />
              </div>
            )}

            {/* จำนวนครั้ง/วัน */}
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}>จำนวนครั้ง/วัน</label>
              <input type="number" value={settings.daily_limit} onChange={(e) => setSettings({ ...settings, daily_limit: parseInt(e.target.value) || 1 })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", color: "#111827" }} />
            </div>

            <button onClick={handleSaveSettings}
              style={{ background: "#7c3aed", color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}>
              บันทึกตั้งค่า
            </button>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {tab === "history" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {history.length === 0 ? (
            <p style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>ยังไม่มีประวัติการหมุน</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                  <tr>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>#</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>ผู้เล่น</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>รางวัล</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>ประเภท</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>มูลค่า</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>วันที่</th>
                  </tr>
                </thead>
                <tbody style={{ background: "#ffffff" }}>
                  {history.map((h: any, i: number) => (
                    <tr key={h.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280" }}>{history.length - i}</td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 600, color: "#111827" }}>{h.user?.username || "-"}</td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#111827" }}>{h.prize_label}</td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280" }}>{typeLabels[h.prize_type] || h.prize_type}</td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: "bold", color: "#7c3aed" }}>{h.prize_value > 0 ? fmt(h.prize_value) : "-"}</td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280", fontSize: "0.8rem" }}>{new Date(h.created_at).toLocaleString("th-TH")}</td>
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