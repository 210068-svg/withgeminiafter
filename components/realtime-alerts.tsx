"use client"

import { useEffect, useState } from "react"
import { X, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"

interface Alert {
  id: string
  alert_type: string
  severity: string
  message: string
  location_lat: number | null
  location_lng: number | null
  created_at: string
}

interface RealtimeAlertsProps {
  userId: string
}

export default function RealtimeAlerts({ userId }: RealtimeAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()

    // 既存のアラートを取得
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error fetching alerts:", error)
        return
      }

      if (data && data.length > 0) {
        setAlerts(data)
        setIsVisible(true)
      }
    }

    fetchAlerts()

    // Realtimeサブスクリプション
    const channel = supabase
      .channel("alerts-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newAlert = payload.new as Alert
          setAlerts((prev) => [newAlert, ...prev.slice(0, 4)])
          setIsVisible(true)

          // ブラウザ通知を表示
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("新しいアラート", {
              body: newAlert.message,
              icon: "/icon.png",
              tag: newAlert.id,
            })
          }
        },
      )
      .subscribe()

    // 通知許可をリクエスト
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
    if (alerts.length <= 1) {
      setIsVisible(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200"
      case "high":
        return "bg-orange-50 border-orange-200"
      case "medium":
        return "bg-yellow-50 border-yellow-200"
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  if (!isVisible || alerts.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`${getSeverityColor(alert.severity)} border rounded-lg p-4 shadow-lg animate-in slide-in-from-right`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm capitalize">{alert.alert_type.replace("_", " ")}</p>
                  <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{new Date(alert.created_at).toLocaleTimeString("ja-JP")}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => dismissAlert(alert.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
