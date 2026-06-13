import React from "react"
export default function NotificationCard({ notif, isNew }) {
  const isConfirmed = notif.type === "SHOP_CONFIRMED"
  const availableMeds = (notif.available_medicines || []).filter(m => m.toLowerCase() !== "medicine list")

  const mapsUrl = notif.shop?.lat && notif.shop?.lng
    ? "https://www.google.com/maps?q=" + notif.shop.lat + "," + notif.shop.lng
    : notif.shop?.address
    ? "https://www.google.com/maps/search/" + encodeURIComponent(notif.shop.address)
    : null

  return (
    <div style={{
      background: isConfirmed ? "rgba(74,222,128,0.05)" : "rgba(255,255,255,0.03)",
      border: "1px solid " + (isConfirmed ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.07)"),
      borderRadius: 14, padding: "16px 18px",
      animation: "slideIn 0.4s ease",
      position: "relative",
    }}>
      {isNew && (
        <span style={{
          position: "absolute", top: 10, right: 12,
          background: "var(--red)", color: "#fff",
          fontSize: 9, fontWeight: 700, padding: "2px 6px",
          borderRadius: 6, letterSpacing: 0.5,
        }}>NEW</span>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: isConfirmed ? "rgba(74,222,128,0.15)" : "rgba(251,191,36,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, color: isConfirmed ? "var(--green)" : "var(--yellow)",
        }}>
          <i className="ti ti-building-store" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 600, fontSize: 15, marginBottom: 3 }}>
            {notif.shop?.name || "Pharmacy"}
          </div>
          <div style={{ fontSize: 13, color: isConfirmed ? "var(--green)" : "var(--yellow)", marginBottom: 8 }}>
            {isConfirmed ? "Medicine confirmed in stock" : "Checking availability..."}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {notif.shop?.distance_km != null && (
              <span style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                background: "var(--blue-dim)", color: "var(--blue)",
                border: "1px solid rgba(56,189,248,0.2)"
              }}>
                <i className="ti ti-map-pin" style={{ fontSize: 10, marginRight: 3 }} />
                {notif.shop.distance_km} km
              </span>
            )}
            {notif.shop?.phone && (
              <a href={"tel:" + notif.shop.phone} style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                background: "var(--green-dim)", color: "var(--green)",
                border: "1px solid rgba(74,222,128,0.2)",
                textDecoration: "none",
              }}>
                <i className="ti ti-phone" style={{ fontSize: 10, marginRight: 3 }} />
                {notif.shop.phone}
              </a>
            )}
            {notif.shop?.address && (
              <span style={{ fontSize: 11, color: "var(--text3)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <i className="ti ti-building" style={{ fontSize: 10 }} />
                {notif.shop.address}
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" title="Open in Google Maps" style={{
                    color: "#60a5fa", display: "inline-flex", alignItems: "center",
                    textDecoration: "none", marginLeft: 2,
                  }}>
                    <i className="ti ti-map-2" style={{ fontSize: 13 }} />
                  </a>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {isConfirmed && availableMeds.length > 0 && (
        <div style={{
          background: "rgba(74,222,128,0.05)",
          border: "1px solid rgba(74,222,128,0.15)",
          borderRadius: 10, padding: "10px 12px",
        }}>
          <div style={{ fontSize: 11, color: "var(--green)", marginBottom: 8, fontFamily: "Syne", fontWeight: 600 }}>
            AVAILABLE AT THIS SHOP
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {availableMeds.map((med, i) => (
              <span key={i} style={{
                background: "rgba(74,222,128,0.1)",
                border: "1px solid rgba(74,222,128,0.25)",
                color: "var(--green)", borderRadius: 8,
                padding: "3px 10px", fontSize: 12,
              }}>
                <i className="ti ti-check" style={{ fontSize: 10, marginRight: 4 }} />{med}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
