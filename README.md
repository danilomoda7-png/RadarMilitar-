# Radar Militar Neon — PWA (Demo)

Arquivos incluídos:
- index.html
- styles.css
- app.js
- manifest.json
- service-worker.js
- icon.svg (for ícone; adicione seu próprio se quiser)

Como rodar localmente:
1. Salve os arquivos em uma pasta.
2. Sirva com um servidor estático (PWA precisa de origem segura em produção; localmente um servidor simples já funciona):
   - Node: `npx http-server -c-1` ou `npx serve`
   - VSCode: Live Server
3. Abra `http://localhost:8080` (ou porta mostrada pelo servidor).
4. No navegador, inspecione e verifique em Application → Manifest e Service Workers.
5. Para instalar como app, use a opção "Install" do navegador (Chrome/Edge).

Personalização rápida:
- Cores: altere variáveis no topo de `styles.css` (ex.: `--neon`, `--accent`).
- Intensidade do brilho: controle via slider "Glow" já presente na UI. No código, `glowControl` controla `ctx.shadowBlur`.
- Velocidade do scanner: slider "Velocidade".
- A frequência de blips aleatórios: ajuste probabilidade em `spawnRandomBlip()` no `app.js`.
- Para obter uma aparência ainda mais "militar", adicione texturas de ruído por cima do canvas via CSS/background-image.

Notas:
- Para icon definitivo, recomendo gerar PNGs 192x192 e 512x512 e atualizar `manifest.json`.
- Em produção, sirva via HTTPS para garantir todas as funcionalidades PWA.
- Se quiser gravação/armazenamento dos blips ou dados do radar, posso adicionar IndexedDB/Sync.

Se quiser, eu posso:
- Gerar uma versão com SVG animado em vez de canvas.
- Adicionar controles avançados (camadas, múltiplos scanners, filtros).
- Preparar assets (ícones PNG) e um pequeno script de build.