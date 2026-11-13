import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, LockKeyhole } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  summary: string;
  price_cents: number | null;
  currency: string;
};

type PublicAnnouncement = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publish_at: string | null;
};

const projects = [
  { number: "01", name: "OraOS 1", description: "Pesquisa de uma experiência de software para smartphones, com compatibilidade ainda em avaliação." },
  { number: "02", name: "OraBook OS", description: "Exploração de uma plataforma para computadores, baseada no ecossistema GNU/Linux." },
  { number: "03", name: "OnWea", description: "Conceito de software para dispositivos vestíveis. Plataforma e arquitetura em estudo." },
  { number: "04", name: "OraStore", description: "Ideia de catálogo e distribuição de aplicativos compatíveis; ainda sem operação comercial." },
  { number: "05", name: "OraCam", description: "Aplicativo de câmera em fase de pesquisa, sujeito às APIs e aos dispositivos compatíveis." },
  { number: "06", name: "OraCloud", description: "Serviços de conta e sincronização em avaliação de arquitetura, privacidade e custos." },
  { number: "07", name: "OraUI", description: "Direção de linguagem visual e componentes multiplataforma em definição." },
];

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency.toUpperCase() }).format(price / 100);
}

export function LandingPage({ products, announcements }: { products: PublicProduct[]; announcements: PublicAnnouncement[] }) {
  return (
    <main>
      <SiteHeader />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Oraner Technologies · pesquisa e desenvolvimento</span>
          <h1 id="hero-title">Tecnologia com espaço para <span>imaginar.</span></h1>
          <p className="hero-lede">A Oraner explora software, sistemas e experiências digitais com foco em clareza, qualidade e privacidade — sempre deixando explícito o que ainda está em construção.</p>
          <div className="hero-actions">
            <a className="button-primary" href="#projetos">Conheça os projetos <ArrowDown size={16} aria-hidden="true" /></a>
            <Link className="button-secondary" href="/workplace/login">Acessar Workplace <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
          <p className="hero-note">Projetos em desenvolvimento. Disponibilidade e novidades serão anunciadas nesta página.</p>
        </div>
        <figure className="hero-visual">
          <Image src="/images/oraner-concept-device.png" alt="Conceito visual de smartphone e notebook em acabamento metálico" fill priority sizes="(max-width: 860px) 100vw, 50vw" />
          <figcaption className="hero-caption">CONCEITO VISUAL · NÃO É PRODUTO À VENDA</figcaption>
        </figure>
      </section>

      <section className="section" id="projetos" aria-labelledby="projects-title">
        <div className="section-head">
          <div>
            <p className="section-kicker">O que estamos explorando</p>
            <h2 id="projects-title">Ideias que começam com boas perguntas.</h2>
          </div>
          <p className="section-intro">Cada iniciativa está em fase de pesquisa, planejamento ou desenvolvimento. A compatibilidade, os recursos e os prazos ainda não estão confirmados.</p>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.number}>
              <span className="project-number">{project.number} / ORANER</span>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <span className="status-chip">Em desenvolvimento</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="novidades" aria-labelledby="announcements-title">
        <div className="section-head">
          <div>
            <p className="section-kicker">Novidades da Oraner</p>
            <h2 id="announcements-title">Comunicados revisados pela equipe.</h2>
          </div>
          <p className="section-intro">Somente anúncios aprovados ficam visíveis publicamente. Rascunhos permanecem privados no Workplace.</p>
        </div>
        {announcements.length ? (
          <div className="product-grid">
            {announcements.map((announcement) => (
              <article className="product-card announcement-card" key={announcement.id}>
                <div className="announcement-meta">
                  <span className="status-chip">Comunicado</span>
                  {announcement.publish_at && <time className="announcement-date" dateTime={announcement.publish_at}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(announcement.publish_at))}</time>}
                </div>
                <h3>{announcement.title}</h3>
                <p>{announcement.excerpt}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-catalog">
            <strong>Nenhum comunicado publicado por enquanto.</strong>
            <p>Novidades serão exibidas aqui após a revisão e publicação pela equipe.</p>
          </div>
        )}
      </section>

      <section className="section" id="loja" aria-labelledby="store-title">
        <div className="section-head">
          <div>
            <p className="section-kicker">Loja Oraner</p>
            <h2 id="store-title">Um catálogo só quando houver algo pronto.</h2>
          </div>
          <p className="section-intro">A loja está sendo preparada. Só exibimos itens publicados e revisados pela equipe; conceitos e rascunhos ficam privados no Workplace.</p>
        </div>
        {products.length ? (
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <span className="status-chip">{product.category}</span>
                <h3>{product.name}</h3>
                <p>{product.summary}</p>
                {product.price_cents !== null && <div className="product-price">{formatPrice(product.price_cents, product.currency)}</div>}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-catalog">
            <strong>Sem produtos publicados por enquanto.</strong>
            <p>Os novos itens aparecem aqui somente depois de uma revisão e publicação autorizada. Não há checkout ativo nesta etapa.</p>
          </div>
        )}
      </section>

      <section className="section" id="sobre" aria-labelledby="about-title">
        <div className="statement">
          <div>
            <p className="section-kicker">Uma iniciativa em fase inicial</p>
            <h2 id="about-title">Construir com clareza também é inovar.</h2>
          </div>
          <div className="statement-copy">
            <p>A Oraner está organizando seus projetos, processos e condições para crescer. As áreas e os cargos descritos são <strong>referências planejadas</strong> — não indicam que existam equipes, vagas ou contratações em andamento.</p>
            <p>Neste momento não há orçamento para salários ou pagamentos. Não solicitamos trabalho gratuito, dados bancários ou documentos pessoais. Compromissos formais só devem ser assumidos quando houver estrutura legal e orientação adequada.</p>
            <div className="value-row">
              <div className="value-item"><strong>Transparência</strong><span>Estado real, sem promessas de lançamento.</span></div>
              <div className="value-item"><strong>Privacidade</strong><span>Acesso mínimo e dados protegidos por função.</span></div>
              <div className="value-item"><strong>Qualidade</strong><span>Pesquisa e revisão antes de publicar.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="workplace-title">
        <div className="cta-band">
          <div>
            <p className="section-kicker">Área interna</p>
            <h2 id="workplace-title">Um espaço privado para organizar o trabalho.</h2>
            <p>O Workplace exige conta ativa; cadastros abertos não recebem acesso aos dados internos.</p>
          </div>
          <Link className="button-primary" href="/workplace/login">Entrar com segurança <LockKeyhole size={15} aria-hidden="true" /></Link>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <div className="brand"><span className="brand-mark" aria-hidden="true">O</span><span>Oraner<span className="brand-sub">TECHNOLOGIES</span></span></div>
          <p className="footer-copy">© {new Date().getFullYear()} Oraner Technologies · Projetos em desenvolvimento</p>
        </div>
        <nav className="footer-links" aria-label="Links institucionais">
          <a href="https://github.com/pedrosoenzo627-code/Oraner-Recrutamento-" target="_blank" rel="noreferrer">GitHub <ArrowRight size={12} aria-hidden="true" /></a>
          <Link href="/workplace/login">Workplace</Link>
          <a href="#sobre">Privacidade e transparência</a>
        </nav>
      </footer>
    </main>
  );
}
