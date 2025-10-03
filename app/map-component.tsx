"use client"

import { useEffect, useState } from "react"
import { MapPin, Navigation, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { recordLocation, startAutoTracking, stopAutoTracking } from "@/app/actions/location"
import { getDevices } from "@/app/actions/devices"
import { subscribeToLocationUpdates } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"

interface Device {
  id: string
  device_name: string
  last_location_lat: number | null
  last_location_lng: number | null
  last_location_time: string | null
  is_active: boolean
}

export default function MapComponent({ userId }: { userId: string }) {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // デバイス一覧を取得
  useEffect(() => {
    const loadDevices = async () => {
      const result = await getDevices(userId)
      if (result.success && result.data) {
        setDevices(result.data)
        if (result.data.length > 0 && !selectedDevice) {
          setSelectedDevice(result.data[0].id)
        }
      }
    }
    loadDevices()
  }, [userId, selectedDevice])

  // リアルタイム位置更新を購読
  useEffect(() => {
    if (!selectedDevice) return

    const channel = subscribeToLocationUpdates(selectedDevice, (payload) => {
      if (payload.eventType === "INSERT") {
        const newLocation = payload.new
        setDevices((prev) =>
          prev.map((d) =>
            d.id === selectedDevice
              ? {
                  ...d,
                  last_location_lat: newLocation.latitude,
                  last_location_lng: newLocation.longitude,
                  last_location_time: newLocation.timestamp,
                }
              : d,
          ),
        )

        toast({
          title: "位置情報を更新しました",
          description: `緯度: ${newLocation.latitude.toFixed(6)}, 経度: ${newLocation.longitude.toFixed(6)}`,
        })
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [selectedDevice, toast])

  // 自動追跡
  const handleStartTracking = async () => {
    if (!selectedDevice) return

    const result = await startAutoTracking(selectedDevice)
    if (result.success) {
      setIsTracking(true)

      // 10秒ごとに位置情報を記録（シミュレーション）
      const interval = setInterval(async () => {
        const selectedDeviceData = devices.find((d) => d.id === selectedDevice)
        if (!selectedDeviceData) return

        // ランダムな位置変化をシミュレート
        const baseLat = selectedDeviceData.last_location_lat || 35.6895
        const baseLng = selectedDeviceData.last_location_lng || 139.6917
        const newLat = baseLat + (Math.random() - 0.5) * 0.001
        const newLng = baseLng + (Math.random() - 0.5) * 0.001

        await recordLocation(selectedDevice, newLat, newLng, Math.random() * 10 + 5)
      }, 10000)

      setTrackingInterval(interval)

      toast({
        title: "追跡を開始しました",
        description: "10秒ごとに位置情報を記録します",
      })
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleStopTracking = async () => {
    if (!selectedDevice) return

    if (trackingInterval) {
      clearInterval(trackingInterval)
      setTrackingInterval(null)
    }

    const result = await stopAutoTracking(selectedDevice)
    if (result.success) {
      setIsTracking(false)
      toast({
        title: "追跡を停止しました",
      })
    }
  }

  // 現在地を手動で記録
  const handleRecordCurrentLocation = async () => {
    if (!selectedDevice) return

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          const result = await recordLocation(selectedDevice, latitude, longitude, accuracy)

          if (result.success) {
            toast({
              title: "位置情報を記録しました",
              description: `緯度: ${latitude.toFixed(6)}, 経度: ${longitude.toFixed(6)}`,
            })
          } else {
            toast({
              title: "エラー",
              description: result.error,
              variant: "destructive",
            })
          }
        },
        (error) => {
          toast({
            title: "位置情報の取得に失敗しました",
            description: error.message,
            variant: "destructive",
          })
        },
      )
    } else {
      toast({
        title: "エラー",
        description: "このブラウザは位置情報をサポートしていません",
        variant: "destructive",
      })
    }
  }

  const selectedDeviceData = devices.find((d) => d.id === selectedDevice)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          位置情報マップ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* デバイス選択 */}
        <div>
          <label className="text-sm font-medium mb-2 block">デバイス選択</label>
          <select
            value={selectedDevice || ""}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.device_name} {device.is_active ? "🟢" : "⚪"}
              </option>
            ))}
          </select>
        </div>

        {/* 地図表示エリア */}
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
          {selectedDeviceData?.last_location_lat && selectedDeviceData?.last_location_lng ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-red-500 mx-auto mb-2 animate-bounce" />
                <p className="font-semibold">{selectedDeviceData.device_name}</p>
                <p className="text-sm text-gray-600">緯度: {selectedDeviceData.last_location_lat.toFixed(6)}</p>
                <p className="text-sm text-gray-600">経度: {selectedDeviceData.last_location_lng.toFixed(6)}</p>
                {selectedDeviceData.last_location_time && (
                  <p className="text-xs text-gray-500 mt-2">
                    更新: {new Date(selectedDeviceData.last_location_time).toLocaleString("ja-JP")}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>位置情報がありません</p>
            </div>
          )}
        </div>

        {/* コントロールボタン */}
        <div className="flex gap-2">
          <Button onClick={handleRecordCurrentLocation} className="flex-1 bg-transparent" variant="outline">
            <Navigation className="h-4 w-4 mr-2" />
            現在地を記録
          </Button>

          {!isTracking ? (
            <Button onClick={handleStartTracking} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              追跡開始
            </Button>
          ) : (
            <Button onClick={handleStopTracking} className="flex-1" variant="destructive">
              <Square className="h-4 w-4 mr-2" />
              追跡停止
            </Button>
          )}
        </div>

        {isTracking && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
            <p className="flex items-center gap-2">
              <span className="animate-pulse">🔴</span>
              追跡中 - 10秒ごとに位置情報を自動記録しています
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
