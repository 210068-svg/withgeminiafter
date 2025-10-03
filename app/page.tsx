"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Bell, Clock, Shield, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import MapComponent from "./map-component"
import RealtimeAlerts from "@/components/realtime-alerts"
import { getSupabaseClient } from "@/lib/supabase-client"
import { checkSetupStatus } from "./actions/setup"

export default function Home() {
  const [userId, setUserId] = useState<string>("demo-user-001")
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [setupComplete, setSetupComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      // セットアップ状態をチェック
      const setupStatus = await checkSetupStatus(userId)

      if (setupStatus.isComplete) {
        setSetupComplete(true)

        // デバイスIDを取得
        const client = getSupabaseClient()
        const { data: devices } = await client
          .from("devices")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true)
          .limit(1)

        if (devices && devices.length > 0) {
          setDeviceId(devices[0].id)
        }
      }

      setLoading(false)
    }

    initializeApp()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">介護見守りアプリ</h1>
            <p className="text-gray-600">大切な方の安全を見守ります</p>
          </div>

          <Card className="border-2 border-emerald-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">初期設定が必要です</CardTitle>
              <CardDescription>アプリを使用する前に、以下の設定を完了してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-600" />
                  必要な設定
                </h3>
                <ul className="space-y-2 ml-7 text-sm text-gray-600">
                  <li>• 監視デバイスの登録</li>
                  <li>• 連絡先の設定</li>
                  <li>• 安全エリアの設定</li>
                </ul>
              </div>
              <Link href="/setup">
                <Button className="w-full" size="lg">
                  初期設定を開始
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4 md:p-8">
      <RealtimeAlerts userId={userId} />

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">介護見守りアプリ</h1>
          <p className="text-gray-600">リアルタイムで位置情報を追跡</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
                現在地
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">追跡中</p>
              <p className="text-xs text-gray-500 mt-1">リアルタイム更新</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Bell className="h-4 w-4 mr-2 text-blue-600" />
                アラート
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">0件</p>
              <p className="text-xs text-gray-500 mt-1">未解決のアラート</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Shield className="h-4 w-4 mr-2 text-purple-600" />
                安全エリア
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">エリア内</p>
              <p className="text-xs text-gray-500 mt-1">設定エリア内</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-orange-600" />
                最終更新
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">たった今</p>
              <p className="text-xs text-gray-500 mt-1">自動更新中</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>リアルタイム位置情報</CardTitle>
            <CardDescription>利用者の現在位置を地図上でリアルタイムに確認できます</CardDescription>
          </CardHeader>
          <CardContent>
            <MapComponent showGeofence={true} deviceId={deviceId || undefined} userId={userId} />
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/alerts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  アラート
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">アラート履歴と通知設定</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  移動履歴
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">過去の移動記録を確認</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/geofence">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  エリア設定
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">安全エリアの設定と管理</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
