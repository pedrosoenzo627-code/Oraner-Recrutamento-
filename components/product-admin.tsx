"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Send } from "lucide-react";

type ProductRow = { id: string; name: string; category: string; summary: string; status: string; price_cents: number | null; currency: string; stripe_product_id: string | null };

export function ProductAdmin({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setError("");
    setFeedback("");
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        name: form.get("name"),
        category: form.get("category"),
        summary: form.get("summary"),
        description: form.get("description"),
        priceCents: Math.round(Number(form.get("price")) * 100),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Não foi possível salvar o rascunho.");
    } else {
      setFeedback(result.message ?? "Produto salvo como rascunho.");
      formElement.reset();
      router.refresh();
    }
    setPending(false);
  }

  async function setStatus(id: string, status: string) {
    setError("");
    setFeedback("");
    const response = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Não foi possível atualizar o estado.");
    else setFeedback(status === "published" ? "Produto publicado na loja." : "Estado atualizado.");
    router.refresh();
  }

  return (
    <>
      <section className="workspace-panel" aria-labelledby="new-product-title">
        <div className="admin-header">
          <div><p className="section-kicker">Cadastro · Stripe + Supabase</p><h1 id="new-product-title">Novo produto</h1><p>O cadastro é salvo no banco e sincronizado ao Stripe como rascunho.</p></div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {feedback && <p className="form-success" role="status">{feedback}</p>}
        <form className="form-stack" onKeyDown={(event) => { if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} onSubmit={createProduct}>
          <div className="field"><label htmlFor="name">Nome do produto</label><input id="name" name="name" required maxLength={100} /></div>
          <div className="field"><label htmlFor="category">Categoria</label><select id="category" name="category" required defaultValue=""><option disabled value="">Selecione</option><option>Smartphone</option><option>Notebook</option><option>Smartwatch</option><option>Software</option><option>Acessório</option></select></div>
          <div className="field"><label htmlFor="summary">Resumo</label><input id="summary" name="summary" required minLength={8} maxLength={240} /></div>
          <div className="field"><label htmlFor="description">Descrição interna</label><textarea id="description" name="description" maxLength={4000} /></div>
          <div className="field"><label htmlFor="price">Preço de referência (R$)</label><input id="price" name="price" type="number" min="0.01" max="1000000" step="0.01" required /></div>
          <p className="form-help">Preços são validados no servidor. O novo item fica em desenvolvimento até revisão; ainda não existe checkout ativo nesta etapa.</p>
          <button className="button-primary form-submit" type="submit" disabled={pending}><Plus size={15} aria-hidden="true" />{pending ? "Salvando e sincronizando…" : "Salvar como rascunho"}</button>
        </form>
      </section>
      <section className="workspace-panel" aria-labelledby="products-title" style={{ marginTop: 18 }}>
        <div className="admin-header"><div><p className="section-kicker">Controle editorial</p><h2 id="products-title">Produtos registrados</h2></div></div>
        {products.length === 0 ? <p className="notice">Nenhum produto no catálogo interno ainda.</p> : (
          <div className="admin-list">
            {products.map((product) => (
              <article className="admin-row" key={product.id}>
                <div><h3>{product.name} · {product.category}</h3><p>{product.summary} · {product.status === "development" ? "Em desenvolvimento" : product.status === "published" ? "Publicado" : "Arquivado"} · {product.stripe_product_id ? "Stripe sincronizado" : "Stripe pendente"}</p></div>
                <div className="admin-row-actions">
                  {product.status === "development" && product.stripe_product_id && <button className="button-small" type="button" onClick={() => setStatus(product.id, "published")}><Send size={13} aria-hidden="true" /> Publicar</button>}
                  {product.status === "published" && <button className="button-small" type="button" onClick={() => setStatus(product.id, "archived")}>Arquivar</button>}
                  {product.status === "archived" && <button className="button-small" type="button" onClick={() => setStatus(product.id, "development")}>Reabrir</button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
