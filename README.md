# Clarity — Better YouTube

Uma biblioteca de formação guiada por intenção, não por tempo de tela. O feed é finito, não tem autoplay e explica por que cada aula, ensaio ou conversa foi recomendado. A curadoria reúne negócios, economia, filosofia, natureza humana, geopolítica, política, administração, gestão, formação católica, curiosidades, astronomia, foguetes, empresas e criação de vídeos. Depois de cada dois vídeos, uma pausa de leitura ajuda a consolidar o aprendizado.

## Como funciona

O algoritmo roda inteiramente no navegador e combina qualidade editorial, profundidade, relevância atemporal, duração, descoberta e feedback explícito. Preferências e vídeos adicionados ficam no `localStorage`; nenhum perfil é enviado a um servidor.

O feed público é renovado automaticamente a cada seis horas pelo GitHub Actions. O job lê os feeds oficiais dos canais selecionados, gera `public/data/latest-videos.json` e publica a nova versão sem expor chaves de API. A interface oferece busca, filtros temáticos, thumbnails reais, player incorporado e temas claro/escuro.

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

Após dois vídeos e uma leitura, o usuário reconstrói as ideias com suas palavras, extrai um princípio e define uma aplicação. O Clarity baixa um Markdown diário. Guarde-o em `diario-de-aprendizado/entradas/`; o modelo de aula da pasta ajuda o Codex a revisar do básico ao avançado sem pular lacunas.
