"use client"

import React, { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  MapPin,
  Bell,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
} from "lucide-react"
import { checkSetupStatus } from "./actions/setup"

// 動的 import（SSR OFF）で初期バンドルを軽くする
const MapComponent = dynamic(() => import("./map-component"), { ssr: false })
const RealtimeAlerts = dynamic(
  () => import("@/components/realtime-alerts"),
  { ssr: false }
)

type SetupStatus = {
  isComplete: boolean
  hasDevice?: boolean
  hasContacts?: boolean
  hasGeofence?: boolean
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  )
}

function SetupItem({
  Icon,
  title,
  desc,
  done,
}: {
  Icon: React.ComponentType<any>
  title: string
  desc: string
  done?: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
      <Icon className="h-5 w-5 text-gray-600" />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      {done ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      ) : (
        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
      )}
    </div>
  )
}

export default function Home() {
  // userId は固定（将来的に props や auth から取る）
  const userId = useMemo(() => "demo-user-001", [])

  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeApp = async () => {
      try {
        const result = await checkSetupStatus(userId)
        if (!mounted) return
        if (result?.success) {
          setSetupStatus(result.data as SetupStatus)
        } else {
          // 失敗時は空の既定値を入れて UI を整える（必要なら詳細エラー処理）
          setSetupStatus({ isComplete: false, hasDevice: false, hasContacts: false, hasGeofence: false })
        }
      } catch (err) {
        console.error("checkSetupStatus error:", err)
        if (mounted) {
          setSetupStatus({ isComplete: false, hasDevice: false, hasContacts: false, hasGeofence: false })
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeApp()
    return () => {
      mounted = false
    }
  }, [userId])

  if (loading) return <Loader />

  const status = setupStatus ?? { isComplete: false }

  // 設定項目を配列化（重複 JSX を削減）
  const setupItems = [
    {
      key: "hasDevice",
      Icon: Smartphone,
      title: "監視デバイスの登録",
      desc: "位置情報を取得するデバイス",
      done: status.hasDevice,
    },
    {
      key: "hasContacts",
      Icon: Bell,
      title: "連絡先の設定",
      desc: "アラートを受け取る連絡先",
      done: status.hasContacts,
    },
    {
      key: "hasGeofence",
      Icon: MapPin,
      title: "安全エリアの設定",
      desc: "ジオフェンスエリア",
      done: status.hasGeofence,
    },
  ]

  if (!status.isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">介護見守りアプリ</h1>
            <p className="text-gray-600">大切な方の安全を見守ります</p>
          </div>

          <Card className="border-2 border-emerald-200">
            <CardHeader className="text-center bg-amber-50">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">初期設定が必要です</CardTitle>
              <CardDescription>アプリを使用する前に、以下の設定を完了してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                {setupItems.map((it) => (
                  <SetupItem
                    key={it.key}
                    Icon={it.Icon}
                    title={it.title}
                    desc={it.desc}
                    done={it.done}
                  />
                ))}
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h3 className="font-semibold mb-2 flex items-center text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  設定完了後の機能
                </h3>
                <ul className="space-y-1 ml-7 text-sm text-emerald-800">
                  <li>• リアルタイム位置追跡</li>
                  <li>• 安全エリア外アラート</li>
                  <li>• 緊急時自動通知</li>
                  <li>• 移動履歴レポート</li>
                </ul>
              </div>

              <Link href="/setup">
                <Button className="w-full" size="lg">
                  初期設定を開始する
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 完了後のUI（重複を減らした形）
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4 md:p-8">
      <RealtimeAlerts userId={userId} />

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
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
              <p className="text-2xl font-bold text-emerald-600">追跡可能</p>
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

        <MapComponent userId={userId} />

        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/alerts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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
