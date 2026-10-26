# Manual de uso do SEIF — site

Manual do SEIF em HTML, com duas trilhas: **Indústria** e **Terceiro (fornecedor)**. Não precisa de build nem de servidor especial: são arquivos estáticos (HTML, CSS, JavaScript, imagens e vídeos).

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Página inicial: o que é o SEIF, como a Indústria e o Terceiro se conectam e a escolha do manual |
| `industria.html` | Manual da Indústria: 7 temas, 23 passos, 7 vídeos narrados |
| `terceiro.html` | Manual do Terceiro (fornecedor): 7 temas, 35 passos, 7 vídeos narrados |

## Pastas

```
assets/
  css/manual.css        estilos (os três arquivos usam o mesmo)
  js/manual.js          interações: busca, vídeos, ampliar imagens, barra
  fonts/                Montserrat e IBM Plex Mono (não depende do Google Fonts)
  img/comum/            marcas SEIF, SESI e sesi+saúde e a foto da capa
  img/industria/        telas do manual da Indústria
  img/terceiro/         telas do manual do Terceiro
  video/industria/      tema-01.mp4 … tema-07.mp4 (com narração)
  video/terceiro/       tema-01.mp4 … tema-07.mp4 (com narração)
audios/                 narração de cada vídeo em separado (.mp3) e o roteiro
```

## Publicar no GitHub Pages

1. Copie o conteúdo desta pasta para a raiz do repositório (o `index.html` precisa ficar na raiz).
2. `git add .` → `git commit -m "Manual SEIF 2026"` → `git push`.
3. No GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, pasta `/ (root)` → **Save**.
4. Em um ou dois minutos o site fica em `https://<usuário-ou-organização>.github.io/<repositório>/`.

> Repositório privado só publica no Pages em planos pagos do GitHub (Team/Enterprise). Confira com o responsável pela conta da empresa.

## Testar no computador antes de subir

Os vídeos e as imagens são carregados de arquivos, então abra por um servidor local (dar dois cliques no HTML pode bloquear alguns recursos):

```
python -m http.server 8000
```

e acesse `http://localhost:8000`. No VS Code, a extensão **Live Server** faz o mesmo.

## Observações

- Todas as telas e vídeos usam **dados fictícios** (INDÚSTRIA MODELO S.A., Montagens Exemplo Ltda etc.).
- As telas e os vídeos da Indústria foram recriados num SEIF simulado, a partir do manual da Indústria em PDF.
- A narração é uma voz sintética (Chatterbox, licença MIT) com referência de locutor brasileiro de banco de vozes CC0.
