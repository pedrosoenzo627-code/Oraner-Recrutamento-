import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/security/owner";
import { isSameOriginRequest } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";

const updateSchema = z.object({
  departmentId: z.string().uuid().nullable(),
  accessRole: z.enum(["member", "manager"]),
  accountStatus: z.enum(["active", "suspended"]),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Solicitação inválida." }, { status: 403 });
  const owner = await getOwnerContext();
  if (!owner.authorized) return NextResponse.json({ error: "Acesso restrito ao owner." }, { status: owner.status });
  const { id } = await context.params;
  if (id === owner.user.id) return NextResponse.json({ error: "O perfil do owner não pode ser alterado nesta tela." }, { status: 400 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revise o cargo, o departamento e o estado da conta." }, { status: 400 });

  const admin = createAdminClient();
  if (parsed.data.departmentId) {
    const { data: department } = await admin.from("departments").select("id").eq("id", parsed.data.departmentId).eq("active", true).maybeSingle();
    if (!department) return NextResponse.json({ error: "Departamento indisponível." }, { status: 400 });
  }
  const { data: target } = await admin.from("profiles").select("access_role").eq("id", id).maybeSingle();
  if (!target || target.access_role === "owner") return NextResponse.json({ error: "Perfil não encontrado ou protegido." }, { status: 404 });

  const { error } = await admin.from("profiles").update({
    department_id: parsed.data.departmentId,
    access_role: parsed.data.accessRole,
    account_status: parsed.data.accountStatus,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return NextResponse.json({ error: "Não foi possível atualizar o perfil." }, { status: 400 });

  await admin.from("audit_events").insert({ actor_id: owner.user.id, action: "employee.permissions_updated", entity_type: "profile", entity_id: id });
  return NextResponse.json({ message: "Permissões atualizadas." });
}
