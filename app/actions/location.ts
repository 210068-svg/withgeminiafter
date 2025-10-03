"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

interface LocationData {
  deviceId: string
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  speed?: number
  heading?: number
}

// 位置情報を記録
export async function recordLocation(data: LocationData) {
  try {
    const { deviceId, latitude, longitude, accuracy, altitude, speed, heading } = data

    if (!deviceId || !latitude || !longitude) {
      return {
        success: false,
        error: "必須パラメータが不足しています",
      }
    }

    // デバイスが存在するか確認
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id, user_id")
      .eq("id", deviceId)
      .single()

    if (deviceError || !device) {
      return {
        success: false,
        error: "デバイスが見つかりません",
      }
    }

    // 位置履歴を記録
    const { data: locationHistory, error: historyError } = await supabase
      .from("location_history")
      .insert({
        device_id: deviceId,
        latitude,
        longitude,
        accuracy: accuracy || null,
        altitude: altitude || null,
        speed: speed || null,
        heading: heading || null,
      })
      .select()
      .single()

    if (historyError) {
      console.error("Location history insert error:", historyError)
      return {
        success: false,
        error: "位置情報の記録に失敗しました",
      }
    }

    // デバイスの最終位置を更新
    const { error: updateError } = await supabase
      .from("devices")
      .update({
        last_latitude: latitude,
        last_longitude: longitude,
        last_seen: new Date().toISOString(),
      })
      .eq("id", deviceId)

    if (updateError) {
      console.error("Device update error:", updateError)
    }

    // ジオフェンスチェック
    await checkGeofenceViolation(device.user_id, deviceId, latitude, longitude)

    revalidatePath("/")
    return {
      success: true,
      data: locationHistory,
    }
  } catch (error) {
    console.error("Record location error:", error)
    return {
      success: false,
      error: "位置情報の記録中にエラーが発生しました",
    }
  }
}

// ジオフェンス違反をチェック
async function checkGeofenceViolation(userId: string, deviceId: string, latitude: number, longitude: number) {
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
      const distance = calculateDistance(latitude, longitude, geofence.center_latitude, geofence.center_longitude)

      const isInside = distance <= geofence.radius

      // エリア外にいる場合、アラートを作成
      if (!isInside && geofence.alert_on_exit) {
        await createAlert(userId, deviceId, geofence.id, "exit", latitude, longitude)
      }

      // エリア内に入った場合、アラートを作成
      if (isInside && geofence.alert_on_enter) {
        await createAlert(userId, deviceId, geofence.id, "enter", latitude, longitude)
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
  geofenceId: string,
  alertType: "enter" | "exit",
  latitude: number,
  longitude: number,
) {
  try {
    // 最近の同じアラートがないか確認（5分以内）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: recentAlerts } = await supabase
      .from("alerts")
      .select("id")
      .eq("device_id", deviceId)
      .eq("geofence_id", geofenceId)
      .eq("alert_type", alertType)
      .gte("created_at", fiveMinutesAgo)

    if (recentAlerts && recentAlerts.length > 0) {
      // 最近同じアラートがあるのでスキップ
      return
    }

    const message = alertType === "exit" ? "利用者が設定エリアから出ました" : "利用者が設定エリアに入りました"

    const { error } = await supabase.from("alerts").insert({
      user_id: userId,
      device_id: deviceId,
      geofence_id: geofenceId,
      alert_type: alertType,
      message,
      latitude,
      longitude,
      is_resolved: false,
    })

    if (error) {
      console.error("Alert creation error:", error)
    }
  } catch (error) {
    console.error("Create alert error:", error)
  }
}

// デバイスの最新位置を取得
export async function getLatestLocation(deviceId: string) {
  try {
    const { data, error } = await supabase
      .from("location_history")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return { success: false, error: "位置情報の取得に失敗しました", data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get latest location error:", error)
    return { success: false, error: "位置情報の取得中にエラーが発生しました", data: null }
  }
}

// 位置履歴を取得
export async function getLocationHistory(deviceId: string, limit = 100) {
  try {
    const { data, error } = await supabase
      .from("location_history")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: "位置履歴の取得に失敗しました", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get location history error:", error)
    return { success: false, error: "位置履歴の取得中にエラーが発生しました", data: [] }
  }
}
