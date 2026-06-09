import { useEffect, useRef, useCallback } from 'react'

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('http', 'ws')

export function useWebSocket(onMessage) {
  const ws = useRef(null)
  const token = localStorage.getItem('mf_shop_token')

  const connect = useCallback(() => {
    if (!token) return
    ws.current = new WebSocket(`${WS_BASE}/ws/shop?token=${token}`)
    ws.current.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)) } catch {}
    }
    ws.current.onclose = () => setTimeout(connect, 3000)
    ws.current.onerror = () => ws.current?.close()
  }, [token, onMessage])

  useEffect(() => {
    connect()
    return () => ws.current?.close()
  }, [connect])
}
