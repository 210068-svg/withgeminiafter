"use server"

import { revalidatePath } from "next/cache"

// デバイス管理のServer Actions

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

    // デバイスIDを生成（実際のアプリではUUIDなどを使用）
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 実際のアプリでは、ここでデータベースに保存
    console.log("Registering device:", { ...deviceData, deviceId })

    // 一時的な遅延をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1500))

    revalidatePath("/devices")
    return {
      success: true,
      message: "デバイスを登録しました",
      deviceId,
      pairingCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
    }
  } catch (error) {
    console.error("Device registration error:", error)
    return { success: false, error: "デバイス登録に失敗しました" }
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

    // 実際のアプリでは、ここでデータベースを更新
    console.log("Updating device:", deviceId, deviceData)

    await new Promise((resolve) => setTimeout(resolve, 1000))

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

    // 実際のアプリでは、ここでデータベースから削除
    console.log("Deleting device:", deviceId)

    await new Promise((resolve) => setTimeout(resolve, 1000))

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

    // 実際のアプリでは、ここでデバイスに位置情報取得開始の指示を送信
    console.log("Starting location tracking for device:", deviceId)

    await new Promise((resolve) => setTimeout(resolve, 1000))

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

    // 実際のアプリでは、ここでデバイスに位置情報取得停止の指示を送信
    console.log("Stopping location tracking for device:", deviceId)

    await new Promise((resolve) => setTimeout(resolve, 1000))

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

    // 実際のアプリでは、ここでペアリングコードを検証
    console.log("Confirming pairing:", pairingCode, deviceInfo)

    await new Promise((resolve) => setTimeout(resolve, 1500))

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

    // 実際のアプリでは、ここでデバイスから位置情報を取得
    // モックデータを返す
    const mockLocation = {
      latitude: 35.6895 + (Math.random() - 0.5) * 0.01,
      longitude: 139.6917 + (Math.random() - 0.5) * 0.01,
      accuracy: Math.floor(Math.random() * 20) + 5,
      timestamp: new Date().toISOString(),
      address: "東京都新宿区西新宿付近",
    }

    console.log("Getting device location:", deviceId, mockLocation)

    await new Promise((resolve) => setTimeout(resolve, 500))

    return { success: true, location: mockLocation }
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

    // 実際のアプリでは、ここでデバイスの状態を更新
    console.log("Updating device status:", deviceId, status)

    await new Promise((resolve) => setTimeout(resolve, 500))

    revalidatePath("/devices")
    return { success: true, message: `デバイスを${status}にしました` }
  } catch (error) {
    console.error("Update status error:", error)
    return { success: false, error: "状態の更新に失敗しました" }
  }
}
