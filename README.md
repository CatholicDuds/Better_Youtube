# Clarity — Better YouTube

Uma biblioteca de formação guiada por intenção, não por tempo de tela. O feed é finito, não tem autoplay e explica por que cada aula, ensaio ou conversa foi recomendado. A curadoria reúne negócios, economia, filosofia, natureza humana, geopolítica, política, administração, gestão, formação católica, curiosidades, astronomia, foguetes, empresas e criação de vídeos. Depois de cada dois vídeos, uma pausa de leitura ajuda a consolidar o aprendizado.

## Como funciona

O algoritmo roda inteiramente no navegador e combina qualidade editorial, profundidade, relevância atemporal, duração, descoberta e feedback explícito. Preferências e vídeos adicionados ficam no `localStorage`; nenhum perfil é enviado a um servidor.

O feed público é renovado automaticamente a cada seis horas pelo GitHub Actions. O job lê os feeds oficiais dos canais selecionados, rejeita Shorts, gera `public/data/latest-videos.json` e publica a nova versão sem expor chaves de API. A interface oferece busca, filtros temáticos, thumbnails reais, player incorporado, podcasts selecionados, atualização manual e temas claro/escuro.

No primeiro acesso, cada pessoa escolhe interesses, complexidade e profundidade. Política faz parte dos temas iniciais, e novos assuntos podem ser criados em **Editar interesses**. As preferências ficam somente no navegador.

## Pesquisa e notícias

A pesquisa local continua instantânea. O botão **⌕+** também pode procurar novos vídeos no YouTube, buscar os detalhes e rejeitar Shorts, lives, títulos sensacionalistas e vídeos com menos de quatro minutos antes de enviá-los ao ranking. A chave pessoal informada na tela fica no `localStorage` daquele dispositivo.

Para ativar a descoberta autônoma no site público:

1. Ative a **YouTube Data API v3** no Google Cloud e crie uma chave restrita.
2. No GitHub, abra **Settings → Secrets and variables → Actions**.
3. Crie o segredo `YOUTUBE_API_KEY`.

O workflow pesquisa os assuntos de `config/discovery-topics.json` a cada seis horas. Sem o segredo, essa etapa é ignorada e o restante do site continua funcionando.

O radar de notícias usa RSS, separa notícias de hoje e dos últimos sete dias e é atualizado no mesmo ciclo. Política, economia, mundo, ciência, tecnologia/criação e fé têm consultas próprias; as notícias sempre abrem na fonte para leitura e verificação.

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
