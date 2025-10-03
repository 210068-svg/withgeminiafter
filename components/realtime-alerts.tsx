"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"

interface Alert {
  id: string
  message: string
  alert_type: string
  created_at: string
  is_resolved: boolean
}

interface RealtimeAlertsProps {
  userId: string
}

export default function RealtimeAlerts({ userId }: RealtimeAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const client = getSupabaseClient()

    // 未解決のアラートを取得
    const fetchAlerts = async () => {
      const { data } = await client
        .from("alerts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })
        .limit(5)

      if (data) {
        setAlerts(data)
      }
    }

    fetchAlerts()

    // Realtimeでアラートを購読
    const channel = client
      .channel("alerts")
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
          setAlerts((prev) => [newAlert, ...prev].slice(0, 5))

          // トースト通知
          toast({
            title: "新しいアラート",
            description: newAlert.message,
            variant: newAlert.alert_type === "exit" ? "destructive" : "default",
          })

          // ブラウザ通知
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("介護見守りアプリ", {
              body: newAlert.message,
              icon: "/icon.png",
            })
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedAlert = payload.new as Alert
          setAlerts((prev) => prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a)))
        },
      )
      .subscribe()

    // 通知許可をリクエスト
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    return () => {
      channel.unsubscribe()
    }
  }, [userId, toast])

  const resolveAlert = async (alertId: string) => {
    const client = getSupabaseClient()
    await client.from("alerts").update({ is_resolved: true }).eq("id", alertId)

    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg shadow-lg ${
            alert.alert_type === "exit" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
          } border flex items-start justify-between animate-in slide-in-from-right`}
        >
          <div className="flex items-start space-x-3">
            <Bell className={`h-5 w-5 mt-0.5 ${alert.alert_type === "exit" ? "text-red-600" : "text-blue-600"}`} />
            <div>
              <p className={`font-medium ${alert.alert_type === "exit" ? "text-red-900" : "text-blue-900"}`}>
                {alert.message}
              </p>
              <p className={`text-xs mt-1 ${alert.alert_type === "exit" ? "text-red-600" : "text-blue-600"}`}>
                {new Date(alert.created_at).toLocaleTimeString("ja-JP")}
              </p>
            </div>
          </div>
          <button onClick={() => resolveAlert(alert.id)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
