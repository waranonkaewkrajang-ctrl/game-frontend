"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export type Provider = {
  product_id: string; category: string; category_name: string;
  game_count: number; icon: string | null;
};
export type GameItem = {
  key: string; provider: string; code: string;
  name: string; image: string | null; category: string;
};

export const CATEGORIES = [
  { key: "EGAMES", name: "สล็อต / เกมตู้" },
  { key: "LIVECASINO", name: "คาสิโนสด" },
  { key: "CARD", name: "เกมไพ่" },
  { key: "SPORT", name: "กีฬา" },
  { key: "TRADING", name: "ไก่ชน" },
];

type Props = {
  categories: string[];
  providers: string[];
  games: string[];
  onChange: (v: { categories: string[]; providers: string[]; games: string[] }) => void;
};

export default function GamePicker({ categories, providers, games, onChange }: Props) {
  const [tab, setTab] = useState<"cat" | "prov" | "game">("cat");
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [gameList, setGameList] = useState<GameItem[]>([]);
  const [pickedGames, setPickedGames] = useState<GameItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterProv, setFilterProv] = useState("");
  const [loading, setLoading] = useState(false);

  // โหลดรายชื่อค่าย
  useEffect(() => {
    api.get("/admin/game-catalog/providers")
      .then((r) => setAllProviders(r.data.data || []))
      .catch(() => {});
  }, []);

  // โหลดรายละเอียดเกมที่เลือกไว้ (ตอนเปิดฟอร์มแก้ไข)
  useEffect(() => {
    if (games.length === 0) { setPickedGames([]); return; }
    api.post("/admin/game-catalog/games-by-keys", { keys: games })
      .then((r) => setPickedGames(r.data.data || []))
      .catch(() => {});
  }, [games.join(",")]); // eslint-disable-line

  // ค้นหาเกม
  useEffect(() => {
    if (tab !== "game") return;
    const t = setTimeout(() => {
      setLoading(true);
      api.get("/admin/game-catalog/games", { params: { search, provider: filterProv } })
        .then((r) => setGameList(r.data.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, filterProv, tab]);

  const toggle = (type: "categories" | "providers" | "games", val: string) => {
    const cur = { categories, providers, games };
    const list = cur[type].slice();
    const i = list.indexOf(val);
    if (i >= 0) list.splice(i, 1); else list.push(val);
    onChange({ ...cur, [type]: list });
  };

  const total = categories.length + providers.length + games.length;
  const byCategory = allProviders.reduce<Record<string, Provider[]>>((acc, p) => {
    (acc[p.category] ||= []).push(p);
    return acc;
  }, {});

  const tabBtn = (on: boolean): React.CSSProperties => ({
    padding: "0.45rem 1rem", borderRadius: "999px", cursor: "pointer", fontFamily: "inherit",
    fontSize: "0.82rem", fontWeight: 600, border: "1px solid",
    background: on ? "#2563eb" : "white", color: on ? "white" : "#475569",
    borderColor: on ? "#2563eb" : "#cbd5e1",
  });

  const chip = (on: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.6rem",
    borderRadius: "10px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem",
    border: on ? "2px solid #2563eb" : "1px solid #e2e8f0",
    background: on ? "#eff6ff" : "white", color: "#334155", textAlign: "left",
  });

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.9rem", background: "#f8fafc" }}>
      <div style={{ display: "flex", gap: "0.45rem", marginBottom: "0.8rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => setTab("cat")} style={tabBtn(tab === "cat")}>
          ประเภท{categories.length > 0 && ` (${categories.length})`}
        </button>
        <button type="button" onClick={() => setTab("prov")} style={tabBtn(tab === "prov")}>
          ค่ายเกม{providers.length > 0 && ` (${providers.length})`}
        </button>
        <button type="button" onClick={() => setTab("game")} style={tabBtn(tab === "game")}>
          เกมเฉพาะ{games.length > 0 && ` (${games.length})`}
        </button>
        <div style={{ flex: 1 }} />
        {total > 0 && (
          <button type="button" onClick={() => onChange({ categories: [], providers: [], games: [] })}
            style={{ padding: "0.45rem 0.9rem", borderRadius: "999px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: "0.78rem", fontFamily: "inherit" }}>
            ล้างทั้งหมด
          </button>
        )}
      </div>

      {/* ── ประเภท ── */}
      {tab === "cat" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.5rem" }}>
          {CATEGORIES.map((c) => (
            <button key={c.key} type="button" onClick={() => toggle("categories", c.key)} style={chip(categories.includes(c.key))}>
              <span style={{ fontWeight: 600 }}>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── ค่ายเกม ── */}
      {tab === "prov" && (
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          {Object.entries(byCategory).map(([cat, list]) => (
            <div key={cat} style={{ marginBottom: "0.9rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.4rem" }}>
                {CATEGORIES.find((c) => c.key === cat)?.name || cat} ({list.length} ค่าย)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.45rem" }}>
                {list.map((p) => (
                  <button key={p.product_id} type="button" onClick={() => toggle("providers", p.product_id)} style={chip(providers.includes(p.product_id))}>
                    {p.icon && <img src={p.icon} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />}
                    <span style={{ overflow: "hidden" }}>
                      <span style={{ display: "block", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.product_id}</span>
                      <span style={{ display: "block", fontSize: "0.68rem", color: "#94a3b8" }}>{p.game_count} เกม</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── เกมเฉพาะ ── */}
      {tab === "game" && (
        <div>
          <div style={{ display: "flex", gap: "0.45rem", marginBottom: "0.7rem", flexWrap: "wrap" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อเกม..."
              style={{ flex: 1, minWidth: 180, padding: "0.5rem 0.8rem", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", fontFamily: "inherit" }} />
            <select value={filterProv} onChange={(e) => setFilterProv(e.target.value)}
              style={{ padding: "0.5rem 0.7rem", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", fontFamily: "inherit", background: "white" }}>
              <option value="">ทุกค่าย</option>
              {allProviders.map((p) => <option key={p.product_id} value={p.product_id}>{p.product_id}</option>)}
            </select>
          </div>

          {pickedGames.length > 0 && (
            <div style={{ marginBottom: "0.7rem", padding: "0.6rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1d4ed8", marginBottom: "0.4rem" }}>เลือกแล้ว {pickedGames.length} เกม</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {pickedGames.map((g) => (
                  <button key={g.key} type="button" onClick={() => toggle("games", g.key)}
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.5rem", borderRadius: "999px", border: "1px solid #93c5fd", background: "white", cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit" }}>
                    {g.image && <img src={g.image} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: "cover" }} />}
                    {g.name} ✕
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8", fontSize: "0.82rem" }}>กำลังค้นหา...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.45rem", maxHeight: 300, overflowY: "auto" }}>
              {gameList.map((g) => (
                <button key={g.key} type="button" onClick={() => toggle("games", g.key)} style={chip(games.includes(g.key))}>
                  {g.image && <img src={g.image} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />}
                  <span style={{ overflow: "hidden" }}>
                    <span style={{ display: "block", fontWeight: 600, fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</span>
                    <span style={{ display: "block", fontSize: "0.65rem", color: "#94a3b8" }}>{g.provider}</span>
                  </span>
                </button>
              ))}
              {gameList.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "1.5rem", color: "#94a3b8", fontSize: "0.82rem" }}>
                  {search ? "ไม่พบเกม" : "พิมพ์ชื่อเกมเพื่อค้นหา หรือเลือกค่ายจากช่องด้านบน"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "0.8rem", paddingTop: "0.6rem", borderTop: "1px dashed #cbd5e1", fontSize: "0.75rem", color: total > 0 ? "#1d4ed8" : "#94a3b8" }}>
        {total === 0
          ? "ไม่เลือกอะไรเลย = เล่นได้ทุกเกม"
          : `เล่นได้: ${[
              categories.length ? `${categories.length} ประเภท` : "",
              providers.length ? `${providers.length} ค่าย` : "",
              games.length ? `${games.length} เกม` : "",
            ].filter(Boolean).join(" · ")}`}
      </div>
    </div>
  );
}