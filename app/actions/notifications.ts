"use server"

import { Resend } from "resend"

// 通知送信のServer Actions

// メール送信（Resend使用）
export async function sendEmailNotification(to: string, subject: string, message: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: "noreply@careapp.com",
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">安心見守りアプリ - アラート通知</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; margin: 0;">${message}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            このメールは安心見守りアプリから自動送信されています。
          </p>
        </div>
      `,
    })

    if (error) {
      console.error("Email sending error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Email sending failed:", error)
    return { success: false, error: "メール送信に失敗しました" }
  }
}

// SMS送信（Twilio使用）
export async function sendSMSNotification(to: string, message: string) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return { success: false, error: "Twilio設定が不完全です" }
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: to,
        Body: `【安心見守りアプリ】${message}`,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("SMS sending error:", error)
      return { success: false, error: "SMS送信に失敗しました" }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("SMS sending failed:", error)
    return { success: false, error: "SMS送信に失敗しました" }
  }
}

// 電話通知（Twilio Voice使用）
export async function sendVoiceNotification(to: string, message: string) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return { success: false, error: "Twilio設定が不完全です" }
    }

    const twimlUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/twiml?message=${encodeURIComponent(message)}`

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: to,
        Url: twimlUrl,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Voice call error:", error)
      return { success: false, error: "電話通知に失敗しました" }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Voice call failed:", error)
    return { success: false, error: "電話通知に失敗しました" }
  }
}

// プッシュ通知送信
export async function sendPushNotification(subscription: any, title: string, message: string) {
  try {
    const webpush = require("web-push")

    webpush.setVapidDetails(
      "mailto:admin@careapp.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    )

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
    })

    await webpush.sendNotification(subscription, payload)
    return { success: true }
  } catch (error) {
    console.error("Push notification failed:", error)
    return { success: false, error: "プッシュ通知に失敗しました" }
  }
}

// 統合通知送信関数
export async function sendNotificationToContact(contact: any, alertType: string, message: string, location?: string) {
  const results = []
  const timestamp = new Date().toISOString()

  const subject = `【緊急】${alertType} - 安心見守りアプリ`
  const fullMessage = location ? `${message}\n場所: ${location}` : message

  // プッシュ通知
  if (contact.notifications.push && contact.pushSubscription) {
    const result = await sendPushNotification(contact.pushSubscription, subject, fullMessage)
    results.push({
      type: "push",
      success: result.success,
      error: result.error,
      timestamp,
    })
  }

  // SMS通知
  if (contact.notifications.sms && contact.phone) {
    const result = await sendSMSNotification(contact.phone, fullMessage)
    results.push({
      type: "sms",
      success: result.success,
      error: result.error,
      timestamp,
    })
  }

  // 電話通知
  if (contact.notifications.call && contact.phone) {
    const result = await sendVoiceNotification(contact.phone, fullMessage)
    results.push({
      type: "call",
      success: result.success,
      error: result.error,
      timestamp,
    })
  }

  // メール通知
  if (contact.notifications.email && contact.email) {
    const result = await sendEmailNotification(contact.email, subject, fullMessage)
    results.push({
      type: "email",
      success: result.success,
      error: result.error,
      timestamp,
    })
  }

  return results
}

// アラート発生時の通知送信
export async function triggerAlert(alertType: string, message: string, location?: string) {
  try {
    // 実際のアプリでは、データベースから連絡先を取得
    const contacts = [
      {
        id: 1,
        name: "連絡先A",
        phone: "+81901234567",
        email: "contact-a@example.com",
        notifications: { push: true, sms: true, call: true, email: true },
        primary: true,
      },
      {
        id: 2,
        name: "連絡先B",
        phone: "+81908765432",
        email: "contact-b@care.com",
        notifications: { push: true, sms: false, call: false, email: true },
        primary: false,
      },
    ]

    const allResults = []

    for (const contact of contacts) {
      const results = await sendNotificationToContact(contact, alertType, message, location)
      allResults.push({
        contactId: contact.id,
        contactName: contact.name,
        results,
      })
    }

    return { success: true, results: allResults }
  } catch (error) {
    console.error("Alert trigger failed:", error)
    return { success: false, error: "アラート送信に失敗しました" }
  }
}
