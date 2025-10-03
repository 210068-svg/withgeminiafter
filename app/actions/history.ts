"use server"

// 履歴・レポートのServer Actions

// 履歴データの取得
export async function getHistoryData(filters: {
  startDate: string
  endDate: string
  location?: string
  searchQuery?: string
  userId?: string
}) {
  try {
    const { startDate, endDate, location, searchQuery, userId } = filters

    // 実際のアプリでは、ここでデータベースから履歴データを取得
    // モックデータを生成
    const mockData = generateMockHistoryData(startDate, endDate, location, searchQuery, userId)

    await new Promise((resolve) => setTimeout(resolve, 500)) // API呼び出しをシミュレート

    return {
      success: true,
      data: mockData,
      totalRecords: mockData.length,
    }
  } catch (error) {
    console.error("History data fetch error:", error)
    return {
      success: false,
      error: "履歴データの取得に失敗しました",
      data: [],
      totalRecords: 0,
    }
  }
}

// CSVエクスポート
export async function exportHistoryToCSV(filters: {
  startDate: string
  endDate: string
  location?: string
  searchQuery?: string
  userId?: string
}) {
  try {
    const { startDate, endDate, location, searchQuery, userId } = filters

    // 実際のアプリでは、ここでデータベースから全データを取得してCSV形式に変換
    const mockData = generateMockHistoryData(startDate, endDate, location, searchQuery, userId)

    // CSVヘッダー
    const csvHeader = "日時,種別,場所,住所,滞在時間,移動時間,活動,緯度,経度,精度\n"

    // CSVデータ
    const csvData = mockData
      .map((record) => {
        return [
          record.datetime,
          record.type === "arrival" ? "到着" : record.type === "departure" ? "出発" : "活動",
          record.location,
          record.address,
          record.stayDuration || "",
          record.travelTime || "",
          record.activity || "",
          record.coordinates.lat,
          record.coordinates.lng,
          record.coordinates.accuracy || "",
        ].join(",")
      })
      .join("\n")

    const csvContent = csvHeader + csvData

    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      csvContent,
      filename: `history_${startDate}_${endDate}.csv`,
    }
  } catch (error) {
    console.error("CSV export error:", error)
    return {
      success: false,
      error: "CSVエクスポートに失敗しました",
    }
  }
}

// 統計データの取得
export async function getStatisticsData(filters: {
  startDate: string
  endDate: string
  location?: string
  userId?: string
}) {
  try {
    const { startDate, endDate, location, userId } = filters

    // 実際のアプリでは、ここでデータベースから統計データを計算
    const mockStats = generateMockStatistics(startDate, endDate, location, userId)

    await new Promise((resolve) => setTimeout(resolve, 300))

    return {
      success: true,
      data: mockStats,
    }
  } catch (error) {
    console.error("Statistics data fetch error:", error)
    return {
      success: false,
      error: "統計データの取得に失敗しました",
      data: null,
    }
  }
}

// フィルター設定の保存
export async function saveFilterPreset(name: string, filters: any) {
  try {
    // 実際のアプリでは、ここでユーザーのフィルター設定をデータベースに保存
    console.log("Saving filter preset:", name, filters)

    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      success: true,
      message: "フィルター設定を保存しました",
    }
  } catch (error) {
    console.error("Save filter preset error:", error)
    return {
      success: false,
      error: "フィルター設定の保存に失敗しました",
    }
  }
}

// モックデータ生成関数
function generateMockHistoryData(
  startDate: string,
  endDate: string,
  location?: string,
  searchQuery?: string,
  userId?: string,
) {
  const locations = [
    {
      name: "自宅",
      address: "東京都新宿区西新宿1-1-1",
      lat: 35.6895,
      lng: 139.6917,
    },
    {
      name: "デイケアセンター",
      address: "東京都新宿区西新宿2-2-2",
      lat: 35.6912,
      lng: 139.6956,
    },
    {
      name: "公園",
      address: "東京都新宿区西新宿3-3-3",
      lat: 35.6889,
      lng: 139.6978,
    },
    {
      name: "病院",
      address: "東京都新宿区西新宿4-4-4",
      lat: 35.6901,
      lng: 139.6934,
    },
    {
      name: "スーパーマーケット",
      address: "東京都新宿区西新宿5-5-5",
      lat: 35.6887,
      lng: 139.6945,
    },
  ]

  const activities = ["レクリエーション活動", "昼食", "散歩・休憩", "診察", "買い物", "リハビリ"]

  const mockData = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  // 日付範囲内でデータを生成
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]

    // 1日あたり5-10件のレコードを生成
    const recordsPerDay = Math.floor(Math.random() * 6) + 5

    for (let i = 0; i < recordsPerDay; i++) {
      const randomLocation = locations[Math.floor(Math.random() * locations.length)]
      const hour = 8 + Math.floor((i / recordsPerDay) * 12) // 8時から20時の間
      const minute = Math.floor(Math.random() * 60)
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      const datetime = `${dateStr}T${time}:00`

      const record = {
        id: `record_${dateStr}_${i}`,
        type: i % 3 === 0 ? "arrival" : i % 3 === 1 ? "departure" : "activity",
        location: randomLocation.name,
        address: randomLocation.address,
        time,
        datetime,
        coordinates: {
          lat: randomLocation.lat + (Math.random() - 0.5) * 0.001,
          lng: randomLocation.lng + (Math.random() - 0.5) * 0.001,
          accuracy: Math.floor(Math.random() * 15) + 5,
        },
        activity: i % 3 === 2 ? activities[Math.floor(Math.random() * activities.length)] : undefined,
        stayDuration: i % 3 === 1 ? `${Math.floor(Math.random() * 180) + 30}分` : undefined,
        travelTime: i % 3 === 0 && i > 0 ? `${Math.floor(Math.random() * 30) + 5}分` : undefined,
      }

      mockData.push(record)
    }
  }

  // フィルタリング
  let filteredData = mockData

  if (location && location !== "all") {
    filteredData = filteredData.filter((record) => record.location.includes(location))
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredData = filteredData.filter(
      (record) =>
        record.location.toLowerCase().includes(query) ||
        record.address.toLowerCase().includes(query) ||
        (record.activity && record.activity.toLowerCase().includes(query)),
    )
  }

  return filteredData.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
}

// モック統計データ生成
function generateMockStatistics(startDate: string, endDate: string, location?: string, userId?: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  return {
    summary: {
      totalDays: daysDiff,
      totalLocations: Math.floor(Math.random() * 5) + 3,
      totalMovements: Math.floor(Math.random() * 20) + 10,
      averageOutingTime: `${Math.floor(Math.random() * 4) + 6}時間${Math.floor(Math.random() * 60)}分`,
    },
    locationStats: [
      {
        location: "自宅",
        totalTime: `${Math.floor(Math.random() * 8) + 12}時間${Math.floor(Math.random() * 60)}分`,
        visits: Math.floor(Math.random() * daysDiff) + daysDiff,
        percentage: Math.floor(Math.random() * 20) + 60,
      },
      {
        location: "デイケアセンター",
        totalTime: `${Math.floor(Math.random() * 4) + 4}時間${Math.floor(Math.random() * 60)}分`,
        visits: Math.floor(Math.random() * daysDiff) + 1,
        percentage: Math.floor(Math.random() * 15) + 20,
      },
      {
        location: "公園",
        totalTime: `${Math.floor(Math.random() * 2) + 1}時間${Math.floor(Math.random() * 60)}分`,
        visits: Math.floor(Math.random() * daysDiff),
        percentage: Math.floor(Math.random() * 10) + 5,
      },
    ],
    timePatterns: {
      mostActiveHour: `${Math.floor(Math.random() * 4) + 10}:00`,
      averageOutingStart: `${Math.floor(Math.random() * 2) + 8}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, "0")}`,
      averageReturnTime: `${Math.floor(Math.random() * 3) + 16}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, "0")}`,
    },
  }
}
