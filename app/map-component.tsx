"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Layers } from "lucide-react"
import Script from "next/script"

interface MapComponentProps {
  initialLatitude?: number
  initialLongitude?: number
  initialZoom?: number
  showGeofence?: boolean
}

export default function MapComponent({
  initialLatitude = 35.6895, // 東京都の緯度をデフォルト値として設定
  initialLongitude = 139.6917, // 東京都の経度をデフォルト値として設定
  initialZoom = 15,
  showGeofence = true,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [positionMarker, setPositionMarker] = useState<any>(null)
  const [mapLayer, setMapLayer] = useState<"osm" | "satellite">("osm")
  const [geofenceVisible, setGeofenceVisible] = useState(showGeofence)
  const [geofenceCircle, setGeofenceCircle] = useState<any>(null)

  // Leaflet.jsのロード完了時の処理
  const handleLeafletLoaded = () => {
    setLeafletLoaded(true)
  }

  // 地図の初期化
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || typeof window === "undefined") return

    // Leafletが利用可能かチェック
    if (typeof (window as any).L === "undefined") return

    const L = (window as any).L

    // 地図の初期化
    const newMap = L.map(mapRef.current).setView([initialLatitude, initialLongitude], initialZoom)

    // タイルレイヤーの設定
    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
    )

    // 初期レイヤーを追加
    if (mapLayer === "osm") {
      osmLayer.addTo(newMap)
    } else {
      satelliteLayer.addTo(newMap)
    }

    setMap(newMap)

    // 現在位置の取得
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentPosition(pos)
          newMap.setView([pos.lat, pos.lng], initialZoom)
        },
        () => {
          console.log("位置情報の取得に失敗しました")
          // デフォルト位置を設定
          setCurrentPosition({ lat: initialLatitude, lng: initialLongitude })
        },
      )
    } else {
      // Geolocationが利用できない場合はデフォルト位置を設定
      setCurrentPosition({ lat: initialLatitude, lng: initialLongitude })
    }

    return () => {
      if (newMap) {
        newMap.remove()
      }
    }
  }, [leafletLoaded, initialLatitude, initialLongitude, initialZoom])

  // 現在位置マーカーの設定
  useEffect(() => {
    if (!map || !currentPosition || typeof window === "undefined") return

    const L = (window as any).L

    if (positionMarker) {
      positionMarker.setLatLng([currentPosition.lat, currentPosition.lng])
    } else {
      // カスタムアイコンの作成
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 20px; 
          height: 20px; 
          background-color: #10b981; 
          border: 3px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const marker = L.marker([currentPosition.lat, currentPosition.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup("現在位置: 利用者")

      setPositionMarker(marker)
    }

    // ジオフェンスの表示
    if (geofenceVisible) {
      if (geofenceCircle) {
        geofenceCircle.setLatLng([currentPosition.lat, currentPosition.lng])
      } else {
        const circle = L.circle([currentPosition.lat, currentPosition.lng], {
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.2,
          radius: 200, // 半径200m
        }).addTo(map)

        setGeofenceCircle(circle)
      }
    } else if (geofenceCircle) {
      map.removeLayer(geofenceCircle)
      setGeofenceCircle(null)
    }
  }, [map, currentPosition, positionMarker, geofenceVisible, geofenceCircle])

  // 地図レイヤーの切り替え
  const toggleMapLayer = () => {
    if (!map || typeof window === "undefined") return

    const L = (window as any).L

    // 現在のレイヤーを削除
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })

    const newLayer = mapLayer === "osm" ? "satellite" : "osm"
    setMapLayer(newLayer)

    // 新しいレイヤーを追加
    if (newLayer === "osm") {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
    } else {
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      }).addTo(map)
    }
  }

  // ジオフェンス表示の切り替え
  const toggleGeofenceDisplay = () => {
    setGeofenceVisible(!geofenceVisible)
  }

  // 位置情報の定期更新
  useEffect(() => {
    if (!map) return

    const watchId = navigator.geolocation?.watchPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentPosition(pos)
      },
      () => {
        console.log("位置情報の監視に失敗しました")
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    )

    return () => {
      if (watchId) {
        navigator.geolocation?.clearWatch(watchId)
      }
    }
  }, [map])

  return (
    <>
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onLoad={handleLeafletLoaded} />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="bg-gray-200 rounded-lg overflow-hidden h-[400px] relative">
        <div ref={mapRef} className="absolute inset-0 z-0"></div>

        <div className="absolute top-4 right-4 bg-white p-2 rounded-md shadow-md z-10">
          <Button variant="outline" size="sm" className="mr-2 bg-transparent" onClick={toggleGeofenceDisplay}>
            <MapPin className="h-4 w-4 mr-1" />
            {geofenceVisible ? "ジオフェンス非表示" : "ジオフェンス表示"}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleMapLayer}>
            <Layers className="h-4 w-4 mr-1" />
            {mapLayer === "osm" ? "衛星表示" : "地図表示"}
          </Button>
        </div>

        {currentPosition && (
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-md shadow-md z-10">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
              <div>
                <p className="font-medium">利用者</p>
                <p className="text-xs text-gray-500">
                  緯度: {currentPosition.lat.toFixed(6)}, 経度: {currentPosition.lng.toFixed(6)}
                </p>
                <p className="text-xs text-gray-400 mt-1">地図データ: OpenStreetMap</p>
              </div>
            </div>
          </div>
        )}

        {!leafletLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">地図を読み込み中...</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
