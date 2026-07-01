# RJP Hub Core V2

Base reutilizável para WebApp e APK Android, preparada para ligar Família Rolim Pedro, RJP Study, SwimTrack e futuras apps ao mesmo backend Google.

## O que inclui

- React + Vite
- Capacitor Android
- Workflow `build-android.yml` para gerar APK
- Workflow `build-webapp.yml` para gerar WebApp e GitHub Pages
- Ícone Android reforçado
- `capacitor.config.json` pronto
- Backend Google Apps Script em `google-apps-script/`
- Cliente comum em `src/api/hubClient.js`

## Como publicar no GitHub

1. Cria um repositório chamado `RJP_Hub_Core`.
2. Envia todos os ficheiros/pastas soltos deste ZIP para a raiz do repositório.
3. Confirma que ficam na raiz:
   - `src`
   - `public`
   - `package.json`
   - `vite.config.js`
   - `capacitor.config.json`
   - `.github/workflows`

## Criar WebApp

Vai a **Actions → Build WebApp → Run workflow**.

O resultado fica em **Artifacts** como `RJP_Hub_Core_webapp_dist` e, se o GitHub Pages estiver ativo, é publicado automaticamente.

## Criar APK

Vai a **Actions → Build Android APK → Run workflow**.

O resultado fica em **Artifacts** como `RJP_Hub_Core_debug_apk`.

## Apps Script

1. Abre `google-apps-script/`.
2. Copia os ficheiros `.gs` para um projeto Google Apps Script.
3. No `Code.gs`, confirma o `FAMILY_CALENDAR_ID`.
4. Publica como App Web:
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
5. Cola o URL `/exec` na app RJP Hub Core.

## Ações principais

- `ping`
- `syncAll`
- `calendar.list`
- `calendar.add`
- `study.import`
- `swim.import`
- `backup.create`

## Nota

Este projeto é o motor comum. Não substitui a app Família; serve para ser reutilizado depois dentro da Família, Study, SwimTrack e restantes projetos.
