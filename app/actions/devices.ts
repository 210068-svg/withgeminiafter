"use server"

import { revalidatePath } from "next/cache"
import { supabase } from "@/lib/supabase"

// デバイスの登録
export async function registerDevice(formData: FormData) {
  try {
    const deviceData = {
      deviceName: formData.get("deviceName") as string,
      deviceType: formData.get("deviceType") as string,
      userId: formData.get("userId") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      emergencyContact: formData.get("emergencyContact") as string,
      notes: formData.get("notes") as string,
    }

    // バリデーション
    if (!deviceData.deviceName || !deviceData.deviceType || !deviceData.userId) {
      return { success: false, error: "デバイス名、種類、利用者は必須項目です" }
    }

    if (deviceData.phoneNumber) {
      const phoneRegex = /^[\d\-+$$$$\s]+$/
      if (!phoneRegex.test(deviceData.phoneNumber)) {
        return { success: false, error: "有効な電話番号を入力してください" }
      }
    }

    // ユーザーが存在しない場合は作成
    const { data: existingUser } = await supabase.from("users").select("id").eq("id", deviceData.userId).single()

    if (!existingUser) {
      const { error: userError } = await supabase.from("users").insert({ id: deviceData.userId })

      if (userError) {
        console.error("User creation error:", userError)
        return { success: false, error: "ユーザーの作成に失敗しました" }
      }
    }

    // ペアリングコード生成
    const pairingCode = Math.random().toString(36).substr(2, 8).toUpperCase()

    // Supabaseにデータを挿入
    const { data, error } = await supabase
      .from("devices")
      .insert({
        user_id: deviceData.userId,
        device_name: deviceData.deviceName,
        device_type: deviceData.deviceType,
        phone_number: deviceData.phoneNumber || null,
        emergency_contact: deviceData.emergencyContact || null,
        notes: deviceData.notes || null,
        pairing_code: pairingCode,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return { success: false, error: "デバイス登録に失敗しました" }
    }

    revalidatePath("/devices")
    revalidatePath("/setup")
    return {
      success: true,
      message: "デバイスを登録しました",
      deviceId: data.id,
      pairingCode: pairingCode,
    }
  } catch (error) {
    console.error("Device registration error:", error)
    return { success: false, error: "デバイス登録に失敗しました" }
  }
}

// デバイス一覧の取得
export async function getDevices(userId: string) {
  try {
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return { success: false, error: "デバイス一覧の取得に失敗しました", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get devices error:", error)
    return { success: false, error: "デバイス一覧の取得に失敗しました", data: [] }
  }
}

// デバイス情報の更新
export async function updateDevice(formData: FormData) {
  try {
    const deviceId = formData.get("deviceId") as string
    const deviceData = {
      deviceName: formData.get("deviceName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      emergencyContact: formData.get("emergencyContact") as string,
      notes: formData.get("notes") as string,
      isActive: formData.get("isActive") === "on",
    }

    if (!deviceId) {
      return { success: false, error: "デバイスIDが見つかりません" }
    }

    if (!deviceData.deviceName) {
      return { success: false, error: "デバイス名は必須項目です" }
    }

    const { error } = await supabase
      .from("devices")
      .update({
        device_name: deviceData.deviceName,
        phone_number: deviceData.phoneNumber || null,
        emergency_contact: deviceData.emergencyContact || null,
        notes: deviceData.notes || null,
        is_active: deviceData.isActive,
      })
      .eq("id", deviceId)

    if (error) {
      console.error("Supabase error:", error)
      return { success: false, error: "更新に失敗しました" }
    }

    revalidatePath("/devices")
    return { success: true, message: "デバイス情報を更新しました" }
  } catch (error) {
    console.error("Device update error:", error)
    return { success: false, error: "更新に失敗しました" }
  }
}

// デバイスの削除
export async function deleteDevice(deviceId: string) {
  try {
    if (!deviceId) {
      return { success: false, error: "デバイスIDが見つかりません" }
    }

    const { error } = await supabase.from("devices").delete().eq("id", deviceId)

    if (error) {
      console.error("Supabase error:", error)
      return { success: false, error: "削除に失敗しました" }
    }

    revalidatePath("/devices")
    return { success: true, message: "デバイスを削除しました" }
  } catch (error) {
    console.error("Device delete error:", error)
    return { success: false, error: "削除に失敗しました" }
  }
}

// デバイスの位置情報取得を開始
export async function startLocationTracking(deviceId: string) {
  try {
    if (!deviceId) {
      return { success: false, error: "デバイスIDが見つかりません" }
    }

    const { error } = await supabase.from("devices").update({ is_active: true }).eq("id", deviceId)

    if (error) {
      console.error("Supabase error:", error)
      return { success: false, error: "位置情報取得の開始に失敗しました" }
    }

    revalidatePath("/devices")
    return { success: true, message: "位置情報の取得を開始しました" }
  } catch (error) {
    console.error("Start tracking error:", error)
    return { success: false, error: "位置情報取得の開始に失敗しました" }
  }
}

// デバイスの位置情報取得を停止
export async function stopLocationTracking(deviceId: string) {
  try {
    if (!deviceId) {
      return { success: false, error: "デバイスIDが見つかりません" }
    }

    const { error } = await supabase.from("devices").update({ is_active: false }).eq("id", deviceId)

    if (error) {
      console.error("Supabase error:", error)
      return { success: false, error: "位置情報取得の停止に失敗しました" }
    }

    revalidatePath("/devices")
    return { success: true, message: "位置情報の取得を停止しました" }
  } catch (error) {
    console.error("Stop tracking error:", error)
    return { success: false, error: "位置情報取得の停止に失敗しました" }
  }
}

// デバイスのペアリング確認
export async function confirmPairing(pairingCode: string, deviceInfo: any) {
  try {
    if (!pairingCode) {
      return { success: false, error: "ペアリングコードが必要です" }
    }

    const { data, error } = await supabase.from("devices").select("*").eq("pairing_code", pairingCode).single()

    if (error || !data) {
      return { success: false, error: "無効なペアリングコードです" }
    }

    revalidatePath("/devices")
    return { success: true, message: "デバイスのペアリングが完了しました" }
  } catch (error) {
    console.error("Pairing confirmation error:", error)
    return { success: false, error: "ペアリングに失敗しました" }
  }
}

// デバイスの位置情報を取得
export async function getDeviceLocation(deviceId: string) {
  try {
    if (!deviceId) {
      return { success: false, error: "デバイスIDが見つかりません" }
    }

    const { data, error } = await supabase.from("devices").select("*").eq("id", deviceId).single()

    if (error || !data) {
      return { success: false, error: "位置情報の取得に失敗しました" }
    }

    if (!data.last_location_lat || !data.last_location_lng) {
      return { success: false, error: "位置情報がまだ取得されていません" }
    }

    return {
      success: true,
      location: {
        latitude: data.last_location_lat,
        longitude: data.last_location_lng,
        accuracy: 10,
        timestamp: data.last_location_time,
        address: "位置情報取得中",
      },
    }
  } catch (error) {
    console.error("Get location error:", error)
    return { success: false, error: "位置情報の取得に失敗しました" }
  }
}

// デバイスの状態を更新
export async function updateDeviceStatus(deviceId: string, status: string) {
  try {
    if (!deviceId || !status) {
      return { success: false, error: "デバイスIDと状態が必要です" }
    }

    const isActive = status === "active"

    const { error } = await supabase.from("devices").update({ is_active: isActive }).eq("id", deviceId)

    if (error) {
      console.error("Supabase error:", error)
      return { success: false, error: "状態の更新に失敗しました" }
    }

    revalidatePath("/devices")
    return { success: true, message: `デバイスを${status}にしました` }
  } catch (error) {
    console.error("Update status error:", error)
    return { success: false, error: "状態の更新に失敗しました" }
  }
}
