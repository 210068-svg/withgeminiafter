"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Download,
  MapPin,
  Clock,
  ArrowRight,
  Home,
  Building,
  TreePine,
  Filter,
  Search,
  Calendar,
  ChevronRight,
  Save,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react"
import MapComponent from "../map-component"
import { getHistoryData, exportHistoryToCSV, getStatisticsData, saveFilterPreset } from "../actions/history"

export default function HistoryPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false)

  // フィルター状態
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7日前
    endDate: new Date().toISOString().split("T")[0], // 今日
    location: "all",
    searchQuery: "",
    userId: "user_001",
  })

  // データ状態
  const [historyData, setHistoryData] = useState([])
  const [statisticsData, setStatisticsData] = useState(null)
  const [totalRecords, setTotalRecords] = useState(0)

  // フィルタープリセット
  const [filterPresets] = useState([
    {
      name: "今日",
      filters: {
        ...filters,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      },
    },
    {
      name: "昨日",
      filters: {
        ...filters,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
    },
    {
      name: "過去7日間",
      filters: { ...filters, startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
    },
    {
      name: "過去30日間",
      filters: { ...filters, startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
    },
  ])

  // データ読み込み
  const loadData = async (newFilters = filters) => {
    setIsLoading(true)
    try {
      const [historyResult, statsResult] = await Promise.all([
        getHistoryData(newFilters),
        getStatisticsData(newFilters),
      ])

      if (historyResult.success) {
        setHistoryData(historyResult.data)
        setTotalRecords(historyResult.totalRecords)
      } else {
        toast({
          title: "エラー",
          description: historyResult.error,
          variant: "destructive",
        })
      }

      if (statsResult.success) {
        setStatisticsData(statsResult.data)
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "データの読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 初回データ読み込み
  useEffect(() => {
    loadData()
  }, [])

  // フィルター変更ハンドラー
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    loadData(newFilters)
  }

  // 日付ナビゲーション
  const navigateDate = (direction: "prev" | "next") => {
    const currentStart = new Date(filters.startDate)
    const currentEnd = new Date(filters.endDate)
    const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24))

    let newStart: Date
    let newEnd: Date

    if (direction === "prev") {
      newStart = new Date(currentStart.getTime() - (daysDiff + 1) * 24 * 60 * 60 * 1000)
      newEnd = new Date(currentEnd.getTime() - (daysDiff + 1) * 24 * 60 * 60 * 1000)
    } else {
      newStart = new Date(currentStart.getTime() + (daysDiff + 1) * 24 * 60 * 60 * 1000)
      newEnd = new Date(currentEnd.getTime() + (daysDiff + 1) * 24 * 60 * 60 * 1000)
    }

    const newFilters = {
      ...filters,
      startDate: newStart.toISOString().split("T")[0],
      endDate: newEnd.toISOString().split("T")[0],
    }
    setFilters(newFilters)
    loadData(newFilters)
  }

  // プリセット適用
  const applyPreset = (preset: any) => {
    const newFilters = { ...filters, ...preset.filters }
    setFilters(newFilters)
    loadData(newFilters)
  }

  // CSVエクスポート
  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const result = await exportHistoryToCSV(filters)
      if (result.success) {
        // ブラウザでCSVファイルをダウンロード
        const blob = new Blob([result.csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", result.filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "成功",
          description: "CSVファイルをダウンロードしました",
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
        description: "エクスポートに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // フィルタープリセット保存
  const handleSavePreset = async (name: string) => {
    try {
      const result = await saveFilterPreset(name, filters)
      if (result.success) {
        toast({
          title: "成功",
          description: result.message,
        })
        setIsSavePresetOpen(false)
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
        description: "保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  // フィルターリセット
  const resetFilters = () => {
    const defaultFilters = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      location: "all",
      searchQuery: "",
      userId: "user_001",
    }
    setFilters(defaultFilters)
    loadData(defaultFilters)
  }

  // アイコン取得
  const getLocationIcon = (location: string) => {
    if (location.includes("自宅")) return <Home className="h-4 w-4" />
    if (location.includes("デイケア") || location.includes("病院")) return <Building className="h-4 w-4" />
    if (location.includes("公園")) return <TreePine className="h-4 w-4" />
    return <MapPin className="h-4 w-4" />
  }

  const getLocationColor = (location: string) => {
    if (location.includes("自宅")) return "bg-emerald-100 text-emerald-700"
    if (location.includes("デイケア")) return "bg-blue-100 text-blue-700"
    if (location.includes("公園")) return "bg-green-100 text-green-700"
    if (location.includes("病院")) return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-700"
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
            <h1 className="text-xl font-bold">履歴・レポート</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-100">
          <p className="text-sm text-green-800">
            <strong>動的フィルター:</strong> 日付範囲、場所、検索条件を変更すると、リアルタイムでデータが更新されます。
          </p>
        </div>

        {/* フィルター・検索セクション */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                <CardTitle>フィルター・検索</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => loadData()} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  更新
                </Button>
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-1" />
                  リセット
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* クイックフィルター */}
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">クイックフィルター</Label>
              <div className="flex flex-wrap gap-2">
                {filterPresets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                    className="text-xs"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* 詳細フィルター */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="start-date">開始日</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">終了日</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="location-filter">場所フィルター</Label>
                <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
                  <SelectTrigger id="location-filter">
                    <SelectValue placeholder="場所を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての場所</SelectItem>
                    <SelectItem value="自宅">自宅</SelectItem>
                    <SelectItem value="デイケア">デイケアセンター</SelectItem>
                    <SelectItem value="公園">公園</SelectItem>
                    <SelectItem value="病院">病院</SelectItem>
                    <SelectItem value="スーパー">スーパーマーケット</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="search">場所検索</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="場所名で検索..."
                    value={filters.searchQuery}
                    onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={handleExportCSV} disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  CSV出力
                </Button>
              </div>
              <div className="flex items-end">
                <Dialog open={isSavePresetOpen} onOpenChange={setIsSavePresetOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Save className="h-4 w-4 mr-1" />
                      保存
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>フィルター設定を保存</DialogTitle>
                      <DialogDescription>現在のフィルター設定に名前を付けて保存します。</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="preset-name" className="text-right">
                          名前
                        </Label>
                        <Input
                          id="preset-name"
                          placeholder="例: 今週の活動"
                          className="col-span-3"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSavePreset((e.target as HTMLInputElement).value)
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        onClick={() => {
                          const input = document.getElementById("preset-name") as HTMLInputElement
                          if (input.value) {
                            handleSavePreset(input.value)
                          }
                        }}
                      >
                        保存
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* 日付ナビゲーション */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                  前の期間
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                  次の期間
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                {totalRecords}件の記録が見つかりました
                {filters.searchQuery && (
                  <span className="ml-2">
                    「<strong>{filters.searchQuery}</strong>」で検索中
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="detailed-log" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="detailed-log">詳細ログ</TabsTrigger>
            <TabsTrigger value="timeline">タイムライン</TabsTrigger>
            <TabsTrigger value="heatmap">ヒートマップ</TabsTrigger>
            <TabsTrigger value="stats">統計情報</TabsTrigger>
          </TabsList>

          <TabsContent value="detailed-log">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>詳細行動ログ</CardTitle>
                    <CardDescription>
                      {filters.startDate} 〜 {filters.endDate} の記録（{historyData.length}件）
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {historyData.map((log, index) => (
                        <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg bg-white">
                          <div className="flex flex-col items-center">
                            <div className={`p-2 rounded-full ${getLocationColor(log.location)}`}>
                              {getLocationIcon(log.location)}
                            </div>
                            {index < historyData.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2"></div>}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-lg">{log.time}</span>
                                <Badge
                                  variant={
                                    log.type === "arrival"
                                      ? "default"
                                      : log.type === "departure"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {log.type === "arrival" ? "到着" : log.type === "departure" ? "出発" : "活動"}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.coordinates.lat.toFixed(4)}, {log.coordinates.lng.toFixed(4)}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900">
                                {filters.searchQuery &&
                                log.location.toLowerCase().includes(filters.searchQuery.toLowerCase()) ? (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: log.location.replace(
                                        new RegExp(`(${filters.searchQuery})`, "gi"),
                                        "<mark>$1</mark>",
                                      ),
                                    }}
                                  />
                                ) : (
                                  log.location
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                {filters.searchQuery &&
                                log.address.toLowerCase().includes(filters.searchQuery.toLowerCase()) ? (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: log.address.replace(
                                        new RegExp(`(${filters.searchQuery})`, "gi"),
                                        "<mark>$1</mark>",
                                      ),
                                    }}
                                  />
                                ) : (
                                  log.address
                                )}
                              </p>
                              {log.activity && (
                                <p className="text-sm text-blue-600 font-medium">活動: {log.activity}</p>
                              )}
                              <div className="flex space-x-4 text-xs text-gray-500">
                                {log.travelTime && (
                                  <span className="flex items-center">
                                    <ArrowRight className="h-3 w-3 mr-1" />
                                    移動時間: {log.travelTime}
                                  </span>
                                )}
                                {log.stayDuration && (
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    滞在時間: {log.stayDuration}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {historyData.length === 0 && !isLoading && (
                        <div className="text-center py-8">
                          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">指定した条件に一致する記録が見つかりません</p>
                          <p className="text-sm text-gray-400">フィルター条件を変更してお試しください</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>期間サマリー</CardTitle>
                    <CardDescription>選択期間の概要</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statisticsData ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{statisticsData.summary.totalDays}</p>
                            <p className="text-xs text-blue-600">対象日数</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{statisticsData.summary.totalLocations}</p>
                            <p className="text-xs text-green-600">訪問場所数</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <p className="text-2xl font-bold text-amber-600">{statisticsData.summary.totalMovements}</p>
                            <p className="text-xs text-amber-600">移動回数</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-lg font-bold text-purple-600">
                              {statisticsData.summary.averageOutingTime}
                            </p>
                            <p className="text-xs text-purple-600">平均外出時間</p>
                          </div>
                        </div>
                        <div className="pt-2">
                          <h4 className="font-medium mb-2">時間パターン</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>最も活発な時間</span>
                              <span className="font-medium">{statisticsData.timePatterns.mostActiveHour}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>平均外出開始</span>
                              <span className="font-medium">{statisticsData.timePatterns.averageOutingStart}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>平均帰宅時刻</span>
                              <span className="font-medium">{statisticsData.timePatterns.averageReturnTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>移動タイムライン</CardTitle>
                    <CardDescription>選択期間の移動履歴</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MapComponent />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>移動経路</CardTitle>
                    <CardDescription>時系列での移動記録</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-6 border-l-2 border-gray-200 space-y-6 py-2">
                      {historyData.slice(0, 10).map((point, i) => (
                        <div key={point.id} className="relative">
                          <div className="absolute -left-[30px] p-1 rounded-full bg-white border-2 border-gray-200">
                            <div className={`p-1 rounded-full ${getLocationColor(point.location)}`}>
                              <MapPin className="h-4 w-4" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold">{point.time}</p>
                            <p className="font-medium">{point.location}</p>
                            <p className="text-xs text-gray-500">
                              座標: {point.coordinates.lat.toFixed(4)}, {point.coordinates.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="heatmap">
            <Card>
              <CardHeader>
                <CardTitle>滞在ヒートマップ</CardTitle>
                <CardDescription>滞在時間が長い場所ほど濃い色で表示されます</CardDescription>
              </CardHeader>
              <CardContent>
                <MapComponent initialZoom={13} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>場所別滞在時間分析</CardTitle>
                  <CardDescription>各場所での滞在時間と訪問回数</CardDescription>
                </CardHeader>
                <CardContent>
                  {statisticsData ? (
                    <div className="space-y-4">
                      {statisticsData.locationStats.map((stat, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className="p-2 bg-gray-100 rounded-md mr-3">{getLocationIcon(stat.location)}</div>
                              <div>
                                <p className="font-medium">{stat.location}</p>
                                <p className="text-xs text-gray-500">訪問回数: {stat.visits}回</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{stat.totalTime}</p>
                              <p className="text-xs text-gray-500">{stat.percentage}%</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${stat.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>時間帯別活動パターン</CardTitle>
                  <CardDescription>選択期間の活動パターン分析</CardDescription>
                </CardHeader>
                <CardContent>
                  {statisticsData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-lg font-bold text-blue-600">
                            {statisticsData.timePatterns.averageOutingStart}
                          </p>
                          <p className="text-xs text-blue-600">平均外出開始</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-lg font-bold text-green-600">
                            {statisticsData.timePatterns.averageReturnTime}
                          </p>
                          <p className="text-xs text-green-600">平均帰宅時刻</p>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                        <p className="text-sm font-medium text-blue-800">活動パターン分析</p>
                        <p className="text-xs text-blue-600 mt-1">
                          選択した期間では規則正しい生活パターンを維持しています。
                          {filters.location !== "all" && `${filters.location}での活動に焦点を当てた分析結果です。`}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">期間統計</h4>
                        <div className="flex justify-between text-sm">
                          <span>対象日数</span>
                          <span className="font-medium">{statisticsData.summary.totalDays}日</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>総移動回数</span>
                          <span className="font-medium">{statisticsData.summary.totalMovements}回</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>訪問場所数</span>
                          <span className="font-medium">{statisticsData.summary.totalLocations}箇所</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
