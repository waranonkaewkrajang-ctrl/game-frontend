"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface BankAccount {
  bank_code: string;
  bank_account: string;
  bank_name: string;
  is_active: boolean;
}

export default function FinanceSettingsPage() {
  const [settings, setSettings] = useState({
    min_deposit: "100",
    max_deposit: "200000",
    min_withdraw: "300",
    max_withdraw: "200000",
    auto_approve_deposit: "false",
    auto_approve_withdraw: "false",
    deposit_channels: '["bank_transfer","promptpay","truewallet"]',
    deposit_banks: "[]",
    deposit_amounts: "[100,300,500,1000,5000]",
    truewallet_number: "",
  });
  const [saving, setSaving] = useState(false);

  // Bank accounts
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [newBank, setNewBank] = useState({ bank_code: "SCB", bank_account: "", bank_name: "" });

  // Channels
  const [channels, setChannels] = useState<string[]>(["bank_transfer", "promptpay", "truewallet"]);

  // Quick amounts
  const [amounts, setAmounts] = useState<number[]>([100, 300, 500, 1000, 5000]);
  const [newAmount, setNewAmount] = useState("");
  const [wallets, setWallets] = useState<{phone: string; name: string; is_active: boolean}[]>([]);
  const [newWallet, setNewWallet] = useState({ phone: "", name: "" });

  useEffect(() => {
    api.get("/admin/settings").then((res) => {
      const data = res.data;
      setSettings((prev) => ({ ...prev, ...data }));

      // Parse banks
      try { setBanks(JSON.parse(data.deposit_banks || "[]")); } catch { setBanks([]); }
      // Parse channels
      try { setChannels(JSON.parse(data.deposit_channels || '["bank_transfer","promptpay","truewallet"]')); } catch {}
      // Parse amounts
      try { setAmounts(JSON.parse(data.deposit_amounts || "[100,300,500,1000,5000]")); } catch {}
      try { setWallets(JSON.parse(data.truewallet_accounts || "[]")); } catch { setWallets([]); }
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/settings", {
        ...settings,
        deposit_banks: JSON.stringify(banks),
        deposit_channels: JSON.stringify(channels),
        deposit_amounts: JSON.stringify(amounts),
        truewallet_accounts: JSON.stringify(wallets),
      });
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ" });
    }
    setSaving(false);
  };

  const addBank = () => {
    if (!newBank.bank_account || !newBank.bank_name) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกข้อมูลให้ครบ" });
      return;
    }
    setBanks([...banks, { ...newBank, is_active: true }]);
    setNewBank({ bank_code: "SCB", bank_account: "", bank_name: "" });
  };

  const removeBank = (index: number) => {
    setBanks(banks.filter((_, i) => i !== index));
  };

  const toggleBank = (index: number) => {
    setBanks(banks.map((b, i) => i === index ? { ...b, is_active: !b.is_active } : b));
  };

  const toggleChannel = (ch: string) => {
    setChannels(channels.includes(ch) ? channels.filter(c => c !== ch) : [...channels, ch]);
  };

  const addAmount = () => {
    const val = parseInt(newAmount);
    if (!val || val <= 0 || amounts.includes(val)) return;
    setAmounts([...amounts, val].sort((a, b) => a - b));
    setNewAmount("");
  };

  const removeAmount = (val: number) => {
    setAmounts(amounts.filter(a => a !== val));
  };

  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" };
  const bankOptions = [
    { code: "SCB", name: "ไทยพาณิชย์" }, { code: "KBANK", name: "กสิกรไทย" },
    { code: "KTB", name: "กรุงไทย" }, { code: "BBL", name: "กรุงเทพ" },
    { code: "TMB", name: "ทหารไทยธนชาต" }, { code: "BAY", name: "กรุงศรี" },
    { code: "GSB", name: "ออมสิน" }, { code: "TBANK", name: "ธนชาต" },
    { code: "LHBANK", name: "แลนด์ แอนด์ เฮ้าส์" }, { code: "CIMB", name: "ซีไอเอ็มบี" },
  ];

  const channelOptions = [
    { key: "bank_transfer", label: "บัญชีธนาคาร", icon: "" },
    { key: "promptpay", label: "QR Payment / PromptPay", icon: "" },
    { key: "truewallet", label: "True Wallet", icon: "" },
  ];

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>ตั้งค่าการเงิน</h1>
      <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>กำหนดบัญชีรับฝาก ขั้นต่ำ-สูงสุด ช่องทาง และปุ่มจำนวนเงิน</p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* บัญชีรับฝาก */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>บัญชีรับฝากเงิน</h3>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 1rem" }}>บัญชีที่จะแสดงให้ลูกค้าโอนเงินเข้า</p>

          {/* รายการบัญชี */}
          {banks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              {banks.map((bank, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: bank.is_active ? "#f0fdf4" : "#fef2f2", border: `1px solid ${bank.is_active ? "#bbf7d0" : "#fecaca"}`, borderRadius: "0.5rem" }}>
                  <img src={`https://fs.cdnrc.com/payment-layout/iconbank/${bank.bank_code}.png`} alt={bank.bank_code} style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#fff", padding: "2px", objectFit: "contain" }} onError={(e) => { e.currentTarget.src = "https://fs.cdnrc.com/payment-layout/svg/bank.svg"; }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{bank.bank_name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{bank.bank_code} — {bank.bank_account}</div>
                  </div>
                  <button type="button" onClick={() => toggleBank(i)} style={{ fontSize: "0.7rem", padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer", background: bank.is_active ? "#dcfce7" : "#fee2e2", color: bank.is_active ? "#166534" : "#991b1b", fontWeight: 600 }}>
                    {bank.is_active ? "เปิด" : "ปิด"}
                  </button>
                  <button type="button" onClick={() => removeBank(i)} style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}>ลบ</button>
                </div>
              ))}
            </div>
          )}

          {/* เพิ่มบัญชี */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div>
              <label style={labelStyle}>ธนาคาร</label>
              <select className="input" value={newBank.bank_code} onChange={(e) => setNewBank({ ...newBank, bank_code: e.target.value })}>
                {bankOptions.map(b => <option key={b.code} value={b.code}>{b.name} ({b.code})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>เลขบัญชี</label>
              <input className="input" value={newBank.bank_account} onChange={(e) => setNewBank({ ...newBank, bank_account: e.target.value })} placeholder="xxx-x-xxxxx-x" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>ชื่อบัญชี</label>
              <input className="input" value={newBank.bank_name} onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })} placeholder="ชื่อ-นามสกุล" />
            </div>
            <button type="button" onClick={addBank} style={{ alignSelf: "flex-end", background: "#22c55e", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>+ เพิ่ม</button>
          </div>
        </div>

        {/* True Wallet */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>บัญชี True Wallet</h3>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 1rem" }}>บัญชี True Wallet ที่จะแสดงให้ลูกค้าโอนเข้า</p>

          {wallets.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              {wallets.map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: w.is_active ? "#f0fdf4" : "#fef2f2", border: `1px solid ${w.is_active ? "#bbf7d0" : "#fecaca"}`, borderRadius: "0.5rem" }}>
                  <img src="https://fs.cdnrc.com/payment-layout/svg/true-wallet.svg" alt="TW" style={{ width: "32px", height: "32px" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{w.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{w.phone}</div>
                  </div>
                  <button type="button" onClick={() => setWallets(wallets.map((ww, ii) => ii === i ? { ...ww, is_active: !ww.is_active } : ww))} style={{ fontSize: "0.7rem", padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer", background: w.is_active ? "#dcfce7" : "#fee2e2", color: w.is_active ? "#166534" : "#991b1b", fontWeight: 600 }}>
                    {w.is_active ? "เปิด" : "ปิด"}
                  </button>
                  <button type="button" onClick={() => setWallets(wallets.filter((_, ii) => ii !== i))} style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}>ลบ</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div>
              <label style={labelStyle}>เบอร์โทรศัพท์</label>
              <input className="input" value={newWallet.phone} onChange={(e) => setNewWallet({ ...newWallet, phone: e.target.value })} placeholder="0xxxxxxxxx" />
            </div>
            <div>
              <label style={labelStyle}>ชื่อบัญชี</label>
              <input className="input" value={newWallet.name} onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })} placeholder="ชื่อ-นามสกุล" />
            </div>
          </div>
          <button type="button" onClick={() => {
            if (!newWallet.phone || !newWallet.name) { Swal.fire({ icon: "warning", title: "กรุณากรอกข้อมูลให้ครบ" }); return; }
            setWallets([...wallets, { ...newWallet, is_active: true }]);
            setNewWallet({ phone: "", name: "" });
          }} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>+ เพิ่ม</button>
        </div>

        {/* ช่องทางฝากเงิน */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>ช่องทางฝากเงิน</h3>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 1rem" }}>เลือกช่องทางที่จะเปิดให้ลูกค้าใช้</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {channelOptions.map(ch => (
              <label key={ch.key} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: channels.includes(ch.key) ? "#f0fdf4" : "#f8fafc", border: `1px solid ${channels.includes(ch.key) ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" checked={channels.includes(ch.key)} onChange={() => toggleChannel(ch.key)} style={{ width: "18px", height: "18px", accentColor: "#22c55e" }} />
                <span style={{ fontSize: "1.2rem" }}>{ch.icon}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{ch.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ขั้นต่ำ-สูงสุด */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ฝากเงิน</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>ฝากขั้นต่ำ (บาท)</label>
              <input className="input" type="number" value={settings.min_deposit} onChange={(e) => setSettings({ ...settings, min_deposit: e.target.value })} placeholder="100" />
            </div>
            <div>
              <label style={labelStyle}>ฝากสูงสุด (บาท)</label>
              <input className="input" type="number" value={settings.max_deposit} onChange={(e) => setSettings({ ...settings, max_deposit: e.target.value })} placeholder="200000" />
            </div>
          </div>
        </div>

        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>ถอนเงิน</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>ถอนขั้นต่ำ (บาท)</label>
              <input className="input" type="number" value={settings.min_withdraw} onChange={(e) => setSettings({ ...settings, min_withdraw: e.target.value })} placeholder="300" />
            </div>
            <div>
              <label style={labelStyle}>ถอนสูงสุด (บาท)</label>
              <input className="input" type="number" value={settings.max_withdraw} onChange={(e) => setSettings({ ...settings, max_withdraw: e.target.value })} placeholder="200000" />
            </div>
          </div>
        </div>

        {/* ปุ่มจำนวนเงินด่วน */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>ปุ่มจำนวนเงินด่วน</h3>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 1rem" }}>ปุ่มกด +เงิน ที่แสดงหน้าฝาก/ถอน ลูกค้ากดเพิ่มจำนวนเงินได้เร็ว</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {amounts.map(val => (
              <div key={val} style={{ display: "flex", alignItems: "center", gap: "4px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "4px 10px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1d4ed8" }}>+{val.toLocaleString()}</span>
                <button type="button" onClick={() => removeAmount(val)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "0.9rem", fontWeight: 700, padding: "0 2px" }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input className="input" type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="จำนวนเงิน เช่น 2000" style={{ flex: 1 }} />
            <button type="button" onClick={addAmount} style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>+ เพิ่ม</button>
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={saving} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: "0.375rem", padding: "0.7rem 2.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </form>
    </div>
  );
}