import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, Plus, Trash2, Edit, Home, MapPin, Map } from "lucide-react"
import MapComponent from "../map-component"

export default function GeofencePage() {
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
            <h1 className="text-xl font-bold">ジオフェンス設定</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>無料地図サービス使用中:</strong>{" "}
            OpenStreetMapとLeaflet.jsを使用しているため、完全無料でご利用いただけます。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>エリア編集</CardTitle>
                <CardDescription>地図上でエリアを描画または編集できます</CardDescription>
              </CardHeader>
              <CardContent>
                <MapComponent initialZoom={14} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>安全エリア一覧</span>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    新規作成
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "自宅エリア",
                      icon: <Home className="h-4 w-4" />,
                      active: true,
                      color: "bg-emerald-100 text-emerald-700",
                    },
                    {
                      name: "デイケアセンター",
                      icon: <MapPin className="h-4 w-4" />,
                      active: true,
                      color: "bg-blue-100 text-blue-700",
                    },
                    {
                      name: "公園散歩コース",
                      icon: <Map className="h-4 w-4" />,
                      active: false,
                      color: "bg-amber-100 text-amber-700",
                    },
                  ].map((area, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-md border">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-md mr-3 ${area.color}`}>{area.icon}</div>
                        <div>
                          <p className="font-medium">{area.name}</p>
                          <p className="text-xs text-gray-500">半径: 約200m</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={area.active} />
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>エリア設定</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="area-name">エリア名</Label>
                    <Input id="area-name" placeholder="例: 自宅エリア" defaultValue="自宅エリア" />
                  </div>
                  <div>
                    <Label htmlFor="area-color">エリアカラー</Label>
                    <div className="flex space-x-2 mt-1">
                      {["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-red-500"].map(
                        (color, i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded-full cursor-pointer ${color} ${i === 0 ? "ring-2 ring-offset-2 ring-emerald-500" : ""}`}
                          ></div>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="area-active">エリアを有効化</Label>
                    <Switch id="area-active" checked={true} />
                  </div>
                  <div className="pt-4">
                    <Button className="w-full">保存</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
