"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar-wrapper ${sidebarOpen ? "open" : ""}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Mobile header */}
        <header className="mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center" }}
          >
            <Menu size={24} color="#0f172a" />
          </button>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>Game Platform</span>
          <div style={{ width: "40px" }} />
        </header>

        <main style={{ flex: 1, padding: "1rem", overflow: "auto" }}>
          {children}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .sidebar-wrapper {
          display: flex;
          flex-shrink: 0;
        }

        .sidebar-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex !important;
          }

          .sidebar-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 50;
            height: 100vh;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }

          .sidebar-wrapper.open {
            transform: translateX(0);
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 45;
          }
        }
      `}} />
    </div>
  );
}