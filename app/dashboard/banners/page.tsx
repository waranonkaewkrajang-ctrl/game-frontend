"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  // ดึง URL ของ API จาก Environment หรือกำหนดค่าตรงๆ
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://31.97.220.103/api";

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_URL}/admin/banners`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (data.status === "success") {
        setBanners(data.data);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      Swal.fire("แจ้งเตือน", "กรุณาใส่ลิงก์รูปภาพ (URL)", "warning");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_URL}/admin/banners`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image_url: imageUrl })
      });
      
      const data = await res.json();
      if (data.status === "success") {
        Swal.fire("สำเร็จ", "เพิ่มแบนเนอร์เรียบร้อย", "success");
        setImageUrl("");
        fetchBanners(); // โหลดข้อมูลใหม่เพื่อแสดงผล
      } else {
        Swal.fire("ผิดพลาด", data.message || "เพิ่มไม่สำเร็จ", "error");
      }
    } catch (error) {
      Swal.fire("ผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: "รูปนี้จะหายไปจากหน้าเว็บลูกค้าทันที!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบทิ้งเลย!",
      cancelButtonText: "ยกเลิก"
    });

    if (confirm.isConfirmed) {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`${API_URL}/admin/banners/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.status === "success") {
          Swal.fire("ลบแล้ว!", "ลบแบนเนอร์สำเร็จ", "success");
          fetchBanners();
        }
      } catch (error) {
        Swal.fire("ผิดพลาด", "ไม่สามารถลบได้", "error");
      }
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#1e293b" }}>
        จัดการแบนเนอร์ (Banners)
      </h1>

      {/* ฟอร์มเพิ่มแบนเนอร์ */}
      <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "#334155" }}>เพิ่มแบนเนอร์ใหม่</h2>
        <form onSubmit={handleAddBanner} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input 
            type="url" 
            placeholder="วางลิงก์รูปภาพ (URL) เช่น https://example.com/banner.jpg" 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ flex: 1, padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px" }}
          />
          <button type="submit" style={{ padding: "12px 24px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}
          >
            + เพิ่มแบนเนอร์
          </button>
        </form>
      </div>

      {/* รายการแบนเนอร์ */}
      <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", color: "#334155" }}>แบนเนอร์ที่แสดงบนหน้าเว็บปัจจุบัน</h2>
        
        {loading ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>กำลังโหลดข้อมูล...</p>
        ) : banners.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed #cbd5e1", borderRadius: "8px" }}>
            <p style={{ color: "#64748b", margin: 0 }}>ยังไม่มีรูปแบนเนอร์ในระบบ</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
            {banners.map((banner) => (
              <div key={banner.id} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ width: "100%", height: "140px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                  <img 
                    src={banner.image_url} 
                    alt="Banner" 
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "4px" }}
                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300x150?text=Invalid+Image+URL")}
                  />
                </div>
                <div style={{ padding: "12px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", marginTop: "auto" }}>
                  <button 
                    onClick={() => handleDelete(banner.id)}
                    style={{ width: "100%", padding: "8px", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", transition: "0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
                  >
                    ลบรูปนี้
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}