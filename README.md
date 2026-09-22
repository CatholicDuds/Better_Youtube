# Clarity — Better YouTube

Aplicativo Windows de curadoria intencional de vídeos, notícias, podcasts e leituras. O feed é finito, não tem autoplay e explica por que cada conteúdo foi recomendado.

## Aplicativo desktop

O executável final fica em `dist/Clarity.exe`. Ele contém a interface gráfica completa e lê os arquivos diretamente de `public/data/`; não depende do GitHub Pages nem de um servidor web local.

Na primeira execução, o Clarity procura a pasta do projeto. Se ela não estiver no local conhecido, o aplicativo pede que o usuário selecione a pasta que contém `package.json` e `public/data/`.

Para recompilar:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-codex-launcher.ps1
```

## Curadoria manual no Codex

O botão **Curar no Codex**:

1. gera a instrução editorial com o caminho local do projeto;
2. copia a instrução para a área de transferência;
3. abre uma tarefa no aplicativo ChatGPT/Codex;
4. cola o texto, mas não o envia automaticamente.

O próprio Codex pesquisa e avalia o conteúdo. Não existe dependência de API externa de IA, chave de modelo, fila automática ou sistema de pendências.

A curadoria atualiza estes arquivos:

- `public/data/latest-videos.json`
- `public/data/discovered-videos.json`
- `public/data/news.json`
- `public/data/podcasts.json`
- `public/data/content-audits.json`

Depois que a tarefa terminar, o botão **Recarregar** relê imediatamente esses JSONs locais. Somente análises concluídas com `method: "semantic-content"` e `approved: true` entram no feed.

## Critérios editoriais

Cada item é julgado pelo conteúdo real, e não pela reputação do canal, convidado ou veículo. A avaliação exige tese clara, desenvolvimento, evidências ou exemplos, profundidade, novos insights, honestidade sobre limites e densidade compatível com o tempo pedido ao usuário.

Shorts, cortes vazios, propaganda disfarçada, clickbait sem substância, duplicações e itens cujo conteúdo não pôde ser verificado ficam de fora. Conteúdos recentes têm preferência quando a qualidade é equivalente, mas obras antigas excepcionais continuam elegíveis.

## Algoritmo local

O ranking usa notas `semantic-content` normalizadas de 0–100 para 0–1: **overall × 50 + depth × 10 + insight × 10 + evidence × 10** (80 pontos de qualidade). Adequação soma até 20: objetivo ativo de maior peso × 10; tema preferido × 2; proximidade da profundidade desejada × 3; evergreen × preferência × 2; duração conhecida compatível × 2; atualidade em 90 dias × preferência de descoberta × 1. captivating é registrado, mas não premia retenção no ranking.

Feedback é limitado a ±4: direto ±2, tema ±1 e conjunto de traços ±1. “Menos assim” continua ocultando o item por escolha explícita. Rotação desconta no máximo 2 pontos; alternância de canais ocorre entre notas semelhantes. Os valores heurísticos quality/depth dos candidatos só fazem pré-triagem. Itens sem auditoria não têm nota editorial; a biblioteca pessoal continua acessível, com duração desconhecida explicitamente indicada (zero), sem inventar 15 minutos.

`config/goals.json` contém exemplos ativos editáveis, pesos de 0 a 1 e campos `_comment`/descrição para orientar o preenchimento (JSON não aceita comentários `//`). `config/topics.json` mapeia aliases para IDs estáveis. Preferências antigas e temas dos catálogos são normalizados na leitura; feedback de aliases não é somado em duplicidade. Buscas não classificadas ficam em `nao-classificado` até a curadoria. `config/discovery-topics.json` agrupa buscas bilíngues sob um único tema.

O esquema é `config/content-audits.schema.json` (v3). Aprovação exige origem verificável, citação localizada e objetivo ativo ou marcação de descoberta. Descobertas ocupam no máximo 20% de cada prefixo exibido, após filtros. Auditorias legadas sem origem/citações foram conservadas como rejeitadas; suas notas não foram recalibradas sem reler o conteúdo. Isso pode esvaziar o feed até a próxima curadoria manual. Não é uma fila de aprovação.

Os botões **mais assim** e **menos assim** ajustam pesos do tema, formato, profundidade e duração do item. As preferências ficam no `localStorage` do WebView2, no computador do usuário.

## Diário de hábitos local

Abra `/habitos/` pelo menu. O registro usa uma única tela com campos opcionais e pode ser editado por data. O horário de dormir se refere à noite anterior à data do registro. Zero é válido; campo vazio não entra na média. Informe o valor total da compra de hobby, inclusive quando parcelada.

Na aba Revisão, o resumo é calculado automaticamente para a semana (segunda–domingo). Médias usam somente valores preenchidos e exibem a contagem; dias futuros não entram como ausências. Horários de sono são agrupados pela noite (janela meio-dia–meio-dia: 23h e 1h dão média 0h). Gasto é somado no mês indicado, apenas nos dias registrados; nenhuma estimativa preenche lacunas. Qualquer parcelamento registrado nesse mês recebe destaque.

Ajustes define limites, hábito principal, início e versão mínima. Dia inicial conta como 1. Entre os dias 10 e 25, confirmar a versão mínima vale como meta cumprida; páginas > 0 também contam para os dias de leitura, sem aumentar a exigência. Alterar o início apenas muda a faixa destacada, sem apagar o diário. Não há notificações, bloqueios, sequências ou reinício obrigatório.

O gráfico cobre 21 dias até o fim da semana selecionada (ou hoje), com lacunas desconectadas e tabela acessível. A exportação Markdown inclui resumo, registros e série de disposição. Tudo fica em `localStorage` na chave `clarity-habits-v1`; nenhum registro é enviado a servidor. O botão **Ver exemplo** mostra três semanas fictícias sem gravar no diário; use as setas da revisão para percorrê-las.

Validação local: `node scripts/validate-curation.mjs`, `node scripts/test-curation.mjs`, `node scripts/test-habits.mjs`, `pnpm run lint` e `pnpm run build`. Resultados e decisões: `docs/validation-curation-habits.md`.

## Desenvolvimento local

```bash
pnpm install
pnpm run dev
```

Abra `http://localhost:3000` apenas durante o desenvolvimento. A versão distribuída deve ser usada pelo `Clarity.exe`.

## Princípios

- sem sinais ocultos de engajamento;
- sem rolagem infinita e sem autoplay;
- pesos transparentes e ajustáveis;
- feedback deliberado;
- diversidade sem favorecer ou punir canais;
- dados e preferências mantidos localmente;
- nenhuma publicação automática.
