"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

type Department = { id: string; name: string };
type TeamMember = { id: string; fullName: string; email: string; departmentId: string | null; accessRole: string; accountStatus: string };

export function TeamAdmin({ initialDepartments, initialTeam }: { initialDepartments: Department[]; initialTeam: TeamMember[] }) {
  const router = useRouter();
  const [departments] = useState(initialDepartments);
  const [team, setTeam] = useState(initialTeam);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setError("");
    setFeedback("");
    const response = await fetch("/api/workplace/team", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), fullName: form.get("fullName"), departmentId: form.get("departmentId") || null, accessRole: form.get("accessRole") }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Não foi possível enviar o convite.");
      else { setFeedback(result.message ?? "Convite enviado."); formElement.reset(); router.refresh(); }

    setPending(false);
  }

  async function updateMember(id: string, patch: Pick<TeamMember, "departmentId" | "accessRole" | "accountStatus">) {
    setError("");
    setFeedback("");
    const response = await fetch(`/api/workplace/team/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Não foi possível atualizar o perfil.");
    else { setFeedback("Permissões atualizadas."); setTeam((current) => current.map((member) => member.id === id ? { ...member, ...patch } : member)); }
  }

  return (
    <>
      <section className="workspace-panel" aria-labelledby="invite-title">
        <div className="admin-header"><div><p className="section-kicker">Acesso por convite</p><h1 id="invite-title">Equipe e cargos</h1><p>Somente o owner pode adicionar perfis e alterar permissões.</p></div></div>
        <p className="notice">O provedor de e-mail do Supabase precisa entregar convites para os domínios dos funcionários. Se a entrega não estiver configurada, o perfil não será ativado.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        {feedback && <p className="form-success" role="status">{feedback}</p>}
        <form className="form-stack" onKeyDown={(event) => { if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} onSubmit={invite} style={{ marginTop: 20 }}>
          <div className="field"><label htmlFor="fullName">Nome</label><input id="fullName" name="fullName" required maxLength={100} /></div>
          <div className="field"><label htmlFor="email">E-mail de trabalho</label><input id="email" name="email" type="email" required maxLength={254} /></div>
          <div className="field"><label htmlFor="departmentId">Departamento</label><select id="departmentId" name="departmentId" defaultValue=""><option value="">Sem departamento</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div>
          <div className="field"><label htmlFor="accessRole">Cargo de acesso</label><select id="accessRole" name="accessRole" defaultValue="member"><option value="member">Equipe</option><option value="manager">Gestor</option></select></div>
          <button className="button-primary form-submit" type="submit" disabled={pending}><UserPlus size={15} aria-hidden="true" />{pending ? "Enviando convite…" : "Enviar convite"}</button>
        </form>
      </section>
      <section className="workspace-panel" aria-labelledby="team-title" style={{ marginTop: 18 }}>
        <div className="admin-header"><div><p className="section-kicker">Diretório privado</p><h2 id="team-title">Contas da equipe</h2></div></div>
        {team.length === 0 ? <p className="notice">Ainda não há outras contas cadastradas.</p> : <div className="admin-list">{team.map((member) => <article className="admin-row" key={member.id}>
          <div><h3>{member.fullName || "Sem nome"}</h3><p>{member.email} · {member.accountStatus === "active" ? "Ativa" : "Suspensa"}</p></div>
          {member.accessRole !== "owner" && <div className="admin-row-actions">
            <select aria-label={`Departamento de ${member.fullName || member.email}`} value={member.departmentId ?? ""} onChange={(event) => updateMember(member.id, { departmentId: event.target.value || null, accessRole: member.accessRole, accountStatus: member.accountStatus })}><option value="">Sem departamento</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
            <select aria-label={`Cargo de ${member.fullName || member.email}`} value={member.accessRole} onChange={(event) => updateMember(member.id, { departmentId: member.departmentId, accessRole: event.target.value, accountStatus: member.accountStatus })}><option value="member">Equipe</option><option value="manager">Gestor</option></select>
            <button className="button-small" type="button" onClick={() => updateMember(member.id, { departmentId: member.departmentId, accessRole: member.accessRole, accountStatus: member.accountStatus === "active" ? "suspended" : "active" })}>{member.accountStatus === "active" ? "Suspender" : "Ativar"}</button>
          </div>}
        </article>)}</div>}
      </section>
    </>
  );
}
