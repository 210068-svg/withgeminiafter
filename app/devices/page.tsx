"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  Smartphone,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Battery,
  QrCode,
  Play,
  Pause,
  RefreshCw,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react"
import {
  registerDevice,
  updateDevice,
  deleteDevice,
  startLocationTracking,
  stopLocationTracking,
  getDeviceLocation,
  updateDeviceStatus,
  confirmPairing,
} from "../actions/devices"

export default function DevicesPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false)
  const [isEditDeviceOpen, setIsEditDeviceOpen] = useState(false)
  const [isPairingOpen, setIsPairingOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState(null)
  const [pairingCode, setPairingCode] = useState("")
  const [qrCodeData, setQrCodeData] = useState("")

  // デバイス一覧のサンプルデータ（実際のアプリではAPIから取得）
  const [devices, setDevices] = useState([
    {
      id: "device_001",
      name: "メインデバイス",
      type: "smartphone",
      brand: "Apple",
      model: "iPhone 14",
      userId: "user_001",
      userName: "利用者A",
      phoneNumber: "090-1234-5678",
      emergencyContact: "090-8765-4321",
      status: "online",
      isActive: true,
      isTracking: true,
      batteryLevel: 78,
      lastSeen: "2分前",
      location: {
        latitude: 35.6895,
        longitude: 139.6917,
        accuracy: 12,
        address: "東京都新宿区西新宿1-1-1",
        timestamp: new Date().toISOString(),
      },
      registeredAt: "2025-01-01T10:00:00Z",
      notes: "主要デバイス",
    },
    {
      id: "device_002",
      name: "サブデバイス",
      type: "smartphone",
      brand: "Samsung",
      model: "Galaxy S23",
      userId: "user_002",
      userName: "利用者B",
      phoneNumber: "090-2345-6789",
      emergencyContact: "090-1234-5678",
      status: "offline",
      isActive: false,
      isTracking: false,
      batteryLevel: 45,
      lastSeen: "1時間前",
      location: {
        latitude: 35.6912,
        longitude: 139.6956,
        accuracy: 8,
        address: "東京都新宿区西新宿2-2-2",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      registeredAt: "2025-01-02T14:30:00Z",
      notes: "サブデバイス",
    },
  ])

  // デバイス登録処理
  const handleRegisterDevice = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const result = await registerDevice(formData)
      if (result.success) {
        toast({
          title: "成功",
          description: result.message,
        })
        setPairingCode(result.pairingCode)
        setQrCodeData(`pairing:${result.deviceId}:${result.pairingCode}`)
        setIsAddDeviceOpen(false)
        setIsPairingOpen(true)
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

  // デバイス更新処理
  const handleUpdateDevice = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const result = await updateDevice(formData)
      if (result.success) {
        toast({
          title: "成功",
          description: result.message,
        })
        setIsEditDeviceOpen(false)
        setEditingDevice(null)
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
        description: "更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // デバイス削除処理
  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm("このデバイスを削除しますか？")) return

    setIsLoading(true)
    try {
      const result = await deleteDevice(deviceId)
      if (result.success) {
        setDevices(devices.filter((d) => d.id !== deviceId))
        toast({
          title: "成功",
          description: result.message,
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
        description: "削除に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 位置情報取得開始/停止
  const handleToggleTracking = async (deviceId: string, isCurrentlyTracking: boolean) => {
    setIsLoading(true)
    try {
      const result = isCurrentlyTracking ? await stopLocationTracking(deviceId) : await startLocationTracking(deviceId)

      if (result.success) {
        setDevices(
          devices.map((device) => (device.id === deviceId ? { ...device, isTracking: !isCurrentlyTracking } : device)),
        )
        toast({
          title: "成功",
          description: result.message,
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
        description: "操作に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 位置情報を手動で取得
  const handleGetLocation = async (deviceId: string) => {
    setIsLoading(true)
    try {
      const result = await getDeviceLocation(deviceId)
      if (result.success) {
        setDevices(
          devices.map((device) =>
            device.id === deviceId
              ? {
                  ...device,
                  location: result.location,
                  lastSeen: "今",
                }
              : device,
          ),
        )
        toast({
          title: "成功",
          description: "位置情報を更新しました",
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
        description: "位置情報の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // デバイス状態の切り替え
  const handleToggleDeviceStatus = async (deviceId: string, currentStatus: boolean) => {
    const newStatus = currentStatus ? "inactive" : "active"
    setIsLoading(true)
    try {
      const result = await updateDeviceStatus(deviceId, newStatus)
      if (result.success) {
        setDevices(
          devices.map((device) =>
            device.id === deviceId
              ? {
                  ...device,
                  isActive: !currentStatus,
                  status: !currentStatus ? "online" : "offline",
                }
              : device,
          ),
        )
        toast({
          title: "成功",
          description: result.message,
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
        description: "状態の変更に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // デバイスアイコンの取得
  const getDeviceIcon = (type: string, brand: string) => {
    return <Smartphone className="h-5 w-5" />
  }

  // ステータスバッジの取得
  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return (
        <Badge variant="secondary" className="text-xs">
          無効
        </Badge>
      )
    }

    switch (status) {
      case "online":
        return (
          <Badge className="text-xs bg-emerald-100 text-emerald-700">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse"></div>
            オンライン
          </Badge>
        )
      case "offline":
        return (
          <Badge variant="secondary" className="text-xs">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
            オフライン
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            不明
          </Badge>
        )
    }
  }

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
            <h1 className="text-xl font-bold">デバイス管理</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>デバイス登録:</strong>{" "}
            スマートフォンやタブレットを位置情報デバイスとして登録し、リアルタイムで位置を追跡できます。
          </p>
        </div>

        {/* デバイス統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">登録デバイス</p>
                  <p className="text-2xl font-bold">{devices.length}</p>
                </div>
                <Smartphone className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">オンライン</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {devices.filter((d) => d.status === "online" && d.isActive).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">追跡中</p>
                  <p className="text-2xl font-bold text-blue-600">{devices.filter((d) => d.isTracking).length}</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">要注意</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {devices.filter((d) => d.batteryLevel < 20 || d.status === "offline").length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* デバイス一覧 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>登録デバイス一覧</CardTitle>
                <CardDescription>位置情報を取得するデバイスを管理します</CardDescription>
              </div>
              <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    デバイス追加
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <form action={handleRegisterDevice}>
                    <DialogHeader>
                      <DialogTitle>新しいデバイスを登録</DialogTitle>
                      <DialogDescription>
                        位置情報を取得するスマートフォンやタブレットを登録してください。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="deviceName" className="text-right">
                          デバイス名 *
                        </Label>
                        <Input
                          id="deviceName"
                          name="deviceName"
                          placeholder="例: メインデバイス"
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="deviceType" className="text-right">
                          デバイス種類 *
                        </Label>
                        <Select name="deviceType" required>
                          <SelectTrigger className="col-span-3">
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
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="userId" className="text-right">
                          利用者 *
                        </Label>
                        <Select name="userId" required>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="利用者を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user_001">利用者A</SelectItem>
                            <SelectItem value="user_002">利用者B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phoneNumber" className="text-right">
                          電話番号
                        </Label>
                        <Input id="phoneNumber" name="phoneNumber" placeholder="090-1234-5678" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="emergencyContact" className="text-right">
                          緊急連絡先
                        </Label>
                        <Input
                          id="emergencyContact"
                          name="emergencyContact"
                          placeholder="090-8765-4321"
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                          メモ
                        </Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          placeholder="デバイスに関するメモ"
                          className="col-span-3"
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        登録
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-gray-100 rounded-lg">{getDeviceIcon(device.type, device.brand)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{device.name}</h3>
                          {getStatusBadge(device.status, device.isActive)}
                          {device.isTracking && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              追跡中
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {device.userName}
                            </span>
                            <span className="flex items-center">
                              <Smartphone className="h-3 w-3 mr-1" />
                              {device.brand} {device.model}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              最終確認: {device.lastSeen}
                            </span>
                          </div>
                          {device.location && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {device.location.address}
                              <span className="ml-2 text-xs text-gray-400">(精度: {device.location.accuracy}m)</span>
                            </div>
                          )}
                          {device.phoneNumber && (
                            <div className="flex items-center">
                              <span>📞 {device.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-sm">
                        <Battery
                          className={`h-4 w-4 ${device.batteryLevel > 20 ? "text-emerald-500" : "text-red-500"}`}
                        />
                        <span className={device.batteryLevel > 20 ? "text-emerald-600" : "text-red-600"}>
                          {device.batteryLevel}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Switch
                          checked={device.isActive}
                          onCheckedChange={() => handleToggleDeviceStatus(device.id, device.isActive)}
                          disabled={isLoading}
                        />
                        <span className="text-xs text-gray-500">有効</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleTracking(device.id, device.isTracking)}
                        disabled={!device.isActive || isLoading}
                      >
                        {device.isTracking ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            追跡停止
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            追跡開始
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGetLocation(device.id)}
                        disabled={!device.isActive || isLoading}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        位置更新
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDevice(device)
                          setIsEditDeviceOpen(true)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        編集
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDevice(device.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {devices.length === 0 && (
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">登録されたデバイスがありません</p>
                  <p className="text-sm text-gray-400">「デバイス追加」ボタンから新しいデバイスを登録してください</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* デバイス編集ダイアログ */}
        <Dialog open={isEditDeviceOpen} onOpenChange={setIsEditDeviceOpen}>
          <DialogContent className="sm:max-w-[500px]">
            {editingDevice && (
              <form action={handleUpdateDevice}>
                <input type="hidden" name="deviceId" value={editingDevice.id} />
                <DialogHeader>
                  <DialogTitle>デバイス情報を編集</DialogTitle>
                  <DialogDescription>デバイスの設定を変更してください。</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-deviceName" className="text-right">
                      デバイス名 *
                    </Label>
                    <Input
                      id="edit-deviceName"
                      name="deviceName"
                      defaultValue={editingDevice.name}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-phoneNumber" className="text-right">
                      電話番号
                    </Label>
                    <Input
                      id="edit-phoneNumber"
                      name="phoneNumber"
                      defaultValue={editingDevice.phoneNumber}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-emergencyContact" className="text-right">
                      緊急連絡先
                    </Label>
                    <Input
                      id="edit-emergencyContact"
                      name="emergencyContact"
                      defaultValue={editingDevice.emergencyContact}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-notes" className="text-right">
                      メモ
                    </Label>
                    <Textarea
                      id="edit-notes"
                      name="notes"
                      defaultValue={editingDevice.notes}
                      className="col-span-3"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-isActive" className="text-right">
                      デバイス有効
                    </Label>
                    <Switch
                      id="edit-isActive"
                      name="isActive"
                      defaultChecked={editingDevice.isActive}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    保存
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* ペアリングダイアログ */}
        <Dialog open={isPairingOpen} onOpenChange={setIsPairingOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>デバイスペアリング</DialogTitle>
              <DialogDescription>
                デバイスでアプリを開き、以下のペアリングコードを入力するか、QRコードをスキャンしてください。
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="text-center space-y-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-500">QRコードスキャン</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">または、ペアリングコードを入力:</p>
                  <div className="text-2xl font-mono font-bold bg-blue-50 p-3 rounded-lg border-2 border-dashed border-blue-200">
                    {pairingCode}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <p>このコードは10分間有効です</p>
                  <p>デバイスでアプリを開き、「デバイス追加」からコードを入力してください</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPairingOpen(false)}>
                閉じる
              </Button>
              <Button
                onClick={async () => {
                  const result = await confirmPairing(pairingCode, { deviceId: "mock" })
                  if (result.success) {
                    toast({
                      title: "成功",
                      description: result.message,
                    })
                    setIsPairingOpen(false)
                  }
                }}
              >
                ペアリング確認
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
