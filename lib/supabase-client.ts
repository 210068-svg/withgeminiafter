"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// クライアントサイド用のSupabaseクライアント（シングルトン）
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }
  return supabaseClient
}

// リアルタイムサブスクリプション用のヘルパー関数
export function subscribeToDeviceUpdates(userId: string, callback: (payload: any) => void) {
  const client = getSupabaseClient()

  const channel = client
    .channel(`devices:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "devices",
        filter: `user_id=eq.${userId}`,
      },
      callback,
    )
    .subscribe()

  return channel
}

export function subscribeToLocationUpdates(deviceId: string, callback: (payload: any) => void) {
  const client = getSupabaseClient()

  const channel = client
    .channel(`location:${deviceId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "location_history",
        filter: `device_id=eq.${deviceId}`,
      },
      callback,
    )
    .subscribe()

  return channel
}

export function subscribeToAlerts(userId: string, callback: (payload: any) => void) {
  const client = getSupabaseClient()

  const channel = client
    .channel(`alerts:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alerts",
        filter: `user_id=eq.${userId}`,
      },
      callback,
    )
    .subscribe()

  return channel
}
