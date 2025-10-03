"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// セットアップ状態の型定義
interface SetupStatus {
  userId: string
  hasDevice: boolean
  hasContacts: boolean
  hasGeofence: boolean
  isComplete: boolean
  completedAt?: string
}

// セットアップ状況をチェック
export async function checkSetupStatus(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        error: "ユーザーIDが必要です",
        isComplete: false,
        data: null,
      }
    }

    // ユーザーが存在しない場合は作成
    const { data: existingUser } = await supabase.from("users").select("id").eq("id", userId).single()

    if (!existingUser) {
      const { error: userError } = await supabase.from("users").insert({ id: userId })

      if (userError) {
        console.error("User creation error:", userError)
      }
    }

    // setup_progressテーブルから取得
    const { data: progressData, error: progressError } = await supabase
      .from("setup_progress")
      .select("*")
      .eq("user_id", userId)
      .single()

    // レコードが存在しない場合は初期データを作成
    if (progressError && progressError.code === "PGRST116") {
      const { data: newProgress, error: insertError } = await supabase
        .from("setup_progress")
        .insert({
          user_id: userId,
          has_device: false,
          has_contacts: false,
          has_geofence: false,
          is_complete: false,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Setup progress insert error:", insertError)
        return {
          success: false,
          error: "セットアップ進行状況の初期化に失敗しました",
          isComplete: false,
          data: {
            userId,
            hasDevice: false,
            hasContacts: false,
            hasGeofence: false,
            isComplete: false,
          },
        }
      }

      return {
        success: true,
        isComplete: false,
        data: {
          userId,
          hasDevice: false,
          hasContacts: false,
          hasGeofence: false,
          isComplete: false,
        },
      }
    }

    if (progressError) {
      console.error("Setup progress fetch error:", progressError)
      return {
        success: false,
        error: "セットアップ進行状況の取得に失敗しました",
        isComplete: false,
        data: null,
      }
    }

    const status: SetupStatus = {
      userId,
      hasDevice: progressData.has_device,
      hasContacts: progressData.has_contacts,
      hasGeofence: progressData.has_geofence,
      isComplete: progressData.is_complete,
      completedAt: progressData.completed_at,
    }

    return {
      success: true,
      isComplete: status.isComplete,
      data: status,
    }
  } catch (error) {
    console.error("Check setup status error:", error)
    return {
      success: false,
      error: "セットアップ状況の確認に失敗しました",
      isComplete: false,
      data: null,
    }
  }
}

// セットアップの進行状況を取得
export async function getSetupProgress(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        error: "ユーザーIDが必要です",
        data: null,
      }
    }

    // ユーザーが存在しない場合は作成
    const { data: existingUser } = await supabase.from("users").select("id").eq("id", userId).single()

    if (!existingUser) {
      const { error: userError } = await supabase.from("users").insert({ id: userId })

      if (userError) {
        console.error("User creation error:", userError)
      }
    }

    // setup_progressテーブルから取得
    const { data: progressData, error: progressError } = await supabase
      .from("setup_progress")
      .select("*")
      .eq("user_id", userId)
      .single()

    // レコードが存在しない場合は初期データを作成
    if (progressError && progressError.code === "PGRST116") {
      const { data: newProgress, error: insertError } = await supabase
        .from("setup_progress")
        .insert({
          user_id: userId,
          has_device: false,
          has_contacts: false,
          has_geofence: false,
          is_complete: false,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Setup progress insert error:", insertError)
        return {
          success: false,
          error: "セットアップ進行状況の初期化に失敗しました",
          data: null,
        }
      }

      return {
        success: true,
        data: {
          status: {
            hasDevice: false,
            hasContacts: false,
            hasGeofence: false,
            isComplete: false,
          },
          nextStep: "device",
          completedSteps: 0,
          totalSteps: 3,
          progress: 0,
        },
      }
    }

    if (progressError) {
      console.error("Setup progress fetch error:", progressError)
      return {
        success: false,
        error: "セットアップ進行状況の取得に失敗しました",
        data: null,
      }
    }

    // 完了ステップ数を計算
    let completedSteps = 0
    if (progressData.has_device) completedSteps++
    if (progressData.has_contacts) completedSteps++
    if (progressData.has_geofence) completedSteps++

    // 次のステップを決定
    let nextStep = "device"
    if (!progressData.has_device) {
      nextStep = "device"
    } else if (!progressData.has_contacts) {
      nextStep = "contacts"
    } else if (!progressData.has_geofence) {
      nextStep = "geofence"
    } else {
      nextStep = "complete"
    }

    // 進行状況のパーセンテージ
    const progress = Math.round((completedSteps / 3) * 100)

    return {
      success: true,
      data: {
        status: {
          hasDevice: progressData.has_device,
          hasContacts: progressData.has_contacts,
          hasGeofence: progressData.has_geofence,
          isComplete: progressData.is_complete,
        },
        nextStep,
        completedSteps,
        totalSteps: 3,
        progress,
      },
    }
  } catch (error) {
    console.error("Get setup progress error:", error)
    return {
      success: false,
      error: "セットアップ進行状況の取得に失敗しました",
      data: null,
    }
  }
}

// デバイス設定完了をマーク
export async function markDeviceSetupComplete(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "ユーザーIDが必要です" }
    }

    // ユーザーが存在することを確認
    const { data: existingUser } = await supabase.from("users").select("id").eq("id", userId).single()

    if (!existingUser) {
      const { error: userError } = await supabase.from("users").insert({ id: userId })

      if (userError) {
        console.error("User creation error:", userError)
        return { success: false, error: "ユーザーの作成に失敗しました" }
      }
    }

    // setup_progressの存在確認
    const { data: existingProgress } = await supabase.from("setup_progress").select("id").eq("user_id", userId).single()

    if (!existingProgress) {
      // 新規作成
      const { error: insertError } = await supabase.from("setup_progress").insert({
        user_id: userId,
        has_device: true,
        has_contacts: false,
        has_geofence: false,
        is_complete: false,
      })

      if (insertError) {
        console.error("Setup progress insert error:", insertError)
        return { success: false, error: "デバイス設定完了の記録に失敗しました" }
      }
    } else {
      // 更新
      const { error: updateError } = await supabase
        .from("setup_progress")
        .update({ has_device: true })
        .eq("user_id", userId)

      if (updateError) {
        console.error("Setup progress update error:", updateError)
        return { success: false, error: "デバイス設定完了の記録に失敗しました" }
      }
    }

    revalidatePath("/setup")
    revalidatePath("/")
    return { success: true, message: "デバイス設定が完了しました" }
  } catch (error) {
    console.error("Mark device setup complete error:", error)
    return { success: false, error: "デバイス設定完了の記録に失敗しました" }
  }
}

// 連絡先設定完了をマーク
export async function markContactsSetupComplete(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "ユーザーIDが必要です" }
    }

    const { error } = await supabase.from("setup_progress").update({ has_contacts: true }).eq("user_id", userId)

    if (error) {
      console.error("Mark contacts setup error:", error)
      return { success: false, error: "連絡先設定完了の記録に失敗しました" }
    }

    revalidatePath("/setup")
    revalidatePath("/")
    return { success: true, message: "連絡先設定が完了しました" }
  } catch (error) {
    console.error("Mark contacts setup complete error:", error)
    return { success: false, error: "連絡先設定完了の記録に失敗しました" }
  }
}

// ジオフェンス設定完了をマーク
export async function markGeofenceSetupComplete(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "ユーザーIDが必要です" }
    }

    const { error } = await supabase
      .from("setup_progress")
      .update({
        has_geofence: true,
        is_complete: true,
        completed_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (error) {
      console.error("Mark geofence setup error:", error)
      return { success: false, error: "ジオフェンス設定完了の記録に失敗しました" }
    }

    revalidatePath("/setup")
    revalidatePath("/")
    return { success: true, message: "ジオフェンス設定が完了しました" }
  } catch (error) {
    console.error("Mark geofence setup complete error:", error)
    return { success: false, error: "ジオフェンス設定完了の記録に失敗しました" }
  }
}

// セットアップ状態をリセット（開発/テスト用）
export async function resetSetupStatus(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "ユーザーIDが必要です" }
    }

    const { error } = await supabase
      .from("setup_progress")
      .update({
        has_device: false,
        has_contacts: false,
        has_geofence: false,
        is_complete: false,
        completed_at: null,
      })
      .eq("user_id", userId)

    if (error) {
      console.error("Reset setup status error:", error)
      return { success: false, error: "セットアップ状態のリセットに失敗しました" }
    }

    revalidatePath("/setup")
    revalidatePath("/")
    return { success: true, message: "セットアップ状態をリセットしました" }
  } catch (error) {
    console.error("Reset setup status error:", error)
    return { success: false, error: "セットアップ状態のリセットに失敗しました" }
  }
}

// セットアップが完了しているか確認
export async function checkSetupComplete(userId: string) {
  try {
    if (!userId) {
      return { success: false, isComplete: false }
    }

    const { data, error } = await supabase.from("setup_progress").select("is_complete").eq("user_id", userId).single()

    if (error) {
      return { success: false, isComplete: false }
    }

    return { success: true, isComplete: data?.is_complete || false }
  } catch (error) {
    console.error("Check setup complete error:", error)
    return { success: false, isComplete: false }
  }
}
