import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/security/owner";
import { isSameOriginRequest } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";

const inviteSchema = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().min(2).max(100),
  departmentId: z.string().uuid().nullable(),
  accessRole: z.enum(["member", "manager"]),
});

export async function GET() {
  const context = await getOwnerContext();
  if (!context.authorized) return NextResponse.json({ error: "Acesso restrito ao owner." }, { status: context.status });
  const admin = createAdminClient();
  const [{ data: profiles, error: profileError }, { data: users, error: usersError }] = await Promise.all([
    admin.from("profiles").select("id, full_name, department_id, access_role, account_status, created_at").order("created_at", { ascending: true }).limit(100),
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
  ]);
  if (profileError || usersError) return NextResponse.json({ error: "Não foi possível carregar a equipe." }, { status: 500 });

  const emailsById = new Map((users?.users ?? []).map((user) => [user.id, user.email ?? ""]));
  const departments = await admin.from("departments").select("id, name").eq("active", true).order("name");
  return NextResponse.json({
    team: (profiles ?? []).map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      email: emailsById.get(profile.id) ?? "",
      departmentId: profile.department_id,
      accessRole: profile.access_role,
      accountStatus: profile.account_status,
    })),
    departments: departments.data ?? [],
  });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Solicitação inválida." }, { status: 403 });
  const context = await getOwnerContext();
  if (!context.authorized) return NextResponse.json({ error: "Acesso restrito ao owner." }, { status: context.status });
  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revise os dados do convite." }, { status: 400 });

  const input = parsed.data;
  const admin = createAdminClient();
  if (input.departmentId) {
    const { data: department } = await admin.from("departments").select("id").eq("id", input.departmentId).eq("active", true).maybeSingle();
    if (!department) return NextResponse.json({ error: "Departamento indisponível." }, { status: 400 });
  }

  const redirectTo = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${new URL(request.url).origin}/auth/callback`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    redirectTo,
    data: { full_name: input.fullName },
  });
  if (error || !data.user) return NextResponse.json({ error: "Não foi possível enviar o convite. Verifique se a conta já existe e se o serviço de e-mail está configurado." }, { status: 400 });

  const { error: profileError } = await admin.from("profiles").update({
    full_name: input.fullName,
    department_id: input.departmentId,
    access_role: input.accessRole,
    account_status: "active",
  }).eq("id", data.user.id);
  if (profileError) return NextResponse.json({ error: "O convite foi enviado, mas o perfil permaneceu sem acesso. Revise o perfil pelo owner." }, { status: 500 });

  await admin.from("audit_events").insert({ actor_id: context.user.id, action: "employee.invited", entity_type: "profile", entity_id: data.user.id });
  return NextResponse.json({ message: "Convite enviado. O acesso só estará disponível após a confirmação do e-mail." }, { status: 201 });
}
