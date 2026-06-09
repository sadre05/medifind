import { useState, useEffect } from 'react'
import { locationAPI } from '../services/api'

export function useGPS() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function requestLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setLocation({ latitude, longitude })
        setLoading(false)
        try {
          await locationAPI.updateUserLocation(latitude, longitude)
        } catch {}
      },
      (err) => {
        setError('Location access denied. Please enable GPS.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return { location, error, loading, requestLocation }
}
