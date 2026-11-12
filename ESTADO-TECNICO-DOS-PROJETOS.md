# Estado técnico dos projetos

Este documento registra a direção técnica conhecida dos projetos da Oraner. Tecnologias listadas como possibilidades não são decisões finais, promessas de compatibilidade ou prova de que um produto está pronto.

## OraOS 1 — smartphones
**Objetivo:** desenvolver uma experiência de sistema operacional móvel para aparelhos compatíveis.

**Direção técnica:** Android Open Source Project (AOSP), aplicativos Android e interface OraUI.

**Estudos necessários:** dispositivo-alvo, bootloader, kernel e drivers compatíveis, árvore de dispositivo, firmware, processo de build, atualizações de segurança e testes.

**Limitações importantes:** AOSP não inclui automaticamente Google Mobile Services (GMS). GMS, drivers proprietários, firmware e homologações dependem de processos e permissões específicos.

## OraBook OS — computadores
**Objetivo:** experiência de sistema operacional para desktops e notebooks.

**Direção técnica:** tecnologias Linux e ecossistema GNU/Linux.

**Estudos necessários:** distribuição base, ambiente gráfico, instalador, atualizações, gerenciamento de pacotes, drivers, acessibilidade e compatibilidade de hardware.

## OnWea — dispositivos vestíveis
**Objetivo:** estudar uma plataforma de software para relógios e outros dispositivos vestíveis.

**Direção técnica:** ainda em avaliação.

**Estudos necessários:** plataforma e SDK suportados, hardware-alvo, conectividade, consumo de energia, interface para telas pequenas e sincronização.

## OraStore — distribuição de aplicativos
**Objetivo:** catálogo e possível distribuição de aplicativos compatíveis.

**Direção técnica:** arquitetura ainda em planejamento.

**Estudos necessários:** modelo de distribuição, assinatura e verificação de pacotes, revisão de aplicativos, metadados, atualizações, backend, segurança e políticas de conteúdo.

## OraCam — câmera
**Objetivo:** aplicativo de câmera para aparelhos compatíveis.

**Direção técnica:** APIs de câmera Android, com Camera2 como uma possibilidade para dispositivos suportados.

**Estudos necessários:** características reais do sensor, permissões, processamento de imagem, controles de captura, testes e diferenças entre fabricantes. A qualidade final depende do hardware e do software do aparelho.

## OraCloud — serviços em nuvem
**Objetivo:** estudar serviços de conta, sincronização e armazenamento.

**Direção técnica:** ainda em planejamento.

**Estudos necessários:** arquitetura, autenticação, autorização, criptografia, proteção de dados, backups, observabilidade, custos e resposta a incidentes. Protótipos devem usar dados fictícios.

## OraUI — identidade e interface
**Objetivo:** criar princípios visuais, componentes e padrões de experiência compartilhados.

**Direção técnica:** design system, tokens visuais, documentação e implementação adaptada a cada plataforma.

**Estudos necessários:** acessibilidade, consistência, responsividade, documentação dos componentes e testes de usabilidade.

---

## Como propor uma melhoria técnica

Enquanto as regras para contribuições externas não estiverem definidas, use este documento apenas para estudo e planejamento. Não envie código de terceiros, segredos, credenciais ou dados reais de usuários.

Quando um projeto estiver preparado para colaboração externa, suas regras de licença, autoria, segurança, revisão e contribuição deverão estar publicadas no próprio repositório.
