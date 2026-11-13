import type { Metadata } from "next";
import { WorkplaceLogin } from "@/components/workplace-login";

export const metadata: Metadata = { title: "Login do Workplace", robots: { index: false, follow: false } };

type LoginPageProps = { searchParams: Promise<{ confirmed?: string; auth?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return <WorkplaceLogin confirmed={params.confirmed === "1"} authError={params.auth === "error"} />;
}
