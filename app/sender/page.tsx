// app/sender/page.tsx
'use client' // このページがブラウザで動くことを示すおまじないです

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase' // ステップ1で設定したSupabaseクライアントを読み込みます

export default function SenderPage() {
  const [status, setStatus] = useState('位置情報の取得を開始します...')
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number | null
    lng: number | null
  }>({ lat: null, lng: null })
  const [watchId, setWatchId] = useState<number | null>(null)

  // ■■■■■■■■■■ 注意 ■■■■■■■■■■
  // これは「どのデバイス」からの位置情報かを示すIDです。
  // 今はテスト用に仮のIDを固定で入れています。
  // 本来は、デバイス登録画面で生成されたIDを使う必要があります。
  const MOCK_DEVICE_ID = '00000000-0000-0000-0000-000000000001'
  // ■■■■■■■■■■■■■■■■■■■■■■■

  useEffect(() => {
    // 1. ブラウザが位置情報に対応しているかチェック
    if (!navigator.geolocation) {
      setStatus('お使いのブラウザは位置情報取得に対応していません。')
      return
    }

    // 2. 位置情報が取得できたときに実行される処理
    const onSuccess = (position: GeolocationPosition) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      setStatus('位置情報を取得しました。データベースに送信中...')
      setCurrentPosition({ lat, lng })

      // 取得した位置情報をSupabaseに送信する
      sendLocationToSupabase(lat, lng)
    }

    // 3. 位置情報の取得に失敗したときに実行される処理
    const onError = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        setStatus(
          '位置情報の利用が許可されませんでした。ブラウザの設定を確認してください。'
        )
      } else {
        setStatus(`エラーが発生しました: ${error.message}`)
      }
    }

    // 4. 位置情報の「監視」を開始
    // これにより、スマホが移動すると自動で onSuccess が呼ばれます
    const id = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true, // 高精度GPSを利用する
      timeout: 10000, // 10秒待っても取得できなかったらエラー
      maximumAge: 0, // 古い（キャッシュされた）位置は使わない
    })
    setWatchId(id)
    setStatus('位置情報の監視を開始しました...')

    // 5. このページが閉じられた時に、監視を終了する処理
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // この[]のおかげで、この処理はページが開かれた時に1回だけ実行されます

  // Supabaseの 'locations' テーブルにデータを送信する関数
  const sendLocationToSupabase = async (lat: number, lng: number) => {
    try {
      // 'locations' テーブルに新しい行を挿入（insert）
      const { error } = await supabase.from('locations').insert([
        {
          device_id: MOCK_DEVICE_ID, // どのデバイスからの情報か
          latitude: lat, // 緯度
          longitude: lng, // 経度
        },
      ])

      if (error) {
        throw error // エラーが起きたら停止
      }

      setStatus('データベースに位置情報を送信しました。（監視中）')
    } catch (error: any) {
      setStatus(`DB送信エラー: ${error.message}`)
    }
  }

  // 画面に表示する内容
  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        backgroundColor: '#333',
        color: 'white',
      }}
    >
      <h1>位置情報 送信ページ</h1>
      <p style={{ fontWeight: 'bold', fontSize: '1.2em', color: '#FFD700' }}>
        （このページは開いたままにしてください）
      </p>
      <div
        style={{
          background: '#555',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
        }}
      >
        <p>
          <strong>現在のステータス:</strong>
        </p>
        <p style={{ color: '#00FF00' }}>{status}</p>
        {currentPosition.lat && (
          <p>
            <strong>現在の位置:</strong> {currentPosition.lat},{' '}
            {currentPosition.lng}
          </p>
        )}
      </div>
    </div>
  )
}