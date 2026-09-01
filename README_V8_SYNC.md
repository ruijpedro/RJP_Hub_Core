# Família Rolim Pedro V8 — sincronização robusta

Esta versão corrige o erro `Failed to fetch`.

## O que mudou
- APK Android: usa `CapacitorHttp` (HTTP nativo), evitando CORS do WebView.
- WebApp/GitHub Pages: usa JSONP no Apps Script, evitando CORS do browser.
- `syncEvents` envia eventos em lotes pequenos na WebApp para não exceder limites de URL.
- Mantém o URL do Hub configurável no separador **Sync**.

## OBRIGATÓRIO — atualizar o Apps Script
1. Abrir o projeto RJP Hub no Google Apps Script.
2. Substituir o `Code.gs` pelo ficheiro `google-apps-script/Code.gs` desta V8.
3. Guardar.
4. Implementar > Gerir implementações > Editar > **Nova versão** > Implementar.
5. Se o URL `/exec` mudar, colar o novo URL em **Família > Sync**.

## Teste
- Abrir `/exec?action=ping` no browser.
- Na Família: **Sync > Testar sincronização**.
- Depois: **Calendário > Ler Google**.
