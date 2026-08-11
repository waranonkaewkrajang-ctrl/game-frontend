"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function ProductGamesPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.product as string;

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchGames();
  }, [productId]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/games", { 
        params: { productId, per_page: 500 } 
      });
      setGames(res.data.data.data || res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGame = async (game: Game) => {
    try {
      await api.post(`/admin/games/${game.id}/toggle`);
      setGames(games.map(g => g.id === game.id ? { ...g, is_active: !g.is_active } : g));
    } catch {
      Swal.fire({ icon: "error", title: "เปลี่ยนสถานะไม่สำเร็จ" });
    }
  };

  const toggleAll = async (activate: boolean) => {
    const confirm = await Swal.fire({
      title: activate ? "เปิดใช้งานทุกเกมในค่ายนี้?" : "ปิดใช้งานทุกเกมในค่ายนี้?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: activate ? "เปิดใช้งาน" : "ปิดใช้งาน",
      confirmButtonColor: activate ? "#059669" : "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.post("/admin/games/toggle-product", { 
        product_id: productId, 
        is_active: activate 
      });
      fetchGames();
      Swal.fire({ icon: "success", title: "สำเร็จ", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "ล้มเหลว" });
    }
  };

  const filtered = games.filter(g => {
    if (filterStatus === "active" && !g.is_active) return false;
    if (filterStatus === "inactive" && g.is_active) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        g.game_name.toLowerCase().includes(s) ||
        (g.game_name_th || "").toLowerCase().includes(s) ||
        g.game_code.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalActive = games.filter(g => g.is_active).length;
  const totalInactive = games.length - totalActive;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      
      {/* Header + Back */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => router.push("/dashboard/games")}
            style={{
              padding: "8px 16px",
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← กลับ
          </button>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              {productId}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "2px 0 0" }}>
              จัดการเกมในค่าย {productId}
            </p>
          </div>
        </div>
        
        {/* Bulk Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => toggleAll(true)}
            style={{
              padding: "10px 18px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
            }}
          >
            เปิดใช้งานทั้งค่าย
          </button>
          <button
            onClick={() => toggleAll(false)}
            style={{
              padding: "10px 18px",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
            }}
          >
            ปิดใช้งานทั้งค่าย
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 18px" }}>
          <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>เกมทั้งหมด</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#6366f1", margin: "2px 0 0" }}>{games.length}</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 18px" }}>
          <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>เปิดใช้งาน</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10b981", margin: "2px 0 0" }}>{totalActive}</p>
        </div>
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 18px" }}>
          <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>ปิดใช้งาน</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ef4444", margin: "2px 0 0" }}>{totalInactive}</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.85rem", minWidth: "150px" }}
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="active">เปิดใช้งาน</option>
            <option value="inactive">ปิดใช้งาน</option>
          </select>
          <input
            type="text"
            placeholder="ค้นหาชื่อเกม / รหัสเกม..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.85rem", minWidth: "200px" }}
          />
        </div>
      </div>

      {/* Grid Games */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          <p style={{ color: "#94a3b8", margin: 0 }}>ไม่พบเกม</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
          {filtered.map((game) => (
            <div
              key={game.id}
              style={{
                background: "white",
                border: game.is_active ? "1px solid #e2e8f0" : "1px solid #fecaca",
                borderRadius: "12px",
                padding: "10px",
                position: "relative",
                opacity: game.is_active ? 1 : 0.7,
              }}
            >
              {/* Image */}
              <div style={{ 
                width: "100%", 
                aspectRatio: "1/1", 
                borderRadius: "8px", 
                overflow: "hidden", 
                background: "#f1f5f9", 
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {game.image_url ? (
                  <img 
                    src={game.image_url} 
                    alt={game.game_name} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>No Image</div>
                )}
              </div>
              
              {/* Name */}
              <div style={{ 
                fontSize: "0.8rem", 
                fontWeight: 700, 
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: "2px",
              }}>
                {game.game_name_th || game.game_name}
              </div>
              
              {/* Code */}
              <div style={{ 
                fontSize: "0.65rem", 
                color: "#94a3b8",
                marginBottom: "8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {game.game_code}
              </div>
              
              {/* Toggle */}
              <button
                onClick={() => toggleGame(game)}
                style={{
                  width: "100%",
                  padding: "6px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: game.is_active ? "#dcfce7" : "#fee2e2",
                  color: game.is_active ? "#059669" : "#dc2626",
                  transition: "all 0.2s",
                }}
              >
                {game.is_active ? "✓ เปิดใช้งาน" : "✗ ปิดใช้งาน"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}