"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// 位置情報を記録
export async function recordLocation(deviceId: string, latitude: number, longitude: number, accuracy = 10) {
  try {
    if (!deviceId || !latitude || !longitude) {
      return { success: false, error: "必須パラメータが不足しています" }
    }

    // デバイスが存在するか確認
    const { data: device, error: deviceError } = await supabase.from("devices").select("*").eq("id", deviceId).single()

    if (deviceError || !device) {
      console.error("Device not found:", deviceError)
      return { success: false, error: "デバイスが見つかりません" }
    }

    const timestamp = new Date().toISOString()

    // 位置履歴に記録
    const { error: historyError } = await supabase.from("location_history").insert({
      device_id: deviceId,
      latitude,
      longitude,
      accuracy,
      timestamp,
    })

    if (historyError) {
      console.error("Location history error:", historyError)
      return { success: false, error: "位置履歴の記録に失敗しました" }
    }

    // デバイスの最新位置を更新
    const { error: updateError } = await supabase
      .from("devices")
      .update({
        last_location_lat: latitude,
        last_location_lng: longitude,
        last_location_time: timestamp,
      })
      .eq("id", deviceId)

    if (updateError) {
      console.error("Device update error:", updateError)
    }

    // ジオフェンスチェック
    await checkGeofence(device.user_id, deviceId, latitude, longitude)

    revalidatePath("/")
    return {
      success: true,
      message: "位置情報を記録しました",
    }
  } catch (error) {
    console.error("Record location error:", error)
    return { success: false, error: "位置情報の記録に失敗しました" }
  }
}

// ジオフェンスをチェック
async function checkGeofence(userId: string, deviceId: string, latitude: number, longitude: number) {
  try {
    // アクティブなジオフェンスを取得
    const { data: geofences, error: geofenceError } = await supabase
      .from("geofences")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (geofenceError || !geofences || geofences.length === 0) {
      return
    }

    for (const geofence of geofences) {
      const distance = calculateDistance(latitude, longitude, geofence.center_lat, geofence.center_lng)

      // 安全エリアの場合: エリア外にいる場合にアラート
      if (geofence.area_type === "safe" && distance > geofence.radius) {
        await createAlert(
          userId,
          deviceId,
          "geofence_exit",
          "high",
          `${geofence.name}から離れました（約${Math.round(distance)}m）`,
          latitude,
          longitude,
        )
      }
      // 危険エリアの場合: エリア内に入った場合にアラート
      else if (geofence.area_type === "danger" && distance <= geofence.radius) {
        await createAlert(
          userId,
          deviceId,
          "geofence_enter",
          "critical",
          `危険エリア「${geofence.name}」に入りました`,
          latitude,
          longitude,
        )
      }
    }
  } catch (error) {
    console.error("Geofence check error:", error)
  }
}

// 2点間の距離を計算（メートル）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // 地球の半径（メートル）
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// アラートを作成
async function createAlert(
  userId: string,
  deviceId: string,
  alertType: string,
  severity: string,
  message: string,
  latitude?: number,
  longitude?: number,
) {
  try {
    // 最近の同じアラートがないか確認（5分以内）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: recentAlerts } = await supabase
      .from("alerts")
      .select("id")
      .eq("device_id", deviceId)
      .eq("alert_type", alertType)
      .gte("created_at", fiveMinutesAgo)

    if (recentAlerts && recentAlerts.length > 0) {
      // 最近同じアラートがあるのでスキップ
      return
    }

    const { error } = await supabase.from("alerts").insert({
      user_id: userId,
      device_id: deviceId,
      alert_type: alertType,
      severity,
      message,
      location_lat: latitude || null,
      location_lng: longitude || null,
      is_resolved: false,
    })

    if (error) {
      console.error("Alert creation error:", error)
    }
  } catch (error) {
    console.error("Create alert error:", error)
  }
}

// 位置履歴を取得
export async function getLocationHistory(deviceId: string, limit = 100) {
  try {
    if (!deviceId) {
      return { success: false, error: "デバイスIDが必要です", data: [] }
    }

    const { data, error } = await supabase
      .from("location_history")
      .select("*")
      .eq("device_id", deviceId)
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Get location history error:", error)
      return { success: false, error: "位置履歴の取得に失敗しました", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get location history error:", error)
    return { success: false, error: "位置履歴の取得に失敗しました", data: [] }
  }
}
