# RJP Hub Core V3

Motor comum para o ecossistema RJP: Família Rolim Pedro, RJP Study, SwimTrack e futuras apps.

## O que esta versão inclui

- WebApp React/Vite pronta para GitHub Pages.
- APK via Capacitor/GitHub Actions.
- Backend Apps Script V3 único.
- Calendar Engine.
- Drive Engine.
- Sheets Engine.
- Conectores Study e SwimTrack.
- Cache offline básica.
- Notificações locais preparadas.
- IA Core local inicial.

## Como usar

1. Faz upload dos ficheiros soltos para o GitHub.
2. Corre `Build WebApp` para publicar a WebApp.
3. Corre `Build Android APK` para gerar APK.
4. No Apps Script, cola `google-apps-script/Code.gs`.
5. Publica como Aplicação Web.
6. Cola o URL `/exec` na app.

## Próximas ligações

- Adicionar `STUDY_SHEET_ID` ou endpoint exportFamily da RJP Study.
- Adicionar `SWIM_SHEET_ID` ou endpoint exportFamily do SwimTrack.
- Ligar Família Rolim Pedro ao mesmo Hub.

## Repositório recomendado

Nome sugerido: `RJP_Hub_Core`.
