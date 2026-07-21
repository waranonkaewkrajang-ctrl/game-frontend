"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";

interface Game {
  id: number;
  product_id: string;
  game_code: string;
  game_name: string;
  game_name_th: string | null;
  category: string | null;
  type: string | null;
  image_url: string | null;
  rank: number;
  is_active: boolean;
}

interface Summary {
  total: number;
  active: number;
  inactive: number;
  products: { product_id: string; total: number; active: number }[];
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProduct, setSyncProduct] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [agentCredit, setAgentCredit] = useState<any>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [productImages, setProductImages] = useState<Record<string, any>>({});

  const fetchGames = () => {
    setLoading(true);
    const params: any = {};
    if (filterProduct) params.productId = filterProduct;
    if (filterStatus) params.status = filterStatus;
    if (search) params.search = search;
    api.get("/admin/games", { params }).then((res) => {
      setGames(res.data.data.data || res.data.data);
      setSummary(res.data.summary || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const fetchProducts = () => {
    api.get("/admin/games/products").then((res) => {
      if (res.data.status === "success") setProducts(res.data.data || []);
    }).catch(() => {});
  };

  const fetchAgentCredit = () => {
    api.get("/admin/games/agent-credit").then((res) => {
      if (res.data.status === "success") setAgentCredit(res.data.data);
    }).catch(() => {});
  };

  const fetchProductImages = () => {
    api.get("/admin/games/product-images").then((res) => {
      if (res.data.status === "success") setProductImages(res.data.data || {});
    }).catch(() => {});
  };

  const handleUploadImage = async (productId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("product_id", productId);
      formData.append("image", file);
      try {
        const res = await api.post("/admin/games/product-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
        Swal.fire({ icon: "success", title: res.data.message, timer: 1500, showConfirmButton: false });
        fetchProductImages();
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "อัปโหลดไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
      }
    };
    input.click();
  };

  useEffect(() => { fetchGames(); fetchProducts(); fetchAgentCredit(); fetchProductImages(); }, [filterProduct, filterStatus]);

  const handleSync = async () => {
    if (!syncProduct) { Swal.fire({ icon: "warning", title: "กรุณาเลือกค่ายเกม" }); return; }
    setSyncing(true);
    try {
      const res = await api.post("/admin/games/sync", { productId: syncProduct });
      Swal.fire({ icon: "success", title: "Sync สำเร็จ", text: res.data.message, timer: 2000, showConfirmButton: false });
      fetchGames();
    } catch (err: any) { Swal.fire({ icon: "error", title: "Sync ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" }); }
    finally { setSyncing(false); }
  };

  const handleSyncAll = async () => {
    if (products.length === 0) return;
    const confirm = await Swal.fire({ title: `Sync ทั้งหมด ${products.length} ค่าย?`, text: "อาจใช้เวลาสักครู่", icon: "question", showCancelButton: true, confirmButtonText: "เริ่ม Sync", cancelButtonText: "ยกเลิก", confirmButtonColor: "#4f46e5" });
    if (!confirm.isConfirmed) return;
    setSyncing(true);
    let total = 0;
    for (const p of products) { try { const res = await api.post("/admin/games/sync", { productId: p }); total += res.data.data?.synced || 0; } catch {} }
    setSyncing(false);
    Swal.fire({ icon: "success", title: "Sync ทั้งหมดสำเร็จ", text: `รวม ${total} เกม จาก ${products.length} ค่าย`, timer: 3000, showConfirmButton: false });
    fetchGames();
  };

  const handleToggle = async (game: Game) => {
    try { await api.post(`/admin/games/${game.id}/toggle`); fetchGames(); }
    catch (err: any) { Swal.fire({ icon: "error", title: "ไม่สำเร็จ", text: err.response?.data?.message || "เกิดข้อผิดพลาด" }); }
  };

  const handleToggleProduct = async (productId: string, activate: boolean) => {
    const confirm = await Swal.fire({ title: `${activate ? "เปิด" : "ปิด"}ทั้งค่าย ${productId}?`, icon: "question", showCancelButton: true, confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก", confirmButtonColor: activate ? "#059669" : "#dc2626" });
    if (!confirm.isConfirmed) return;
    try { const res = await api.post("/admin/games/toggle-product", { productId, is_active: activate }); Swal.fire({ icon: "success", title: res.data.message, timer: 1500, showConfirmButton: false }); fetchGames(); }
    catch { Swal.fire({ icon: "error", title: "ไม่สำเร็จ" }); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchGames(); };
  const fmt = (n: number) => n?.toLocaleString("th-TH", { minimumFractionDigits: 2 });

  const box = (borderColor: string) => ({ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", borderTop: `3px solid ${borderColor}` });
  const chip = (bg: string, color: string) => ({ fontSize: "0.65rem", background: bg, color: color, padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 as const, display: "inline-block" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ───── Header ───── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>จัดการเกม</h1>
          <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "4px 0 0" }}>Sync เกมจาก AMB SuperAPI เปิด/ปิดเกม และจัดการค่ายเกม</p>
        </div>
        {agentCredit && (
          <div style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "1px solid #86efac", borderRadius: "10px", padding: "10px 18px", textAlign: "right" }}>
            <p style={{ fontSize: "0.65rem", color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Agent Credit</p>
            <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#059669", margin: "2px 0 0" }}>฿{fmt(agentCredit.credit)}</p>
          </div>
        )}
      </div>

      {/* ───── Summary Cards ───── */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          <div style={box("#6366f1")}>
            <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>เกมทั้งหมด</p>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "#6366f1", margin: "4px 0 0", lineHeight: 1 }}>{summary.total.toLocaleString()}</p>
          </div>
          <div style={box("#10b981")}>
            <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>เปิดใช้งาน</p>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981", margin: "4px 0 0", lineHeight: 1 }}>{summary.active.toLocaleString()}</p>
          </div>
          <div style={box("#ef4444")}>
            <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>ปิดใช้งาน</p>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "#ef4444", margin: "4px 0 0", lineHeight: 1 }}>{summary.inactive.toLocaleString()}</p>
          </div>
          <div style={box("#f59e0b")}>
            <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>จำนวนค่าย</p>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b", margin: "4px 0 0", lineHeight: 1 }}>{summary.products.length}</p>
          </div>
        </div>
      )}

      {/* ───── Sync + Filter Bar ───── */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ minWidth: "200px" }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.03em" }}>Sync เกม</label>
            <select className="input" value={syncProduct} onChange={(e) => setSyncProduct(e.target.value)}>
              <option value="">-- เลือกค่าย --</option>
              {products.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={handleSync} className="btn-primary" disabled={syncing} style={{ padding: "0.65rem 1.25rem" }}>{syncing ? "Syncing..." : "Sync ค่ายนี้"}</button>
          <button onClick={handleSyncAll} className="btn-success" disabled={syncing} style={{ padding: "0.65rem 1.25rem" }}>{syncing ? "Syncing..." : "Sync ทั้งหมด"}</button>

          <div style={{ width: "1px", height: "32px", background: "#e2e8f0", margin: "0 4px" }} />

          <div>
            <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.03em" }}>กรองค่าย</label>
            <select className="input" style={{ width: "160px" }} value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {(summary?.products || []).map((p) => <option key={p.product_id} value={p.product_id}>{p.product_id} ({p.total})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.03em" }}>สถานะ</label>
            <select className="input" style={{ width: "120px" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">ทั้งหมด</option>
              <option value="active">เปิด</option>
              <option value="inactive">ปิด</option>
            </select>
          </div>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.4rem" }}>
            <input className="input" style={{ width: "180px" }} placeholder="ค้นหาชื่อเกม..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="submit" className="btn-primary" style={{ padding: "0.65rem 1rem" }}>ค้นหา</button>
          </form>

          <div style={{ marginLeft: "auto", display: "flex", gap: "2px", background: "#f1f5f9", borderRadius: "8px", padding: "3px" }}>
            <button onClick={() => setView("grid")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, background: view === "grid" ? "white" : "transparent", color: view === "grid" ? "#0f172a" : "#94a3b8", boxShadow: view === "grid" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>Grid</button>
            <button onClick={() => setView("list")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, background: view === "list" ? "white" : "transparent", color: view === "list" ? "#0f172a" : "#94a3b8", boxShadow: view === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>List</button>
          </div>
        </div>
      </div>

      {/* ───── Products Chips ───── */}
      {summary && summary.products.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {summary.products.map((p) => {
            const inactive = p.total - p.active;
            return (
              <div key={p.product_id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "white", border: "1px solid #e2e8f0", borderRadius: "999px", padding: "5px 6px 5px 6px", fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                {productImages[p.product_id]?.image_url ? (
                  <img src={productImages[p.product_id].image_url} alt={p.product_id} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "#94a3b8" }}>?</div>
                )}
                {p.product_id}
                <span style={chip("#d1fae5", "#065f46")}>{p.active}</span>
                {inactive > 0 && <span style={chip("#fee2e2", "#991b1b")}>{inactive}</span>}
                <button onClick={() => handleToggleProduct(p.product_id, true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: "#059669", fontWeight: 700, padding: "2px 4px" }}>ON</button>
                <button onClick={() => handleToggleProduct(p.product_id, false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: "#dc2626", fontWeight: 700, padding: "2px 4px" }}>OFF</button>
                <button onClick={() => handleUploadImage(p.product_id)} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", cursor: "pointer", fontSize: "0.65rem", color: "#2563eb", fontWeight: 700, padding: "3px 8px" }}>เปลี่ยนรูป</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ───── Game Content ───── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontSize: "0.9rem" }}>กำลังโหลดข้อมูลเกม...</div>
      ) : games.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          <p style={{ color: "#94a3b8", fontSize: "1rem", margin: 0 }}>ไม่พบเกม กรุณา Sync จาก AMB ก่อน</p>
        </div>
      ) : view === "grid" ? (
        /* ───── Grid View ───── */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px" }}>
          {games.map((game) => (
            <div key={game.id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", opacity: game.is_active ? 1 : 0.45, transition: "all 0.2s", position: "relative" }}>
              {/* Status dot */}
              <div style={{ position: "absolute", top: "8px", right: "8px", width: "10px", height: "10px", borderRadius: "50%", background: game.is_active ? "#10b981" : "#ef4444", border: "2px solid white", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", zIndex: 2 }} />

              {/* Image */}
              <div style={{ width: "100%", aspectRatio: "4/3", background: "#f8fafc", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {game.image_url ? (
                  <img src={game.image_url} alt={game.game_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "#cbd5e1", fontSize: "0.75rem" }}>No Image</span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "10px 12px 12px" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {game.game_name_th || game.game_name}
                </p>
                <div style={{ display: "flex", gap: "4px", marginTop: "5px", flexWrap: "wrap" }}>
                  <span style={chip("#eff6ff", "#2563eb")}>{game.product_id}</span>
                  {game.type && <span style={chip("#faf5ff", "#7c3aed")}>{game.type}</span>}
                </div>
                <button onClick={() => handleToggle(game)} style={{
                  marginTop: "8px", width: "100%", padding: "6px", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontSize: "0.72rem", fontWeight: 700, transition: "all 0.15s", letterSpacing: "0.02em",
                  background: game.is_active ? "linear-gradient(135deg,#fee2e2,#fecaca)" : "linear-gradient(135deg,#d1fae5,#a7f3d0)",
                  color: game.is_active ? "#b91c1c" : "#047857",
                }}>
                  {game.is_active ? "ปิดเกมนี้" : "เปิดเกมนี้"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ───── List View ───── */
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["", "ชื่อเกม", "รหัส", "ค่าย", "ประเภท", "สถานะ", ""].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 5 || i === 6 ? "center" as const : "left" as const, padding: "10px 14px", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id} style={{ borderBottom: "1px solid #f1f5f9", opacity: game.is_active ? 1 : 0.5, transition: "all 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fafbfc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "8px 14px", width: "52px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", background: "#f1f5f9" }}>
                      {game.image_url ? <img src={game.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                    </div>
                  </td>
                  <td style={{ padding: "8px 14px" }}>
                    <p style={{ fontWeight: 600, color: "#0f172a", margin: 0, fontSize: "0.82rem" }}>{game.game_name_th || game.game_name}</p>
                    {game.game_name_th && <p style={{ color: "#94a3b8", margin: "1px 0 0", fontSize: "0.68rem" }}>{game.game_name}</p>}
                  </td>
                  <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: "0.72rem", color: "#64748b" }}>{game.game_code}</td>
                  <td style={{ padding: "8px 14px" }}><span style={chip("#eff6ff", "#2563eb")}>{game.product_id}</span></td>
                  <td style={{ padding: "8px 14px", fontSize: "0.78rem", color: "#64748b" }}>{game.type || "-"}</td>
                  <td style={{ padding: "8px 14px", textAlign: "center" }}>
                    <span style={chip(game.is_active ? "#d1fae5" : "#fee2e2", game.is_active ? "#065f46" : "#991b1b")}>{game.is_active ? "เปิด" : "ปิด"}</span>
                  </td>
                  <td style={{ padding: "8px 14px", textAlign: "center" }}>
                    <button onClick={() => handleToggle(game)} style={{
                      background: game.is_active ? "#fee2e2" : "#d1fae5", border: "none", borderRadius: "6px",
                      padding: "5px 14px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                      color: game.is_active ? "#b91c1c" : "#047857",
                    }}>{game.is_active ? "ปิด" : "เปิด"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}