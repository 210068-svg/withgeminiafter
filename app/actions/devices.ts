"use server"

import { revalidatePath } from "next/cache"
import { supabase } from "@/lib/supabase"

type Result<T = any> = {
  success: boolean
  error?: string
  message?: string
  data?: T
  deviceId?: string
  pairingCode?: string
}

const PHONE_REGEX = /^[\d+\-\s()]+$/ // 数字、+、-、空白、() を許可

/* ---------- ヘルパー ---------- */

async function revalidate(paths: string[] = []) {
  // revalidatePath は同期関数の実装差があるため await を付けない環境もあるが、
  // Promise で包んでおくと安全（副作用的に呼ぶ）
  for (const p of paths) {
    try {
      // Next の revalidatePath を呼ぶ（エラーは握り潰さない）
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await revalidatePath(p)
    } catch (e) {
      console.error("revalidatePath error:", e)
    }
  }
}

function generatePairingCode(length = 8) {
  // 8文字の英数字（大文字）を生成
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase()
}

async function ensureUserExists(userId: string): Promise<Result> {
  if (!userId) return { success: false, error: "userId が必要です" }

  try {
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 等は「row not found」系の DB ドライバコードかもしれないので、一般エラーのみハンドリング
      return { success: false, error: "ユーザー確認に失敗しました" }
    }

    if (!existingUser) {
      const { error: userError } = await supabase.from("users").insert({ id: userId })
      if (userError) {
        console.error("User creation error:", userError)
        return { success: false, error: "ユーザー作成に失敗しました" }
      }
    }

    return { success: true }
  } catch (e) {
    console.error("ensureUserExists error:", e)
    return { success: false, error: "ユーザー確認中にエラーが発生しました" }
  }
}

/* ---------- 共通バリデーション ---------- */

function validatePhone(phone?: string) {
  if (!phone) return { ok: true }
  if (!PHONE_REGEX.test(phone)) return { ok: false, error: "有効な電話番号を入力してください" }
  return { ok: true }
}

/* ---------- API 関数群 ---------- */

export async function registerDevice(formData: FormData): Promise<Result> {
  try {
    const deviceName = String(formData.get("deviceName") ?? "")
    const deviceType = String(formData.get("deviceType") ?? "")
    const userId = String(formData.get("userId") ?? "")
    const phoneNumber = formData.get("phoneNumber") ? String(formData.get("phoneNumber")) : null
    const emergencyContact = formData.get("emergencyContact") ? String(formData.get("emergencyContact")) : null
    const notes = formData.get("notes") ? String(formData.get("notes")) : null

    if (!deviceName || !deviceType || !userId) {
      return { success: false, error: "デバイス名、種類、利用者は必須項目です" }
    }

    const phoneValidation = validatePhone(phoneNumber ?? undefined)
    if (!phoneValidation.ok) return { success: false, error: phoneValidation.error }

    // ユーザー存在確認（なければ作成）
    const ensure = await ensureUserExists(userId)
    if (!ensure.success) return ensure

    const pairingCode = generatePairingCode()

    const payload = {
      user_id: userId,
      device_name: deviceName,
      device_type: deviceType,
      phone_number: phoneNumber || null,
      emergency_contact: emergencyContact || null,
      notes: notes || null,
      pairing_code: pairingCode,
      is_active: true,
    }

    const { data, error } = await supabase.from("devices").insert(payload).select().single()

    if (error) {
      console.error("Supabase error (insert device):", error)
      return { success: false, error: "デバイス登録に失敗しました" }
    }

    await revalidate(["/devices", "/setup"])

    return {
      success: true,
      message: "デバイスを登録しました",
      deviceId: data.id,
      pairingCode,
      data,
    }
  } catch (e) {
    console.error("Device registration error:", e)
    return { success: false, error: "デバイス登録に失敗しました" }
  }
}

export async function getDevices(userId: string): Promise<Result<any[]>> {
  try {
    if (!userId) return { success: false, error: "userId が必要です", data: [] }

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error (getDevices):", error)
      return { success: false, error: "デバイス一覧の取得に失敗しました", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (e) {
    console.error("Get devices error:", e)
    return { success: false, error: "デバイス一覧の取得に失敗しました", data: [] }
  }
}

export async function updateDevice(formData: FormData): Promise<Result> {
  try {
    const deviceId = String(formData.get("deviceId") ?? "")
    const deviceName = String(formData.get("deviceName") ?? "")
    const phoneNumber = formData.get("phoneNumber") ? String(formData.get("phoneNumber")) : null
    const emergencyContact = formData.get("emergencyContact") ? String(formData.get("emergencyContact")) : null
    const notes = formData.get("notes") ? String(formData.get("notes")) : null
    const isActiveRaw = formData.get("isActive")
    const isActive = isActiveRaw === "on" || isActiveRaw === "true" || isActiveRaw === true

    if (!deviceId) return { success: false, error: "デバイスIDが見つかりません" }
    if (!deviceName) return { success: false, error: "デバイス名は必須項目です" }

    const phoneValidation = validatePhone(phoneNumber ?? undefined)
    if (!phoneValidation.ok) return { success: false, error: phoneValidation.error }

    const { error } = await supabase
      .from("devices")
      .update({
        device_name: deviceName,
        phone_number: phoneNumber || null,
        emergency_contact: emergencyContact || null,
        notes: notes || null,
        is_active: isActive,
      })
      .eq("id", deviceId)

    if (error) {
      console.error("Supabase error (updateDevice):", error)
      return { success: false, error: "更新に失敗しました" }
    }

    await revalidate(["/devices"])
    return { success: true, message: "デバイス情報を更新しました" }
  } catch (e) {
    console.error("Device update error:", e)
    return { success: false, error: "更新に失敗しました" }
  }
}

export async function deleteDevice(deviceId: string): Promise<Result> {
  try {
    if (!deviceId) return { success: false, error: "デバイスIDが見つかりません" }

    const { error } = await supabase.from("devices").delete().eq("id", deviceId)

    if (error) {
      console.error("Supabase error (deleteDevice):", error)
      return { success: false, error: "削除に失敗しました" }
    }

    await revalidate(["/devices"])
    return { success: true, message: "デバイスを削除しました" }
  } catch (e) {
    console.error("Device delete error:", e)
    return { success: false, error: "削除に失敗しました" }
  }
}

export async function startLocationTracking(deviceId: string): Promise<Result> {
  return updateDeviceStatus(deviceId, true, "位置情報の取得を開始しました", "位置情報取得の開始に失敗しました")
}

export async function stopLocationTracking(deviceId: string): Promise<Result> {
  return updateDeviceStatus(deviceId, false, "位置情報の取得を停止しました", "位置情報取得の停止に失敗しました")
}

async function updateDeviceStatus(
  deviceId: string,
  isActive: boolean,
  successMessage = "状態を更新しました",
  failureMessage = "状態の更新に失敗しました"
): Promise<Result> {
  try {
    if (!deviceId) return { success: false, error: "デバイスIDが見つかりません" }

    const { error } = await supabase.from("devices").update({ is_active: isActive }).eq("id", deviceId)

    if (error) {
      console.error("Supabase error (updateDeviceStatus):", error)
      return { success: false, error: failureMessage }
    }

    await revalidate(["/devices"])
    return { success: true, message: successMessage }
  } catch (e) {
    console.error("Update status error:", e)
    return { success: false, error: failureMessage }
  }
}

export async function confirmPairing(pairingCode: string, deviceInfo?: any): Promise<Result> {
  try {
    if (!pairingCode) return { success: false, error: "ペアリングコードが必要です" }

    const { data, error } = await supabase.from("devices").select("*").eq("pairing_code", pairingCode).single()

    if (error || !data) {
      return { success: false, error: "無効なペアリングコードです" }
    }

    // 必要ならここで deviceInfo を devices テーブルに書き込むなどの処理を追加
    await revalidate(["/devices"])
    return { success: true, message: "デバイスのペアリングが完了しました", data }
  } catch (e) {
    console.error("Pairing confirmation error:", e)
    return { success: false, error: "ペアリングに失敗しました" }
  }
}

export async function getDeviceLocation(deviceId: string): Promise<Result> {
  try {
    if (!deviceId) return { success: false, error: "デバイスIDが見つかりません" }

    const { data, error } = await supabase.from("devices").select("*").eq("id", deviceId).single()

    if (error || !data) {
      console.error("Supabase error (getDeviceLocation):", error)
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
        accuracy: data.last_location_accuracy ?? 10,
        timestamp: data.last_location_time,
        address: data.last_location_address ?? "位置情報取得中",
      },
    }
  } catch (e) {
    console.error("Get location error:", e)
    return { success: false, error: "位置情報の取得に失敗しました" }
  }
}

export async function updateDeviceStatus(deviceId: string, status: string): Promise<Result> {
  try {
    if (!deviceId || !status) return { success: false, error: "デバイスIDと状態が必要です" }

    const isActive = status === "active"

    const { error } = await supabase.from("devices").update({ is_active: isActive }).eq("id", deviceId)

    if (error) {
      console.error("Supabase error (updateDeviceStatus string):", error)
      return { success: false, error: "状態の更新に失敗しました" }
    }

    await revalidate(["/devices"])
    return { success: true, message: `デバイスを${status}にしました` }
  } catch (e) {
    console.error("Update status error (string):", e)
    return { success: false, error: "状態の更新に失敗しました" }
  }
}
