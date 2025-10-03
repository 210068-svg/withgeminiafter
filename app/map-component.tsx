"use client"

import { useEffect, useState, useRef } from "react"
import { MapPin, Navigation, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase-client"
import { recordLocation } from "./actions/location"

interface MapComponentProps {
  showGeofence?: boolean
  deviceId?: string
  userId?: string
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: number
}

export default function MapComponent({ showGeofence = false, deviceId, userId }: MapComponentProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Realtimeで位置情報を購読
  useEffect(() => {
    if (!deviceId) return

    const client = getSupabaseClient()

    const channel = client
      .channel(`location:${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "location_history",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const newLocation = payload.new as any
          setCurrentLocation({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            accuracy: newLocation.accuracy,
            timestamp: new Date(newLocation.created_at).getTime(),
          })
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [deviceId])

  // 位置追跡を開始
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("このブラウザは位置情報をサポートしていません")
      return
    }

    if (!deviceId) {
      setError("デバイスIDが設定されていません")
      return
    }

    setIsTracking(true)
    setError(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }

        setCurrentLocation(locationData)

        // Supabaseに位置情報を記録
        await recordLocation({
          deviceId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        })
      },
      (error) => {
        console.error("位置情報の取得エラー:", error)
        setError("位置情報の取得に失敗しました")
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  // 位置追跡を停止
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }

  // 現在位置を一度だけ取得
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("このブラウザは位置情報をサポートしていません")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
        setError(null)
      },
      (error) => {
        console.error("位置情報の取得エラー:", error)
        setError("位置情報の取得に失敗しました")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  useEffect(() => {
    getCurrentLocation()

    return () => {
      stopTracking()
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-emerald-600" />
          <span className="font-medium">現在位置</span>
          {isTracking && <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">追跡中</span>}
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={getCurrentLocation}>
            <Navigation className="h-4 w-4 mr-1" />
            更新
          </Button>
          {deviceId && (
            <Button
              size="sm"
              variant={isTracking ? "destructive" : "default"}
              onClick={isTracking ? stopTracking : startTracking}
            >
              {isTracking ? (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  停止
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  追跡開始
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div
        ref={mapRef}
        className="w-full h-[400px] bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg flex items-center justify-center relative overflow-hidden"
      >
        {currentLocation ? (
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <MapPin className="h-12 w-12 text-emerald-600 mx-auto" />
              </div>
              <MapPin className="h-12 w-12 text-emerald-600 relative z-10" />
            </div>
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
              <p className="text-sm text-gray-600 mb-2">緯度・経度</p>
              <p className="font-mono text-sm">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
              {currentLocation.accuracy && (
                <p className="text-xs text-gray-500 mt-2">精度: ±{Math.round(currentLocation.accuracy)}m</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(currentLocation.timestamp).toLocaleTimeString("ja-JP")}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>位置情報を取得中...</p>
          </div>
        )}

        {showGeofence && currentLocation && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-emerald-300 rounded-full opacity-30 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-emerald-400 rounded-full opacity-40"></div>
          </div>
        )}
      </div>

      {deviceId && isTracking && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p className="font-medium mb-1">リアルタイム追跡中</p>
          <p className="text-xs">位置情報は自動的にSupabaseに保存されています</p>
        </div>
      )}
    </div>
  )
}
