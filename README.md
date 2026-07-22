# Clarity — Better YouTube

Uma biblioteca de formação guiada por intenção, não por tempo de tela. O feed é finito, não tem autoplay e explica por que cada aula, ensaio ou conversa foi recomendado. A curadoria reúne negócios, economia, filosofia, natureza humana, geopolítica, política, administração, gestão, formação católica, curiosidades, astronomia, foguetes, empresas e criação de vídeos. Depois de cada dois vídeos, uma pausa de leitura ajuda a consolidar o aprendizado.

## Como funciona

O algoritmo roda inteiramente no navegador e avalia cada vídeo por seus próprios sinais: qualidade editorial, profundidade, relevância atemporal, duração, descoberta e feedback explícito. O nome ou a frequência do canal não altera essa nota. Apenas entre vídeos com pontuações praticamente equivalentes, a apresentação alterna canais para tornar o feed menos repetitivo, sem excluir conteúdo. Preferências e vídeos adicionados ficam no `localStorage`; nenhum perfil é enviado a um servidor.

O portão de entrada rejeita Shorts, vídeos com menos de quatro minutos, duração desconhecida, títulos manipulativos e candidatos que dependem de uma única palavra de aparência educativa. Para entrar, um vídeo precisa combinar vários sinais próprios, como relevância temática, explicação estruturada, descrição substancial, evidências ou fontes, profundidade e recepção proporcional.

Depois dessa triagem, `scripts/audit-content.mjs` executa a avaliação decisiva sobre o conteúdo em si. O job lê legendas dos vídeos, resolve e extrai o texto das notícias e usa a transcrição publicada do podcast; quando ela não existe, comprime e transcreve o áudio do episódio. Materiais sem conteúdo suficiente não são aprovados. A auditoria semântica usa saída estruturada para pontuar importância, profundidade, insights, evidências, clareza, capacidade de prender atenção sem manipulação, substância e embalagem enganosa. A identidade da fonte é omitida do avaliador. Os resultados ficam em `public/data/content-audits.json`, são reutilizados nas execuções seguintes e somente itens com `approved: true` entram nos três feeds.

Para ativar a auditoria profunda, crie o segredo `OPENAI_API_KEY` no GitHub. Opcionalmente, configure `OPENAI_EVALUATION_MODEL` e `CONTENT_AUDIT_BATCH_SIZE`; o padrão avalia seis itens de cada tipo por execução com `gpt-5.6`. Sem a chave, nenhum material novo recebe aprovação semântica.

O feed público é renovado automaticamente a cada hora pelo GitHub Actions. O job lê os feeds oficiais dos canais selecionados, rejeita Shorts, gera `public/data/latest-videos.json` e publica a nova versão sem expor chaves de API. A interface oferece busca, filtros temáticos, thumbnails reais, player incorporado, podcasts selecionados com capas oficiais do catálogo Apple, atualização manual e temas claro/escuro.

No primeiro acesso, cada pessoa escolhe interesses, complexidade e profundidade. Política faz parte dos temas iniciais, e novos assuntos podem ser criados em **Editar interesses**. Cada assunto personalizado abre um feed próprio, pesquisa automaticamente vídeos aprovados e guarda a seleção no navegador; ao ser reaberto depois de uma hora, o campo procura uma seleção renovada.

## Pesquisa e notícias

A pesquisa local continua instantânea. O botão **⌕+** consulta a função autenticada `search-youtube` no Supabase e procura o mesmo assunto em três frentes: YouTube, notícias em português e inglês e podcasts ativos do Apple Podcasts. Vídeos passam por relação real com o assunto, ausência de iscas de atenção, duração, densidade educativa e diversidade de canais; notícias exigem fonte confiável, atualidade e cobertura suficiente do tema; podcasts exigem relevância, atividade recente, catálogo consistente e profundidade. Cada usuário tem um limite diário e a função também protege a cota global da API do YouTube.

Para ativar a descoberta autônoma no site público:

1. Ative a **YouTube Data API v3** no Google Cloud e crie uma chave restrita.
2. No GitHub, abra **Settings → Secrets and variables → Actions**.
3. Crie o segredo `YOUTUBE_API_KEY`.

O workflow gira pelos assuntos de `config/discovery-topics.json` a cada hora. Cada consulta recebe um de quatro prompts rotativos focados no conteúdo: explicação com conceitos e exemplos, análise com fontes, fundamentos com demonstração ou estudo de caso com evidências. A aprovação considera os sinais do próprio vídeo, e não a reputação ou o nome do canal. Essa rotação mantém variedade ao longo do dia sem consumir a cota padrão do YouTube antes das pesquisas dos usuários. Sem o segredo, essa etapa é ignorada e o restante do site continua funcionando.

Para ativar a pesquisa em tempo real sem expor a chave:

1. Execute novamente `supabase/schema.sql` para criar o controle privado de uso.
2. No Supabase, abra **Edge Functions → Deploy a new function → Via Editor**.
3. Crie ou republice a função `search-youtube` com o conteúdo de `supabase/functions/search-youtube/index.ts` e mantenha a verificação de JWT ativada. Alterações nesse arquivo precisam ser implantadas novamente no Supabase; o deploy do GitHub Pages atualiza apenas o site estático.
4. Em **Edge Functions → Secrets**, crie `YOUTUBE_API_KEY` com a mesma chave usada no GitHub.

O segredo do GitHub atende às atualizações programadas; o segredo do Supabase atende às pesquisas feitas no site. A chave nunca deve ser adicionada ao código ou a uma variável `NEXT_PUBLIC_*`.

O radar de notícias usa RSS, separa notícias de hoje e dos últimos sete dias e é atualizado no mesmo ciclo. Política, economia, mundo, ciência, tecnologia/criação e fé têm consultas próprias; as notícias sempre abrem na fonte para leitura e verificação. O filtro de espectro permite comparar fontes classificadas em esquerda, centro e direita. Essa classificação é uma orientação editorial aproximada da fonte e não atribui posição política à matéria individual. Notícias e podcasts aparecem em carrosséis de até três páginas, com navegação por setas, indicadores e gesto lateral em telas de toque.

## Modo Estudo

A página `/estudo/` pode ser aberta a qualquer momento e também oferece uma agenda opcional salva no dispositivo. O usuário escolhe dias, horário, duração, trilha e idioma; lembretes do navegador funcionam enquanto o Clarity estiver aberto. As trilhas de Matemática, Inteligência Artificial, Ciência, Biologia, Pensamento Crítico, Neurociência e Economia avançam por fundamento, modelo e aplicação, com aulas selecionadas em português e inglês, exercícios, progresso local e sínteses em Markdown.

## Usuários e administrador

O login usa Supabase Auth com e-mail, senha, confirmação de e-mail, recuperação de senha e sessão persistente. O banco cria um perfil no momento da confirmação e todas as contas confirmadas têm acesso contínuo. A conta confirmada `eduardo.emilio.gomes@gmail.com` recebe o papel `admin`.

Para ativar:

1. Crie um projeto no Supabase e execute `supabase/schema.sql` no **SQL Editor**.
2. Em **Authentication → Providers → Email**, mantenha **Confirm Email** ativado.
3. Em **Authentication → URL Configuration**, cadastre a URL completa do GitHub Pages, terminando em `/Better_Youtube/`, como Site URL e Redirect URL.
4. No GitHub, crie a variável `NEXT_PUBLIC_SUPABASE_URL` e o segredo `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Nunca use a chave `service_role` no frontend.

O papel fica protegido por Row Level Security; usuários comuns só leem o próprio perfil. A função `current_user_has_access()` confirma que a sessão pertence a um perfil autenticado antes de liberar operações protegidas, como a pesquisa na API do YouTube.

## Estudar com IA

O painel **Estudar com IA** oferece botões para ChatGPT, Claude, Gemini e Grok. Ele monta um roteiro socrático com o resumo mais recente, copia para a área de transferência e abre o serviço escolhido. Nenhum dado é enviado automaticamente.

## Biblioteca de leituras

A página `/leituras/` reúne artigos, livros abertos, artigos científicos, documentos e guias — incluindo uma área de política com textos constitucionais e obras clássicas. É possível pesquisar e filtrar por tema, formato e complexidade. A página inicial também mostra uma seleção alinhada ao tema e ao nível escolhidos.

Cada leitura tem uma pergunta orientadora e uma oficina de síntese em cinco partes: explicação simples, primeiros princípios, conexões, avaliação de evidências e aplicação. O resultado é baixado em Markdown e também fica salvo localmente no navegador.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Publicar no GitHub Pages

1. Envie o repositório para o GitHub na branch `main`.
2. Em **Settings → Pages → Build and deployment**, escolha **GitHub Actions**.
3. O workflow `Publicar no GitHub Pages` fará a publicação a cada push.

## Princípios do algoritmo

- Sem sinais ocultos de engajamento ou retenção.
- Sem rolagem infinita e sem autoplay.
- Pesos transparentes e ajustáveis.
- Feedback deliberado: “mais assim” e “menos assim”.
- Diversidade controlada para evitar bolhas.
- Funciona offline depois do primeiro carregamento, exceto a reprodução no YouTube.

O motor está em `lib/recommender.ts` e pode ser reutilizado por um job local ou por GitHub Actions para pré-calcular coleções maiores no futuro.

## Diário e aulas com o Codex

Após dois vídeos e uma leitura, o usuário reconstrói as ideias com suas palavras antes de continuar. O roteiro combina a explicação simples associada a Feynman, a organização do conhecimento por fundamentos, a conexão e simplificação de ideias e o estudo deliberado orientado por perguntas e evidências. O Clarity baixa um Markdown diário. Guarde-o em `diario-de-aprendizado/entradas/`; o modelo de aula da pasta ajuda o Codex a revisar do básico ao avançado sem pular lacunas.
