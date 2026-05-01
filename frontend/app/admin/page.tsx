"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface QueueItem {
  url: string
  status: string
  created_at?: string
}

export default function AdminPage() {
  const { data: session } = useSession()
  const [urls, setUrls] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loadingQueue, setLoadingQueue] = useState(false)

  async function handleAddUrls(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const list = urls.split("\n").map(u => u.trim()).filter(Boolean)
    if (!list.length) return

    setSubmitting(true)
    setMessage("")
    try {
      const res = await fetch(`${API_URL}/admin/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: list }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMessage(`${list.length} 件のURLをキューに追加しました`)
      setUrls("")
    } catch {
      setMessage("追加に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLoadQueue() {
    setLoadingQueue(true)
    try {
      const res = await fetch(`${API_URL}/admin/queue`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setQueue(data.items ?? [])
    } catch {
      setMessage("キューの取得に失敗しました")
    } finally {
      setLoadingQueue(false)
    }
  }

  async function handleExecute() {
    setMessage("")
    try {
      const res = await fetch(`${API_URL}/admin/index`, { method: "POST" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMessage("インデックス処理を開始しました")
    } catch {
      setMessage("処理の開始に失敗しました")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-800">管理画面</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session?.user?.email}</span>
          <a href="/" className="text-sm text-blue-600 hover:underline">検索に戻る</a>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            サインアウト
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-10">
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
          <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-700">URLをキューに追加</h2>
            <form onSubmit={handleAddUrls} className="flex flex-col gap-3">
              <textarea
                value={urls}
                onChange={e => setUrls(e.target.value)}
                placeholder={"https://example.com/page1\nhttps://example.com/page2"}
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={!urls.trim() || submitting}
                className="self-end px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? "追加中..." : "キューに追加"}
              </button>
            </form>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">インデックスキュー</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleLoadQueue}
                  disabled={loadingQueue}
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  {loadingQueue ? "読み込み中..." : "更新"}
                </button>
                <button
                  onClick={handleExecute}
                  className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  インデックス実行
                </button>
              </div>
            </div>

            {queue.length === 0 ? (
              <p className="text-sm text-gray-400">「更新」ボタンでキューを表示します</p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {queue.map((item, i) => (
                  <div key={i} className="py-2 flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-700 truncate">{item.url}</span>
                    <span className={`text-xs font-medium shrink-0 px-2 py-0.5 rounded-full ${
                      item.status === "done" ? "bg-green-100 text-green-700" :
                      item.status === "error" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {message && (
            <p className="text-sm text-gray-600 text-center">{message}</p>
          )}
        </div>
      </main>
    </div>
  )
}
