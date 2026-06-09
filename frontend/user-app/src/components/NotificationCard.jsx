import React from 'react'

export default function NotificationCard({ notif, isNew }) {
  const isConfirmed = notif.type === 'SHOP_CONFIRMED'

  return (
    <div style={{
      background: isConfirmed ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isConfirmed ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, padding: '16px 18px',
      display: 'flex', alignItems: 'flex-start', gap: 14,
      animation: 'slideIn 0.4s ease',
      position: 'relative',
    }}>
      {isNew && (
        <span style={{
          position: 'absolute', top: 10, right: 12,
          background: 'var(--red)', color: '#fff',
          fontSize: 9, fontWeight: 700, padding: '2px 6px',
          borderRadius: 6, letterSpacing: 0.5,
        }}>NEW</span>
      )}

      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: isConfirmed ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color: isConfirmed ? 'var(--green)' : 'var(--yellow)',
      }}>
        <i className={`ti ti-building-store`} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 15, marginBottom: 3 }}>
          {notif.shop?.name || 'Pharmacy'}
        </div>
        <div style={{ fontSize: 13, color: isConfirmed ? 'var(--green)' : 'var(--yellow)', marginBottom: 8 }}>
          {isConfirmed ? '✓ Medicine confirmed in stock' : '⏳ Checking availability...'}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {notif.shop?.distance_km != null && (
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: 'var(--blue-dim)', color: 'var(--blue)',
              border: '1px solid rgba(56,189,248,0.2)'
            }}>
              <i className="ti ti-map-pin" style={{ fontSize: 10, marginRight: 3 }} />
              {notif.shop.distance_km} km
            </span>
          )}
          {notif.shop?.phone && (
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20,
              background: 'var(--green-dim)', color: 'var(--green)',
              border: '1px solid rgba(74,222,128,0.2)'
            }}>
              <i className="ti ti-phone" style={{ fontSize: 10, marginRight: 3 }} />
              {notif.shop.phone}
            </span>
          )}
          {notif.shop?.address && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              {notif.shop.address}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
