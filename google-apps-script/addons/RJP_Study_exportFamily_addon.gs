// RJP Study - acrescentar ao Code.gs da Study para exportar para a Família
// Depois de colar, publicar nova implementação da Study.

function exportFamily() { return output(exportFamilyObject()); }

function exportFamilyObject() {
  setupObject();
  const data = getAllObject().data;
  const items = [];

  (data.eventos || []).forEach(function(e){
    if (!e.data) return;
    items.push({
      id: 'study_event_' + (e.id || e.titulo + e.data),
      titulo: e.titulo || 'Evento Study',
      data: formatStudyDate(e.data),
      hora: e.hora || '',
      membro: e.perfil || 'Rui',
      origem: 'RJP Study',
      prioridade: e.tipo === 'Exame' || e.tipo === 'Teste' ? 'Alta' : 'Normal',
      notas: 'Tipo: ' + (e.tipo || '') + '\nMatéria: ' + (e.materia || '')
    });
  });

  (data.exames || []).forEach(function(e){
    if (!e.data) return;
    items.push({
      id: 'study_exam_' + (e.id || e.disciplina + e.epoca + e.data),
      titulo: e.titulo || ((e.disciplina || 'Exame') + ' — ' + (e.epoca || '')),
      data: formatStudyDate(e.data),
      hora: e.hora || '',
      membro: e.perfil || 'Rui',
      origem: 'RJP Study',
      prioridade: 'Alta',
      notas: 'Disciplina: ' + (e.disciplina || '') + '\nÉpoca: ' + (e.epoca || '')
    });
  });

  return { ok:true, source:'RJP Study', items:items };
}

function formatStudyDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v || '').slice(0,10);
}
