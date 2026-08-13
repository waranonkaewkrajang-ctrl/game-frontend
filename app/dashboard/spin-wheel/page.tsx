"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface Prize {
  id: number; label: string; type: string; value: number; color: string;
  icon: string; image_url: string | null; probability: number; sort_order: number; is_active: boolean;
}

interface Multiplier {
  id: number; label: string; value: number; color: string;
  probability: number; sort_order: number; is_active: boolean;
}

interface Settings {
  enabled: boolean; condition: string; deposit_min: number; daily_limit: number;
  ticket_cost: number; point_cost: number; free_enabled: boolean;
}

interface Summary {
  today_spins: number; today_credit: number; total_spins: number;
  total_credit: number; total_physical: number; prizes_count: number;
}

export default function SpinWheelAdminPage() {
  const [tab, setTab] = useState<"prizes" | "multipliers" | "settings" | "history">("prizes");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [multipliers, setMultipliers] = useState<Multiplier[]>([]);
  const [settings, setSettings] = useState<Settings>({ enabled: true, condition: "free_daily", deposit_min: 0, daily_limit: 3, ticket_cost: 1, point_cost: 500, free_enabled: true });
  const [summary, setSummary] = useState<Summary>({ today_spins: 0, today_credit: 0, total_spins: 0, total_credit: 0, total_physical: 0, prizes_count: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrizes = () => {
    api.get("/admin/spin-wheel/prizes").then((res) => { setPrizes(res.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  const fetchMultipliers = () => {
    api.get("/admin/spin-wheel/multipliers").then((res) => { setMultipliers(res.data.data || []); }).catch(() => {});
  };
  const fetchSettings = () => {
    api.get("/admin/spin-wheel/settings").then((res) => { if (res.data.data) setSettings(res.data.data); });
  };
  const fetchSummary = () => {
    api.get("/admin/spin-wheel/summary").then((res) => { if (res.data.data) setSummary(res.data.data); });
  };
  const fetchHistory = () => {
    api.get("/admin/spin-wheel/history").then((res) => { setHistory(res.data.data?.data || res.data.data || []); });
  };

  useEffect(() => { fetchPrizes(); fetchMultipliers(); fetchSettings(); fetchSummary(); }, []);
  useEffect(() => { if (tab === "history") fetchHistory(); }, [tab]);

  const typeLabels: Record<string, string> = { credit: "เครดิต", bonus: "โบนัส", free_spin: "หมุนฟรี", nothing: "เสียใจด้วย", physical: "ของรางวัล" };
  const typeColors: Record<string, { bg: string; text: string }> = {
    credit: { bg: "#dcfce7", text: "#166534" }, bonus: { bg: "#e0e7ff", text: "#3730a3" },
    free_spin: { bg: "#fef3c7", text: "#92400e" }, nothing: { bg: "#f3f4f6", text: "#6b7280" },
    physical: { bg: "#fce7f3", text: "#9d174d" },
  };
  const spinTypeLabels: Record<string, string> = { free: "ฟรี", ticket: "ตั๋ว", points: "คะแนน" };

  const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2 });
  const totalProb = prizes.filter(p => p.is_active).reduce((sum, p) => sum + Number(p.probability), 0);
  const totalMultProb = multipliers.filter(m => m.is_active).reduce((sum, m) => sum + Number(m.probability), 0);

  // =====================================================
  //  Prize Handlers
  // =====================================================
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
                <option value="physical">ของรางวัลจริง</option>
                <option value="nothing">เสียใจด้วย</option>
              </select>
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">มูลค่า</label>
              <input id="swal-value" class="swal2-input" type="number" placeholder="0" style="margin:0;width:100%;box-sizing:border-box">
            </div>
          </div>
          <div>
            <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">URL รูปรางวัล (ถ้ามี)</label>
            <input id="swal-image" class="swal2-input" placeholder="https://example.com/prize.png" style="margin:0;width:100%;box-sizing:border-box">
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
      width: 520, focusConfirm: false, showCancelButton: true,
      confirmButtonText: "เพิ่มรางวัล", cancelButtonText: "ยกเลิก", confirmButtonColor: "#4f46e5",
      preConfirm: () => {
        const label = (document.getElementById("swal-label") as HTMLInputElement).value;
        if (!label) { Swal.showValidationMessage("กรุณาใส่ชื่อรางวัล"); return false; }
        return {
          label,
          type: (document.getElementById("swal-type") as HTMLSelectElement).value,
          value: parseFloat((document.getElementById("swal-value") as HTMLInputElement).value) || 0,
          color: (document.getElementById("swal-color") as HTMLInputElement).value,
          icon: (document.getElementById("swal-icon") as HTMLInputElement).value || "★",
          image_url: (document.getElementById("swal-image") as HTMLInputElement).value || null,
probability: (() => { const v = parseFloat((document.getElementById("swal-prob") as HTMLInputElement).value); return isNaN(v) ? 10 : v; })(),
          sort_order: prizes.length, is_active: true,
        };
      },
    });
    if (formValues) {
      try {
        await api.post("/admin/spin-wheel/prizes", formValues);
        Swal.fire({ icon: "success", title: "เพิ่มรางวัลสำเร็จ", timer: 1500, showConfirmButton: false });
        fetchPrizes(); fetchSummary();
      } catch (err: any) { Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" }); }
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
                <option value="physical" ${prize.type === "physical" ? "selected" : ""}>ของรางวัลจริง</option>
                <option value="nothing" ${prize.type === "nothing" ? "selected" : ""}>เสียใจด้วย</option>
              </select>
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">มูลค่า</label>
              <input id="swal-value" class="swal2-input" type="number" value="${prize.value}" style="margin:0;width:100%;box-sizing:border-box">
            </div>
          </div>
          <div>
            <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">URL รูปรางวัล</label>
            <input id="swal-image" class="swal2-input" value="${prize.image_url || ""}" placeholder="https://example.com/prize.png" style="margin:0;width:100%;box-sizing:border-box">
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
      width: 520, focusConfirm: false, showCancelButton: true,
      confirmButtonText: "บันทึก", cancelButtonText: "ยกเลิก", confirmButtonColor: "#4f46e5",
      preConfirm: () => ({
        label: (document.getElementById("swal-label") as HTMLInputElement).value,
        type: (document.getElementById("swal-type") as HTMLSelectElement).value,
        value: parseFloat((document.getElementById("swal-value") as HTMLInputElement).value) || 0,
        color: (document.getElementById("swal-color") as HTMLInputElement).value,
        icon: (document.getElementById("swal-icon") as HTMLInputElement).value || "★",
        image_url: (document.getElementById("swal-image") as HTMLInputElement).value || null,
        probability: (isNaN(parseFloat((document.getElementById("swal-prob") as HTMLInputElement).value)) ? 10 : parseFloat((document.getElementById("swal-prob") as HTMLInputElement).value)),
      }),
    });
    if (formValues) {
      try {
        await api.put(`/admin/spin-wheel/prizes/${prize.id}`, formValues);
        Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
        fetchPrizes();
      } catch (err: any) { Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" }); }
    }
  };

  const handleDeletePrize = async (id: number) => {
    const result = await Swal.fire({ title: "ลบรางวัลนี้?", text: "รางวัลจะถูกลบออกจากวงล้อ", icon: "warning", showCancelButton: true, confirmButtonText: "ลบ", cancelButtonText: "ยกเลิก", confirmButtonColor: "#ef4444" });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/admin/spin-wheel/prizes/${id}`);
      Swal.fire({ icon: "success", title: "ลบแล้ว", timer: 1500, showConfirmButton: false });
      fetchPrizes(); fetchSummary();
    } catch { Swal.fire({ icon: "error", title: "ไม่สำเร็จ" }); }
  };

  const handleTogglePrize = async (prize: Prize) => { await api.put(`/admin/spin-wheel/prizes/${prize.id}`, { is_active: !prize.is_active }); fetchPrizes(); };

  // =====================================================
  //  Multiplier Handlers
  // =====================================================
  const handleAddMultiplier = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มตัวคูณ",
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left;padding:4px 0">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">ชื่อ (เช่น 10x)</label>
              <input id="swal-label" class="swal2-input" placeholder="10x" style="margin:0;width:100%;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">ค่าตัวคูณ</label>
              <input id="swal-value" class="swal2-input" type="number" placeholder="10" style="margin:0;width:100%;box-sizing:border-box">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">สี</label>
              <input id="swal-color" type="color" value="#facc15" style="width:100%;height:42px;padding:2px;border:1px solid #d1d5db;border-radius:8px;cursor:pointer">
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">โอกาส %</label>
              <input id="swal-prob" class="swal2-input" type="number" placeholder="10" style="margin:0;width:100%;box-sizing:border-box">
            </div>
          </div>
        </div>
      `,
      width: 440, focusConfirm: false, showCancelButton: true,
      confirmButtonText: "เพิ่ม", cancelButtonText: "ยกเลิก", confirmButtonColor: "#4f46e5",
      preConfirm: () => {
        const label = (document.getElementById("swal-label") as HTMLInputElement).value;
        if (!label) { Swal.showValidationMessage("กรุณาใส่ชื่อ"); return false; }
        return {
          label,
          value: parseFloat((document.getElementById("swal-value") as HTMLInputElement).value) || 1,
          color: (document.getElementById("swal-color") as HTMLInputElement).value,
probability: (() => { const v = parseFloat((document.getElementById("swal-prob") as HTMLInputElement).value); return isNaN(v) ? 10 : v; })(),
          sort_order: multipliers.length, is_active: true,
        };
      },
    });
    if (formValues) {
      try {
        await api.post("/admin/spin-wheel/multipliers", formValues);
        Swal.fire({ icon: "success", title: "เพิ่มตัวคูณสำเร็จ", timer: 1500, showConfirmButton: false });
        fetchMultipliers();
      } catch (err: any) { Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" }); }
    }
  };

  const handleEditMultiplier = async (m: Multiplier) => {
    const { value: formValues } = await Swal.fire({
      title: "แก้ไขตัวคูณ",
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left;padding:4px 0">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">ชื่อ</label>
              <input id="swal-label" class="swal2-input" value="${m.label}" style="margin:0;width:100%;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">ค่าตัวคูณ</label>
              <input id="swal-value" class="swal2-input" type="number" value="${m.value}" style="margin:0;width:100%;box-sizing:border-box">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">สี</label>
              <input id="swal-color" type="color" value="${m.color}" style="width:100%;height:42px;padding:2px;border:1px solid #d1d5db;border-radius:8px;cursor:pointer">
            </div>
            <div>
              <label style="font-size:13px;color:#374151;font-weight:500;display:block;margin-bottom:4px">โอกาส %</label>
              <input id="swal-prob" class="swal2-input" type="number" value="${m.probability}" style="margin:0;width:100%;box-sizing:border-box">
            </div>
          </div>
        </div>
      `,
      width: 440, focusConfirm: false, showCancelButton: true,
      confirmButtonText: "บันทึก", cancelButtonText: "ยกเลิก", confirmButtonColor: "#4f46e5",
      preConfirm: () => ({
        label: (document.getElementById("swal-label") as HTMLInputElement).value,
        value: parseFloat((document.getElementById("swal-value") as HTMLInputElement).value) || 1,
        color: (document.getElementById("swal-color") as HTMLInputElement).value,
        probability: (isNaN(parseFloat((document.getElementById("swal-prob") as HTMLInputElement).value)) ? 10 : parseFloat((document.getElementById("swal-prob") as HTMLInputElement).value)),
      }),
    });
    if (formValues) {
      try {
        await api.put(`/admin/spin-wheel/multipliers/${m.id}`, formValues);
        Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
        fetchMultipliers();
      } catch (err: any) { Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" }); }
    }
  };

  const handleDeleteMultiplier = async (id: number) => {
    const result = await Swal.fire({ title: "ลบตัวคูณนี้?", icon: "warning", showCancelButton: true, confirmButtonText: "ลบ", cancelButtonText: "ยกเลิก", confirmButtonColor: "#ef4444" });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/admin/spin-wheel/multipliers/${id}`);
      Swal.fire({ icon: "success", title: "ลบแล้ว", timer: 1500, showConfirmButton: false });
      fetchMultipliers();
    } catch { Swal.fire({ icon: "error", title: "ไม่สำเร็จ" }); }
  };

  const handleToggleMultiplier = async (m: Multiplier) => { await api.put(`/admin/spin-wheel/multipliers/${m.id}`, { is_active: !m.is_active }); fetchMultipliers(); };

  // =====================================================
  //  Settings Handler
  // =====================================================
  const handleSaveSettings = async () => {
    try {
      await api.post("/admin/spin-wheel/settings", settings);
      Swal.fire({ icon: "success", title: "บันทึกตั้งค่าสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch (err: any) { Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" }); }
  };

  // =====================================================
  //  Toggle Switch Component
  // =====================================================
  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <div style={{ width: "44px", height: "24px", borderRadius: "12px", background: value ? "#10b981" : "#d1d5db", position: "relative", transition: "background 0.2s" }}>
        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: value ? "22px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </div>
    </button>
  );

  const SmallToggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <div style={{ width: "36px", height: "20px", borderRadius: "10px", background: value ? "#10b981" : "#d1d5db", position: "relative", transition: "background 0.2s" }}>
        <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: value ? "18px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
      </div>
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: "bold", margin: "0 0 4px" }}>จัดการวงล้อ</h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "0.9rem" }}>ตั้งค่ารางวัล ตัวคูณ เงื่อนไข และดูประวัติการหมุน</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
        {[
          { label: "หมุนวันนี้", value: summary.today_spins.toString(), accent: "#4f46e5" },
          { label: "แจกวันนี้", value: fmt(summary.today_credit) + " ฿", accent: "#dc2626" },
          { label: "หมุนทั้งหมด", value: summary.total_spins.toString(), accent: "#2563eb" },
          { label: "แจกทั้งหมด", value: fmt(summary.total_credit) + " ฿", accent: "#d97706" },
          { label: "รอส่งของรางวัล", value: (summary.total_physical || 0).toString(), accent: "#9d174d" },
        ].map((card, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6", padding: "16px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: card.accent }} />
            <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 6px", fontWeight: 500 }}>{card.label}</p>
            <p style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#111827", margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "#f3f4f6", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
        {[
          { v: "prizes" as const, l: "รางวัล" },
          { v: "multipliers" as const, l: "ตัวคูณ" },
          { v: "settings" as const, l: "ตั้งค่า" },
          { v: "history" as const, l: "ประวัติ" },
        ].map((t) => (
          <button key={t.v} onClick={() => setTab(t.v)} style={{
            padding: "8px 20px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 500, border: "none", cursor: "pointer",
            background: tab === t.v ? "#dbeafe" : "transparent", color: tab === t.v ? "#1d4ed8" : "#6b7280",
            boxShadow: tab === t.v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}>{t.l}</button>
        ))}
      </div>

      {/* =====================================================
          Tab: Prizes
      ===================================================== */}
      {tab === "prizes" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <div>
              <span style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>รางวัลในวงล้อ</span>
              <span style={{ color: "#9ca3af", fontSize: "0.85rem", marginLeft: "8px" }}>{prizes.length} ช่อง</span>
            </div>
            <button onClick={handleAddPrize} style={{ background: "#4f46e5", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem" }}>+ เพิ่มรางวัล</button>
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
                    {["สี", "รางวัล", "รูป", "ประเภท", "มูลค่า", "โอกาส", "สถานะ", "จัดการ"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prizes.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: p.color, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "bold" }}>
                          {p.icon || "★"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827", textAlign: "left" }}>{p.label}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.label} style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : <span style={{ color: "#d1d5db", fontSize: "0.75rem" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, background: typeColors[p.type]?.bg || "#f3f4f6", color: typeColors[p.type]?.text || "#6b7280" }}>
                          {typeLabels[p.type] || p.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#4f46e5" }}>{p.value > 0 ? fmt(p.value) : "-"}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center", color: "#111827", fontWeight: 500 }}>{p.probability}%</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}><SmallToggle value={p.is_active} onChange={() => handleTogglePrize(p)} /></td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button onClick={() => handleEditPrize(p)} style={{ background: "#f3f4f6", color: "#374151", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 }}>แก้ไข</button>
                          <button onClick={() => handleDeletePrize(p.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 }}>ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", background: totalProb === 100 ? "#f0fdf4" : "#fffbeb" }}>
                <span style={{ fontSize: "0.85rem", color: totalProb === 100 ? "#166534" : "#92400e", fontWeight: 500 }}>รวมโอกาส: {totalProb.toFixed(1)}%</span>
                <span style={{ fontSize: "0.8rem", color: totalProb === 100 ? "#16a34a" : "#d97706" }}>{totalProb === 100 ? "✅ ถูกต้อง" : "⚠️ ควรรวมได้ 100%"}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================
          Tab: Multipliers
      ===================================================== */}
      {tab === "multipliers" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <div>
              <span style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>ตัวคูณ (Multiplier)</span>
              <span style={{ color: "#9ca3af", fontSize: "0.85rem", marginLeft: "8px" }}>{multipliers.length} ตัว</span>
            </div>
            <button onClick={handleAddMultiplier} style={{ background: "#4f46e5", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem" }}>+ เพิ่มตัวคูณ</button>
          </div>

          <p style={{ padding: "12px 20px 0", margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>ตัวคูณจะสุ่มแยกจากรางวัล เช่น ได้ 50 บาท × 10x = 500 บาท</p>

          {multipliers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
              <p style={{ fontSize: "0.9rem", margin: 0 }}>ยังไม่มีตัวคูณ</p>
            </div>
          ) : (
            <>
              <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    {["สี", "ชื่อ", "ค่าคูณ", "โอกาส", "สถานะ", "จัดการ"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {multipliers.map((m) => (
                    <tr key={m.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: m.color, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: "bold" }}>
                          {m.label}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827", textAlign: "center" }}>{m.label}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: "#d97706", fontSize: "1rem" }}>×{m.value}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center", color: "#111827", fontWeight: 500 }}>{m.probability}%</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}><SmallToggle value={m.is_active} onChange={() => handleToggleMultiplier(m)} /></td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button onClick={() => handleEditMultiplier(m)} style={{ background: "#f3f4f6", color: "#374151", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 }}>แก้ไข</button>
                          <button onClick={() => handleDeleteMultiplier(m.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 }}>ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", background: totalMultProb === 100 ? "#f0fdf4" : "#fffbeb" }}>
                <span style={{ fontSize: "0.85rem", color: totalMultProb === 100 ? "#166534" : "#92400e", fontWeight: 500 }}>รวมโอกาส: {totalMultProb.toFixed(1)}%</span>
                <span style={{ fontSize: "0.8rem", color: totalMultProb === 100 ? "#16a34a" : "#d97706" }}>{totalMultProb === 100 ? "✅ ถูกต้อง" : "⚠️ ควรรวมได้ 100%"}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================
          Tab: Settings
      ===================================================== */}
      {tab === "settings" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6", padding: "24px", maxWidth: "520px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "20px", color: "#111827" }}>ตั้งค่าวงล้อ</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* เปิด/ปิดวงล้อ */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#fafafa", borderRadius: "10px" }}>
              <div>
                <p style={{ fontWeight: 500, margin: "0 0 2px", color: "#111827", fontSize: "0.9rem" }}>เปิดใช้งานวงล้อ</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>ลูกค้าจะเห็นวงล้อในหน้าเว็บ</p>
              </div>
              <Toggle value={settings.enabled} onChange={() => setSettings({ ...settings, enabled: !settings.enabled })} />
            </div>

            {/* เปิด/ปิดหมุนฟรี */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#fafafa", borderRadius: "10px" }}>
              <div>
                <p style={{ fontWeight: 500, margin: "0 0 2px", color: "#111827", fontSize: "0.9rem" }}>เปิดหมุนฟรี</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>ให้ลูกค้าหมุนฟรีตามจำนวนครั้ง/วัน</p>
              </div>
              <Toggle value={settings.free_enabled} onChange={() => setSettings({ ...settings, free_enabled: !settings.free_enabled })} />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "6px", fontSize: "0.9rem", color: "#111827" }}>เงื่อนไขหมุนฟรี</label>
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
              <label style={{ display: "block", fontWeight: 500, marginBottom: "6px", fontSize: "0.9rem", color: "#111827" }}>จำนวนหมุนฟรี / วัน</label>
              <input type="number" value={settings.daily_limit} onChange={(e) => setSettings({ ...settings, daily_limit: parseInt(e.target.value) || 1 })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9rem", boxSizing: "border-box" }} />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "4px 0" }} />
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827", margin: 0 }}>ราคาหมุน (Ticket / Points)</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 500, marginBottom: "6px", fontSize: "0.9rem", color: "#111827" }}>ใช้ตั๋ว (ใบ/ครั้ง)</label>
                <input type="number" value={settings.ticket_cost} onChange={(e) => setSettings({ ...settings, ticket_cost: parseInt(e.target.value) || 1 })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9rem", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 500, marginBottom: "6px", fontSize: "0.9rem", color: "#111827" }}>ใช้คะแนน (แต้ม/ครั้ง)</label>
                <input type="number" value={settings.point_cost} onChange={(e) => setSettings({ ...settings, point_cost: parseInt(e.target.value) || 1 })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", color: "#111827", fontSize: "0.9rem", boxSizing: "border-box" }} />
              </div>
            </div>

            <button onClick={handleSaveSettings} style={{ background: "#4f46e5", color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", marginTop: "4px" }}>
              บันทึกตั้งค่า
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          Tab: History
      ===================================================== */}
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
                    {["#", "ผู้เล่น", "รางวัล", "ประเภท", "ค่าเดิม", "ตัวคูณ", "ได้รับจริง", "หมุนด้วย", "วันที่"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "center", color: "#6b7280", fontWeight: 500, fontSize: "0.8rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any, i: number) => (
                    <tr key={h.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#9ca3af" }}>{history.length - i}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600, color: "#111827" }}>{h.user?.username || "-"}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#111827" }}>{h.prize_label}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, background: typeColors[h.prize_type]?.bg || "#f3f4f6", color: typeColors[h.prize_type]?.text || "#6b7280" }}>
                          {typeLabels[h.prize_type] || h.prize_type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#6b7280" }}>{h.prize_value > 0 ? fmt(h.prize_value) : "-"}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#d97706" }}>×{h.multiplier || 1}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#4f46e5" }}>{h.final_value > 0 ? fmt(h.final_value) : "-"}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 600, background: h.spin_type === "free" ? "#dbeafe" : h.spin_type === "ticket" ? "#fef3c7" : "#e0e7ff", color: h.spin_type === "free" ? "#1e40af" : h.spin_type === "ticket" ? "#92400e" : "#3730a3" }}>
                          {spinTypeLabels[h.spin_type] || h.spin_type || "ฟรี"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#9ca3af", fontSize: "0.8rem" }}>{new Date(h.created_at).toLocaleString("th-TH")}</td>
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