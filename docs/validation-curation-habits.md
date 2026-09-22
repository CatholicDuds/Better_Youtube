# Validação — curadoria e hábitos

Nenhuma API externa de IA foi usada em nenhuma das partes. Nada foi commitado, enviado ou publicado.

## Parte 1 — 22/09/2026

Nenhuma API externa de IA foi utilizada. Correções existentes no diretório foram preservadas.

### Migração honesta

25 auditorias legadas: 14 vídeos, 9 notícias, 2 podcasts. Antes, 21/25 aprovadas (84%). Nenhuma registrava origem de transcrição, trechos localizados e relação com objetivos. Na migração, ficaram 0/25 aprovadas (0%); notas, teses, razões e datas originais foram preservadas, sem simular reavaliação. O feed editorial ficará vazio até haver novas análises comprovadas. A biblioteca pessoal continua disponível.

Distribuição das notas históricas (não são novas notas calibradas):

| Dimensão | 0–39 | 40–59 | 60–74 | 75–89 | 90–100 |
| --- | ---: | ---: | ---: | ---: | ---: |
| overall | 0 | 0 | 4 | 16 | 5 |
| depth | 0 | 1 | 3 | 14 | 7 |
| insight | 0 | 1 | 3 | 12 | 9 |
| evidence | 0 | 0 | 4 | 12 | 9 |
| captivating | 0 | 0 | 2 | 14 | 9 |

### Ranking antes/depois

Mesmos 14 vídeos dos catálogos, mesmas preferências padrão e notas históricas. Comparação isolada das fórmulas, sem promover os legados rejeitados ao feed. Pontuações das duas fórmulas têm escalas diferentes.

| YouTube ID | overall | Posição anterior | Posição nova | Pontos anteriores | Pontos novos |
| --- | ---: | ---: | ---: | ---: | ---: |
| GlYgs6v2YfU | 95 | 8 | 1 | 85,46 | 82,58 |
| l6DKRf-fAAM | 94 | 11 | 2 | 84,46 | 81,75 |
| aircAruvnKk | 93 | 5 | 3 | 85,74 | 80,68 |
| 36GT2zI8lVA | 90 | 1 | 4 | 93,04 | 80,26 |
| R9OCA6UFE-0 | 74 | 2 | 12 | 89,93 | 64,56 |

Reproduzir: `node scripts/test-curation.mjs`. Os testes também verificam que alterações na heurística quality/depth não alteram a nota final; aliases compartilham tema/feedback; falta de prova/objetivo impede aprovação; 95 supera 85 mesmo com feedback positivo; e nenhum prefixo da seleção excede 20% de descobertas.

`node scripts/validate-curation.mjs` valida sintaxe dos JSONs, o esquema de auditorias, aliases, objetivos, duplicatas e proporção de descobertas, e imprime distribuição/taxa de aprovação. As consultas PT/EN permanecem, agrupadas em um único registro por tema.

Objetivos em `config/goals.json` são exemplos ativos editáveis, não uma inferência sobre prioridades pessoais. A descrição e `_comment` orientam o preenchimento sem invalidar o JSON. O runtime usa os IDs e o maior peso dos objetivos explicitamente relacionados pela auditoria.

## Parte 2 — Diário de hábitos local, 22/09/2026

Página `/habitos/`, três abas: **Registro**, **Revisão** e **Ajustes**. Tudo em `localStorage`, chave `clarity-habits-v1`. Sem servidor, sem notificações, sem bloqueios e sem nenhum conteúdo do feed na página.

### Decisões de desenho

**Ausência ≠ zero.** Cada campo diário é opcional e armazenado só quando informado. `0` é um valor legítimo e entra nas médias; campo vazio não entra e não é estimado. Por isso cada cartão da revisão mostra também quantos valores compõem a média, e a revisão nunca preenche lacuna com interpolação.

**Dia sem registro não é falha.** A revisão distingue três estados: `registrado`, `sem registro` e `ainda não chegou`. Dias futuros da semana corrente não contam como ausência (o denominador é `elapsedDays`, não 7). Não existe sequência, contador de dias seguidos nem reinício.

**Mensagem única depois de deslize.** `RETURN_MESSAGE` é exatamente "Volte amanhã, sem compensar e sem recomeçar do zero." Ela aparece quando a semana registra algo acima dos limites configurados (Instagram, horário de dormir, teto de hobby, parcelamento ou YouTube reativo) — nunca como acusação de fracasso, e nunca por um dia sem registro.

**Versão mínima entre os dias 10 e 25.** `habitDay` conta o dia de início como 1. Nessa faixa o formulário mostra a versão mínima definida em Ajustes com uma caixa de confirmação; marcá-la vale como meta cumprida na revisão e no Markdown. Fora da faixa a caixa não aparece, e páginas > 0 continuam contando para os dias de leitura sem exigir mais.

**Sono medido pela noite, não pelo relógio.** `bedtimeMinutes` usa janela meio-dia–meio-dia: horários antes das 12h recebem +1440. Assim 23h e 1h têm média 0h em vez de 12h, e "dormir mais tarde" é sempre um número maior que o alvo.

**Gasto por mês, sem inventar.** O total soma apenas os dias informados do mês da semana selecionada, até hoje; nenhuma estimativa preenche os dias vazios. O campo pede o valor total da compra mesmo quando parcelada, e qualquer parcelamento do mês recebe destaque separado do teto, porque compromete meses futuros.

**Registro em uma tela.** O formulário é uma grade de oito campos curtos, com a caixa da versão mínima e um único botão. Teste automatizado verifica que o botão "Salvar registro" cabe na viewport e que não há rolagem horizontal em 375×667, 390×720 e 1280×800.

**Falha de leitura não apaga nada.** `parseHabitStore` falha fechado: dado incompatível lança erro, a página mostra um alerta, desabilita a gravação e oferece baixar a cópia original em JSON. Um diário ilegível nunca é sobrescrito por um vazio. Ao salvar, o armazenamento é relido antes da escrita para não perder registros feitos em outra aba.

**Demonstração isolada.** O botão "Ver exemplo" troca a fonte de dados por um `HabitStore` em memória e fixa "hoje" em 2026-09-20. Nada é gravado; o teste de UI compara o `localStorage` antes e depois da demonstração e exige que seja idêntico.

### Demonstração de três semanas

21 dias (31/08 a 20/09/2026), 16 registros e 5 dias sem registro, distribuídos nas três semanas. Reproduzir com `node scripts/test-habits.mjs`.

| Semana | Registros | Instagram (média) | Dormir (média) | Dias de leitura | Versão mínima | Gasto do mês | Parcelamentos |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 31/08 – 06/09 | 5/7 | 27,0 min | 23:30 | 3 | 0 | R$ 270 | 1 |
| 07/09 – 13/09 | 6/7 | 30,0 min | 23:23 | 4 | 3 | R$ 270 | 1 |
| 14/09 – 20/09 | 5/7 | 12,0 min | 23:30 | 3 | 3 | R$ 270 | 1 |

O gasto do mês é o mesmo nas três linhas porque é acumulado de setembro (R$ 180 em 05/09 e R$ 90 em 12/09), não semanal. A versão mínima é 0 na primeira semana porque a faixa 10–25 só começa em 09/09. O Markdown exportado da terceira semana está em `outputs/habits/revisao-exemplo.md` (diretório ignorado pelo Git); ele mostra lacunas como "sem registro", a mensagem de retorno e a série de disposição com os dias da faixa marcados.

## Validações executadas nesta sessão

Reexecutadas de ponta a ponta em 22/09/2026, já com o build web refeito em modo desktop.

| Verificação | Comando | Resultado |
| --- | --- | --- |
| JSONs, esquema v3, aliases, objetivos, descobertas | `node scripts/validate-curation.mjs` | OK (0/25 aprovadas, distribuição impressa) |
| Ranking antes/depois e regras de curadoria | `node scripts/test-curation.mjs` | OK (14 vídeos comparados) |
| Domínio de hábitos: datas, médias, meia-noite, orçamento, exportação | `node scripts/test-habits.mjs` | OK (21 dias, 16 registros, 5 lacunas) |
| Interface em Chromium headless, rede externa bloqueada | `node scripts/test-habits-ui.mjs` | OK, nenhum `pageerror` |
| Lint dos arquivos desta tarefa | `eslint` nos 14 arquivos alterados/novos | 0 problemas |
| Build de produção Next.js (`NEXT_PUBLIC_DESKTOP_APP=true`) | `next build` | OK, `/habitos` exportada |
| Publish .NET self-contained | `dotnet publish -c Release -r win-x64 --self-contained true` | OK, exit 0 |

O teste de UI cobre: persistência de `0` após recarregar; campos vazios que continuam ausentes; a caixa da versão mínima; a mensagem de retorno; uma tela em três tamanhos; ausência de `iframe` (nenhum conteúdo de feed); demonstração sem tocar no diário real; navegação pelas três semanas; exportação Markdown; e JSON corrompido preservado intacto com oferta de cópia.

Capturas e exemplo exportado, regerados nesta sessão, em `outputs/habits/`: `registro-375.png`, `registro-390.png`, `registro-1280.png`, `revisao-demo.png`, `revisao-exemplo.md`.

Ambiente do teste de UI: `PLAYWRIGHT_PACKAGE` apontando para o pacote `playwright` disponível na máquina e `CHROME_PATH` para o Chrome instalado. O script sobe um servidor estático temporário sobre `out/`, bloqueia qualquer requisição fora dele e encerra navegador e servidor ao terminar.

## Limitações conhecidas

**Feed editorial vazio.** Consequência direta e intencional da migração: nenhuma das 25 auditorias legadas registra origem de transcrição, citação localizada ou objetivo, então nenhuma pode ser aprovada pelas novas regras. Isso não é uma fila de aprovação pendente — exige reler o conteúdo e auditar de novo com `prompts/curate-feed-with-codex.md`. A biblioteca pessoal e a busca continuam funcionando.

**Notas legadas não foram recalibradas.** A distribuição da Parte 1 descreve as notas antigas. A rubrica com âncoras 40/60/75/90 só vale para análises novas; comparar as duas escalas diretamente não é válido.

**A comparação antes/depois não aprova nada.** Ela roda a fórmula sobre os mesmos 14 vídeos para mostrar o efeito da mudança de pesos. Todos continuam rejeitados.

**Lint global permanece sujo por herança.** `eslint . --ignore-pattern out --ignore-pattern .next` fecha em 2417 problemas: 51 erros e 2366 avisos. Os 51 erros são 50 em dois bundles compilados sob `desktop/**/bin/**/wwwroot/_next/static/chunks/` e 1 `react-hooks/set-state-in-effect` em `app/leituras/page.tsx:26`. Dos avisos, todos menos um vêm dos mesmos artefatos compilados; o restante é um `import/no-anonymous-default-export` em `supabase/functions/search-youtube/index.ts:191`. Tudo isso é anterior a esta tarefa e não foi tocado, para não ampliar o escopo. A contagem de erros continua em 51; os avisos subiram de 2349 para 2366 apenas porque o build desktop desta sessão regerou aqueles bundles, agora incluindo `/habitos`. Os arquivos desta tarefa passam limpos.

**`dist/Clarity.exe` não foi substituído.** O build terminou com sucesso e o executável novo está em `desktop/Clarity.CodexLauncher/bin/Release/net10.0-windows/win-x64/publish/Clarity.exe`, com `/habitos` verificada dentro do bundle. A cópia final para `dist/` foi bloqueada pela política de permissões desta sessão e precisa ser feita manualmente; até lá, o `dist/Clarity.exe` em disco continua sendo a versão de 22/07/2026, sem as funcionalidades novas.

**`pnpm` não está no PATH desta máquina.** `scripts/build-codex-launcher.ps1` chama `pnpm run build` e falha na primeira linha. O build foi concluído executando os dois passos equivalentes (`node_modules/.bin/next build` e `dotnet publish` com os mesmos argumentos do script). O script não foi alterado, por estar fora do escopo pedido.

**Dados só neste navegador.** O diário vive no `localStorage` do WebView2/navegador usado. Não há sincronização, backup automático nem histórico de versões; a exportação Markdown e a "cópia original" em JSON são as únicas saídas.

**Interface testada apenas em Chromium.** O `.exe` usa WebView2, que é Chromium, então a cobertura é representativa do alvo real, mas não foi verificada em Firefox ou Safari.

## Inventário de arquivos

### Novos, desta tarefa

| Arquivo | Parte | Papel |
| --- | --- | --- |
| `config/goals.json` | 1 | Objetivos ponderados, editáveis, com instruções em `_comment` |
| `config/topics.json` | 1 | IDs estáveis, rótulos e aliases |
| `config/content-audits.schema.json` | 1 | Esquema v3 das auditorias |
| `lib/topics.ts` | 1 | Normalização, aliases e objetivos ativos |
| `lib/content-audits.ts` | 1 | Tipos, elegibilidade e limite de descobertas |
| `lib/habits.ts` | 2 | Domínio do diário: parsing, revisão semanal, série e Markdown |
| `app/habitos/page.tsx` | 2 | Página com as abas Registro, Revisão e Ajustes |
| `app/habitos/habits.module.css` | 2 | Estilos da página |
| `scripts/lib/load-local-ts.mjs` | 1 e 2 | Carrega os módulos de domínio reais nos testes |
| `scripts/validate-curation.mjs` | 1 | Validação de JSONs, esquema, aliases e objetivos |
| `scripts/test-curation.mjs` | 1 | Testes de ranking e comparação antes/depois |
| `scripts/test-habits.mjs` | 2 | Testes do domínio de hábitos |
| `scripts/test-habits-ui.mjs` | 2 | Teste de interface em Chromium headless |
| `docs/validation-curation-habits.md` | 1 e 2 | Este documento |

### Alterados por esta tarefa

| Arquivo | Parte | O que mudou |
| --- | --- | --- |
| `lib/recommender.ts` | 1 | Pontuação a partir da auditoria; feedback limitado; `explain` sempre com frase |
| `app/page.tsx` | 1 e 2 | Ranking com auditorias, taxonomia normalizada, duração desconhecida, limite de descobertas, link para Hábitos |
| `public/data/content-audits.json` | 1 | Migração para o esquema v3, com metadados da migração |
| `config/discovery-topics.json` | 1 | Temas sem duplicatas, consultas bilíngues agrupadas em `searches[]` |
| `scripts/discover-videos.mjs` | 1 | Adaptado ao novo formato e à linguagem de pré-triagem |
| `prompts/curate-feed-with-codex.md` | 1 | Rubrica com âncoras, comparação em lote, evidência, objetivos e relatório |
| `README.md` | 1 e 2 | Pesos documentados, objetivos, migração e seção do diário de hábitos |
| `app/components/SectionSidebar.tsx` | 2 | Item "Hábitos" na navegação lateral |
| `app/globals.css` | 2 | Barra móvel com 6 posições |
| `app/components/AuthGate.tsx` | 2 | **Apenas** o link "Hábitos" na barra móvel |

### Alterados antes desta tarefa e apenas preservados

Estes arquivos já estavam modificados no diretório de trabalho por uma depuração anterior. Não foram revertidos nem atribuídos a esta tarefa:

- `app/components/AIStudyDock.tsx`
- `app/estudo/page.tsx`
- `desktop/Clarity.CodexLauncher/Program.cs`
- `app/components/AuthGate.tsx` — tratamento de erro em `supabase.auth.getSession()`
- `app/page.tsx` — parte do endurecimento da leitura de `localStorage`, entrelaçada com a normalização de temas da Parte 1

Ao revisar o `git diff`, esses cinco pontos não pertencem a este trabalho.

## Reproduzir

```bash
node scripts/validate-curation.mjs
node scripts/test-curation.mjs
node scripts/test-habits.mjs
```

O teste de interface exige `out/` gerado em modo desktop:

```bash
node_modules/.bin/next build
node scripts/test-habits-ui.mjs
```

com `NEXT_PUBLIC_DESKTOP_APP=true`, `NEXT_PUBLIC_BASE_PATH=""`, `PLAYWRIGHT_PACKAGE` e `CHROME_PATH` definidos no ambiente.
