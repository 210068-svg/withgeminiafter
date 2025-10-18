"use server"

import { revalidatePath } from "next/cache"

// アカウント設定のServer Actions

// 利用者データの型定義
interface UserProfile {
  id: string
  lastName: string
  firstName: string
  birthDate: string
  address: string
  emergencyContact: string
  medicalInfo: string
  profileImage?: string
  updatedAt: string
}

// 模擬データベース（実際のアプリではデータベースを使用）
const userProfiles: Record<string, UserProfile> = {}

// ケア担当者データ
const caregivers: Record<string, any> = {}

// アカウント情報
const accountInfos: Record<string, any> = {}

// 新規ユーザーの初期プロフィール作成
async function createInitialUserProfile(userId: string): Promise<UserProfile> {
  const initialProfile: UserProfile = {
    id: userId,
    lastName: "",
    firstName: "",
    birthDate: "",
    address: "",
    emergencyContact: "",
    medicalInfo: "",
    profileImage: null,
    updatedAt: new Date().toISOString(),
  }

  userProfiles[userId] = initialProfile

  // 初期アカウント情報も作成
  accountInfos[userId] = {
    email: "",
    lastPasswordChange: new Date().toISOString(),
    lastEmailChange: new Date().toISOString(),
  }

  return initialProfile
}

// 利用者情報の取得
export async function getUserProfile(userId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300)) // API呼び出しをシミュレート

    let profile = userProfiles[userId]
    if (!profile) {
      // 新規ユーザーの場合、初期プロフィールを作成
      profile = await createInitialUserProfile(userId)
    }

    return { success: true, data: profile }
  } catch (error) {
    console.error("Get user profile error:", error)
    return { success: false, error: "利用者情報の取得に失敗しました", data: null }
  }
}

// 利用者情報の更新
export async function updateUserProfile(formData: FormData) {
  try {
    const userId = formData.get("userId") as string

    if (!userId) {
      return { success: false, error: "ユーザーIDが見つかりません" }
    }

    const profileData = {
      lastName: formData.get("lastName") as string,
      firstName: formData.get("firstName") as string,
      birthDate: formData.get("birthDate") as string,
      address: formData.get("address") as string,
      emergencyContact: formData.get("emergencyContact") as string,
      medicalInfo: formData.get("medicalInfo") as string,
    }

    // バリデーション
    if (!profileData.lastName || !profileData.firstName) {
      return { success: false, error: "姓名は必須項目です" }
    }

    if (profileData.lastName.length > 50 || profileData.firstName.length > 50) {
      return { success: false, error: "姓名は50文字以内で入力してください" }
    }

    if (profileData.birthDate) {
      const birthDate = new Date(profileData.birthDate)
      const today = new Date()
      if (birthDate > today) {
        return { success: false, error: "生年月日は今日以前の日付を入力してください" }
      }
    }

    // データベースの更新をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 既存のプロフィールを更新または新規作成
    const existingProfile = userProfiles[userId] || (await createInitialUserProfile(userId))
    userProfiles[userId] = {
      ...existingProfile,
      ...profileData,
      updatedAt: new Date().toISOString(),
    }

    console.log("Updated user profile:", userProfiles[userId])

    revalidatePath("/settings")
    return {
      success: true,
      message: "利用者情報を更新しました",
      data: userProfiles[userId],
    }
  } catch (error) {
    console.error("Profile update error:", error)
    return { success: false, error: "更新に失敗しました" }
  }
}

// ケア担当者一覧の取得
export async function getCaregivers(userId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const userCaregivers = Object.values(caregivers).filter((c) => c.userId === userId)
    return { success: true, data: userCaregivers }
  } catch (error) {
    console.error("Get caregivers error:", error)
    return { success: false, error: "ケア担当者情報の取得に失敗しました", data: [] }
  }
}

// ケア担当者の追加処理を強化
export async function addCaregiver(formData: FormData) {
  try {
    const caregiverData = {
      name: (formData.get("name") as string)?.trim(),
      relation: (formData.get("relation") as string)?.trim(),
      phone: (formData.get("phone") as string)?.trim(),
      email: (formData.get("email") as string)?.trim(),
      role: (formData.get("role") as string) || "家族",
      userId: formData.get("userId") as string,
    }

    if (!caregiverData.userId) {
      return { success: false, error: "ユーザーIDが見つかりません" }
    }

    // より詳細なバリデーション
    if (!caregiverData.name) {
      return { success: false, error: "名前を入力してください" }
    }

    if (!caregiverData.relation) {
      return { success: false, error: "続柄を入力してください" }
    }

    if (caregiverData.name.length < 2) {
      return { success: false, error: "名前は2文字以上で入力してください" }
    }

    if (caregiverData.name.length > 100) {
      return { success: false, error: "名前は100文字以内で入力してください" }
    }

    if (caregiverData.relation.length > 100) {
      return { success: false, error: "続柄は100文字以内で入力してください" }
    }

    // 電話番号のより詳細なバリデーション
    if (caregiverData.phone) {
      // 空白や特殊文字を除去して数字のみをチェック
      const cleanPhone = caregiverData.phone.replace(/[\s\-+$$$$]/g, "")
      if (cleanPhone.length > 0 && (cleanPhone.length < 10 || cleanPhone.length > 15)) {
        return { success: false, error: "電話番号は10-15桁で入力してください" }
      }

      const phoneRegex = /^[\d\-+$$$$\s]+$/
      if (!phoneRegex.test(caregiverData.phone)) {
        return { success: false, error: "電話番号に無効な文字が含まれています" }
      }
    }

    // メールアドレスのバリデーション
    if (caregiverData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(caregiverData.email)) {
        return { success: false, error: "有効なメールアドレスを入力してください" }
      }

      if (caregiverData.email.length > 255) {
        return { success: false, error: "メールアドレスは255文字以内で入力してください" }
      }

      // 重複チェック
      const existingCaregivers = Object.values(caregivers).filter((c) => c.userId === caregiverData.userId)
      if (existingCaregivers.some((c) => c.email.toLowerCase() === caregiverData.email.toLowerCase())) {
        return { success: false, error: "このメールアドレスは既に登録されています" }
      }
    }

    // 同じ名前の重複チェック
    const existingCaregivers = Object.values(caregivers).filter((c) => c.userId === caregiverData.userId)
    if (existingCaregivers.some((c) => c.name === caregiverData.name)) {
      return { success: false, error: "同じ名前のケア担当者が既に登録されています" }
    }

    // データベースの更新をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 新しいIDを生成（より安全な方法）
    const existingIds = Object.keys(caregivers)
      .map((id) => Number.parseInt(id))
      .filter((id) => !isNaN(id))
    const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1

    const newCaregiver = {
      id: newId.toString(),
      ...caregiverData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    caregivers[newId.toString()] = newCaregiver

    console.log("Added caregiver:", newCaregiver)

    revalidatePath("/settings")
    return {
      success: true,
      message: `${caregiverData.name}さんをケア担当者に追加しました`,
      data: newCaregiver,
    }
  } catch (error) {
    console.error("Caregiver add error:", error)
    return { success: false, error: "システムエラーが発生しました。しばらく後でお試しください。" }
  }
}

// ケア担当者の更新処理を強化
export async function updateCaregiver(formData: FormData) {
  try {
    const caregiverId = formData.get("caregiverId") as string
    const caregiverData = {
      name: (formData.get("name") as string)?.trim(),
      relation: (formData.get("relation") as string)?.trim(),
      phone: (formData.get("phone") as string)?.trim(),
      email: (formData.get("email") as string)?.trim(),
      role: (formData.get("role") as string) || "家族",
    }

    if (!caregiverId) {
      return { success: false, error: "ケア担当者IDが見つかりません" }
    }

    const existingCaregiver = caregivers[caregiverId]
    if (!existingCaregiver) {
      return { success: false, error: "ケア担当者が見つかりません" }
    }

    // バリデーション（追加時と同じ）
    if (!caregiverData.name) {
      return { success: false, error: "名前を入力してください" }
    }

    if (!caregiverData.relation) {
      return { success: false, error: "続柄を入力してください" }
    }

    if (caregiverData.name.length < 2) {
      return { success: false, error: "名前は2文字以上で入力してください" }
    }

    if (caregiverData.name.length > 100) {
      return { success: false, error: "名前は100文字以内で入力してください" }
    }

    // 電話番号のバリデーション
    if (caregiverData.phone) {
      const cleanPhone = caregiverData.phone.replace(/[\s\-+$$$$]/g, "")
      if (cleanPhone.length > 0 && (cleanPhone.length < 10 || cleanPhone.length > 15)) {
        return { success: false, error: "電話番号は10-15桁で入力してください" }
      }

      const phoneRegex = /^[\d\-+$$$$\s]+$/
      if (!phoneRegex.test(caregiverData.phone)) {
        return { success: false, error: "電話番号に無効な文字が含まれています" }
      }
    }

    // メールアドレスのバリデーション
    if (caregiverData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(caregiverData.email)) {
        return { success: false, error: "有効なメールアドレスを入力してください" }
      }

      // 重複チェック（自分以外）
      const existingCaregivers = Object.values(caregivers).filter(
        (c) => c.userId === existingCaregiver.userId && c.id !== caregiverId,
      )
      if (existingCaregivers.some((c) => c.email.toLowerCase() === caregiverData.email.toLowerCase())) {
        return { success: false, error: "このメールアドレスは既に登録されています" }
      }
    }

    // 名前の重複チェック（自分以外）
    const existingCaregivers = Object.values(caregivers).filter(
      (c) => c.userId === existingCaregiver.userId && c.id !== caregiverId,
    )
    if (existingCaregivers.some((c) => c.name === caregiverData.name)) {
      return { success: false, error: "同じ名前のケア担当者が既に登録されています" }
    }

    // データベースの更新をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const updatedCaregiver = {
      ...existingCaregiver,
      ...caregiverData,
      updatedAt: new Date().toISOString(),
    }

    caregivers[caregiverId] = updatedCaregiver

    console.log("Updated caregiver:", updatedCaregiver)

    revalidatePath("/settings")
    return {
      success: true,
      message: `${caregiverData.name}さんの情報を更新しました`,
      data: updatedCaregiver,
    }
  } catch (error) {
    console.error("Caregiver update error:", error)
    return { success: false, error: "システムエラーが発生しました。しばらく後でお試しください。" }
  }
}

// ケア担当者の削除
export async function deleteCaregiver(caregiverId: string) {
  try {
    if (!caregiverId) {
      return { success: false, error: "ケア担当者IDが見つかりません" }
    }

    const caregiverToDelete = caregivers[caregiverId]
    if (!caregiverToDelete) {
      return { success: false, error: "ケア担当者が見つかりません" }
    }

    // データベースの更新をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const deletedCaregiver = { ...caregivers[caregiverId] }
    delete caregivers[caregiverId]

    console.log("Deleted caregiver:", deletedCaregiver)

    revalidatePath("/settings")
    return {
      success: true,
      message: `${deletedCaregiver.name}さんを削除しました`,
      data: deletedCaregiver,
    }
  } catch (error) {
    console.error("Caregiver delete error:", error)
    return { success: false, error: "システムエラーが発生しました。しばらく後でお試しください。" }
  }
}

// アカウント情報の更新処理を強化
export async function updateAccountInfo(formData: FormData) {
  try {
    const userId = formData.get("userId") as string
    const accountData = {
      email: (formData.get("email") as string)?.trim(),
      currentPassword: formData.get("currentPassword") as string,
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    }

    if (!userId) {
      return { success: false, error: "ユーザーIDが見つかりません" }
    }

    // より詳細なバリデーション
    if (!accountData.email) {
      return { success: false, error: "メールアドレスを入力してください" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(accountData.email)) {
      return { success: false, error: "有効なメールアドレスを入力してください" }
    }

    if (accountData.email.length > 255) {
      return { success: false, error: "メールアドレスは255文字以内で入力してください" }
    }

    // パスワード変更の場合の詳細なバリデーション
    if (accountData.newPassword) {
      if (!accountData.currentPassword) {
        return { success: false, error: "現在のパスワードを入力してください" }
      }

      if (accountData.newPassword !== accountData.confirmPassword) {
        return { success: false, error: "新しいパスワードが一致しません" }
      }

      if (accountData.newPassword.length < 8) {
        return { success: false, error: "パスワードは8文字以上で入力してください" }
      }

      if (accountData.newPassword.length > 128) {
        return { success: false, error: "パスワードは128文字以内で入力してください" }
      }

      // パスワード強度チェック
      const hasUpperCase = /[A-Z]/.test(accountData.newPassword)
      const hasLowerCase = /[a-z]/.test(accountData.newPassword)
      const hasNumbers = /\d/.test(accountData.newPassword)

      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        return { success: false, error: "パスワードは大文字、小文字、数字を含む必要があります" }
      }

      // 現在のパスワードの検証（実際のアプリではハッシュ化されたパスワードと比較）
      if (accountData.currentPassword === accountData.newPassword) {
        return { success: false, error: "新しいパスワードは現在のパスワードと異なる必要があります" }
      }

      // 簡単なパスワードのチェック
      const commonPasswords = ["password", "12345678", "qwerty123", "abc12345"]
      if (commonPasswords.some((common) => accountData.newPassword.toLowerCase().includes(common))) {
        return { success: false, error: "より複雑なパスワードを設定してください" }
      }
    }

    // データベースの更新をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // アカウント情報を更新または新規作成
    const existingAccountInfo = accountInfos[userId] || {
      email: "",
      lastPasswordChange: new Date().toISOString(),
      lastEmailChange: new Date().toISOString(),
    }

    const updatedAccountInfo = {
      email: accountData.email,
      lastPasswordChange: accountData.newPassword ? new Date().toISOString() : existingAccountInfo.lastPasswordChange,
      lastEmailChange:
        accountData.email !== existingAccountInfo.email
          ? new Date().toISOString()
          : existingAccountInfo.lastEmailChange,
    }

    accountInfos[userId] = updatedAccountInfo

    console.log("Updated account info:", updatedAccountInfo)

    revalidatePath("/settings")
    return {
      success: true,
      message: accountData.newPassword ? "アカウント情報とパスワードを更新しました" : "アカウント情報を更新しました",
      data: updatedAccountInfo,
    }
  } catch (error) {
    console.error("Account update error:", error)
    return { success: false, error: "システムエラーが発生しました。しばらく後でお試しください。" }
  }
}

// デバイス設定の更新
export async function updateDeviceSettings(formData: FormData) {
  try {
    const deviceSettings = {
      trackingMode: formData.get("trackingMode") as string,
      powerSaving: formData.get("powerSaving") === "on",
      indoorTracking: formData.get("indoorTracking") === "on",
    }

    // バリデーション
    const validTrackingModes = ["high", "balanced", "low", "adaptive"]
    if (!validTrackingModes.includes(deviceSettings.trackingMode)) {
      return { success: false, error: "無効なトラッキングモードです" }
    }

    // データベースの更新をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Updated device settings:", deviceSettings)

    revalidatePath("/settings")
    return { success: true, message: "デバイス設定を更新しました" }
  } catch (error) {
    console.error("Device settings update error:", error)
    return { success: false, error: "更新に失敗しました" }
  }
}

// アプリ設定の更新
export async function updateAppSettings(formData: FormData) {
  try {
    const appSettings = {
      language: formData.get("language") as string,
      theme: formData.get("theme") as string,
      mapStyle: formData.get("mapStyle") as string,
      sound: formData.get("sound") === "on",
      vibration: formData.get("vibration") === "on",
    }

    // バリデーション
    const validLanguages = ["ja", "en", "zh", "ko"]
    const validThemes = ["light", "dark", "system"]
    const validMapStyles = ["standard", "satellite", "hybrid", "simple"]

    if (!validLanguages.includes(appSettings.language)) {
      return { success: false, error: "無効な言語設定です" }
    }

    if (!validThemes.includes(appSettings.theme)) {
      return { success: false, error: "無効なテーマ設定です" }
    }

    if (!validMapStyles.includes(appSettings.mapStyle)) {
      return { success: false, error: "無効な地図スタイル設定です" }
    }

    // データベースの更新をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Updated app settings:", appSettings)

    revalidatePath("/settings")
    return { success: true, message: "アプリ設定を更新しました" }
  } catch (error) {
    console.error("App settings update error:", error)
    return { success: false, error: "更新に失敗しました" }
  }
}

// プライバシー設定の更新
export async function updatePrivacySettings(formData: FormData) {
  try {
    const privacySettings = {
      locationTracking: formData.get("locationTracking") === "on",
      dataSharing: formData.get("dataSharing") === "on",
      analytics: formData.get("analytics") === "on",
      dataRetention: formData.get("dataRetention") as string,
    }

    // バリデーション
    const validRetentionPeriods = ["1month", "3months", "6months", "1year", "forever"]
    if (!validRetentionPeriods.includes(privacySettings.dataRetention)) {
      return { success: false, error: "無効なデータ保持期間です" }
    }

    // データベースの更新をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Updated privacy settings:", privacySettings)

    revalidatePath("/settings")
    return { success: true, message: "プライバシー設定を更新しました" }
  } catch (error) {
    console.error("Privacy settings update error:", error)
    return { success: false, error: "更新に失敗しました" }
  }
}

// プロフィール画像のアップロード
export async function uploadProfileImage(formData: FormData) {
  try {
    const file = formData.get("profileImage") as File
    const userId = formData.get("userId") as string

    if (!userId) {
      return { success: false, error: "ユーザーIDが見つかりません" }
    }

    if (!file || file.size === 0) {
      return { success: false, error: "画像ファイルを選択してください" }
    }

    // ファイルサイズチェック (5MB制限)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "ファイルサイズは5MB以下にしてください" }
    }

    // ファイル形式チェック
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "JPEG、PNG、GIF、WebP形式の画像のみアップロード可能です" }
    }

    // ファイルアップロードをシミュレート
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 画像URLを生成（実際のアプリではクラウドストレージのURLを使用）
    const imageUrl = `/uploads/profile_${userId}_${Date.now()}.${file.type.split("/")[1]}`

    // プロフィールを更新
    if (userProfiles[userId]) {
      userProfiles[userId].profileImage = imageUrl
      userProfiles[userId].updatedAt = new Date().toISOString()
    }

    console.log("Uploaded profile image:", file.name, file.size, file.type, imageUrl)

    revalidatePath("/settings")
    return {
      success: true,
      message: "プロフィール画像を更新しました",
      imageUrl,
    }
  } catch (error) {
    console.error("Profile image upload error:", error)
    return { success: false, error: "アップロードに失敗しました" }
  }
}

// アカウント情報の取得
export async function getAccountInfo(userId: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 200))

    let accountInfo = accountInfos[userId]
    if (!accountInfo) {
      // 新規ユーザーの場合、初期アカウント情報を作成
      accountInfo = {
        email: "",
        lastPasswordChange: new Date().toISOString(),
        lastEmailChange: new Date().toISOString(),
      }
      accountInfos[userId] = accountInfo
    }

    return { success: true, data: accountInfo }
  } catch (error) {
    console.error("Get account info error:", error)
    return { success: false, error: "アカウント情報の取得に失敗しました", data: null }
  }
}
