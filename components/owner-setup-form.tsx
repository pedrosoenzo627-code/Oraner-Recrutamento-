"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/site-header";

const OWNER_EMAIL = "pedrosoenzo627@gmail.com";

export function OwnerSetupForm() {
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (email.trim().toLowerCase() !== OWNER_EMAIL) {
      setError("O primeiro acesso é exclusivo para o e-mail de owner cadastrado.");
      return;
    }
    if (password.length < 12) {
      setError("Use uma senha com pelo menos 12 caracteres.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: OWNER_EMAIL,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: { full_name: "Owner Oraner" },
      },
    });

    if (signUpError) {
      setError(signUpError.code === "email_address_not_authorized"
        ? "O provedor padrão só envia para endereços autorizados. Configure SMTP corporativo para receber o convite neste e-mail."
        : signUpError.code === "over_email_send_rate_limit"
          ? "Limite de envio atingido. Aguarde antes de pedir outro e-mail de confirmação."
          : signUpError.code === "weak_password"
            ? "Escolha uma senha mais forte e tente novamente."
            : "Não foi possível iniciar o cadastro. Se o e-mail já estiver registrado, entre na tela de login.");
      setPending(false);
      return;
    }

    if (data.session) {
      const { data: claim, error: claimError } = await supabase.rpc("claim_initial_owner");
      if (!claimError && claim) {
        setMessage("Acesso inicial ativado. Você já pode entrar no Workplace.");
      } else {
        setError("A conta foi criada, mas não foi possível ativar a função de owner.");
      }
    } else {
      setMessage("Cadastro iniciado. Confirme o endereço pelo e-mail e depois entre no Workplace para ativar o acesso inicial.");
    }
    setPending(false);
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-copy">
          <span className="eyebrow">Configuração inicial</span>
          <h1>Uma única conta para começar.</h1>
          <p>A função de owner só pode ser reivindicada pelo e-mail verificado já definido para a Oraner. O perfil não é confiado a metadados editáveis.</p>
        </div>
        <Link className="footer-copy" href="/workplace/login">← Voltar ao login</Link>
      </aside>
      <section className="auth-form-wrap" aria-labelledby="setup-title">
        <div className="auth-card">
          <span className="eyebrow">Ativação única · E-mail verificado</span>
          <h2 id="setup-title">Primeiro acesso do owner</h2>
          <p>Crie a conta inicial. A confirmação do e-mail é necessária antes da ativação das permissões.</p>
          {message && <p className="form-success" role="status">{message}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <form className="form-stack" onKeyDown={(event) => { if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} onSubmit={submit}>
            <div className="field">
              <label htmlFor="owner-email">E-mail do owner</label>
              <input autoComplete="email" id="owner-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="owner-password">Crie uma senha forte</label>
              <input autoComplete="new-password" id="owner-password" type="password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} />
              <p className="form-help">Mínimo de 12 caracteres. Não reutilize uma senha de outro serviço.</p>
            </div>
            <button className="button-primary form-submit" disabled={pending} type="submit">{pending ? "Criando conta…" : "Criar conta inicial"}</button>
          </form>
          <div className="auth-footnote"><span>O cadastro não abre acesso a funcionários. Convites e funções precisam ser autorizados pelo owner.</span><Link className="text-link" href="/workplace/login">Já tenho uma conta</Link></div>
        </div>
      </section>
    </main>
  );
}
