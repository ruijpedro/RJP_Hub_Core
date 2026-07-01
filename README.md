# RJP Hub Core V1

Base reutilizável para ligar Família Rolim Pedro, RJP Study, SwimTrack e futuras apps ao mesmo backend Google.

## Como usar
1. Copiar `google-apps-script/*.gs` para um projeto Apps Script.
2. Configurar os IDs no topo de `Code.gs`.
3. Publicar como Web App: executar como **Eu**, acesso **Qualquer pessoa**.
4. Colar o URL `/exec` nas apps.

## Ações principais
- `ping`
- `syncAll`
- `calendar.list`
- `calendar.add`
- `family.sync`
- `study.import`
- `swim.import`
- `backup.create`
