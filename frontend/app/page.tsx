"use client"

import { useState, useRef, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const API_BASE = "/api"

type Status = "idle" | "pending" | "done" | "error"

interface Result {
  answer: string
  usage?: string
}

export default function Home() {
  const { data: session } = useSession()
  const [question, setQuestion] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<Result | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!question.trim() || status === "pending") return

    setStatus("pending")
    setResult(null)
    setErrorMsg("")

    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { task_id } = await res.json()

      pollRef.current = setInterval(async () => {
        try {
          const poll = await fetch(`${API_BASE}/search/${task_id}`)
          if (!poll.ok) throw new Error(`HTTP ${poll.status}`)
          const data = await poll.json()
          if (data.status === "done") {
            clearInterval(pollRef.current!)
            setResult({ answer: data.answer, usage: data.usage })
            setStatus("done")
          } else if (data.status === "error") {
            clearInterval(pollRef.current!)
            setErrorMsg(data.answer || "エラーが発生しました")
            setStatus("error")
          }
        } catch {
          clearInterval(pollRef.current!)
          setErrorMsg("結果の取得に失敗しました")
          setStatus("error")
        }
      }, 3000)
    } catch {
      setErrorMsg("リクエストの送信に失敗しました")
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-800">モビリティ知識検索</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session?.user?.email}</span>
          <a href="/admin" className="text-sm text-blue-600 hover:underline">管理</a>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            サインアウト
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-2xl flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
              }}
              placeholder="モビリティに関する質問を入力してください..."
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={status === "pending"}
            />
            <button
              type="submit"
              disabled={!question.trim() || status === "pending"}
              className="self-end px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {status === "pending" ? "検索中..." : "検索"}
            </button>
          </form>

          {status === "pending" && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              AIが回答を生成しています（最大1分ほどかかります）
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {status === "done" && result && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-white border border-gray-200 px-5 py-4 text-sm text-gray-800 prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.answer}
                </ReactMarkdown>
              </div>
              {result.usage && (
                <p className="text-xs text-gray-400 text-right">{result.usage}</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
