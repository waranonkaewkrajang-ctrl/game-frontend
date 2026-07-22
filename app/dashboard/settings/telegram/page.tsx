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
      Swal.fire({ icon: "success", title: "ส่งข้อความทดสอบสำเร็จ", text: "กรุณาตรวจสอบข้อความใน Telegram" });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ส่งไม่สำเร็จ", text: err.response?.data?.message || "โปรดตรวจสอบ Token และ Chat ID อีกครั้ง" });
    }
    setTesting(false);
  };

  const labelStyle = { display: "block" as const, fontSize: "0.85rem", fontWeight: 500, color: "#475569", marginBottom: "0.4rem" };

  return (
    <div style={{ maxWidth: "700px", fontFamily: "'Inter', 'Kanit', sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.5rem" }}>ตั้งค่าการแจ้งเตือน Telegram</h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>เชื่อมต่อระบบเข้ากับ Telegram Bot เพื่อรับการแจ้งเตือนรายการฝาก ถอน และสมัครสมาชิกใหม่โดยอัตโนมัติ</p>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* วิธีตั้งค่า (พื้นหลังแดงอ่อน) */}
        <div style={{ background: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: "0 8px 8px 0", padding: "1.25rem 1.5rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#b91c1c", margin: "0 0 0.75rem" }}>คำแนะนำการสร้าง Bot</h3>
          <ol style={{ fontSize: "0.85rem", color: "#7f1d1d", lineHeight: 1.7, margin: 0, paddingLeft: "1.25rem" }}>
            <li>ค้นหา <strong>@BotFather</strong> ใน Telegram และพิมพ์คำสั่ง <code>/newbot</code></li>
            <li>ตั้งชื่อ Bot ให้เรียบร้อย จากนั้นนำ <strong>Bot Token</strong> ที่ได้รับมาใส่ในช่องด้านล่าง</li>
            <li>ดึง Bot เข้ากลุ่ม (หรือเปิดแชทส่วนตัว) และค้นหา <strong>@userinfobot</strong> เพื่อรับ <strong>Chat ID</strong></li>
            <li>นำ Chat ID มาใส่ในช่องด้านล่าง แล้วกด <strong>ทดสอบส่งข้อความ</strong></li>
          </ol>
        </div>

        {/* Bot Token + Chat ID */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", margin: "0 0 1.25rem" }}>ข้อมูลการเชื่อมต่อ</h3>
          
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={labelStyle}>Bot Token</label>
            <input 
              className="input" 
              value={settings.telegram_bot_token} 
              onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })} 
              placeholder="e.g. 1234567890:ABCDefGhIjKlMnOpQrStUvWxYz" 
              style={{ background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a" }}
            />
          </div>
          
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Chat ID (ID กลุ่มหรือบัญชีส่วนตัว)</label>
            <input 
              className="input" 
              value={settings.telegram_chat_id} 
              onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })} 
              placeholder="e.g. -1001234567890" 
              style={{ background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a" }}
            />
          </div>

          <button 
            type="button" 
            onClick={handleTest} 
            disabled={testing} 
            style={{ 
              background: "linear-gradient(135deg, #0ea5e9, #14b8a6)", /* สีเขียวฟ้า */
              color: "white", 
              border: "none", 
              borderRadius: "6px", 
              padding: "0.6rem 1.25rem", 
              fontSize: "0.85rem", 
              fontWeight: 500, 
              cursor: testing ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: testing ? 0.7 : 1,
              boxShadow: "0 4px 10px rgba(20, 184, 166, 0.3)"
            }}
          >
            {testing ? "กำลังทดสอบ..." : "ทดสอบส่งข้อความ"}
          </button>
        </div>

        {/* เลือกว่าจะแจ้งเตือนอะไรบ้าง */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.5rem" }}>ตั้งค่าการแจ้งเตือน</h3>
          
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { key: "telegram_notify_deposit", label: "รายการฝากเงิน" },
              { key: "telegram_notify_withdraw", label: "รายการถอนเงิน" },
              { key: "telegram_notify_register", label: "การสมัครสมาชิกใหม่" },
            ].map((item, index, arr) => (
              <div 
                key={item.key} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "1rem 0", 
                  borderBottom: index === arr.length - 1 ? "none" : "1px solid #f1f5f9" 
                }}
              >
                <span style={{ fontSize: "0.9rem", color: "#334155", fontWeight: 500 }}>{item.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: (settings as any)[item.key] === "true" ? "#10b981" : "#ef4444" }}>
                    {(settings as any)[item.key] === "true" ? "ON" : "OFF"}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setSettings({ ...settings, [item.key]: (settings as any)[item.key] === "true" ? "false" : "true" })}
                    style={{
                      position: "relative",
                      width: "44px",
                      height: "24px",
                      borderRadius: "12px",
                      background: (settings as any)[item.key] === "true" ? "#10b981" : "#ef4444",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 0.3s ease"
                    }}
                  >
                    <div style={{
                      position: "absolute",
                      top: "2px",
                      left: (settings as any)[item.key] === "true" ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      background: "white",
                      borderRadius: "50%",
                      transition: "left 0.3s ease",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button 
            type="submit" 
            disabled={saving} 
            style={{ 
              background: "#0f172a", 
              color: "white", 
              border: "none", 
              borderRadius: "8px", 
              padding: "0.75rem 2rem", 
              fontSize: "0.9rem", 
              fontWeight: 500, 
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              transition: "all 0.2s",
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? "กำลังบันทึกข้อมูล..." : "บันทึกการตั้งค่า"}
          </button>
        </div>
      </form>
    </div>
  );
}