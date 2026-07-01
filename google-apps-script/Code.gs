// RJP Hub Core V3 - Backend único
// Publicar como Aplicação Web: Executar como Eu; acesso Qualquer pessoa.

const HUB_VERSION = '3.0.0';
const FAMILY_CALENDAR_ID = '5ed755d114d6482c9b0fe7db37fd1b3330c17389ef8e83f5d4806da71f097296@group.calendar.google.com';
const HUB_DB_NAME = 'RJP_Hub_DB';
const HUB_DRIVE_ROOT = 'RJP Hub';

// Opcional: preencher quando tiveres as bases finais.
const STUDY_SHEET_ID = '';
const SWIM_SHEET_ID = '';

function doGet(e){
  return route({ action: (e && e.parameter && e.parameter.action) || 'ping', params: (e && e.parameter) || {} });
}

function doPost(e){
  let req = {};
  try { req = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch(err){ req = {}; }
  return route(req);
}

function route(req){
  try{
    const action = String(req.action || 'ping');

    if(inList(action,['ping','test','status','testSync'])) return json(ping());
    if(inList(action,['syncAll','syncHub','sincronizarTudo'])) return json(syncAll(req));

    if(inList(action,['calendar.list','listEvents','events','lerCalendar','readCalendar'])) return json(calendarList());
    if(inList(action,['calendar.add','addEvent'])) return json(calendarAdd(req.event || req));
    if(inList(action,['calendar.sync','syncEvents','syncCalendar'])) return json(calendarSync(req.events || []));
    if(inList(action,['calendar.delete','deleteEvent'])) return json(calendarDelete(req.id));

    if(inList(action,['study.import','importStudy','study.list','syncStudy'])) return json(studyImport());
    if(inList(action,['study.publish'])) return json(studyPublish(req.event || req.item || req));

    if(inList(action,['swim.import','importSwim','swim.list','syncSwim','importSwimTrack'])) return json(swimImport());
    if(inList(action,['swim.publish'])) return json(swimPublish(req.event || req.item || req));

    if(inList(action,['sheets.get'])) return json(sheetsGet(req.table));
    if(inList(action,['sheets.save'])) return json(sheetsSave(req.table, req.items || []));
    if(inList(action,['sheets.append'])) return json(sheetsAppend(req.table, req.item || req));

    if(inList(action,['drive.ensureStructure','drive.folders'])) return json(driveEnsureStructure());
    if(inList(action,['drive.list'])) return json(driveList(req.folder));

    return json({ ok:true, warning:'Ação recebida sem rotina específica: '+action, hub:HUB_VERSION, calendar:getCalendarName() });
  }catch(err){
    return json({ ok:false, error:String(err.message || err), hub:HUB_VERSION });
  }
}

function ping(){ return { ok:true, app:'RJP Hub Core', version:HUB_VERSION, calendar:getCalendarName(), now:new Date() }; }

function syncAll(req){
  const created = calendarSync(req.events || []).count;
  const calendar = calendarList();
  const study = studyImport();
  const swim = swimImport();
  driveEnsureStructure();
  return { ok:true, message:'RJP Hub sincronizado', version:HUB_VERSION, created, events:calendar.events, study:study.items, swim:swim.items, calendar:getCalendarName() };
}

function calendar(){ const c = CalendarApp.getCalendarById(FAMILY_CALENDAR_ID); if(!c) throw new Error('Calendário não encontrado.'); return c; }
function getCalendarName(){ return calendar().getName(); }

function calendarList(){
  const c = calendar();
  const start = new Date(); start.setDate(start.getDate()-30);
  const end = new Date(); end.setDate(end.getDate()+365);
  const tz = Session.getScriptTimeZone();
  const events = c.getEvents(start,end).map(function(e){
    return {
      id:(e.getTag && e.getTag('rjpId')) || e.getId(),
      titulo:cleanTitle(e.getTitle()),
      data:Utilities.formatDate(e.getStartTime(),tz,'yyyy-MM-dd'),
      hora:e.isAllDayEvent() ? '' : Utilities.formatDate(e.getStartTime(),tz,'HH:mm'),
      membro:readDesc(e.getDescription(),'Membro') || 'Todos',
      origem:(e.getTag && e.getTag('origem')) || origemFromTitle(e.getTitle()),
      notas:readDesc(e.getDescription(),'Notas') || '',
      prioridade:readDesc(e.getDescription(),'Prioridade') || 'Normal'
    };
  });
  return { ok:true, calendar:getCalendarName(), events };
}

function calendarAdd(ev){ return calendarSync([ev]); }

function calendarSync(events){
  const c = calendar();
  const existing = c.getEvents(new Date(Date.now()-90*86400000), new Date(Date.now()+730*86400000));
  const byId = {};
  existing.forEach(function(e){ const id = e.getTag && e.getTag('rjpId'); if(id) byId[id]=e; });
  let count=0;
  (events || []).map(normalizeEvent).filter(function(e){ return e.titulo && e.data; }).forEach(function(ev){
    const id = ev.id || makeId(ev);
    const title = '['+(ev.origem || 'RJP Hub')+'] '+ev.titulo;
    const desc = 'Membro: '+(ev.membro || 'Todos')+'\nPrioridade: '+(ev.prioridade || 'Normal')+'\nNotas: '+(ev.notas || '');
    let ce = byId[id];
    if(ce){ ce.setTitle(title); ce.setDescription(desc); setEventDate(ce, ev); }
    else{
      const d = makeDate(ev.data, ev.hora || '09:00');
      ce = ev.hora ? c.createEvent(title,d,new Date(d.getTime()+3600000),{description:desc}) : c.createAllDayEvent(title,d,{description:desc});
      if(ce.setTag) ce.setTag('rjpId',id);
      if(ce.setTag) ce.setTag('origem', ev.origem || 'RJP Hub');
    }
    count++;
  });
  return { ok:true, count, calendar:getCalendarName() };
}

function calendarDelete(id){
  if(!id) return { ok:false, error:'ID em falta' };
  const events = calendar().getEvents(new Date(Date.now()-365*86400000), new Date(Date.now()+365*86400000));
  events.forEach(function(e){ if((e.getTag && e.getTag('rjpId'))===id || e.getId()===id) e.deleteEvent(); });
  return { ok:true };
}

function studyImport(){ return { ok:true, items: readSheet(STUDY_SHEET_ID,'RJP Study'), message: STUDY_SHEET_ID ? 'Study importada' : 'Study preparada: falta STUDY_SHEET_ID ou endpoint exportFamily.' }; }
function swimImport(){ return { ok:true, items: readSheet(SWIM_SHEET_ID,'SwimTrack'), message: SWIM_SHEET_ID ? 'SwimTrack importado' : 'SwimTrack preparado: falta SWIM_SHEET_ID ou endpoint exportFamily.' }; }
function studyPublish(item){ const ev = normalizeEvent(Object.assign({}, item, { origem:'RJP Study' })); return calendarSync([ev]); }
function swimPublish(item){ const ev = normalizeEvent(Object.assign({}, item, { origem:'SwimTrack' })); return calendarSync([ev]); }

function sheetsGet(table){
  const sh = getSheet(table || 'CONFIG');
  const values = sh.getDataRange().getValues();
  return { ok:true, table, values };
}
function sheetsSave(table,items){
  const sh = getSheet(table || 'DATA'); sh.clear(); sh.appendRow(['json','updatedAt']);
  (items||[]).forEach(function(x){ sh.appendRow([JSON.stringify(x),new Date()]); });
  return { ok:true, table, count:(items||[]).length };
}
function sheetsAppend(table,item){ const sh = getSheet(table || 'DATA'); if(sh.getLastRow()===0) sh.appendRow(['json','updatedAt']); sh.appendRow([JSON.stringify(item),new Date()]); return { ok:true, table }; }

function getHubDb(){
  const files = DriveApp.getFilesByName(HUB_DB_NAME);
  if(files.hasNext()) return SpreadsheetApp.open(files.next());
  return SpreadsheetApp.create(HUB_DB_NAME);
}
function getSheet(name){ const ss = getHubDb(); return ss.getSheetByName(name) || ss.insertSheet(name); }

function driveEnsureStructure(){
  const root = getOrCreateFolder(HUB_DRIVE_ROOT);
  ['Família','RJP Study','SwimTrack','Obras','EDF_Oeste','EBTCC','AMV','Backups'].forEach(function(n){ getOrCreateFolder(n, root); });
  return { ok:true, root:root.getName(), folders:['Família','RJP Study','SwimTrack','Obras','EDF_Oeste','EBTCC','AMV','Backups'] };
}
function driveList(folder){
  const f = folder ? getOrCreateFolder(folder, getOrCreateFolder(HUB_DRIVE_ROOT)) : getOrCreateFolder(HUB_DRIVE_ROOT);
  const files=[]; const it=f.getFiles(); while(it.hasNext()){ const x=it.next(); files.push({ name:x.getName(), url:x.getUrl(), id:x.getId() }); }
  return { ok:true, folder:f.getName(), files };
}
function getOrCreateFolder(name,parent){
  const it = parent ? parent.getFoldersByName(name) : DriveApp.getFoldersByName(name);
  if(it.hasNext()) return it.next();
  return parent ? parent.createFolder(name) : DriveApp.createFolder(name);
}

function readSheet(id,origem){
  if(!id) return [];
  const sh = SpreadsheetApp.openById(id).getSheets()[0];
  const values = sh.getDataRange().getValues(); if(values.length<2) return [];
  const head = values.shift().map(function(h){ return String(h).trim().toLowerCase(); });
  return values.filter(function(r){ return r.join('').trim(); }).map(function(r,i){
    return normalizeEvent({ id:origem+'_'+i, titulo:val(r,head,['titulo','nome','disciplina','prova','evento','tarefa']), data:formatDate(val(r,head,['data','dia','date'])), hora:val(r,head,['hora','time']), membro:val(r,head,['membro','aluno','atleta','pessoa']), origem, notas:val(r,head,['notas','observações','observacoes','obs']), prioridade:val(r,head,['prioridade']) });
  }).filter(function(x){ return x.data; });
}

function normalizeEvent(ev){ return { id:ev.id || ev.eventId || '', titulo:ev.titulo || ev.title || ev.nome || ev.destino || 'Evento', data:String(ev.data || ev.date || ev.inicio || '').slice(0,10), hora:String(ev.hora || ev.time || '').slice(0,5), membro:ev.membro || ev.resp || ev.aluno || ev.atleta || 'Todos', origem:ev.origem || ev.source || 'RJP Hub', notas:ev.notas || ev.obs || ev.description || '', prioridade:ev.prioridade || 'Normal' }; }
function makeId(ev){ return [ev.origem,ev.membro,ev.titulo,ev.data,ev.hora].join('|'); }
function makeDate(data,hora){ return new Date(String(data).slice(0,10)+'T'+String(hora || '09:00').slice(0,5)+':00'); }
function setEventDate(ce,ev){ const d=makeDate(ev.data,ev.hora||'09:00'); if(ev.hora) ce.setTime(d,new Date(d.getTime()+3600000)); else ce.setAllDayDate(d); }
function cleanTitle(t){ return String(t || '').replace(/^\[[^\]]+\]\s*/,''); }
function origemFromTitle(t){ const m=String(t||'').match(/^\[([^\]]+)\]/); return m ? m[1] : 'Google Calendar'; }
function readDesc(desc,key){ const m=String(desc||'').match(new RegExp(key+':\\s*([^\\n]*)')); return m ? m[1] : ''; }
function val(r,head,names){ for(let i=0;i<names.length;i++){ const idx=head.indexOf(names[i]); if(idx>=0) return r[idx]; } return ''; }
function formatDate(v){ if(v instanceof Date) return Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd'); return String(v || '').slice(0,10); }
function inList(v,arr){ return arr.indexOf(v)>=0; }
function json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
