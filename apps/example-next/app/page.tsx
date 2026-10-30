import { ChatDemo } from "@/components/ChatDemo";

export default function HomePage() {
  return (
    <main className="page">
      <header className="header">
        <h1>local-mask-security</h1>
        <p>
          LLM 送信前に PII をマスクし、応答をアンマスクする Next.js デモ（P2）
        </p>
      </header>
      <ChatDemo />
    </main>
  );
}
