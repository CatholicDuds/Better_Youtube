# Clarity para Windows

Este aplicativo contém a interface gráfica completa do Clarity e lê os arquivos JSON diretamente de `public/data`. Ele também:

1. incorpora o prompt editorial de `prompts/curate-feed-with-codex.md`;
2. localiza o repositório atual;
3. copia o prompt para o clipboard;
4. abre o aplicativo ChatGPT/Codex;
5. tenta abrir uma tarefa nova e colar o texto;
6. nunca pressiona Enter.

Se a automação de foco do Windows falhar, o prompt permanece no clipboard e pode ser colado com `Ctrl+V`.

## Gerar o `.exe`

```powershell
.\scripts\build-codex-launcher.ps1
```

O executável gráfico será criado em `dist/Clarity.exe`. Ele é local e não depende do GitHub Pages.
