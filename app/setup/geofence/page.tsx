"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, MapPin, CheckCircle, Loader2, Home, Building, Trees, Plus, Trash2 } from "lucide-react"
import { markGeofenceSetupComplete } from "../../actions/setup"

export default function GeofenceSetupPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [geofences, setGeofences] = useState([])
  const [newGeofence, setNewGeofence] = useState({
    name: "",
    type: "",
    address: "",
    radius: "200",
    description: "",
  })

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

  // ジオフェンスを追加
  const handleAddGeofence = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGeofence.name || !newGeofence.type || !newGeofence.address) {
      toast({
        title: "エラー",
        description: "必須項目を入力してください",
        variant: "destructive",
      })
      return
    }

    const geofence = {
      id: Date.now().toString(),
      ...newGeofence,
      coordinates: {
        lat: 35.6895 + (Math.random() - 0.5) * 0.01,
        lng: 139.6917 + (Math.random() - 0.5) * 0.01,
      },
    }

    setGeofences([...geofences, geofence])
    setNewGeofence({
      name: "",
      type: "",
      address: "",
      radius: "200",
      description: "",
    })

    toast({
      title: "成功",
      description: "安全エリアを追加しました",
    })
  }

  // ジオフェンスを削除
  const handleRemoveGeofence = (id: string) => {
    setGeofences(geofences.filter((g) => g.id !== id))
  }

  // 設定完了
  const handleSetupComplete = async () => {
    if (geofences.length === 0) {
      toast({
        title: "エラー",
        description: "最低1つの安全エリアを設定してください",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await markGeofenceSetupComplete(currentUserId)
      if (result.success) {
        toast({
          title: "成功",
          description: "安全エリアの設定が完了しました",
        })
        // 設定完了画面に進む
        window.location.href = "/setup"
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
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getGeofenceIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="h-5 w-5" />
      case "facility":
        return <Building className="h-5 w-5" />
      case "park":
        return <Trees className="h-5 w-5" />
      default:
        return <MapPin className="h-5 w-5" />
    }
  }

  const getGeofenceColor = (type: string) => {
    switch (type) {
      case "home":
        return "bg-emerald-100 text-emerald-700"
      case "facility":
        return "bg-blue-100 text-blue-700"
      case "park":
        return "bg-amber-100 text-amber-700"
      default:
        return "bg-gray-100 text-gray-700"
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
            <h1 className="text-xl font-bold">安全エリア設定</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                安全エリア（ジオフェンス）
              </CardTitle>
              <CardDescription>
                見守り対象者が安全に過ごせるエリアを設定してください。このエリアを出た場合にアラートが発生します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 既存のジオフェンスリスト */}
                {geofences.map((geofence) => (
                  <div key={geofence.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${getGeofenceColor(geofence.type)}`}>
                          {getGeofenceIcon(geofence.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{geofence.name}</h4>
                          <p className="text-sm text-gray-500">{geofence.address}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveGeofence(geofence.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>半径: {geofence.radius}m</p>
                      {geofence.description && <p>説明: {geofence.description}</p>}
                    </div>
                  </div>
                ))}

                {/* 新しいジオフェンス追加フォーム */}
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-4">
                    <form onSubmit={handleAddGeofence} className="space-y-4">
                      <div className="flex items-center mb-4">
                        <Plus className="h-5 w-5 mr-2 text-gray-600" />
                        <h4 className="font-medium">新しい安全エリアを追加</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">エリア名 *</Label>
                          <Input
                            id="name"
                            value={newGeofence.name}
                            onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
                            placeholder="例: 自宅エリア"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">エリア種類 *</Label>
                          <Select
                            value={newGeofence.type}
                            onValueChange={(value) => setNewGeofence({ ...newGeofence, type: value })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="種類を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="home">自宅</SelectItem>
                              <SelectItem value="facility">施設</SelectItem>
                              <SelectItem value="park">公園・散歩コース</SelectItem>
                              <SelectItem value="other">その他</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address">住所 *</Label>
                        <Input
                          id="address"
                          value={newGeofence.address}
                          onChange={(e) => setNewGeofence({ ...newGeofence, address: e.target.value })}
                          placeholder="例: 東京都新宿区西新宿1-1-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="radius">半径（メートル）</Label>
                        <Select
                          value={newGeofence.radius}
                          onValueChange={(value) => setNewGeofence({ ...newGeofence, radius: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">100m</SelectItem>
                            <SelectItem value="200">200m</SelectItem>
                            <SelectItem value="300">300m</SelectItem>
                            <SelectItem value="500">500m</SelectItem>
                            <SelectItem value="1000">1000m</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="description">説明</Label>
                        <Input
                          id="description"
                          value={newGeofence.description}
                          onChange={(e) => setNewGeofence({ ...newGeofence, description: e.target.value })}
                          placeholder="例: 平日の日中に利用"
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        安全エリアを追加
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* 地図プレビュー */}
          {geofences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>エリアプレビュー</CardTitle>
                <CardDescription>設定した安全エリアの位置を確認できます</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">地図プレビュー</p>
                    <p className="text-xs">設定したエリアが表示されます</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 完了ボタン */}
          <div className="space-y-4">
            {geofences.length === 0 && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">安全エリアが必要です</p>
                    <p className="text-xs text-amber-600 mt-1">
                      アラート機能を有効にするため、最低1つの安全エリアを設定してください。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSetupComplete} className="w-full" disabled={isLoading || geofences.length === 0}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              設定を完了する
            </Button>

            {geofences.length > 0 && (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">設定完了準備完了</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      すべての必要な設定が完了しました。「設定を完了する」ボタンを押してアプリの利用を開始してください。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
