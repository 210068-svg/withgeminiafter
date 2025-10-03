import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, MapPin, Battery, Clock, User, Bell, Filter } from "lucide-react"

export default function AlertsPage() {
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
            <h1 className="text-xl font-bold">アラート履歴</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="アラートタイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="geofence">安全エリア</SelectItem>
                <SelectItem value="stationary">長時間静止</SelectItem>
                <SelectItem value="night">夜間外出</SelectItem>
                <SelectItem value="battery">バッテリー</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              フィルター
            </Button>
          </div>
          <div>
            <Select defaultValue="week">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="期間を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今日</SelectItem>
                <SelectItem value="yesterday">昨日</SelectItem>
                <SelectItem value="week">過去7日間</SelectItem>
                <SelectItem value="month">過去30日間</SelectItem>
                <SelectItem value="custom">カスタム期間</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>アラート履歴</CardTitle>
            <CardDescription>過去7日間のアラート履歴を表示しています</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  date: "2025/05/17",
                  alerts: [
                    {
                      title: "安全エリア外",
                      time: "10:23",
                      description: "利用者が自宅エリアの外に出ました",
                      icon: <MapPin className="h-5 w-5" />,
                      color: "bg-amber-100 text-amber-700",
                      status: "解決済み",
                    },
                    {
                      title: "バッテリー低下",
                      time: "08:45",
                      description: "デバイスのバッテリーが20%を下回りました",
                      icon: <Battery className="h-5 w-5" />,
                      color: "bg-red-100 text-red-700",
                      status: "解決済み",
                    },
                  ],
                },
                {
                  date: "2025/05/16",
                  alerts: [
                    {
                      title: "安全エリア外",
                      time: "15:30",
                      description: "利用者が自宅エリアの外に出ました",
                      icon: <MapPin className="h-5 w-5" />,
                      color: "bg-amber-100 text-amber-700",
                      status: "解決済み",
                    },
                    {
                      title: "長時間静止",
                      time: "11:15",
                      description: "利用者が45分間同じ場所に留まっています",
                      icon: <Clock className="h-5 w-5" />,
                      color: "bg-blue-100 text-blue-700",
                      status: "解決済み",
                    },
                  ],
                },
                {
                  date: "2025/05/15",
                  alerts: [
                    {
                      title: "夜間外出",
                      time: "23:10",
                      description: "利用者が夜間に外出しました",
                      icon: <User className="h-5 w-5" />,
                      color: "bg-purple-100 text-purple-700",
                      status: "解決済み",
                    },
                  ],
                },
              ].map((day, i) => (
                <div key={i}>
                  <h3 className="font-medium text-gray-500 mb-2">{day.date}</h3>
                  <div className="space-y-3">
                    {day.alerts.map((alert, j) => (
                      <div key={j} className="p-4 border rounded-md bg-white">
                        <div className="flex items-start">
                          <div className={`p-2 rounded-md mr-3 ${alert.color}`}>{alert.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center">
                                  <p className="font-medium">{alert.title}</p>
                                  <p className="text-xs text-gray-500 ml-2">{alert.time}</p>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                              </div>
                              <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {alert.status}
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end space-x-2">
                              <Button variant="outline" size="sm">
                                <Bell className="h-4 w-4 mr-1" />
                                通知設定
                              </Button>
                              <Button variant="outline" size="sm">
                                詳細
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-center pt-4">
                <Button variant="outline">さらに表示</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
