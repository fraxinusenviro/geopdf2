/**
 * GPS positioning hook using the Web Geolocation API.
 * Provides live position, heading, and screen wake lock during recording.
 */

import { useEffect, useRef, useCallback } from 'react'
import type { GpsPosition } from '@/types'
import { useUiStore } from '@/store/uiStore'
import { useTrackStore } from '@/store/trackStore'
import { useMapStore } from '@/store/mapStore'

let wakeLock: WakeLockSentinel | null = null

async function acquireWakeLock(): Promise<void> {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen')
    } catch {
      // Wake lock not critical
    }
  }
}

async function releaseWakeLock(): Promise<void> {
  if (wakeLock) {
    await wakeLock.release()
    wakeLock = null
  }
}

interface UseGpsReturn {
  position: GpsPosition | null
  startGps: () => void
  stopGps: () => void
}

let gpsPosition: GpsPosition | null = null
const positionListeners = new Set<(pos: GpsPosition | null) => void>()

// Module-level GPS state (shared across hook instances)
let watchId: number | null = null
let refCount = 0

function notifyListeners(pos: GpsPosition | null): void {
  gpsPosition = pos
  positionListeners.forEach((fn) => fn(pos))
}

export function useGps(): UseGpsReturn {
  const setGpsStatus = useUiStore((s) => s.setGpsStatus)
  const addTrackPoint = useTrackStore((s) => s.addTrackPoint)
  const isRecording = useTrackStore((s) => s.isRecording)
  const recordingInterval = useTrackStore((s) => s.recordingInterval)
  const followGps = useMapStore((s) => s.followGps)
  const setViewTransform = useMapStore((s) => s.setViewTransform)

  const posRef = useRef<GpsPosition | null>(gpsPosition)
  const forceUpdate = useCallback(() => {
    // We need a re-render mechanism; use a simple state approach
  }, [])

  const onPosition = useCallback(
    (pos: GpsPosition | null) => {
      posRef.current = pos
    },
    [],
  )

  useEffect(() => {
    positionListeners.add(onPosition)
    return () => {
      positionListeners.delete(onPosition)
    }
  }, [onPosition])

  // Last track point timestamp for interval filtering
  const lastTrackTs = useRef<number>(0)

  useEffect(() => {
    const unsubscribeGps = subscribeToGps((pos) => {
      if (!pos) return
      posRef.current = pos

      // Track recording with interval filter
      if (isRecording) {
        const now = pos.timestamp
        if (now - lastTrackTs.current >= recordingInterval * 1000) {
          addTrackPoint(pos)
          lastTrackTs.current = now
        }
      }
    })

    return unsubscribeGps
  }, [isRecording, recordingInterval, addTrackPoint])

  const startGps = useCallback((): void => {
    if (!navigator.geolocation) {
      setGpsStatus('error', 'Geolocation not supported by this browser')
      return
    }

    setGpsStatus('requesting')
    refCount++

    if (watchId !== null) return

    acquireWakeLock()

    watchId = navigator.geolocation.watchPosition(
      (nativePos) => {
        const pos: GpsPosition = {
          lat: nativePos.coords.latitude,
          lon: nativePos.coords.longitude,
          accuracy: nativePos.coords.accuracy,
          altitude: nativePos.coords.altitude ?? undefined,
          altitudeAccuracy: nativePos.coords.altitudeAccuracy ?? undefined,
          speed: nativePos.coords.speed ?? undefined,
          heading: nativePos.coords.heading ?? undefined,
          timestamp: nativePos.timestamp,
        }
        notifyListeners(pos)
        setGpsStatus('active')
      },
      (err) => {
        setGpsStatus('error', err.message)
        notifyListeners(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [setGpsStatus])

  const stopGps = useCallback((): void => {
    refCount = Math.max(0, refCount - 1)
    if (refCount === 0 && watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
      notifyListeners(null)
      setGpsStatus('off')
      releaseWakeLock()
    }
  }, [setGpsStatus])

  return { position: posRef.current, startGps, stopGps }
}

function subscribeToGps(cb: (pos: GpsPosition | null) => void): () => void {
  positionListeners.add(cb)
  // Immediately call with current position
  if (gpsPosition) cb(gpsPosition)
  return () => positionListeners.delete(cb)
}
