"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Brand } from "@/components/site-header";
import { createClient } from "@/lib/supabase/client";

const OWNER_EMAIL = "pedrosoenzo627@gmail.com";

export function WorkplaceLogin({ confirmed = false, authError = false }: { confirmed?: boolean; authError?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(confirmed ? "E-mail confirmado. Entre com sua senha para ativar o acesso inicial do owner." : "");
  const [error, setError] = useState(authError ? "Não foi possível confirmar a sessão. Tente entrar novamente." : "");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError || !data.user) {
      const code = signInError?.code;
      setError(code === "email_not_confirmed"
        ? "Confirme seu e-mail pelo link enviado antes de entrar."
        : code === "over_request_rate_limit" || code === "over_email_send_rate_limit"
          ? "Muitas tentativas. Aguarde um pouco antes de tentar novamente."
          : "E-mail ou senha inválidos. Verifique os dados e tente novamente.");
      setPending(false);
      return;
    }

    if (email.trim().toLowerCase() === OWNER_EMAIL) {
      await supabase.rpc("claim_initial_owner");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.account_status !== "active") {
      await supabase.auth.signOut();
      setError("A conta ainda não está liberada. Peça ao owner da Oraner um convite de acesso.");
      setPending(false);
      return;
    }

    router.replace("/workplace");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Espaço interno</span>
          <h1>O trabalho da Oraner, em um só lugar.</h1>
          <p>Acesso somente para contas liberadas pela equipe. Seus dados de sessão são protegidos e cada perfil recebe apenas as permissões necessárias.</p>
        </div>
        <Link className="footer-copy" href="/">← Voltar para o site público</Link>
      </aside>
      <section className="auth-form-wrap" aria-labelledby="login-title">
        <div className="auth-card">
          <span className="eyebrow"><LockKeyhole size={13} aria-hidden="true" /> Login protegido</span>
          <h2 id="login-title">Bem-vindo ao Workplace.</h2>
          <p>Entre com a conta de trabalho que recebeu autorização da Oraner.</p>
          {message && <p className="form-success" role="status">{message}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <form className="form-stack" onKeyDown={(event) => { if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} onSubmit={submit}>
            <div className="field">
              <label htmlFor="email">E-mail de trabalho</label>
              <input autoComplete="username" id="email" name="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input autoComplete="current-password" id="password" name="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <button className="button-primary form-submit" type="submit" disabled={pending}>
              {pending ? "Verificando acesso…" : "Entrar com segurança"}
            </button>
          </form>
          <div className="auth-footnote">
            <span>Contas novas não recebem acesso automaticamente. O cadastro inicial é restrito ao owner; demais pessoas precisam de convite.</span>
            <span>A sessão permanece neste navegador por até 30 dias. Em dispositivos compartilhados, saia ao terminar.</span>
            <Link className="text-link" href="/workplace/setup">Primeiro acesso do owner</Link>
            <Link className="text-link" href="/"><ArrowLeft size={12} aria-hidden="true" /> Voltar ao site</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
