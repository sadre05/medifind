import React, { useState } from "react"
import { requestAPI } from "../services/api"

export default function RequestCard({ req, onRespond }) {
  const [loading, setLoading] = useState(null)
  const [done, setDone] = useState(null)
  const allMeds = Array.isArray(req.medicine_names) ? req.medicine_names : []
const meds = allMeds.filter(m => m.toLowerCase() !== 'medicine list')
  const [selected, setSelected] = useState(new Set(meds))

  function toggleMed(med) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(med) ? next.delete(med) : next.add(med)
      return next
    })
  }

  async function respond(response) {
    setLoading(response)
    try {
      const available = response === "confirmed" ? [...selected] : []
      await requestAPI.respond(req.request_id, req.shop_id, response, available)
      setDone(response)
      onRespond(req.notification_id, response)
    } catch (e) {
      alert(e.response?.data?.detail || "Error responding")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{
      background: done === "confirmed"
        ? "rgba(74,222,128,0.05)"
        : done === "declined"
        ? "rgba(248,113,113,0.04)"
        : "rgba(255,255,255,0.02)",
      border: `1px solid ${done === "confirmed" ? "rgba(74,222,128,0.25)" : done === "declined" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 14, padding: "16px 18px",
      animation: "slideIn 0.4s ease",
      transition: "all 0.3s",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontFamily: "Syne", fontWeight: 600,
          color: "#F59E0B", background: "rgba(245,158,11,0.1)",
          padding: "2px 8px", borderRadius: 6, letterSpacing: 0.5,
        }}>
          {req.request_code}
        </span>
        <span style={{ fontSize: 10, color: "var(--text3)" }}>
          {new Date(req.notified_at).toLocaleTimeString()}
        </span>
      </div>

      {/* Medicines — selectable */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>
          Select medicines you have in stock:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {meds.map((m, i) => {
            const isSelected = selected.has(m)
            return (
              <div
                key={i}
                onClick={() => !done && toggleMed(m)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: isSelected ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isSelected ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 10, padding: "8px 12px",
                  cursor: done ? "default" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: isSelected ? "var(--green)" : "transparent",
                  border: `2px solid ${isSelected ? "var(--green)" : "var(--text3)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {isSelected && <i className="ti ti-check" style={{ fontSize: 10, color: "#0B0F1A" }} />}
                </div>
                <span style={{
                  fontSize: 13,
                  color: isSelected ? "var(--text)" : "var(--text3)",
                  textDecoration: isSelected ? "none" : "line-through",
                }}>
                  {m}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Distance */}
      <div style={{ fontSize: 12, color: "var(--text3)", margin: "10px 0 14px" }}>
        <i className="ti ti-map-pin" style={{ marginRight: 4, fontSize: 11 }} />
        User is {req.distance_km} km away
      </div>

      {/* Action buttons */}
      {!done ? (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => respond("confirmed")}
            disabled={!!loading || selected.size === 0}
            style={{
              flex: 1, background: "rgba(74,222,128,0.1)",
              border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10,
              padding: "10px 0", color: "var(--green)",
              cursor: loading || selected.size === 0 ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 500, transition: "all 0.2s",
              opacity: selected.size === 0 ? 0.4 : 1,
            }}
          >
            <i className="ti ti-check" style={{ marginRight: 6 }} />
            {loading === "confirmed" ? "Confirming..." : `Confirm ${selected.size} Medicine${selected.size !== 1 ? "s" : ""}`}
          </button>
          <button
            onClick={() => respond("declined")}
            disabled={!!loading}
            style={{
              flex: 1, background: "rgba(248,113,113,0.07)",
              border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10,
              padding: "10px 0", color: "var(--red)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 500, transition: "all 0.2s",
            }}
          >
            <i className="ti ti-x" style={{ marginRight: 6 }} />
            {loading === "declined" ? "Declining..." : "Not Available"}
          </button>
        </div>
      ) : (
        <div style={{
          textAlign: "center", padding: "10px 0", fontSize: 13,
          color: done === "confirmed" ? "var(--green)" : "var(--red)",
        }}>
          <i className={`ti ti-${done === "confirmed" ? "check-circle" : "circle-x"}`} style={{ marginRight: 6 }} />
          {done === "confirmed" ? `Confirmed ${selected.size} medicines — user notified!` : "Declined"}
        </div>
      )}
    </div>
  )
}

