"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  ChevronLeft,
  Bell,
  MessageSquare,
  Phone,
  Clock,
  MapPin,
  User,
  Battery,
  Plus,
  Home,
  Map,
  Settings,
  Send,
  AlertTriangle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { triggerAlert, sendNotificationToContact } from "../actions/notifications"

export default function NotificationsPage() {
  const { toast } = useToast()
  const [isTestingNotification, setIsTestingNotification] = useState(false)

  // 連絡先の状態管理
  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: "連絡先A",
      relation: "家族（主担当）",
      phone: "+81901234567",
      email: "contact-a@example.com",
      primary: true,
      notifications: {
        push: true,
        sms: true,
        call: true,
        email: true,
      },
    },
    {
      id: 2,
      name: "連絡先B",
      relation: "ケアマネージャー",
      phone: "+81908765432",
      email: "contact-b@care.com",
      primary: false,
      notifications: {
        push: true,
        sms: false,
        call: false,
        email: true,
      },
    },
  ])

  const [editingContact, setEditingContact] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newContact, setNewContact] = useState({
    name: "",
    relation: "",
    phone: "",
    email: "",
    primary: false,
    notifications: {
      push: true,
      sms: false,
      call: false,
      email: false,
    },
  })

  // テスト通知送信
  const handleTestNotification = async (contact) => {
    setIsTestingNotification(true)
    try {
      const result = await sendNotificationToContact(
        contact,
        "テスト通知",
        "これはテスト通知です。通知設定が正常に動作しています。",
        "テスト環境",
      )

      const successCount = result.filter((r) => r.success).length
      const totalCount = result.length

      if (successCount > 0) {
        toast({
          title: "テスト通知送信完了",
          description: `${contact.name}さんに${successCount}/${totalCount}件の通知を送信しました。`,
        })
      } else {
        toast({
          title: "通知送信失敗",
          description: "通知の送信に失敗しました。設定を確認してください。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "通知送信中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsTestingNotification(false)
    }
  }

  // 緊急アラートのテスト送信
  const handleEmergencyAlert = async () => {
    setIsTestingNotification(true)
    try {
      const result = await triggerAlert(
        "安全エリア外",
        "佐藤太郎さんが設定された安全エリアの外に出ました。現在位置を確認してください。",
        "東京都新宿区西新宿付近",
      )

      if (result.success) {
        toast({
          title: "緊急アラート送信完了",
          description: "すべての連絡先に緊急アラートを送信しました。",
        })
      } else {
        toast({
          title: "アラート送信失敗",
          description: result.error || "アラートの送信に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "アラート送信中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsTestingNotification(false)
    }
  }

  // 新しい連絡先を追加
  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      const contact = {
        ...newContact,
        id: Date.now(),
      }
      setContacts([...contacts, contact])
      setNewContact({
        name: "",
        relation: "",
        phone: "",
        email: "",
        primary: false,
        notifications: {
          push: true,
          sms: false,
          call: false,
          email: false,
        },
      })
      setIsAddDialogOpen(false)
    }
  }

  // 連絡先を編集
  const handleEditContact = () => {
    if (editingContact) {
      setContacts(contacts.map((contact) => (contact.id === editingContact.id ? editingContact : contact)))
      setEditingContact(null)
      setIsEditDialogOpen(false)
    }
  }

  // 連絡先を削除
  const handleDeleteContact = (id) => {
    setContacts(contacts.filter((contact) => contact.id !== id))
  }

  // 主要連絡先を設定
  const handleSetPrimary = (id) => {
    setContacts(
      contacts.map((contact) => ({
        ...contact,
        primary: contact.id === id,
      })),
    )
  }

  // 編集ダイアログを開く
  const openEditDialog = (contact) => {
    setEditingContact({ ...contact })
    setIsEditDialogOpen(true)
  }

  // 利用可能な安全エリアのデータ
  const safeAreas = [
    { id: "home", name: "自宅エリア", icon: <Home className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-700" },
    {
      id: "daycare",
      name: "デイケアセンター",
      icon: <MapPin className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-700",
    },
    { id: "park", name: "公園散歩コース", icon: <Map className="h-4 w-4" />, color: "bg-amber-100 text-amber-700" },
  ]

  // アラート設定のデータ
  const alertSettings = [
    {
      id: "geofence",
      title: "安全エリア外",
      icon: <MapPin className="h-5 w-5" />,
      description: "設定したジオフェンスの外に出た場合",
      selectedAreas: ["home", "daycare"],
      enabled: true,
    },
    {
      id: "stationary",
      title: "長時間静止",
      icon: <Clock className="h-5 w-5" />,
      description: "30分以上同じ場所に留まっている場合",
      selectedAreas: ["park"],
      enabled: true,
    },
    {
      id: "night",
      title: "夜間外出",
      icon: <User className="h-5 w-5" />,
      description: "22時〜6時の間に外出した場合",
      selectedAreas: ["home"],
      enabled: true,
    },
    {
      id: "battery",
      title: "バッテリー低下",
      icon: <Battery className="h-5 w-5" />,
      description: "デバイスのバッテリーが20%以下になった場合",
      selectedAreas: [], // バッテリーアラートは場所に依存しない
      enabled: true,
    },
  ]

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
            <h1 className="text-xl font-bold">通知設定</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 通知テスト用のカード */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              通知テスト
            </CardTitle>
            <CardDescription>実際の通知送信をテストできます。設定した連絡先に通知が送信されます。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button
                onClick={handleEmergencyAlert}
                disabled={isTestingNotification}
                className="bg-red-600 hover:bg-red-700"
              >
                <Send className="h-4 w-4 mr-1" />
                緊急アラートテスト
              </Button>
              <p className="text-sm text-gray-500 flex items-center">
                すべての連絡先に緊急アラートのテスト通知を送信します
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="settings">通知設定</TabsTrigger>
            <TabsTrigger value="areas">エリア別設定</TabsTrigger>
            <TabsTrigger value="history">通知履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>アラート通知と安全エリア設定</CardTitle>
                  <CardDescription>各種アラートの通知方法と適用する安全エリアを設定します</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {alertSettings.map((alert, i) => (
                      <div key={i} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="p-2 bg-gray-100 rounded-md mr-3">{alert.icon}</div>
                            <div>
                              <p className="font-medium">{alert.title}</p>
                              <p className="text-xs text-gray-500">{alert.description}</p>
                            </div>
                          </div>
                          <Switch checked={alert.enabled} />
                        </div>

                        {/* 安全エリア選択 */}
                        {alert.id !== "battery" && (
                          <div className="mb-4">
                            <label className="text-sm font-medium mb-2 block">適用する安全エリア</label>
                            <div className="space-y-2">
                              {safeAreas.map((area) => (
                                <div key={area.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${alert.id}-${area.id}`}
                                    checked={alert.selectedAreas.includes(area.id)}
                                  />
                                  <label
                                    htmlFor={`${alert.id}-${area.id}`}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <div className={`p-1 rounded-md mr-2 ${area.color}`}>{area.icon}</div>
                                    <span className="text-sm">{area.name}</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {alert.selectedAreas.map((areaId) => {
                                const area = safeAreas.find((a) => a.id === areaId)
                                return area ? (
                                  <Badge key={areaId} variant="secondary" className="text-xs">
                                    {area.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </div>
                        )}

                        {/* 通知方法設定 */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col items-center p-2 border rounded-md bg-emerald-50 border-emerald-200">
                            <Bell className="h-4 w-4 text-emerald-600 mb-1" />
                            <span className="text-xs font-medium">プッシュ通知</span>
                            <span className="text-xs text-gray-500">優先度1</span>
                          </div>
                          <div className="flex flex-col items-center p-2 border rounded-md">
                            <MessageSquare className="h-4 w-4 text-gray-400 mb-1" />
                            <span className="text-xs font-medium text-gray-500">SMS</span>
                            <span className="text-xs text-gray-400">優先度2</span>
                          </div>
                          <div className="flex flex-col items-center p-2 border rounded-md">
                            <Phone className="h-4 w-4 text-gray-400 mb-1" />
                            <span className="text-xs font-medium text-gray-500">電話</span>
                            <span className="text-xs text-gray-400">優先度3</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>通知先設定</CardTitle>
                    <CardDescription>通知を受け取る人を設定します</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="p-3 border rounded-md bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-xs text-gray-500">{contact.relation}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {contact.primary && (
                                <div className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                  主要連絡先
                                </div>
                              )}
                              {!contact.primary && (
                                <Button variant="outline" size="sm" onClick={() => handleSetPrimary(contact.id)}>
                                  主要に設定
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {contact.phone}
                            </div>
                            {contact.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {contact.email}
                              </div>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {contact.notifications.push && (
                              <Badge variant="secondary" className="text-xs">
                                プッシュ
                              </Badge>
                            )}
                            {contact.notifications.sms && (
                              <Badge variant="secondary" className="text-xs">
                                SMS
                              </Badge>
                            )}
                            {contact.notifications.call && (
                              <Badge variant="secondary" className="text-xs">
                                電話
                              </Badge>
                            )}
                            {contact.notifications.email && (
                              <Badge variant="secondary" className="text-xs">
                                メール
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3 flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestNotification(contact)}
                              disabled={isTestingNotification}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              テスト送信
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(contact)}>
                              編集
                            </Button>
                            {!contact.primary && (
                              <Button variant="outline" size="sm" onClick={() => handleDeleteContact(contact.id)}>
                                削除
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* 新しい連絡先を追加するダイアログ */}
                      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full">
                            <Plus className="h-4 w-4 mr-1" />
                            連絡先を追加
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>新しい連絡先を追加</DialogTitle>
                            <DialogDescription>通知を受け取る連絡先の情報を入力してください。</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                名前 *
                              </Label>
                              <Input
                                id="name"
                                value={newContact.name}
                                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                className="col-span-3"
                                placeholder="例: 連絡先の名前"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="relation" className="text-right">
                                続柄
                              </Label>
                              <Input
                                id="relation"
                                value={newContact.relation}
                                onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                                className="col-span-3"
                                placeholder="例: 家族（息子）"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="phone" className="text-right">
                                電話番号 *
                              </Label>
                              <Input
                                id="phone"
                                value={newContact.phone}
                                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                className="col-span-3"
                                placeholder="例: +81901234567"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="email" className="text-right">
                                メール
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                value={newContact.email}
                                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                className="col-span-3"
                                placeholder="例: example@email.com"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">通知方法</Label>
                              <div className="col-span-3 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="push"
                                    checked={newContact.notifications.push}
                                    onCheckedChange={(checked) =>
                                      setNewContact({
                                        ...newContact,
                                        notifications: { ...newContact.notifications, push: checked },
                                      })
                                    }
                                  />
                                  <Label htmlFor="push">プッシュ通知</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="sms"
                                    checked={newContact.notifications.sms}
                                    onCheckedChange={(checked) =>
                                      setNewContact({
                                        ...newContact,
                                        notifications: { ...newContact.notifications, sms: checked },
                                      })
                                    }
                                  />
                                  <Label htmlFor="sms">SMS</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="call"
                                    checked={newContact.notifications.call}
                                    onCheckedChange={(checked) =>
                                      setNewContact({
                                        ...newContact,
                                        notifications: { ...newContact.notifications, call: checked },
                                      })
                                    }
                                  />
                                  <Label htmlFor="call">電話</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="email-notif"
                                    checked={newContact.notifications.email}
                                    onCheckedChange={(checked) =>
                                      setNewContact({
                                        ...newContact,
                                        notifications: { ...newContact.notifications, email: checked },
                                      })
                                    }
                                  />
                                  <Label htmlFor="email-notif">メール</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" onClick={handleAddContact}>
                              追加
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* 連絡先編集ダイアログ */}
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>連絡先を編集</DialogTitle>
                            <DialogDescription>連絡先の情報を編集してください。</DialogDescription>
                          </DialogHeader>
                          {editingContact && (
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">
                                  名前 *
                                </Label>
                                <Input
                                  id="edit-name"
                                  value={editingContact.name}
                                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-relation" className="text-right">
                                  続柄
                                </Label>
                                <Input
                                  id="edit-relation"
                                  value={editingContact.relation}
                                  onChange={(e) => setEditingContact({ ...editingContact, relation: e.target.value })}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-phone" className="text-right">
                                  電話番号 *
                                </Label>
                                <Input
                                  id="edit-phone"
                                  value={editingContact.phone}
                                  onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-email" className="text-right">
                                  メール
                                </Label>
                                <Input
                                  id="edit-email"
                                  type="email"
                                  value={editingContact.email}
                                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">通知方法</Label>
                                <div className="col-span-3 space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="edit-push"
                                      checked={editingContact.notifications.push}
                                      onCheckedChange={(checked) =>
                                        setEditingContact({
                                          ...editingContact,
                                          notifications: { ...editingContact.notifications, push: checked },
                                        })
                                      }
                                    />
                                    <Label htmlFor="edit-push">プッシュ通知</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="edit-sms"
                                      checked={editingContact.notifications.sms}
                                      onCheckedChange={(checked) =>
                                        setEditingContact({
                                          ...editingContact,
                                          notifications: { ...editingContact.notifications, sms: checked },
                                        })
                                      }
                                    />
                                    <Label htmlFor="edit-sms">SMS</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="edit-call"
                                      checked={editingContact.notifications.call}
                                      onCheckedChange={(checked) =>
                                        setEditingContact({
                                          ...editingContact,
                                          notifications: { ...editingContact.notifications, call: checked },
                                        })
                                      }
                                    />
                                    <Label htmlFor="edit-call">電話</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="edit-email-notif"
                                      checked={editingContact.notifications.email}
                                      onCheckedChange={(checked) =>
                                        setEditingContact({
                                          ...editingContact,
                                          notifications: { ...editingContact.notifications, email: checked },
                                        })
                                      }
                                    />
                                    <Label htmlFor="edit-email-notif">メール</Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button type="submit" onClick={handleEditContact}>
                              保存
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>通知スケジュール</CardTitle>
                    <CardDescription>通知を受け取る時間帯を設定します</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">24時間通知を受け取る</span>
                        <Switch checked={false} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">開始時間</label>
                          <Select defaultValue="7">
                            <SelectTrigger>
                              <SelectValue placeholder="開始時間" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }).map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i}:00
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">終了時間</label>
                          <Select defaultValue="22">
                            <SelectTrigger>
                              <SelectValue placeholder="終了時間" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }).map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i}:00
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Button className="w-full">保存</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="areas">
            <Card>
              <CardHeader>
                <CardTitle>安全エリア別詳細設定</CardTitle>
                <CardDescription>各安全エリアごとにアラート設定をカスタマイズできます</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {safeAreas.map((area, i) => (
                    <div key={i} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-md mr-3 ${area.color}`}>{area.icon}</div>
                          <div>
                            <h3 className="font-medium">{area.name}</h3>
                            <p className="text-xs text-gray-500">半径: 約200m</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          編集
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">エリア外アラート</span>
                            <Switch checked={area.id !== "park"} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">長時間静止アラート</span>
                            <Switch checked={area.id === "park"} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">夜間外出アラート</span>
                            <Switch checked={area.id === "home"} />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">静止時間しきい値</label>
                            <Select defaultValue="30">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15分</SelectItem>
                                <SelectItem value="30">30分</SelectItem>
                                <SelectItem value="45">45分</SelectItem>
                                <SelectItem value="60">60分</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">アラート感度</label>
                            <Select defaultValue="medium">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">低</SelectItem>
                                <SelectItem value="medium">中</SelectItem>
                                <SelectItem value="high">高</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>通知履歴</CardTitle>
                <CardDescription>過去30日間の通知履歴を表示します</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "安全エリア外",
                      time: "2025/05/17 10:23",
                      description: "佐藤太郎さんが自宅エリアの外に出ました",
                      area: "自宅エリア",
                      icon: <MapPin className="h-5 w-5" />,
                      color: "bg-amber-100 text-amber-700",
                    },
                    {
                      title: "バッテリー低下",
                      time: "2025/05/16 18:45",
                      description: "デバイスのバッテリーが20%を下回りました",
                      area: "全エリア",
                      icon: <Battery className="h-5 w-5" />,
                      color: "bg-red-100 text-red-700",
                    },
                    {
                      title: "長時間静止",
                      time: "2025/05/16 14:30",
                      description: "公園散歩コースで45分間静止しています",
                      area: "公園散歩コース",
                      icon: <Clock className="h-5 w-5" />,
                      color: "bg-blue-100 text-blue-700",
                    },
                    {
                      title: "安全エリア内",
                      time: "2025/05/16 11:30",
                      description: "佐藤太郎さんが自宅エリアに戻りました",
                      area: "自宅エリア",
                      icon: <MapPin className="h-5 w-5" />,
                      color: "bg-emerald-100 text-emerald-700",
                    },
                  ].map((notification, i) => (
                    <div key={i} className="p-4 border rounded-md">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-md mr-3 ${notification.color}`}>{notification.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                <p className="font-medium">{notification.title}</p>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {notification.area}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">{notification.time}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-center pt-2">
                    <Button variant="outline">さらに表示</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
