"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Megaphone, ShieldCheck, WandSparkles } from "lucide-react";

type Draft = {
  id: string;
  topic: string;
  title: string;
  excerpt: string;
  body: string;
  image_url: string | null;
  status: "pending_approval" | "published" | "rejected";
  created_at: string;
};
type WeeklyReport = {
  id: string;
  period_start: string;
  period_end: string;
  summary: string;
  metrics: Record<string, unknown>;
  created_at: string;
};

export function AiManager({
  initialDrafts,
  reports,
  geminiConfigured,
}: {
  initialDrafts: Draft[];
  reports: WeeklyReport[];
  geminiConfigured: boolean;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(initialDrafts);
  const [topic, setTopic] = useState("");
  const [generateImage, setGenerateImage] = useState(true);
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic.trim() || pending) return;
    setPending(true);
    setError("");
    setFeedback("");

    try {
      const response = await fetch("/api/ai/manager/drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, generateImage }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Não foi possível criar a campanha.");
        return;
      }
      setDrafts((current) => [result.draft, ...current]);
      setTopic("");
      setFeedback(result.imageWarning || "Rascunho criado. Revise o conteúdo antes de publicar.");
      router.refresh();
    } catch {
      setError("Falha de conexão ao criar a campanha.");
    } finally {
      setPending(false);
    }
  }

  async function reviewDraft(id: string, action: "publish" | "reject") {
    if (busyId) return;
    setBusyId(id);
    setError("");
    setFeedback("");
    try {
      const response = await fetch("/api/ai/manager/drafts/" + encodeURIComponent(id), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Não foi possível revisar o rascunho.");
        return;
      }
      setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, status: result.status } : draft));
      setFeedback(action === "publish" ? "Comunicado publicado na área de novidades." : "Rascunho arquivado.");
      router.refresh();
    } catch {
      setError("Falha de conexão ao revisar o rascunho.");
    } finally {
      setBusyId("");
    }
  }

  const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return (
    <div className="ai-manager-page">
      <div className="ai-manager-header">
        <span className="eyebrow"><span className="eyebrow-dot" /> Oraner Technologies · Gestão assistida</span>
        <h1>Gestor IA da Oraner.</h1>
        <p>O Gemini ajuda a preparar anúncios, imagens e relatórios. O conteúdo fica como rascunho até uma pessoa autorizada revisar e publicar.</p>
        <div className="ai-integration-row">
          <span className={"ai-integration-chip " + (geminiConfigured ? "ready" : "")}>{geminiConfigured ? "Gemini configurado no servidor" : "GEMINI_API_KEY não detectada"}</span>
          <span className="ai-integration-chip">Supabase · dados e imagens</span>
          <span className="ai-integration-chip">Aprovação humana obrigatória</span>
        </div>
      </div>

      {!geminiConfigured && (
        <div className="ai-manager-notice">
          O servidor não encontrou GEMINI_API_KEY. Configure a variável no ambiente de produção do projeto Oraner Oficial na Vercel e gere uma nova implantação.
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      {feedback && <p className="form-success" role="status">{feedback}</p>}

      <div className="ai-manager-grid">
        <section className="ai-manager-panel" aria-labelledby="campaign-builder-title">
          <p className="section-kicker">Criador de conteúdo</p>
          <h2 id="campaign-builder-title"><Megaphone size={20} aria-hidden="true" /> Nova campanha</h2>
          <p>Informe o assunto. O Gemini cria título, resumo, texto e, quando solicitado, uma imagem para a identidade visual da Oraner.</p>
          <form className="ai-manager-form" onSubmit={createCampaign}>
            <label className="field" htmlFor="campaign-topic">
              <span>Assunto da campanha</span>
              <textarea id="campaign-topic" value={topic} onChange={(event) => setTopic(event.target.value)} minLength={5} maxLength={500} required placeholder="Ex.: novidades de desenvolvimento do OraOS 1, explicação sobre o Ora UI, comunicado institucional..." />
            </label>
            <label className="ai-checkline">
              <input type="checkbox" checked={generateImage} onChange={(event) => setGenerateImage(event.target.checked)} />
              <ImagePlus size={15} aria-hidden="true" /> Gerar imagem com Gemini
            </label>
            <button type="submit" disabled={pending || !geminiConfigured || topic.trim().length < 5}>
              <WandSparkles size={16} aria-hidden="true" /> {pending ? "Criando campanha…" : "Gerar rascunho"}
            </button>
          </form>
        </section>

        <section className="ai-manager-panel" aria-labelledby="manager-rules-title">
          <p className="section-kicker">Controle e segurança</p>
          <h2 id="manager-rules-title"><ShieldCheck size={20} aria-hidden="true" /> O que o gestor pode fazer</h2>
          <p>O Gemini pode sugerir textos, criar imagens e apontar melhorias com base nos dados públicos e nos registros do site.</p>
          <ul className="ai-manager-rules">
            <li>Campanhas e imagens são salvas como rascunho.</li>
            <li>Uma pessoa autorizada decide se publica ou rejeita cada anúncio.</li>
            <li>O Gemini não recebe as chaves do Supabase ou do Stripe.</li>
            <li>O Gemini não altera sozinho o código, os cargos ou as configurações do site.</li>
            <li>Os relatórios usam somente métricas que o sistema realmente registra.</li>
          </ul>
        </section>
      </div>

      <section className="workspace-panel ai-manager-section" aria-labelledby="drafts-title">
        <div className="admin-header">
          <div>
            <p className="section-kicker">Revisão editorial</p>
            <h2 id="drafts-title">Campanhas criadas pelo Gemini</h2>
            <p>Somente depois da aprovação o comunicado passa a aparecer publicamente em Novidades.</p>
          </div>
        </div>
        {drafts.length === 0 ? <p className="notice">Nenhum rascunho criado ainda. Escolha um assunto acima para começar.</p> : (
          <div className="ai-draft-list">
            {drafts.map((draft) => (
              <article className="ai-draft-card" key={draft.id}>
                {draft.image_url?.startsWith("https://") ? <img className="ai-draft-image" src={draft.image_url} alt={"Imagem sugerida para " + draft.title} loading="lazy" /> : <div className="ai-draft-image ai-draft-placeholder"><ImagePlus size={28} aria-hidden="true" /><span>Sem imagem</span></div>}
                <div>
                  <div className="ai-draft-meta">
                    <span className="status-chip">{draft.status === "pending_approval" ? "Aguardando aprovação" : draft.status === "published" ? "Publicado" : "Rejeitado"}</span>
                    <time>{formatDate(draft.created_at)}</time>
                  </div>
                  <p className="ai-draft-topic">Assunto: {draft.topic}</p>
                  <h3>{draft.title}</h3>
                  <p><strong>{draft.excerpt}</strong></p>
                  <p className="ai-draft-body">{draft.body}</p>
                  {draft.status === "pending_approval" && (
                    <div className="ai-draft-actions">
                      <button className="primary" type="button" disabled={Boolean(busyId)} onClick={() => reviewDraft(draft.id, "publish")}>{busyId === draft.id ? "Salvando…" : "Aprovar e publicar"}</button>
                      <button type="button" disabled={Boolean(busyId)} onClick={() => reviewDraft(draft.id, "reject")}>Rejeitar</button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="workspace-panel ai-manager-section" aria-labelledby="reports-title">
        <div className="admin-header">
          <div>
            <p className="section-kicker">Relatórios automáticos</p>
            <h2 id="reports-title">Resumo semanal da Oraner</h2>
            <p>Agendado para toda segunda-feira, às 09:00 no horário de Brasília.</p>
          </div>
        </div>
        <p className="form-help">Os relatórios contabilizam produtos, comunicados e rascunhos no banco. Visitas, cliques e vendas só serão incluídos quando essas métricas estiverem integradas.</p>
        {reports.length === 0 ? <p className="notice">O primeiro relatório será criado no próximo ciclo semanal depois que a implantação e o CRON_SECRET estiverem configurados.</p> : (
          <div className="ai-report-list">
            {reports.map((report) => (
              <article className="ai-report-card" key={report.id}>
                <div className="ai-report-meta">{formatDate(report.created_at)}</div>
                <h3>Relatório semanal · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(report.period_start))} a {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(report.period_end))}</h3>
                <p className="ai-report-text">{report.summary}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
