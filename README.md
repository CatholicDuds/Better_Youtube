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

O ranking considera qualidade editorial, profundidade, relevância atemporal, duração, descoberta e feedback explícito. O canal não recebe peso de qualidade. A alternância de canais acontece apenas como desempate entre itens de qualidade semelhante.

Os botões **mais assim** e **menos assim** ajustam pesos do tema, formato, profundidade e duração do item. As preferências ficam no `localStorage` do WebView2, no computador do usuário.

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
