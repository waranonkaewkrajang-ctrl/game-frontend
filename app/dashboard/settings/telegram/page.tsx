"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

export default function TelegramSettingsPage() {
  const [settings, setSettings] = useState({
    telegram_bot_token: "",
    telegram_chat_id: "",
    telegram_notify_deposit: "true",
    telegram_notify_withdraw: "true",
    telegram_notify_register: "true",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.get("/admin/settings").then((res) => {
      setSettings((prev) => ({ ...prev, ...res.data }));
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/settings", settings);
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ" });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      Swal.fire({ icon: "warning", title: "กรุณากรอก Bot Token และ Chat ID ก่อน" });
      return;
    }
    setTesting(true);
    try {
      const res = await api.post("/admin/settings/telegram-test", {
        bot_token: settings.telegram_bot_token,
        chat_id: settings.telegram_chat_id,
      });
      Swal.fire({ icon: "success", title: "ส่งข้อความทดสอบสำเร็จ!", text: "เช็ค Telegram เลย" });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ส่งไม่สำเร็จ", text: err.response?.data?.message || "เช็ค Token กับ Chat ID ใหม่" });
    }
    setTesting(false);
  };

  const labelStyle = { display: "block" as const, fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" };

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>แจ้งเตือน Telegram</h1>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>ตั้งค่า Bot Telegram ให้แจ้งเตือนอัตโนมัติเมื่อมีรายการฝาก ถอน หรือสมัครใหม่</p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* วิธีตั้งค่า */}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1d4ed8", margin: "0 0 0.5rem" }}>วิธีสร้าง Telegram Bot</h3>
          <ol style={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.8, margin: 0, paddingLeft: "1.25rem" }}>
            <li>เปิด Telegram ค้นหา <strong>@BotFather</strong> แล้วพิมพ์ <code>/newbot</code></li>
            <li>ตั้งชื่อ Bot → ได้ <strong>Bot Token</strong> มาวางในช่องด้านล่าง</li>
            <li>เพิ่ม Bot เข้ากลุ่มหรือแชทกับ Bot แล้วค้นหา <strong>@userinfobot</strong> เพื่อดู Chat ID</li>
            <li>วาง Chat ID ในช่องด้านล่าง แล้วกด <strong>ทดสอบ</strong></li>
          </ol>
        </div>

        {/* Bot Token + Chat ID */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ข้อมูล Bot</h3>
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Bot Token</label>
            <input className="input" value={settings.telegram_bot_token} onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })} placeholder="1234567890:ABCDefGhIjKlMnOpQrStUvWxYz" />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Chat ID (กลุ่มหรือส่วนตัว)</label>
            <input className="input" value={settings.telegram_chat_id} onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })} placeholder="-1001234567890" />
          </div>
          <button type="button" onClick={handleTest} disabled={testing} style={{ background: "#0ea5e9", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.6rem 1.5rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            {testing ? "กำลังส่ง..." : "🚀 ทดสอบส่งข้อความ"}
          </button>
        </div>

        {/* เลือกว่าจะแจ้งเตือนอะไรบ้าง */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>เลือกการแจ้งเตือน</h3>
          {[
            { key: "telegram_notify_deposit", label: "แจ้งเตือนเมื่อมีรายการฝากเงิน", emoji: "💰" },
            { key: "telegram_notify_withdraw", label: "แจ้งเตือนเมื่อมีรายการถอนเงิน", emoji: "💸" },
            { key: "telegram_notify_register", label: "แจ้งเตือนเมื่อมีสมาชิกสมัครใหม่", emoji: "👤" },
          ].map((item) => (
            <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ fontSize: "0.85rem", color: "#334155" }}>{item.emoji} {item.label}</span>
              <select className="input" style={{ width: "100px" }} value={(settings as any)[item.key]} onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}>
                <option value="true">เปิด</option>
                <option value="false">ปิด</option>
              </select>
            </div>
          ))}
        </div>

        {/* ปุ่มบันทึก */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={saving} style={{ background: "#0f172a", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.7rem 2.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </form>
    </div>
  );
}