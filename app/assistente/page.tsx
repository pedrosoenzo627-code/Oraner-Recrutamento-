import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { OranerAiAssistant } from "@/components/oraner-ai-assistant";

export const metadata: Metadata = {
  title: "Assistente Oraner",
  description: "Converse com o assistente de IA da Oraner Technologies.",
};

export default function AssistantPage() {
  return (
    <main>
      <SiteHeader />
      <section className="assistant-page">
        <Link className="detail-back" href="/">← Voltar ao site</Link>
        <div className="assistant-intro">
          <span className="eyebrow">Oraner Technologies · Assistente IA</span>
          <h1>Conheça a Oraner por conversa.</h1>
          <p>Pergunte sobre projetos, novidades e informações públicas. O assistente utiliza Gemini e responde em português.</p>
        </div>
        <OranerAiAssistant />
      </section>
    </main>
  );
}
