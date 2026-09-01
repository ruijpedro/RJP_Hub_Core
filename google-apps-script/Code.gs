// Família Rolim Pedro V8 - RJP Hub Core Backend
// Backend único para Família + RJP Study + SwimTrack + Google Calendar + Sheets.
// Publicar como Web App: Executar como "Eu"; acesso "Qualquer pessoa".

const FAMILY_CALENDAR_ID = '5ed755d114d6482c9b0fe7db37fd1b3330c17389ef8e83f5d4806da71f097296@group.calendar.google.com';

// Opcional: cola aqui os URLs /exec das outras apps quando estiverem publicados.
// A Família continuará a funcionar mesmo vazios.
const STUDY_SCRIPT_URL = '';
const SWIM_SCRIPT_URL = '';

// Opcional: se preferires ler por Google Sheets direto, cola os IDs aqui.
const STUDY_SHEET_ID = '';
const SWIM_SHEET_ID = '';
const DB_SHEET_ID = '';

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = String(p.action || 'ping');
    let payload = {};
    if (p.payload) {
      try { payload = JSON.parse(p.payload); } catch (parseErr) { payload = {}; }
    }
    const req = Object.assign({}, payload, { action: action, params: p });
    const out = handleAction(req);

    // JSONP para WebApp/GitHub Pages: evita CORS do Apps Script.
    if (p.callback) {
      const cb = String(p.callback).replace(/[^a-zA-Z0-9_.$]/g, '');
      const body = out.getContent();
      return ContentService
        .createTextOutput(cb + '(' + body + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return out;
  } catch (err) {
    return json({ ok:false, error:String(err.message || err), where:'doGet' });
  }
}

function doPost(e) {
  try {
    let req = {};
    try { req = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch (parseErr) { req = {}; }
    return handleAction(req);
  } catch (err) {
    return json({ ok:false, error:String(err.message || err), where:'doPost' });
  }
}

function handleAction(req) {
  const action = String(req.action || 'ping');

  if (['ping','test','testSync','check','status'].indexOf(action) >= 0) return json(ping());
  if (['syncHub','syncAll','sincronizarTudo'].indexOf(action) >= 0) return json(syncHub(req));
  if (['syncEvents','calendar.sync','syncCalendar'].indexOf(action) >= 0) return json(syncEvents(req.events || []));
  if (['listEvents','events','calendar.list','readCalendar','lerCalendar'].indexOf(action) >= 0) return json(listEvents());
  if (['importStudy','study.list','syncStudy','exportStudy'].indexOf(action) >= 0) return json(importStudy());
  if (['importSwim','swim.list','syncSwim','importSwimTrack','exportSwim'].indexOf(action) >= 0) return json(importSwim());
  if (['addEvent','calendar.add'].indexOf(action) >= 0) return json(syncEvents([req.event || req]));
  if (['deleteEvent','calendar.delete'].indexOf(action) >= 0) return json(deleteEvent(req));

  // Modo seguro: nunca bloqueia a app por causa de uma ação antiga.
  return json({
    ok:true,
    warning:'Ação recebida sem rotina específica: ' + action,
    receivedAction: action,
    calendar:getCalendarName(),
    events:listEvents().events,
    study:importStudy().items,
    swim:importSwim().items
  });
}

function ping() {
  return {
    ok:true,
    app:'Família Rolim Pedro Hub Core',
    version:'V8',
    calendar:getCalendarName(),
    studyConfigured: !!(STUDY_SCRIPT_URL || STUDY_SHEET_ID),
    swimConfigured: !!(SWIM_SCRIPT_URL || SWIM_SHEET_ID),
    now:new Date()
  };
}

function syncHub(req) {
  const familyEvents = req.events || [];
  const study = importStudy().items || [];
  const swim = importSwim().items || [];

  const eventsToCalendar = []
    .concat(familyEvents)
    .concat(study.map(function(x){ return normalizeEvent(x, 'RJP Study'); }))
    .concat(swim.map(function(x){ return normalizeEvent(x, 'SwimTrack'); }));

  const synced = syncEvents(eventsToCalendar);

  saveDb('tarefas', req.tasks || req.tarefas || []);
  saveDb('compras', req.compras || []);
  saveDb('study_cache', study);
  saveDb('swim_cache', swim);

  return {
    ok:true,
    message:'RJP Hub Core V8 sincronizado',
    calendar:getCalendarName(),
    synced:synced.count,
    events:listEvents().events,
    study:study,
    swim:swim,
    status:{ family:true, calendar:true, study:!!study.length, swim:!!swim.length }
  };
}

function syncEvents(events) {
  const c = cal();
  const startWindow = new Date(); startWindow.setDate(startWindow.getDate() - 180);
  const endWindow = new Date(); endWindow.setDate(endWindow.getDate() + 900);

  const existing = c.getEvents(startWindow, endWindow);
  const byFrp = {};
  existing.forEach(function(ev){
    const tag = ev.getTag && ev.getTag('frpId');
    if (tag) byFrp[tag] = ev;
  });

  let count = 0;
  uniqueEvents(events).forEach(function(raw){
    const ev = normalizeEvent(raw, raw.origem || raw.source || 'Família');
    if (!ev.titulo || !ev.data) return;

    const id = String(ev.id || makeStableId(ev));
    const title = '[' + (ev.origem || 'Família') + '] ' + ev.titulo;
    const desc = [
      'Membro: ' + (ev.membro || 'Todos'),
      'Prioridade: ' + (ev.prioridade || 'Normal'),
      'Origem: ' + (ev.origem || 'Família'),
      'Notas: ' + (ev.notas || '')
    ].join('\n');

    let ce = byFrp[id];
    if (ce) {
      ce.setTitle(title);
      ce.setDescription(desc);
      setEventDate(ce, ev);
    } else {
      const d = makeDate(ev.data, ev.hora || '09:00');
      ce = ev.hora
        ? c.createEvent(title, d, new Date(d.getTime() + 60 * 60 * 1000), { description: desc, location: ev.local || '' })
        : c.createAllDayEvent(title, d, { description: desc, location: ev.local || '' });
      if (ce.setTag) ce.setTag('frpId', id);
      if (ce.setTag) ce.setTag('origem', ev.origem || 'Família');
    }
    count++;
  });

  return { ok:true, count, calendar:getCalendarName() };
}

function listEvents() {
  const c = cal();
  const start = new Date(); start.setDate(start.getDate() - 30);
  const end = new Date(); end.setDate(end.getDate() + 365);
  const tz = Session.getScriptTimeZone();

  const events = c.getEvents(start, end).map(function(e){
    return {
      id:(e.getTag && e.getTag('frpId')) || e.getId(),
      titulo:cleanTitle(e.getTitle()),
      data:Utilities.formatDate(e.getStartTime(), tz, 'yyyy-MM-dd'),
      hora:e.isAllDayEvent() ? '' : Utilities.formatDate(e.getStartTime(), tz, 'HH:mm'),
      membro:readDesc(e.getDescription(), 'Membro') || 'Todos',
      origem:(e.getTag && e.getTag('origem')) || origemFromTitle(e.getTitle()),
      prioridade:readDesc(e.getDescription(), 'Prioridade') || 'Normal',
      notas:readDesc(e.getDescription(), 'Notas') || '',
      local:e.getLocation() || ''
    };
  });
  return { ok:true, calendar:getCalendarName(), events };
}

function importStudy() {
  let items = [];
  if (STUDY_SCRIPT_URL) items = fetchExternalEvents(STUDY_SCRIPT_URL, 'RJP Study');
  else if (STUDY_SHEET_ID) items = readSheetEvents(STUDY_SHEET_ID, 'RJP Study');
  return { ok:true, source:'RJP Study', items:items };
}

function importSwim() {
  let items = [];
  if (SWIM_SCRIPT_URL) items = fetchExternalEvents(SWIM_SCRIPT_URL, 'SwimTrack');
  else if (SWIM_SHEET_ID) items = readSheetEvents(SWIM_SHEET_ID, 'SwimTrack');
  return { ok:true, source:'SwimTrack', items:items };
}

function fetchExternalEvents(url, origem) {
  try {
    const sep = String(url).indexOf('?') >= 0 ? '&' : '?';
    let resp = UrlFetchApp.fetch(url + sep + 'action=exportFamily', { muteHttpExceptions:true, followRedirects:true });
    let txt = resp.getContentText();
    let obj = safeParse(txt);

    // Fallback para RJP Study antigo: getAll
    if (!obj || obj.ok === false) {
      resp = UrlFetchApp.fetch(url + sep + 'action=getAll', { muteHttpExceptions:true, followRedirects:true });
      obj = safeParse(resp.getContentText());
    }

    return normalizeExternalPayload(obj, origem);
  } catch (err) {
    return [{ id:origem + '_erro', titulo:'Erro ao importar ' + origem, data:today(), origem, membro:'Todos', notas:String(err.message || err), prioridade:'Alta' }];
  }
}

function normalizeExternalPayload(obj, origem) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj.map(function(x){ return normalizeEvent(x, origem); }).filter(hasDate);
  if (Array.isArray(obj.items)) return obj.items.map(function(x){ return normalizeEvent(x, origem); }).filter(hasDate);
  if (Array.isArray(obj.events)) return obj.events.map(function(x){ return normalizeEvent(x, origem); }).filter(hasDate);
  if (obj.data) {
    const out = [];
    const d = obj.data;
    (d.eventos || d.events || []).forEach(function(x){ out.push(normalizeEvent(x, origem)); });
    (d.exames || []).forEach(function(x){ out.push(normalizeStudyExam(x)); });
    return out.filter(hasDate);
  }
  return [];
}

function normalizeStudyExam(x) {
  return normalizeEvent({
    id:x.id,
    titulo:x.titulo || ((x.disciplina || 'Exame') + (x.epoca ? ' — ' + x.epoca : '')),
    data:x.data,
    hora:x.hora,
    membro:x.perfil || x.membro || 'Rui',
    origem:'RJP Study',
    notas:'Disciplina: ' + (x.disciplina || '') + '\nÉpoca: ' + (x.epoca || ''),
    prioridade:'Alta'
  }, 'RJP Study');
}

function readSheetEvents(id, origem) {
  if (!id) return [];
  const ss = SpreadsheetApp.openById(id);
  const sheet = ss.getSheets()[0];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift().map(function(h){ return String(h).trim().toLowerCase(); });
  return values.map(function(r, i){
    return normalizeEvent({
      id:origem.replace(/\s+/g,'_') + '_' + i + '_' + getVal(r, headers, ['data','date','dia']),
      titulo:getVal(r, headers, ['titulo','title','nome','disciplina','prova','evento','tarefa']) || origem,
      data:formatDate(getVal(r, headers, ['data','date','dia'])),
      hora:getVal(r, headers, ['hora','time']) || '',
      membro:getVal(r, headers, ['membro','perfil','aluno','atleta','pessoa']) || 'Todos',
      origem,
      notas:getVal(r, headers, ['notas','observações','observacoes','obs','materia']) || '',
      prioridade:getVal(r, headers, ['prioridade']) || 'Normal'
    }, origem);
  }).filter(hasDate);
}

function deleteEvent(req) {
  const id = String(req.id || req.eventId || '');
  if (!id) return { ok:true, message:'Sem id para apagar' };
  const c = cal();
  const start = new Date(); start.setDate(start.getDate() - 365);
  const end = new Date(); end.setDate(end.getDate() + 900);
  const events = c.getEvents(start, end);
  let count = 0;
  events.forEach(function(e){ if (e.getTag && e.getTag('frpId') === id) { e.deleteEvent(); count++; } });
  return { ok:true, deleted:count };
}

function normalizeEvent(ev, origemDefault) {
  return {
    id:ev.id || ev.eventId || ev.uid || makeStableId(ev),
    titulo:ev.titulo || ev.title || ev.nome || ev.name || ev.destino || ev.prova || ev.disciplina || 'Evento',
    data:formatDate(ev.data || ev.date || ev.inicio || ev.start || ev.dia),
    hora:String(ev.hora || ev.time || '').slice(0,5),
    membro:ev.membro || ev.perfil || ev.resp || ev.aluno || ev.atleta || ev.pessoa || 'Todos',
    origem:ev.origem || ev.source || origemDefault || 'Família',
    notas:ev.notas || ev.obs || ev.description || ev.materia || ev.topics || '',
    prioridade:ev.prioridade || ev.priority || 'Normal',
    local:ev.local || ev.location || ''
  };
}
function hasDate(x){ return !!(x && x.data); }
function uniqueEvents(events) {
  const seen = {};
  return (events || []).filter(function(x){
    const ev = normalizeEvent(x, x && x.origem);
    const id = String(ev.id || makeStableId(ev));
    if (seen[id]) return false;
    seen[id] = true;
    return true;
  });
}
function makeStableId(ev) { return Utilities.base64EncodeWebSafe(String((ev.origem || ev.source || '') + '|' + (ev.titulo || ev.title || ev.nome || '') + '|' + (ev.data || ev.date || '') + '|' + (ev.hora || ev.time || ''))).slice(0,80); }
function setEventDate(ce, ev) { if (ev.hora) { const d = makeDate(ev.data, ev.hora); ce.setTime(d, new Date(d.getTime() + 60*60*1000)); } else ce.setAllDayDate(makeDate(ev.data, '09:00')); }
function makeDate(data, hora) { const parts = String(data).slice(0,10).split('-'); const hs = String(hora || '09:00').slice(0,5).split(':'); return new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]), Number(hs[0] || 9), Number(hs[1] || 0)); }
function formatDate(v) { if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd'); const s = String(v || '').trim(); if (!s) return ''; if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10); if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) { const p=s.split('/'); return p[2].slice(0,4)+'-'+p[1]+'-'+p[0]; } return s.slice(0,10); }
function today(){ return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function cleanTitle(t){ return String(t || '').replace(/^\[[^\]]+\]\s*/, ''); }
function origemFromTitle(t){ const m = String(t || '').match(/^\[([^\]]+)\]/); return m ? m[1] : 'Google Calendar'; }
function readDesc(desc, key){ const m = String(desc || '').match(new RegExp(key + ':\\s*([^\\n]*)')); return m ? m[1] : ''; }
function getVal(r, headers, names){ for (let i=0;i<names.length;i++){ const idx=headers.indexOf(names[i]); if (idx>=0) return r[idx]; } return ''; }
function safeParse(txt){ try { return JSON.parse(txt); } catch (e) { return null; } }
function cal(){ const c = CalendarApp.getCalendarById(FAMILY_CALENDAR_ID); if (!c) throw new Error('Calendário familiar não encontrado. Confirma o FAMILY_CALENDAR_ID.'); return c; }
function getCalendarName(){ return cal().getName(); }
function json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function saveDb(name, items) {
  try {
    const ss = getDb();
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.clear(); sh.appendRow(['json','updatedAt']);
    (items || []).forEach(function(x){ sh.appendRow([JSON.stringify(x), new Date()]); });
  } catch (err) {}
}
function getDb(){ if (DB_SHEET_ID) return SpreadsheetApp.openById(DB_SHEET_ID); const files=DriveApp.getFilesByName('Familia_Rolim_Pedro_DB'); if (files.hasNext()) return SpreadsheetApp.open(files.next()); return SpreadsheetApp.create('Familia_Rolim_Pedro_DB'); }
