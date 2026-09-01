// SwimTrack - modelo de exportação para a Família
// Adaptar os nomes das folhas/campos se a tua SwimTrack usar uma estrutura diferente.

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';
  if (action === 'exportFamily') return ContentService.createTextOutput(JSON.stringify(exportFamilyObject())).setMimeType(ContentService.MimeType.JSON);
  return ContentService.createTextOutput(JSON.stringify({ok:true, app:'SwimTrack'})).setMimeType(ContentService.MimeType.JSON);
}

function exportFamilyObject() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const items = [];
  ['Treinos','Competicoes','Competições','Eventos'].forEach(function(name){
    const sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return;
    const values = sh.getDataRange().getValues();
    const h = values.shift().map(function(x){ return String(x).trim().toLowerCase(); });
    values.forEach(function(r, i){
      const data = valSwim(r,h,['data','dia','date']);
      if (!data) return;
      items.push({
        id: 'swim_' + name + '_' + i + '_' + formatSwimDate(data),
        titulo: valSwim(r,h,['titulo','nome','prova','competição','competicao','evento']) || name,
        data: formatSwimDate(data),
        hora: valSwim(r,h,['hora','time']) || '',
        membro: valSwim(r,h,['atleta','membro','pessoa']) || 'Constança',
        origem: 'SwimTrack',
        prioridade: name.toLowerCase().indexOf('compet') >= 0 ? 'Alta' : 'Normal',
        notas: valSwim(r,h,['notas','obs','local','piscina']) || ''
      });
    });
  });
  return { ok:true, source:'SwimTrack', items:items };
}
function valSwim(r,h,names){ for (var i=0;i<names.length;i++){ var idx=h.indexOf(names[i]); if(idx>=0) return r[idx]; } return ''; }
function formatSwimDate(v){ if(v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd'); return String(v||'').slice(0,10); }
