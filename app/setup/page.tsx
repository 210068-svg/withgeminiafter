"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Smartphone, Bell, MapPin, CheckCircle, ArrowRight, Shield, Loader2 } from "lucide-react"
import { getSetupProgress, resetSetupStatus } from "../actions/setup"

export default function SetupWizardPage() {
  const { toast } = useToast()
  const [setupProgress, setSetupProgress] = useState(null)
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

  // 進行状況を取得
  const loadProgress = async () => {
    setIsLoading(true)
    try {
      const result = await getSetupProgress(currentUserId)
      if (result.success) {
        setSetupProgress(result.data)
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "進行状況の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 設定をリセット（開発用）
  const handleReset = async () => {
    if (!confirm("設定をリセットしますか？")) return

    try {
      const result = await resetSetupStatus(currentUserId)
      if (result.success) {
        toast({
          title: "成功",
          description: "設定をリセットしました",
        })
        loadProgress()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "リセットに失敗しました",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadProgress()
  }, [currentUserId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">初期設定ウィザード</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">設定状況を確認中...</p>
          </div>
        </main>
      </div>
    )
  }

  const steps = [
    {
      id: "device",
      title: "見守りデバイス登録",
      description: "位置情報を取得するデバイスを登録します",
      icon: <Smartphone className="h-6 w-6" />,
      href: "/setup/device",
      completed: setupProgress?.status?.hasDevice || false,
    },
    {
      id: "contacts",
      title: "通知連絡先設定",
      description: "アラートを受け取る連絡先を設定します",
      icon: <Bell className="h-6 w-6" />,
      href: "/setup/contacts",
      completed: setupProgress?.status?.hasContacts || false,
    },
    {
      id: "geofence",
      title: "安全エリア設定",
      description: "ジオフェンスエリアを設定します",
      icon: <MapPin className="h-6 w-6" />,
      href: "/setup/geofence",
      completed: setupProgress?.status?.hasGeofence || false,
    },
  ]

  const currentStepIndex = steps.findIndex((step) => step.id === setupProgress?.nextStep)
  const isComplete = setupProgress?.nextStep === "complete"

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">初期設定ウィザード</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              設定リセット
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* 進行状況 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>設定の進行状況</CardTitle>
              <CardDescription>
                {setupProgress?.completedSteps || 0} / {setupProgress?.totalSteps || 3} 完了
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={setupProgress?.progress || 0} className="w-full" />
                <p className="text-sm text-gray-600">
                  {isComplete
                    ? "すべての設定が完了しました！"
                    : `次のステップ: ${steps.find((s) => s.id === setupProgress?.nextStep)?.title || "不明"}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 設定完了メッセージ */}
          {isComplete && (
            <Card className="mb-8 border-emerald-200 bg-emerald-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="p-4 bg-emerald-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-800 mb-2">設定完了！</h2>
                  <p className="text-emerald-700 mb-6">
                    安心見守りアプリの初期設定がすべて完了しました。
                    <br />
                    これでアプリのすべての機能をご利用いただけます。
                  </p>
                  <Link href="/">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Shield className="h-4 w-4 mr-2" />
                      ダッシュボードに移動
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 設定ステップ */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card
                key={step.id}
                className={`transition-all ${
                  step.completed
                    ? "border-emerald-200 bg-emerald-50"
                    : index === currentStepIndex
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3 rounded-full ${
                          step.completed
                            ? "bg-emerald-100 text-emerald-600"
                            : index === currentStepIndex
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {step.completed ? <CheckCircle className="h-6 w-6" /> : step.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                        {step.completed && <p className="text-sm text-emerald-600 font-medium mt-1">✓ 設定完了</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {step.completed ? (
                        <Link href={step.href}>
                          <Button variant="outline" size="sm">
                            再設定
                          </Button>
                        </Link>
                      ) : index === currentStepIndex ? (
                        <Link href={step.href}>
                          <Button>
                            設定開始
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          待機中
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ヘルプ情報 */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>設定について</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">1. 見守りデバイス登録</h4>
                  <p>
                    位置情報を取得するスマートフォンやウェアラブルデバイスを登録します。デバイスの位置情報許可が必要です。
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">2. 通知連絡先設定</h4>
                  <p>
                    緊急時やアラート発生時に通知を受け取る連絡先を設定します。家族やケア担当者の連絡先を登録してください。
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">3. 安全エリア設定</h4>
                  <p>
                    見守り対象者が安全に過ごせるエリア（ジオフェンス）を設定します。このエリアを出た場合にアラートが発生します。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
