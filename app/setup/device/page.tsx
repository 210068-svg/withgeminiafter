"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Smartphone, CheckCircle, Loader2, MapPin, Battery, Wifi, QrCode, ArrowRight } from "lucide-react"
import { registerDevice } from "../../actions/devices"
import { markDeviceSetupComplete } from "../../actions/setup"

export default function DeviceSetupPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [deviceInfo, setDeviceInfo] = useState({
    deviceName: "",
    deviceType: "",
    userId: "",
    phoneNumber: "",
    emergencyContact: "",
    notes: "",
  })
  const [pairingCode, setPairingCode] = useState("")
  const [isDeviceConnected, setIsDeviceConnected] = useState(false)

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

  useEffect(() => {
    setDeviceInfo((prev) => ({ ...prev, userId: currentUserId }))
  }, [currentUserId])

  // デバイス登録処理
  const handleDeviceRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      Object.entries(deviceInfo).forEach(([key, value]) => {
        formData.append(key, value)
      })

      const result = await registerDevice(formData)
      if (result.success) {
        setPairingCode(result.pairingCode)
        setCurrentStep(2)
        toast({
          title: "成功",
          description: "デバイス情報を登録しました",
        })
      } else {
        toast({
          title: "エラー",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "デバイス登録に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // デバイス接続確認
  const handleDeviceConnection = async () => {
    setIsLoading(true)
    try {
      // デバイス接続をシミュレート
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setIsDeviceConnected(true)
      setCurrentStep(3)
      toast({
        title: "成功",
        description: "デバイスが正常に接続されました",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "デバイス接続に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 設定完了
  const handleSetupComplete = async () => {
    setIsLoading(true)
    try {
      const result = await markDeviceSetupComplete(currentUserId)
      if (result.success) {
        toast({
          title: "成功",
          description: "デバイス設定が完了しました",
        })
        // 次のステップに進む
        window.location.href = "/setup/contacts"
      } else {
        toast({
          title: "エラー",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "設定完了の記録に失敗しました",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link href="/setup" className="mr-4">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">見守りデバイス登録</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 進行状況 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep
                        ? "bg-blue-600 text-white"
                        : step === currentStep + 1
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${step < currentStep ? "bg-blue-600" : "bg-gray-200"}`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>デバイス情報</span>
              <span>ペアリング</span>
              <span>接続確認</span>
            </div>
          </div>

          {/* ステップ1: デバイス情報入力 */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  デバイス情報を入力
                </CardTitle>
                <CardDescription>見守り対象者が使用するデバイスの情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDeviceRegistration} className="space-y-4">
                  <div>
                    <Label htmlFor="deviceName">デバイス名 *</Label>
                    <Input
                      id="deviceName"
                      value={deviceInfo.deviceName}
                      onChange={(e) => setDeviceInfo({ ...deviceInfo, deviceName: e.target.value })}
                      placeholder="例: メインデバイス"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deviceType">デバイス種類 *</Label>
                    <Select
                      value={deviceInfo.deviceType}
                      onValueChange={(value) => setDeviceInfo({ ...deviceInfo, deviceType: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="デバイス種類を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smartphone">スマートフォン</SelectItem>
                        <SelectItem value="tablet">タブレット</SelectItem>
                        <SelectItem value="smartwatch">スマートウォッチ</SelectItem>
                        <SelectItem value="gps_tracker">GPSトラッカー</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">電話番号</Label>
                    <Input
                      id="phoneNumber"
                      value={deviceInfo.phoneNumber}
                      onChange={(e) => setDeviceInfo({ ...deviceInfo, phoneNumber: e.target.value })}
                      placeholder="090-1234-5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContact">緊急連絡先</Label>
                    <Input
                      id="emergencyContact"
                      value={deviceInfo.emergencyContact}
                      onChange={(e) => setDeviceInfo({ ...deviceInfo, emergencyContact: e.target.value })}
                      placeholder="090-8765-4321"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">メモ</Label>
                    <Textarea
                      id="notes"
                      value={deviceInfo.notes}
                      onChange={(e) => setDeviceInfo({ ...deviceInfo, notes: e.target.value })}
                      placeholder="デバイスに関するメモ"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    次へ進む
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ステップ2: デバイスペアリング */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  デバイスペアリング
                </CardTitle>
                <CardDescription>デバイスでアプリを開き、ペアリングコードを入力してください</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <div className="p-6 bg-gray-100 rounded-lg">
                    <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-sm text-gray-500">QRコードスキャン</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">または、ペアリングコードを入力:</p>
                    <div className="text-3xl font-mono font-bold bg-blue-50 p-4 rounded-lg border-2 border-dashed border-blue-200">
                      {pairingCode}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>1. デバイスで安心見守りアプリを開く</p>
                    <p>2. 「デバイス追加」を選択</p>
                    <p>3. 上記のコードを入力</p>
                  </div>
                  <Button onClick={handleDeviceConnection} className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    接続確認
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ステップ3: 接続確認 */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-emerald-600" />
                  デバイス接続完了
                </CardTitle>
                <CardDescription>デバイスが正常に接続されました</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="p-4 bg-emerald-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-emerald-800 mb-2">接続成功！</h3>
                    <p className="text-emerald-700">デバイスが正常に登録され、位置情報の取得が開始されました。</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <MapPin className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                      <p className="text-sm font-medium">位置情報</p>
                      <p className="text-xs text-gray-500">取得中</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <Battery className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                      <p className="text-sm font-medium">バッテリー</p>
                      <p className="text-xs text-gray-500">78%</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <Wifi className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                      <p className="text-sm font-medium">通信</p>
                      <p className="text-xs text-gray-500">良好</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">次のステップ</h4>
                    <p className="text-sm text-blue-700">
                      デバイス登録が完了しました。続いて通知を受け取る連絡先を設定しましょう。
                    </p>
                  </div>

                  <Button onClick={handleSetupComplete} className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    通知連絡先の設定に進む
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
