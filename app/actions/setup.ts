"use server"

// 設定状況管理のServer Actions

// 設定状況の型定義
interface SetupStatus {
  userId: string
  hasDevice: boolean
  hasContacts: boolean
  hasGeofence: boolean
  isComplete: boolean
  completedAt?: string
  lastUpdated: string
}

// 模擬データベース
const setupStatuses: Record<string, SetupStatus> = {}

// 設定状況をチェック
export async function checkSetupStatus(userId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500)) // API呼び出しをシミュレート

    let status = setupStatuses[userId]
    if (!status) {
      // 新規ユーザーの場合、初期状態を作成
      status = {
        userId,
        hasDevice: false,
        hasContacts: false,
        hasGeofence: false,
        isComplete: false,
        lastUpdated: new Date().toISOString(),
      }
      setupStatuses[userId] = status
    }

    return { success: true, data: status }
  } catch (error) {
    console.error("Setup status check error:", error)
    return { success: false, error: "設定状況の確認に失敗しました", data: null }
  }
}

// デバイス登録完了を記録
export async function markDeviceSetupComplete(userId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    let status = setupStatuses[userId]
    if (!status) {
      status = {
        userId,
        hasDevice: false,
        hasContacts: false,
        hasGeofence: false,
        isComplete: false,
        lastUpdated: new Date().toISOString(),
      }
    }

    status.hasDevice = true
    status.lastUpdated = new Date().toISOString()
    status.isComplete = status.hasDevice && status.hasContacts && status.hasGeofence

    if (status.isComplete && !status.completedAt) {
      status.completedAt = new Date().toISOString()
    }

    setupStatuses[userId] = status

    console.log("Device setup completed for user:", userId)
    return { success: true, data: status }
  } catch (error) {
    console.error("Mark device setup complete error:", error)
    return { success: false, error: "デバイス設定の記録に失敗しました" }
  }
}

// 連絡先設定完了を記録
export async function markContactsSetupComplete(userId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    let status = setupStatuses[userId]
    if (!status) {
      status = {
        userId,
        hasDevice: false,
        hasContacts: false,
        hasGeofence: false,
        isComplete: false,
        lastUpdated: new Date().toISOString(),
      }
    }

    status.hasContacts = true
    status.lastUpdated = new Date().toISOString()
    status.isComplete = status.hasDevice && status.hasContacts && status.hasGeofence

    if (status.isComplete && !status.completedAt) {
      status.completedAt = new Date().toISOString()
    }

    setupStatuses[userId] = status

    console.log("Contacts setup completed for user:", userId)
    return { success: true, data: status }
  } catch (error) {
    console.error("Mark contacts setup complete error:", error)
    return { success: false, error: "連絡先設定の記録に失敗しました" }
  }
}

// ジオフェンス設定完了を記録
export async function markGeofenceSetupComplete(userId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    let status = setupStatuses[userId]
    if (!status) {
      status = {
        userId,
        hasDevice: false,
        hasContacts: false,
        hasGeofence: false,
        isComplete: false,
        lastUpdated: new Date().toISOString(),
      }
    }

    status.hasGeofence = true
    status.lastUpdated = new Date().toISOString()
    status.isComplete = status.hasDevice && status.hasContacts && status.hasGeofence

    if (status.isComplete && !status.completedAt) {
      status.completedAt = new Date().toISOString()
    }

    setupStatuses[userId] = status

    console.log("Geofence setup completed for user:", userId)
    return { success: true, data: status }
  } catch (error) {
    console.error("Mark geofence setup complete error:", error)
    return { success: false, error: "ジオフェンス設定の記録に失敗しました" }
  }
}

// 設定をリセット（テスト用）
export async function resetSetupStatus(userId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    setupStatuses[userId] = {
      userId,
      hasDevice: false,
      hasContacts: false,
      hasGeofence: false,
      isComplete: false,
      lastUpdated: new Date().toISOString(),
    }

    console.log("Setup status reset for user:", userId)
    return { success: true, data: setupStatuses[userId] }
  } catch (error) {
    console.error("Reset setup status error:", error)
    return { success: false, error: "設定リセットに失敗しました" }
  }
}

// 設定の進行状況を取得
export async function getSetupProgress(userId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const status = setupStatuses[userId]
    if (!status) {
      return {
        success: true,
        data: {
          totalSteps: 3,
          completedSteps: 0,
          progress: 0,
          nextStep: "device",
        },
      }
    }

    let completedSteps = 0
    if (status.hasDevice) completedSteps++
    if (status.hasContacts) completedSteps++
    if (status.hasGeofence) completedSteps++

    const progress = Math.round((completedSteps / 3) * 100)

    let nextStep = "device"
    if (status.hasDevice && !status.hasContacts) nextStep = "contacts"
    else if (status.hasDevice && status.hasContacts && !status.hasGeofence) nextStep = "geofence"
    else if (status.isComplete) nextStep = "complete"

    return {
      success: true,
      data: {
        totalSteps: 3,
        completedSteps,
        progress,
        nextStep,
        status,
      },
    }
  } catch (error) {
    console.error("Get setup progress error:", error)
    return { success: false, error: "進行状況の取得に失敗しました", data: null }
  }
}
