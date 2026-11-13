import type { Metadata } from "next";
import { OwnerSetupForm } from "@/components/owner-setup-form";

export const metadata: Metadata = { title: "Primeiro acesso do owner", robots: { index: false, follow: false } };

export default function OwnerSetupPage() {
  return <OwnerSetupForm />;
}
