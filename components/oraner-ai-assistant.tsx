"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content: "Olá! Sou o assistente da Oraner. Posso explicar nossos projetos, novidades e informações públicas. O que você gostaria de saber?",
};

export function OranerAiAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || pending) return;

    const nextMessages = [...messages, { role: "user" as const, content }].slice(-12);
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Não foi possível enviar sua mensagem.");
        return;
      }
      if (typeof result.reply !== "string" || !result.reply.trim()) {
        setError("O assistente retornou uma resposta vazia. Tente novamente.");
        return;
      }
      setMessages((current) => [...current, { role: "assistant", content: result.reply }].slice(-12));
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="assistant-panel" aria-label="Conversa com o assistente Oraner">
      <div className="assistant-topline">
        <span className="assistant-status"><span className="assistant-status-dot" /> Assistente Oraner · Gemini</span>
        <Sparkles size={18} aria-hidden="true" />
      </div>
      <div className="assistant-messages" aria-live="polite" aria-relevant="additions text">
        {messages.map((message, index) => (
          <div className={"assistant-message " + message.role} key={index}>{message.content}</div>
        ))}
        {pending && <div className="assistant-message assistant" role="status">Estou preparando uma resposta…</div>}
        <div ref={messagesEndRef} />
      </div>
      {error && <p className="assistant-error" role="alert">{error}</p>}
      <form className="assistant-composer" onSubmit={sendMessage}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Pergunte sobre a Oraner…"
          aria-label="Digite sua mensagem"
          maxLength={3000}
          rows={2}
          disabled={pending}
        />
        <button type="submit" disabled={pending || !draft.trim()}>
          {pending ? "Enviando…" : "Enviar"} <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </form>
      <p className="assistant-disclaimer">Respostas geradas por IA podem conter erros. Não envie senhas, documentos, dados bancários ou informações privadas.</p>
    </section>
  );
}
