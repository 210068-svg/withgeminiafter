"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Settings, Clock, Battery, Shield, MapPin, Smartphone, AlertTriangle, CheckCircle } from "lucide-react"
import MapComponent from "./map-component"
import { checkSetupStatus } from "./actions/setup"

export default function Home() {
  const [setupStatus, setSetupStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // 動的ユーザーID生成
  const [currentUserId] = useState(() => {
    if (typeof window !== "undefined") {
      const existingId = localStorage.getItem("userId")
      if (existingId) return existingId

      const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("userId", newId)
      return newId
    }
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })

  // 設定状況をチェック
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const result = await checkSetupStatus(currentUserId)
        setSetupStatus(result.data)
      } catch (error) {
        console.error("Setup status check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSetup()
  }, [currentUserId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">安心見守りアプリ</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">設定状況を確認中...</p>
          </div>
        </main>
      </div>
    )
  }

  // 設定が未完了の場合は設定画面に誘導
  if (!setupStatus?.isComplete) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">安心見守りアプリ</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="p-4 bg-amber-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">初期設定が必要です</h2>
              <p className="text-gray-600">
                安心見守りアプリをご利用いただくには、デバイスの登録と連絡先の設定が必要です。
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>設定の進行状況</CardTitle>
                <CardDescription>以下の設定を完了してください</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-full mr-3">
                        <Smartphone className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">見守りデバイスの登録</p>
                        <p className="text-sm text-gray-500">位置情報を取得するデバイスを登録</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {setupStatus?.hasDevice ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-full mr-3">
                        <Bell className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">通知連絡先の設定</p>
                        <p className="text-sm text-gray-500">アラートを受け取る連絡先を設定</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {setupStatus?.hasContacts ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-full mr-3">
                        <MapPin className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">安全エリアの設定</p>
                        <p className="text-sm text-gray-500">ジオフェンスエリアを設定</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {setupStatus?.hasGeofence ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">設定完了後の機能</p>
                      <ul className="text-xs text-blue-600 mt-1 space-y-1">
                        <li>• リアルタイム位置追跡</li>
                        <li>• 安全エリア外アラート</li>
                        <li>• 緊急時自動通知</li>
                        <li>• 移動履歴レポート</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {!setupStatus?.hasDevice && (
                <Link href="/setup/device" className="block">
                  <Button className="w-full h-12 text-lg">
                    <Smartphone className="h-5 w-5 mr-2" />
                    見守りデバイスを登録する
                  </Button>
                </Link>
              )}

              {setupStatus?.hasDevice && !setupStatus?.hasContacts && (
                <Link href="/setup/contacts" className="block">
                  <Button className="w-full h-12 text-lg">
                    <Bell className="h-5 w-5 mr-2" />
                    通知連絡先を設定する
                  </Button>
                </Link>
              )}

              {setupStatus?.hasDevice && setupStatus?.hasContacts && !setupStatus?.hasGeofence && (
                <Link href="/setup/geofence" className="block">
                  <Button className="w-full h-12 text-lg">
                    <MapPin className="h-5 w-5 mr-2" />
                    安全エリアを設定する
                  </Button>
                </Link>
              )}

              <Link href="/setup" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  設定ウィザードを開始
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 設定完了後のメイン画面
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">安心見守りアプリ</h1>
          </div>
          <nav>
            <Button variant="ghost" size="sm">
              ログアウト
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center">
                <div className="w-2 h-2 bg-emerald-600 rounded-full mr-2 animate-pulse"></div>
                オンライン
              </div>
              <Button variant="outline" size="sm">
                更新
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>現在位置</CardTitle>
                <CardDescription>最終更新: 2分前</CardDescription>
              </CardHeader>
              <CardContent>
                <MapComponent />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>アラート状況</span>
                    <Bell className="h-5 w-5 text-amber-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-md border border-green-100">
                      <p className="text-sm font-medium text-green-800">安全エリア内</p>
                      <p className="text-xs text-green-600">自宅エリア内にいます</p>
                    </div>
                    <Link href="/alerts" className="text-sm text-emerald-600 hover:underline block">
                      アラート履歴を表示 →
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>デバイス状態</span>
                    <Battery className="h-5 w-5 text-emerald-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>バッテリー</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">残り約4日</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>GPS信号</span>
                        <span className="font-medium text-emerald-600">良好</span>
                      </div>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-2 w-full rounded-full ${i <= 3 ? "bg-emerald-500" : "bg-gray-200"}`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">クイックアクセス</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                title: "デバイス管理",
                icon: <Smartphone className="h-6 w-6" />,
                href: "/devices",
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                title: "ジオフェンス設定",
                icon: <MapPin className="h-6 w-6" />,
                href: "/geofence",
                color: "bg-blue-50 text-blue-600",
              },
              {
                title: "通知設定",
                icon: <Bell className="h-6 w-6" />,
                href: "/notifications",
                color: "bg-amber-50 text-amber-600",
              },
              {
                title: "履歴・レポート",
                icon: <Clock className="h-6 w-6" />,
                href: "/history",
                color: "bg-purple-50 text-purple-600",
              },
              {
                title: "設定",
                icon: <Settings className="h-6 w-6" />,
                href: "/settings",
                color: "bg-gray-50 text-gray-600",
              },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex flex-col items-center p-6 rounded-lg border hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
              >
                <div className={`p-3 rounded-full mb-3 ${item.color}`}>{item.icon}</div>
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 安心見守りアプリ. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Button variant="link" size="sm">
                プライバシーポリシー
              </Button>
              <Button variant="link" size="sm">
                利用規約
              </Button>
              <Button variant="link" size="sm">
                サポート
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
