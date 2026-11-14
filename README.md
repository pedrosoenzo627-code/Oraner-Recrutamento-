# ORANER TECHNOLOGIES
### Projetos, documentação e interesse em colaboração técnica

**Inovação • Desempenho • Liberdade**

Bem-vindo ao repositório informativo da **Oraner Technologies**. Este espaço apresenta a iniciativa, seus projetos em planejamento e desenvolvimento, as áreas técnicas que poderão fazer parte de sua estrutura e os cuidados necessários antes de qualquer colaboração externa.

> **Transparência:** a Oraner está em fase inicial e não possui orçamento para salários ou contratações neste momento. Este repositório **não anuncia vagas de emprego nem solicita trabalho gratuito**. A possibilidade de receber contribuições externas será avaliada com orientação adequada sobre situação jurídica, licenças, autoria, privacidade e proteção de participantes.

---

## 1. Sobre a Oraner

A Oraner é uma iniciativa de tecnologia que pretende pesquisar, projetar e desenvolver sistemas operacionais, aplicativos e experiências de software para diferentes dispositivos.

Nosso objetivo é construir uma base técnica consistente, documentada e sustentável, evoluindo os projetos por etapas e sem apresentar ideias em desenvolvimento como produtos finalizados.

## 2. Projetos

| Projeto | Objetivo | Direção técnica atual |
|---|---|---|
| **OraOS 1** | Sistema para smartphones. | Android Open Source Project (AOSP); compatibilidade depende de hardware, drivers, firmware e licenças. |
| **OraBook OS** | Sistema para computadores e notebooks. | Tecnologias Linux e ecossistema GNU/Linux. |
| **OnWea** | Plataforma de software para dispositivos vestíveis. | Plataforma e arquitetura ainda em avaliação. |
| **OraStore** | Catálogo e distribuição de aplicativos compatíveis. | Produto e serviços em planejamento. |
| **OraCam** | Aplicativo de câmera para dispositivos compatíveis. | APIs de câmera Android como direção inicial; compatibilidade precisa ser testada. |
| **OraCloud** | Serviços de conta, sincronização e armazenamento. | Arquitetura, segurança e custos em estudo. |
| **OraUI** | Linguagem visual e componentes de interface. | Design system multiplataforma em definição. |

Consulte [Projetos e direção técnica](ESTADO-TECNICO-DOS-PROJETOS.md) para ver o que está definido e o que ainda precisa ser pesquisado.

## 3. Estrutura planejada

A estrutura organizacional está documentada em [Departamentos](DEPARTAMENTOS.md). Ela é um planejamento futuro, não significa que existam 14 equipes ou vagas abertas.

As áreas de maior prioridade técnica para a fase inicial são:
- Software e sistemas.
- Engenharia e pesquisa de hardware.
- Design e experiência de usuário.
- Qualidade, testes e documentação.

## 4. Situação atual e participação

A Oraner ainda está organizando seus projetos, sua estrutura e suas condições para receber contribuições externas. Não há orçamento para salários, bolsas ou pagamentos.

**Não estamos anunciando posições voluntárias nem pedindo que pessoas executem tarefas de operação da iniciativa sem remuneração.** A possibilidade de contribuições independentes em projetos de código aberto só deverá ser aberta após definir publicamente o repositório, a licença, as regras de contribuição, a titularidade dos direitos e os cuidados jurídicos aplicáveis.

Até lá, pessoas interessadas podem conhecer a documentação e enviar perguntas gerais, sem assumir tarefas ou compromissos.

## 5. Como trabalhamos com tecnologia

Quando um projeto estiver preparado para contribuições externas:
- As regras e a licença do repositório deverão estar publicadas antes da primeira contribuição.
- Mudanças deverão ser propostas por Pull Requests e revisadas.
- Cada contribuição deverá ter escopo claro e ser feita por decisão livre da própria pessoa.
- Não serão solicitados horários fixos, disponibilidade obrigatória ou exclusividade.
- Autoria, licença, direitos de uso e responsabilidades deverão estar claros antes da integração.
- Não compartilhe senhas, tokens, chaves privadas, arquivos `.env` ou credenciais.

## 6. Segurança, privacidade e menores de idade

Não publique neste repositório ou em comunidades:
- Senhas, tokens, chaves privadas ou credenciais.
- Documentos pessoais, endereço residencial ou dados bancários.
- Informações confidenciais de clientes, empresas ou terceiros.

Não solicitamos documentos, dados sensíveis ou pagamentos para conhecer a iniciativa. Menores de idade devem contar com conhecimento e acompanhamento de seu responsável legal; nenhum acordo ou compromisso formal deve ser assumido por menores por conta própria.

Leia [Privacidade e contribuições](PRIVACIDADE-E-CONTRIBUICOES.md).

## 7. Contato com comunidades e parcerias

Estamos buscando orientação sobre iniciativas educacionais, comunidades de tecnologia e boas práticas de código aberto. A mensagem preparada para a Cumbuca Dev está em [Contato com a Cumbuca Dev](CONTATO-CUMBUCA-DEV.md).

## 8. Documentos deste repositório

- [Projetos da Oraner](PROJETOS.md)
- [Estado técnico dos projetos](ESTADO-TECNICO-DOS-PROJETOS.md)
- [Departamentos planejados](DEPARTAMENTOS.md)
- [Áreas de conhecimento](AREAS-DE-COLABORACAO.md)
- [Plano de crescimento](PLANO-DE-CRESCIMENTO.md)
- [Como conhecer a iniciativa](COMO-PARTICIPAR.md)
- [Privacidade e contribuições](PRIVACIDADE-E-CONTRIBUICOES.md)
- [Transparência e regras](TRANSPARENCIA-E-REGRAS.md)
- [Contato com a Cumbuca Dev](CONTATO-CUMBUCA-DEV.md)

---

**ORANER TECHNOLOGIES**  
*Inovação • Desempenho • Liberdade*

<sub>Este repositório é informativo. Não constitui oferta de emprego, contrato, promessa de remuneração, investimento ou participação societária. A participação externa dependerá de regras, licenças e orientações adequadas previamente definidas.</sub>


## Integração Gemini e gestão de conteúdo

O assistente público está em `/assistente`. O painel privado do Gestor IA está em `/workplace/gestor-ia` e exige perfil autorizado no Workplace.

A API Gemini usa a API Interactions atual. Configure `GEMINI_API_KEY` (segredo somente do servidor). Os modelos padrão são `gemini-3.8-flash` para texto e `gemini-3.1-flash-image` para imagens. O Gestor IA cria rascunhos e imagens; um owner ou gestor precisa aprovar antes que um comunicado apareça publicamente.

**O Gemini não recebe as chaves do Supabase ou Stripe, não altera cargos e não edita nem publica código do site por conta própria.** Recomendações de melhoria aparecem nos relatórios para revisão humana.

## Relatório semanal automático

O arquivo `vercel.json` agenda `/api/cron/weekly-report` toda segunda-feira às 12:00 UTC (09:00 no horário de Brasília). Configure uma variável secreta `CRON_SECRET` na Vercel; o endpoint recusa chamadas sem o cabeçalho de autorização esperado. O relatório usa contagens reais de produtos, comunicados e campanhas do Supabase. Visitas, cliques e vendas não são estimados enquanto essas métricas não estiverem integradas.

## Migration do Gestor IA e imagens

Execute o conteúdo de `supabase/migrations/202611130001_oraner_ai_manager.sql` uma vez no SQL Editor do Supabase para criar as colunas de imagem, as tabelas privadas de rascunhos/relatórios e o bucket de imagens geradas.
