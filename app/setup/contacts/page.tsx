"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  ChevronLeft,
  Bell,
  Loader2,
  Plus,
  Trash2,
  Phone,
  MessageSquare,
  Mail,
  ArrowRight,
  UserPlus,
} from "lucide-react"
import { addCaregiver } from "../../actions/settings"
import { markContactsSetupComplete } from "../../actions/setup"

export default function ContactsSetupPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [contacts, setContacts] = useState([])
  const [newContact, setNewContact] = useState({
    name: "",
    relation: "",
    phone: "",
    email: "",
    role: "家族",
    notifications: {
      push: true,
      sms: false,
      call: false,
      email: false,
    },
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

  // 連絡先を追加
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("name", newContact.name)
      formData.append("relation", newContact.relation)
      formData.append("phone", newContact.phone)
      formData.append("email", newContact.email)
      formData.append("role", newContact.role)
      formData.append("userId", currentUserId)

      const result = await addCaregiver(formData)
      if (result.success) {
        const contactWithNotifications = {
          ...result.data,
          notifications: newContact.notifications,
        }
        setContacts([...contacts, contactWithNotifications])
        setNewContact({
          name: "",
          relation: "",
          phone: "",
          email: "",
          role: "家族",
          notifications: {
            push: true,
            sms: false,
            call: false,
            email: false,
          },
        })
        toast({
          title: "成功",
          description: "連絡先を追加しました",
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
        description: "連絡先の追加に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 連絡先を削除
  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  // 設定完了
  const handleSetupComplete = async () => {
    if (contacts.length === 0) {
      toast({
        title: "エラー",
        description: "最低1つの連絡先を追加してください",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await markContactsSetupComplete(currentUserId)
      if (result.success) {
        toast({
          title: "成功",
          description: "通知連絡先の設定が完了しました",
        })
        // 次のステップに進む
        window.location.href = "/setup/geofence"
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
            <h1 className="text-xl font-bold">通知連絡先設定</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                通知を受け取る連絡先
              </CardTitle>
              <CardDescription>
                緊急時やアラート発生時に通知を受け取る連絡先を設定してください。最低1つの連絡先が必要です。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 既存の連絡先リスト */}
                {contacts.map((contact, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{contact.name}</h4>
                        <p className="text-sm text-gray-500">{contact.relation}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveContact(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {contact.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {contact.email}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {contact.notifications.push && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">プッシュ</span>
                      )}
                      {contact.notifications.sms && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">SMS</span>
                      )}
                      {contact.notifications.call && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">電話</span>
                      )}
                      {contact.notifications.email && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">メール</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* 新しい連絡先追加フォーム */}
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-4">
                    <form onSubmit={handleAddContact} className="space-y-4">
                      <div className="flex items-center mb-4">
                        <UserPlus className="h-5 w-5 mr-2 text-gray-600" />
                        <h4 className="font-medium">新しい連絡先を追加</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">名前 *</Label>
                          <Input
                            id="name"
                            value={newContact.name}
                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                            placeholder="例: 連絡先の名前"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="relation">続柄 *</Label>
                          <Input
                            id="relation"
                            value={newContact.relation}
                            onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                            placeholder="例: 家族（息子）"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">電話番号</Label>
                          <Input
                            id="phone"
                            value={newContact.phone}
                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                            placeholder="090-1234-5678"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">メールアドレス</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newContact.email}
                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                            placeholder="example@email.com"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="role">役割</Label>
                        <Select
                          value={newContact.role}
                          onValueChange={(value) => setNewContact({ ...newContact, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="役割を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="主要担当者">主要担当者</SelectItem>
                            <SelectItem value="専門職">専門職</SelectItem>
                            <SelectItem value="家族">家族</SelectItem>
                            <SelectItem value="その他">その他</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">通知方法</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
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
                            <Label htmlFor="push" className="text-sm">
                              プッシュ通知
                            </Label>
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
                            <Label htmlFor="sms" className="text-sm">
                              SMS
                            </Label>
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
                            <Label htmlFor="call" className="text-sm">
                              電話
                            </Label>
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
                            <Label htmlFor="email-notif" className="text-sm">
                              メール
                            </Label>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        連絡先を追加
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* 通知テスト */}
          {contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>通知テスト</CardTitle>
                <CardDescription>設定した連絡先に実際にテスト通知を送信できます</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <Bell className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">テスト通知について</p>
                        <p className="text-xs text-blue-600 mt-1">
                          実際の緊急時と同じ方法で通知が送信されます。設定が正しく動作するか確認してください。
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    テスト通知を送信
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 完了ボタン */}
          <div className="space-y-4">
            {contacts.length === 0 && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start">
                  <Bell className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">連絡先が必要です</p>
                    <p className="text-xs text-amber-600 mt-1">
                      緊急時に通知を受け取るため、最低1つの連絡先を追加してください。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSetupComplete} className="w-full" disabled={isLoading || contacts.length === 0}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              安全エリアの設定に進む
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
