import { useEffect, useRef, useCallback } from 'react'

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace('http', 'ws')

export function useWebSocket(onMessage) {
  const ws = useRef(null)
  const token = localStorage.getItem('mf_token')

  const connect = useCallback(() => {
    if (!token) return
    ws.current = new WebSocket(`${WS_BASE}/ws/user?token=${token}`)

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onMessage(data)
      } catch {}
    }

    ws.current.onclose = () => {
      // Reconnect after 3 seconds
      setTimeout(connect, 3000)
    }

    ws.current.onerror = () => {
      ws.current?.close()
    }
  }, [token, onMessage])

  useEffect(() => {
    connect()
    return () => ws.current?.close()
  }, [connect])
}
