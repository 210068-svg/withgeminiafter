"use client"

import { useEffect, useState, useCallback } from "react"
import { MapPin, Play, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase-client"
import { recordLocation } from "./actions/location"

interface MapComponentProps {
  userId: string
  deviceId?: string
  showGeofence?: boolean
}

export default function MapComponent({ userId, deviceId, showGeofence = true }: MapComponentProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [devices, setDevices] = useState<any[]>([])
  const [geofences, setGeofences] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // デバイスとジオフェンスを取得
  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient()

      // デバイスを取得
      const { data: devicesData, error: devicesError } = await supabase
        .from("devices")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)

      if (devicesError) {
        console.error("Error fetching devices:", devicesError)
      } else {
        setDevices(devicesData || [])
        if (devicesData && devicesData.length > 0 && devicesData[0].last_location_lat) {
          setCurrentLocation({
            lat: devicesData[0].last_location_lat,
            lng: devicesData[0].last_location_lng,
          })
        }
      }

      // ジオフェンスを取得
      if (showGeofence) {
        const { data: geofencesData, error: geofencesError } = await supabase
          .from("geofences")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)

        if (geofencesError) {
          console.error("Error fetching geofences:", geofencesError)
        } else {
          setGeofences(geofencesData || [])
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [userId, showGeofence])

  // Realtimeサブスクリプション
  useEffect(() => {
    const supabase = getSupabaseClient()

    const channel = supabase
      .channel("devices-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "devices",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedDevice = payload.new as any
          if (updatedDevice.last_location_lat && updatedDevice.last_location_lng) {
            setCurrentLocation({
              lat: updatedDevice.last_location_lat,
              lng: updatedDevice.last_location_lng,
            })
            setDevices((prev) =>
              prev.map((device) => (device.id === updatedDevice.id ? { ...device, ...updatedDevice } : device)),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // 位置情報の追跡
  const startTracking = useCallback(() => {
    if (!devices || devices.length === 0) {
      setError("デバイスが登録されていません")
      return
    }

    const targetDeviceId = deviceId || devices[0].id

    setIsTracking(true)
    setError(null)

    // シミュレーション: 定期的に位置情報を更新
    const interval = setInterval(() => {
      // 東京駅付近をランダムに移動
      const baseLat = 35.6812
      const baseLng = 139.7671
      const randomLat = baseLat + (Math.random() - 0.5) * 0.01
      const randomLng = baseLng + (Math.random() - 0.5) * 0.01

      recordLocation(targetDeviceId, randomLat, randomLng, 10).then((result) => {
        if (!result.success) {
          console.error("Location recording error:", result.error)
          setError(result.error || "位置情報の記録に失敗しました")
          stopTracking()
        }
      })
    }, 10000) // 10秒ごと

    // クリーンアップ関数を返す
    return () => {
      clearInterval(interval)
      setIsTracking(false)
    }
  }, [devices, deviceId])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
  }, [])

  // 追跡の開始/停止
  useEffect(() => {
    let cleanup: (() => void) | undefined

    if (isTracking) {
      cleanup = startTracking()
    }

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [isTracking, startTracking])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>位置情報マップ</CardTitle>
          <CardDescription>リアルタイムで位置を追跡</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>位置情報マップ</CardTitle>
            <CardDescription>リアルタイムで位置を追跡</CardDescription>
          </div>
          <div className="flex gap-2">
            {!isTracking ? (
              <Button onClick={() => setIsTracking(true)} size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                追跡開始
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="destructive" size="sm" className="gap-2">
                <Square className="h-4 w-4" />
                追跡停止
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
        )}

        <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
          {/* 地図のプレースホルダー */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">地図表示エリア</p>
              {currentLocation && (
                <p className="text-xs text-gray-400 mt-2">
                  緯度: {currentLocation.lat.toFixed(6)}, 経度: {currentLocation.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {/* デバイスマーカー */}
          {devices.map((device) => (
            <div
              key={device.id}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                animation: isTracking ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
              }}
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-emerald-400 rounded-full opacity-75 animate-ping"></div>
                <MapPin className="relative h-8 w-8 text-emerald-600 fill-emerald-200" />
              </div>
            </div>
          ))}

          {/* ジオフェンス円 */}
          {showGeofence &&
            geofences.map((geofence, index) => (
              <div
                key={geofence.id}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: `${Math.min(geofence.radius / 5, 200)}px`,
                  height: `${Math.min(geofence.radius / 5, 200)}px`,
                }}
              >
                <div
                  className={`w-full h-full rounded-full border-2 ${
                    geofence.area_type === "safe"
                      ? "border-emerald-400 bg-emerald-100/30"
                      : "border-red-400 bg-red-100/30"
                  }`}
                ></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2">
                  <span className="text-xs font-medium bg-white px-2 py-1 rounded shadow">{geofence.name}</span>
                </div>
              </div>
            ))}

          {/* 追跡ステータス */}
          {isTracking && (
            <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              追跡中
            </div>
          )}
        </div>

        {/* デバイス情報 */}
        {devices.length > 0 && (
          <div className="mt-4 space-y-2">
            {devices.map((device) => (
              <div key={device.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{device.device_name}</p>
                    <p className="text-xs text-gray-500">
                      最終更新:{" "}
                      {device.last_location_time
                        ? new Date(device.last_location_time).toLocaleString("ja-JP")
                        : "未取得"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">バッテリー</span>
                      <span className="text-sm font-medium">{device.battery_level || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ジオフェンス情報 */}
        {showGeofence && geofences.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">設定エリア</h3>
            <div className="space-y-2">
              {geofences.map((geofence) => (
                <div key={geofence.id} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{geofence.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        geofence.area_type === "safe" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {geofence.area_type === "safe" ? "安全エリア" : "危険エリア"}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1">半径: {geofence.radius}m</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
