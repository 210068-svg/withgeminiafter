"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { subscribeToAlerts } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"

interface Alert {
  id: string
  alert_type: string
  severity: string
  message: string
  location_lat: number | null
  location_lng: number | null
  created_at: string
}

export function RealtimeAlerts({ userId }: { userId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) return

    const channel = subscribeToAlerts(userId, (payload) => {
      if (payload.eventType === "INSERT") {
        const newAlert = payload.new as Alert
        setAlerts((prev) => [newAlert, ...prev].slice(0, 10))
        setIsVisible(true)

        // トースト通知
        toast({
          title: getSeverityLabel(newAlert.severity),
          description: newAlert.message,
          variant: newAlert.severity === "critical" ? "destructive" : "default",
        })

        // ブラウザ通知
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(getSeverityLabel(newAlert.severity), {
            body: newAlert.message,
            icon: "/icon.png",
            badge: "/badge.png",
          })
        }
      }
    })

    // 通知権限をリクエスト
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    return () => {
      channel.unsubscribe()
    }
  }, [userId, toast])

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🚨 緊急警告"
      case "high":
        return "⚠️ 重要な通知"
      case "medium":
        return "📢 お知らせ"
      case "low":
        return "ℹ️ 情報"
      default:
        return "通知"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-900"
      case "high":
        return "bg-orange-50 border-orange-200 text-orange-900"
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-900"
      case "low":
        return "bg-blue-50 border-blue-200 text-blue-900"
      default:
        return "bg-gray-50 border-gray-200 text-gray-900"
    }
  }

  if (alerts.length === 0 || !isVisible) {
    return null
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-80 max-h-[80vh] overflow-y-auto space-y-2">
      <div className="flex items-center justify-between mb-2 bg-white p-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <span className="font-semibold">リアルタイム通知</span>
        </div>
        <button onClick={() => setIsVisible(false)} className="hover:bg-gray-100 p-1 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      {alerts.map((alert) => (
        <div key={alert.id} className={`p-4 rounded-lg border-2 shadow-lg ${getSeverityColor(alert.severity)}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-semibold mb-1">{getSeverityLabel(alert.severity)}</p>
              <p className="text-sm">{alert.message}</p>
              <p className="text-xs mt-2 opacity-70">{new Date(alert.created_at).toLocaleString("ja-JP")}</p>
            </div>
            <button
              onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
              className="hover:bg-black/10 p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
