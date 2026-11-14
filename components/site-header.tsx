import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Oraner Technologies — início">
      <span className="brand-mark" aria-hidden="true">
        <Image src="/images/oraner-logo.jpg" alt="" fill sizes="34px" priority />
      </span>
      <span>Oraner<span className="brand-sub">TECHNOLOGIES</span></span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <Brand />
      <nav className="site-nav" aria-label="Navegação principal">
        <Link href="/#projetos">Projetos</Link>
        <Link href="/#novidades">Novidades</Link>
        <Link href="/#loja">Loja</Link>
        <Link href="/#sobre">Sobre</Link>
        <Link href="/assistente">Oraner IA</Link>
      </nav>
      <Link className="header-action" href="/workplace/login">
        Workplace <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </header>
  );
}
