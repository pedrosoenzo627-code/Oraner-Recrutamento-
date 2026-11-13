"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

type Announcement = { id: string; title: string; excerpt: string; status: string; created_at: string };

export function AnnouncementAdmin({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setError("");
    setFeedback("");
    const response = await fetch("/api/workplace/announcements", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: form.get("title"), excerpt: form.get("excerpt"), body: form.get("body"), publish: form.get("publish") === "on" }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Não foi possível salvar o anúncio.");
    else { setFeedback(result.status === "published" ? "Anúncio publicado." : "Rascunho salvo."); formElement.reset(); router.refresh(); }
    setPending(false);
  }

  return (
    <>
      <section className="workspace-panel" aria-labelledby="announcement-title">
        <div className="admin-header"><div><p className="section-kicker">Conteúdo e campanhas</p><h1 id="announcement-title">Novo anúncio</h1><p>Revise o texto antes de publicar. O conteúdo é tratado como texto simples, sem HTML executável.</p></div></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {feedback && <p className="form-success" role="status">{feedback}</p>}
        <form className="form-stack" onKeyDown={(event) => { if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} onSubmit={submit}>
          <div className="field"><label htmlFor="title">Título</label><input id="title" name="title" required maxLength={140} /></div>
          <div className="field"><label htmlFor="excerpt">Resumo público</label><input id="excerpt" name="excerpt" required minLength={8} maxLength={300} /></div>
          <div className="field"><label htmlFor="body">Texto do anúncio</label><textarea id="body" name="body" required minLength={10} maxLength={12000} /></div>
          <label className="field" style={{ flexDirection: "row", alignItems: "center" }}><input type="checkbox" name="publish" /> Publicar após revisão</label>
          <p className="form-help">Sem seleção, o anúncio fica como rascunho privado no Workplace.</p>
          <button className="button-primary form-submit" type="submit" disabled={pending}><Send size={14} aria-hidden="true" />{pending ? "Salvando…" : "Salvar anúncio"}</button>
        </form>
      </section>
      <section className="workspace-panel" aria-labelledby="announcement-list-title" style={{ marginTop: 18 }}>
        <div className="admin-header"><div><p className="section-kicker">Histórico</p><h2 id="announcement-list-title">Anúncios registrados</h2></div></div>
        {announcements.length === 0 ? <p className="notice">Nenhum anúncio foi criado ainda.</p> : <div className="admin-list">{announcements.map((item) => <article className="admin-row" key={item.id}><div><h3>{item.title}</h3><p>{item.excerpt} · {item.status === "published" ? "Publicado" : "Rascunho"}</p></div></article>)}</div>}
      </section>
    </>
  );
}
