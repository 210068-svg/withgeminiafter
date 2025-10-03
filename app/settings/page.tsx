"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  User,
  Shield,
  MapPin,
  Battery,
  Clock,
  Smartphone,
  UserCog,
  Plus,
  Edit,
  Trash2,
  Upload,
  Loader2,
  CheckCircle,
  RefreshCw,
} from "lucide-react"
import {
  updateUserProfile,
  updateAccountInfo,
  addCaregiver,
  updateCaregiver,
  deleteCaregiver,
  updateDeviceSettings,
  updateAppSettings,
  updatePrivacySettings,
  uploadProfileImage,
  getUserProfile,
  getCaregivers,
  getAccountInfo,
} from "../actions/settings"

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [isAddCaregiverOpen, setIsAddCaregiverOpen] = useState(false)
  const [editingCaregiver, setEditingCaregiver] = useState(null)
  const [isEditCaregiverOpen, setIsEditCaregiverOpen] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)

  // 動的ユーザーID生成
  const [currentUserId] = useState(() => {
    // 実際のアプリではログイン情報から取得
    if (typeof window !== "undefined") {
      const existingId = localStorage.getItem("userId")
      if (existingId) return existingId

      const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("userId", newId)
      return newId
    }
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })

  // データ状態
  const [userProfile, setUserProfile] = useState(null)
  const [caregivers, setCaregivers] = useState([])
  const [accountInfo, setAccountInfo] = useState(null)

  // フォーム状態
  const [profileForm, setProfileForm] = useState({
    lastName: "",
    firstName: "",
    birthDate: "",
    address: "",
    emergencyContact: "",
    medicalInfo: "",
  })

  const [accountForm, setAccountForm] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // ケア担当者追加フォームの状態を追加
  const [addCaregiverForm, setAddCaregiverForm] = useState({
    name: "",
    relation: "",
    phone: "",
    email: "",
    role: "家族",
  })

  // ダイアログを閉じる時のリセット処理を追加
  const handleAddDialogClose = (open: boolean) => {
    setIsAddCaregiverOpen(open)
    if (!open) {
      // ダイアログを閉じる時にフォームをリセット
      setAddCaregiverForm({
        name: "",
        relation: "",
        phone: "",
        email: "",
        role: "家族",
      })
    }
  }

  const handleEditDialogClose = (open: boolean) => {
    setIsEditCaregiverOpen(open)
    if (!open) {
      setEditingCaregiver(null)
    }
  }

  // データ読み込み
  const loadData = async () => {
    setIsDataLoading(true)
    try {
      const [profileResult, caregiversResult, accountResult] = await Promise.all([
        getUserProfile(currentUserId),
        getCaregivers(currentUserId),
        getAccountInfo(currentUserId),
      ])

      if (profileResult.success && profileResult.data) {
        setUserProfile(profileResult.data)
        setProfileForm({
          lastName: profileResult.data.lastName || "",
          firstName: profileResult.data.firstName || "",
          birthDate: profileResult.data.birthDate || "",
          address: profileResult.data.address || "",
          emergencyContact: profileResult.data.emergencyContact || "",
          medicalInfo: profileResult.data.medicalInfo || "",
        })
      }

      if (caregiversResult.success) {
        setCaregivers(caregiversResult.data)
      }

      if (accountResult.success && accountResult.data) {
        setAccountInfo(accountResult.data)
        setAccountForm({
          email: accountResult.data.email || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "データの読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsDataLoading(false)
    }
  }

  // 初回データ読み込み
  useEffect(() => {
    loadData()
  }, [currentUserId])

  // プロフィールフォーム送信
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("userId", currentUserId)
      formData.append("lastName", profileForm.lastName)
      formData.append("firstName", profileForm.firstName)
      formData.append("birthDate", profileForm.birthDate)
      formData.append("address", profileForm.address)
      formData.append("emergencyContact", profileForm.emergencyContact)
      formData.append("medicalInfo", profileForm.medicalInfo)

      const result = await updateUserProfile(formData)

      if (result.success) {
        setUserProfile(result.data)
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
        description: "予期しないエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // アカウントフォーム送信処理を以下に変更
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 重複送信防止
    if (isLoading) return

    setIsLoading(true)

    try {
      // クライアントサイドバリデーション
      if (!accountForm.email.trim()) {
        toast({
          title: "エラー",
          description: "メールアドレスを入力してください",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // パスワード確認のバリデーション
      if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
        toast({
          title: "エラー",
          description: "新しいパスワードが一致しません",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // パスワード長のチェック
      if (accountForm.newPassword && accountForm.newPassword.length < 8) {
        toast({
          title: "エラー",
          description: "パスワードは8文字以上で入力してください",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const formData = new FormData()
      formData.append("userId", currentUserId)
      formData.append("email", accountForm.email.trim())
      formData.append("currentPassword", accountForm.currentPassword)
      formData.append("newPassword", accountForm.newPassword)
      formData.append("confirmPassword", accountForm.confirmPassword)

      const result = await updateAccountInfo(formData)

      if (result.success) {
        setAccountInfo(result.data)
        // パスワードフィールドをクリア
        setAccountForm({
          ...accountForm,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
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
      console.error("Account update error:", error)
      toast({
        title: "エラー",
        description: "ネットワークエラーが発生しました。しばらく後でお試しください。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // プロフィール画像アップロード
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImageUploading(true)
    const formData = new FormData()
    formData.append("profileImage", file)
    formData.append("userId", currentUserId)

    try {
      const result = await uploadProfileImage(formData)
      if (result.success) {
        // プロフィール情報を更新
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            profileImage: result.imageUrl,
          })
        }
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
        description: "画像のアップロードに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsImageUploading(false)
    }
  }

  // ケア担当者の削除処理を以下に変更
  const handleDeleteCaregiver = async (caregiverId: string) => {
    const caregiver = caregivers.find((c) => c.id === caregiverId)
    if (!caregiver) return

    if (!confirm(`${caregiver.name}さんを削除しますか？この操作は取り消せません。`)) return

    // 重複送信防止
    if (isLoading) return

    setIsLoading(true)
    try {
      const result = await deleteCaregiver(caregiverId)
      if (result.success) {
        setCaregivers(caregivers.filter((c) => c.id !== caregiverId))
        toast({
          title: "成功",
          description: `${caregiver.name}さんを削除しました`,
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

  // ケア担当者追加処理を以下に変更:
  const handleAddCaregiverSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 重複送信防止
    if (isLoading) return

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("name", addCaregiverForm.name.trim())
      formData.append("relation", addCaregiverForm.relation.trim())
      formData.append("phone", addCaregiverForm.phone.trim())
      formData.append("email", addCaregiverForm.email.trim())
      formData.append("role", addCaregiverForm.role)
      formData.append("userId", currentUserId)

      const result = await addCaregiver(formData)
      if (result.success) {
        setCaregivers([...caregivers, result.data])
        setIsAddCaregiverOpen(false)
        // フォームをリセット
        setAddCaregiverForm({
          name: "",
          relation: "",
          phone: "",
          email: "",
          role: "家族",
        })
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
        description: "追加に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 編集フォームの初期化処理を追加
  const openEditDialog = (caregiver) => {
    setEditingCaregiver({ ...caregiver })
    setIsEditCaregiverOpen(true)
  }

  // ケア担当者編集フォームの処理を以下に変更
  const handleEditCaregiverSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 重複送信防止
    if (isLoading) return

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("caregiverId", editingCaregiver.id)
      formData.append("name", editingCaregiver.name.trim())
      formData.append("relation", editingCaregiver.relation.trim())
      formData.append("phone", editingCaregiver.phone.trim())
      formData.append("email", editingCaregiver.email.trim())
      formData.append("role", editingCaregiver.role)

      const result = await updateCaregiver(formData)
      if (result.success) {
        setCaregivers(caregivers.map((c) => (c.id === result.data.id ? result.data : c)))
        setIsEditCaregiverOpen(false)
        setEditingCaregiver(null)
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
        description: "更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // フォーム送信ハンドラー（その他の設定）
  const handleFormSubmit = async (action: any, formData: FormData, successMessage: string) => {
    setIsLoading(true)
    try {
      const result = await action(formData)
      if (result.success) {
        toast({
          title: "成功",
          description: result.message || successMessage,
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
        description: "予期しないエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isDataLoading) {
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
              <h1 className="text-xl font-bold">設定</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">設定情報を読み込み中...</p>
          </div>
        </main>
      </div>
    )
  }

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
              <h1 className="text-xl font-bold">設定</h1>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={isDataLoading}>
              {isDataLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              更新
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>初回設定:</strong>{" "}
            まずは利用者情報を入力してください。必須項目は姓名のみです。その他の情報は後から追加できます。
          </p>
        </div>

        <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-100">
          <p className="text-sm text-green-800">
            <strong>データ保存機能:</strong> すべての設定変更は自動的に保存され、リアルタイムで反映されます。
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile">プロフィール</TabsTrigger>
            <TabsTrigger value="device">デバイス</TabsTrigger>
            <TabsTrigger value="preferences">環境設定</TabsTrigger>
            <TabsTrigger value="privacy">プライバシー</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>利用者情報</CardTitle>
                  <CardDescription>見守り対象者の情報を設定します</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit}>
                    <div className="space-y-4">
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {userProfile?.profileImage ? (
                              <img
                                src={userProfile.profileImage || "/placeholder.svg"}
                                alt="プロフィール画像"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-12 w-12 text-gray-400" />
                            )}
                          </div>
                          <label htmlFor="profile-image" className="absolute bottom-0 right-0 cursor-pointer">
                            <div className="rounded-full w-8 h-8 bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700">
                              {isImageUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </div>
                          </label>
                          <input
                            id="profile-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isImageUploading}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="lastName">姓 *</Label>
                          <Input
                            id="lastName"
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                            required
                            disabled={isLoading}
                            placeholder="例: 山田"
                          />
                        </div>
                        <div>
                          <Label htmlFor="firstName">名 *</Label>
                          <Input
                            id="firstName"
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                            required
                            disabled={isLoading}
                            placeholder="例: 太郎"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="birthDate">生年月日</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={profileForm.birthDate}
                          onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">住所</Label>
                        <Input
                          id="address"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          disabled={isLoading}
                          placeholder="例: 東京都新宿区西新宿1-1-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContact">緊急連絡先</Label>
                        <Input
                          id="emergencyContact"
                          value={profileForm.emergencyContact}
                          onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                          disabled={isLoading}
                          placeholder="例: 090-1234-5678（家族）"
                        />
                      </div>
                      <div>
                        <Label htmlFor="medicalInfo">医療情報</Label>
                        <Textarea
                          id="medicalInfo"
                          value={profileForm.medicalInfo}
                          onChange={(e) => setProfileForm({ ...profileForm, medicalInfo: e.target.value })}
                          rows={3}
                          disabled={isLoading}
                          placeholder="例: 服用中の薬、アレルギー、既往歴など"
                        />
                      </div>
                      {userProfile?.updatedAt && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          最終更新: {new Date(userProfile.updatedAt).toLocaleString("ja-JP")}
                        </div>
                      )}
                      <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          保存
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ケア担当者</CardTitle>
                    <CardDescription>ケア担当者の情報を設定します</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {caregivers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <UserCog className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">まだケア担当者が登録されていません</p>
                          <p className="text-xs">下のボタンから追加してください</p>
                        </div>
                      ) : (
                        caregivers.map((caregiver) => (
                          <div key={caregiver.id} className="p-3 border rounded-md bg-white">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center">
                                <div className="p-2 bg-gray-100 rounded-full mr-2">
                                  <UserCog className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{caregiver.name}</p>
                                  <p className="text-xs text-gray-500">{caregiver.relation}</p>
                                  <p className="text-xs text-gray-500">{caregiver.phone}</p>
                                  {caregiver.email && <p className="text-xs text-gray-500">{caregiver.email}</p>}
                                </div>
                              </div>
                              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {caregiver.role}
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  openEditDialog(caregiver)
                                }}
                                disabled={isLoading}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                編集
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCaregiver(caregiver.id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                削除
                              </Button>
                            </div>
                          </div>
                        ))
                      )}

                      {/* ケア担当者追加ダイアログ */}
                      <Dialog open={isAddCaregiverOpen} onOpenChange={handleAddDialogClose}>
                        <DialogTrigger asChild>
                          <Button className="w-full" disabled={isLoading}>
                            <Plus className="h-4 w-4 mr-1" />
                            ケア担当者を追加
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <form onSubmit={handleAddCaregiverSubmit}>
                            <DialogHeader>
                              <DialogTitle>ケア担当者を追加</DialogTitle>
                              <DialogDescription>新しいケア担当者の情報を入力してください。</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="add-name" className="text-right">
                                  名前 *
                                </Label>
                                <Input
                                  id="add-name"
                                  value={addCaregiverForm.name}
                                  onChange={(e) => setAddCaregiverForm({ ...addCaregiverForm, name: e.target.value })}
                                  className="col-span-3"
                                  required
                                  placeholder="例: 連絡先の名前"
                                  disabled={isLoading}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="add-relation" className="text-right">
                                  続柄 *
                                </Label>
                                <Input
                                  id="add-relation"
                                  value={addCaregiverForm.relation}
                                  onChange={(e) =>
                                    setAddCaregiverForm({ ...addCaregiverForm, relation: e.target.value })
                                  }
                                  className="col-span-3"
                                  required
                                  placeholder="例: 家族（息子）"
                                  disabled={isLoading}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="add-phone" className="text-right">
                                  電話番号
                                </Label>
                                <Input
                                  id="add-phone"
                                  value={addCaregiverForm.phone}
                                  onChange={(e) => setAddCaregiverForm({ ...addCaregiverForm, phone: e.target.value })}
                                  className="col-span-3"
                                  placeholder="例: 090-1234-5678"
                                  disabled={isLoading}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="add-email" className="text-right">
                                  メール
                                </Label>
                                <Input
                                  id="add-email"
                                  type="email"
                                  value={addCaregiverForm.email}
                                  onChange={(e) => setAddCaregiverForm({ ...addCaregiverForm, email: e.target.value })}
                                  className="col-span-3"
                                  placeholder="例: example@email.com"
                                  disabled={isLoading}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="add-role" className="text-right">
                                  役割
                                </Label>
                                <Select
                                  value={addCaregiverForm.role}
                                  onValueChange={(value) => setAddCaregiverForm({ ...addCaregiverForm, role: value })}
                                  disabled={isLoading}
                                >
                                  <SelectTrigger className="col-span-3">
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
                            </div>
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddCaregiverOpen(false)}
                                disabled={isLoading}
                              >
                                キャンセル
                              </Button>
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                追加
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>

                      {/* ケア担当者編集ダイアログ */}
                      <Dialog open={isEditCaregiverOpen} onOpenChange={handleEditDialogClose}>
                        <DialogContent className="sm:max-w-[425px]">
                          {editingCaregiver && (
                            <form onSubmit={handleEditCaregiverSubmit}>
                              <input type="hidden" name="caregiverId" value={editingCaregiver.id} />
                              <DialogHeader>
                                <DialogTitle>ケア担当者を編集</DialogTitle>
                                <DialogDescription>ケア担当者の情報を編集してください。</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-name" className="text-right">
                                    名前 *
                                  </Label>
                                  <Input
                                    id="edit-name"
                                    value={editingCaregiver.name}
                                    onChange={(e) => setEditingCaregiver({ ...editingCaregiver, name: e.target.value })}
                                    className="col-span-3"
                                    required
                                    disabled={isLoading}
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-relation" className="text-right">
                                    続柄 *
                                  </Label>
                                  <Input
                                    id="edit-relation"
                                    value={editingCaregiver.relation}
                                    onChange={(e) =>
                                      setEditingCaregiver({ ...editingCaregiver, relation: e.target.value })
                                    }
                                    className="col-span-3"
                                    required
                                    disabled={isLoading}
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-phone" className="text-right">
                                    電話番号
                                  </Label>
                                  <Input
                                    id="edit-phone"
                                    value={editingCaregiver.phone}
                                    onChange={(e) =>
                                      setEditingCaregiver({ ...editingCaregiver, phone: e.target.value })
                                    }
                                    className="col-span-3"
                                    disabled={isLoading}
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-email" className="text-right">
                                    メール
                                  </Label>
                                  <Input
                                    id="edit-email"
                                    type="email"
                                    value={editingCaregiver.email}
                                    onChange={(e) =>
                                      setEditingCaregiver({ ...editingCaregiver, email: e.target.value })
                                    }
                                    className="col-span-3"
                                    disabled={isLoading}
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-role" className="text-right">
                                    役割
                                  </Label>
                                  <Select
                                    value={editingCaregiver.role}
                                    onValueChange={(value) => setEditingCaregiver({ ...editingCaregiver, role: value })}
                                    disabled={isLoading}
                                  >
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="主要担当者">主要担当者</SelectItem>
                                      <SelectItem value="専門職">専門職</SelectItem>
                                      <SelectItem value="家族">家族</SelectItem>
                                      <SelectItem value="その他">その他</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsEditCaregiverOpen(false)}
                                  disabled={isLoading}
                                >
                                  キャンセル
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                  保存
                                </Button>
                              </DialogFooter>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>アカウント設定</CardTitle>
                    <CardDescription>アカウント情報を設定します</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAccountSubmit}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">メールアドレス *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={accountForm.email}
                            onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                            required
                            placeholder="例: user@example.com"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <Label htmlFor="currentPassword">現在のパスワード</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={accountForm.currentPassword}
                            onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                            placeholder="パスワードを変更する場合のみ入力"
                            disabled={isLoading}
                          />
                          <p className="text-xs text-gray-500 mt-1">パスワードを変更する場合のみ入力してください</p>
                        </div>
                        <div>
                          <Label htmlFor="newPassword">新しいパスワード</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={accountForm.newPassword}
                            onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                            placeholder="8文字以上で入力"
                            disabled={isLoading}
                          />
                          <p className="text-xs text-gray-500 mt-1">8文字以上、大文字・小文字・数字を含む</p>
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={accountForm.confirmPassword}
                            onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                            placeholder="新しいパスワードを再入力"
                            disabled={isLoading}
                          />
                          {accountForm.newPassword &&
                            accountForm.confirmPassword &&
                            accountForm.newPassword !== accountForm.confirmPassword && (
                              <p className="text-xs text-red-500 mt-1">パスワードが一致しません</p>
                            )}
                        </div>
                        {accountInfo?.lastPasswordChange && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            最終パスワード変更: {new Date(accountInfo.lastPasswordChange).toLocaleString("ja-JP")}
                          </div>
                        )}
                        <div className="pt-4">
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            保存
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="device">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>デバイス情報</CardTitle>
                  <CardDescription>ウェアラブルデバイスの情報を表示します</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-6 bg-gray-100 rounded-full">
                        <Smartphone className="h-12 w-12 text-gray-600" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">デバイス名</span>
                        <span className="font-medium">安心ウォッチ Pro</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">シリアル番号</span>
                        <span className="font-medium">AW-12345-JP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">ファームウェア</span>
                        <span className="font-medium">v2.3.1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">最終同期</span>
                        <span className="font-medium">2分前</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">バッテリー状態</span>
                        <div className="flex items-center">
                          <Battery className="h-4 w-4 text-emerald-500 mr-1" />
                          <span className="font-medium text-emerald-600">78%</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 space-y-2">
                      <Button variant="outline" className="w-full bg-transparent">
                        デバイスを再起動
                      </Button>
                      <Button variant="outline" className="w-full bg-transparent">
                        ファームウェアを更新
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>測位設定</CardTitle>
                    <CardDescription>位置情報の取得頻度を設定します</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      action={async (formData) => {
                        await handleFormSubmit(updateDeviceSettings, formData, "デバイス設定を更新しました")
                      }}
                    >
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="trackingMode">トラッキングモード</Label>
                          <Select name="trackingMode" defaultValue="balanced">
                            <SelectTrigger id="trackingMode">
                              <SelectValue placeholder="トラッキングモードを選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">高精度（1分ごと、バッテリー消費大）</SelectItem>
                              <SelectItem value="balanced">バランス（5分ごと、推奨）</SelectItem>
                              <SelectItem value="low">省電力（15分ごと、バッテリー節約）</SelectItem>
                              <SelectItem value="adaptive">適応型（活動に応じて自動調整）</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="powerSaving">省電力モード</Label>
                            <p className="text-xs text-gray-500">静止時は測位頻度を下げます</p>
                          </div>
                          <Switch id="powerSaving" name="powerSaving" defaultChecked={true} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="indoorTracking">屋内トラッキング</Label>
                            <p className="text-xs text-gray-500">Wi-Fi/BLEビーコンを使用</p>
                          </div>
                          <Switch id="indoorTracking" name="indoorTracking" defaultChecked={true} />
                        </div>
                        <div className="pt-4">
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            保存
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>アラート感度</CardTitle>
                    <CardDescription>各種アラートの感度を設定します</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          title: "ジオフェンス",
                          icon: <MapPin className="h-4 w-4" />,
                          description: "安全エリアからの逸脱検知",
                        },
                        {
                          title: "静止検知",
                          icon: <Clock className="h-4 w-4" />,
                          description: "同じ場所に留まる時間",
                        },
                        {
                          title: "徘徊検知",
                          icon: <User className="h-4 w-4" />,
                          description: "異常な移動パターン",
                        },
                      ].map((alert, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center">
                            <div className="p-1 bg-gray-100 rounded-md mr-2">{alert.icon}</div>
                            <div>
                              <p className="font-medium text-sm">{alert.title}</p>
                              <p className="text-xs text-gray-500">{alert.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs">低</span>
                            <div className="flex-1">
                              <input type="range" min="1" max="5" defaultValue="3" className="w-full" />
                            </div>
                            <span className="text-xs">高</span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-4">
                        <Button className="w-full">保存</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preferences">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>アプリ設定</CardTitle>
                  <CardDescription>アプリの表示や動作を設定します</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    action={async (formData) => {
                      await handleFormSubmit(updateAppSettings, formData, "アプリ設定を更新しました")
                    }}
                  >
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="language">言語</Label>
                        <Select name="language" defaultValue="ja">
                          <SelectTrigger id="language">
                            <SelectValue placeholder="言語を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ja">日本語</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="zh">中文</SelectItem>
                            <SelectItem value="ko">한국어</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="theme">テーマ</Label>
                        <Select name="theme" defaultValue="light">
                          <SelectTrigger id="theme">
                            <SelectValue placeholder="テーマを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">ライト</SelectItem>
                            <SelectItem value="dark">ダーク</SelectItem>
                            <SelectItem value="system">システム設定に合わせる</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="mapStyle">地図スタイル</Label>
                        <Select name="mapStyle" defaultValue="standard">
                          <SelectTrigger id="mapStyle">
                            <SelectValue placeholder="地図スタイルを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">標準</SelectItem>
                            <SelectItem value="satellite">衛星写真</SelectItem>
                            <SelectItem value="hybrid">ハイブリッド</SelectItem>
                            <SelectItem value="simple">シンプル</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="sound">通知音</Label>
                          <p className="text-xs text-gray-500">アラート時に音を鳴らす</p>
                        </div>
                        <Switch id="sound" name="sound" defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="vibration">バイブレーション</Label>
                          <p className="text-xs text-gray-500">アラート時に振動する</p>
                        </div>
                        <Switch id="vibration" name="vibration" defaultChecked={true} />
                      </div>
                      <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          保存
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>通知設定</CardTitle>
                    <CardDescription>通知の受け取り方を設定します</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="push-notifications">プッシュ通知</Label>
                          <p className="text-xs text-gray-500">アプリからの通知を受け取る</p>
                        </div>
                        <Switch id="push-notifications" defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="sms-notifications">SMS通知</Label>
                          <p className="text-xs text-gray-500">重要なアラートをSMSで受け取る</p>
                        </div>
                        <Switch id="sms-notifications" defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifications">メール通知</Label>
                          <p className="text-xs text-gray-500">日次レポートをメールで受け取る</p>
                        </div>
                        <Switch id="email-notifications" defaultChecked={false} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="call-notifications">電話通知</Label>
                          <p className="text-xs text-gray-500">緊急時に自動電話を受け取る</p>
                        </div>
                        <Switch id="call-notifications" defaultChecked={true} />
                      </div>
                      <div className="pt-4">
                        <Button className="w-full">保存</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>レポート設定</CardTitle>
                    <CardDescription>レポートの生成頻度を設定します</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="report-frequency">レポート頻度</Label>
                        <Select defaultValue="daily">
                          <SelectTrigger id="report-frequency">
                            <SelectValue placeholder="頻度を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">毎日</SelectItem>
                            <SelectItem value="weekly">毎週</SelectItem>
                            <SelectItem value="monthly">毎月</SelectItem>
                            <SelectItem value="none">生成しない</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="report-format">レポート形式</Label>
                        <Select defaultValue="pdf">
                          <SelectTrigger id="report-format">
                            <SelectValue placeholder="形式を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="both">両方</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-share">自動共有</Label>
                          <p className="text-xs text-gray-500">ケア担当者と自動共有</p>
                        </div>
                        <Switch id="auto-share" defaultChecked={true} />
                      </div>
                      <div className="pt-4">
                        <Button className="w-full">保存</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>プライバシー設定</CardTitle>
                  <CardDescription>データの収集と共有を設定します</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    action={async (formData) => {
                      await handleFormSubmit(updatePrivacySettings, formData, "プライバシー設定を更新しました")
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="locationTracking">位置情報の追跡</Label>
                          <p className="text-xs text-gray-500">リアルタイムの位置情報を収集</p>
                        </div>
                        <Switch id="locationTracking" name="locationTracking" defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="dataSharing">データ共有</Label>
                          <p className="text-xs text-gray-500">ケア担当者とデータを共有</p>
                        </div>
                        <Switch id="dataSharing" name="dataSharing" defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="analytics">分析データ</Label>
                          <p className="text-xs text-gray-500">サービス改善のためのデータ提供</p>
                        </div>
                        <Switch id="analytics" name="analytics" defaultChecked={false} />
                      </div>
                      <div>
                        <Label htmlFor="dataRetention">データ保持期間</Label>
                        <Select name="dataRetention" defaultValue="6months">
                          <SelectTrigger id="dataRetention">
                            <SelectValue placeholder="期間を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1month">1ヶ月</SelectItem>
                            <SelectItem value="3months">3ヶ月</SelectItem>
                            <SelectItem value="6months">6ヶ月</SelectItem>
                            <SelectItem value="1year">1年</SelectItem>
                            <SelectItem value="forever">無期限</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-md border border-blue-100 mt-4">
                        <div className="flex items-start">
                          <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">データ保護について</p>
                            <p className="text-xs text-blue-600 mt-1">
                              すべてのデータはAES-256で暗号化され、厳格なアクセス制御のもとで保管されます。データは法的に必要な期間のみ保持されます。
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          保存
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>データ管理</CardTitle>
                    <CardDescription>収集されたデータの管理を行います</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="pt-2">
                        <Button variant="outline" className="w-full bg-transparent">
                          位置履歴をダウンロード
                        </Button>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" className="w-full bg-transparent">
                          アラート履歴をダウンロード
                        </Button>
                      </div>
                      <div className="pt-2">
                        <Button variant="destructive" className="w-full">
                          すべてのデータを削除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>アクセス管理</CardTitle>
                    <CardDescription>データへのアクセス権を管理します</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">アクセス権限はケア担当者追加時に自動設定されます</p>
                        <p className="text-xs">詳細な権限管理は今後のアップデートで追加予定です</p>
                      </div>
                      <div className="pt-2">
                        <Button className="w-full" disabled>
                          <Plus className="h-4 w-4 mr-1" />
                          アクセス権を追加（準備中）
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
