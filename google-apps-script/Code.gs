// RJP Hub Core V4 — backend central do ecossistema RJP
// Publicar como Aplicação Web: Executar como Eu; acesso Qualquer pessoa.
const HUB_VERSION='4.0.0';
const FAMILY_CALENDAR_ID='5ed755d114d6482c9b0fe7db37fd1b3330c17389ef8e83f5d4806da71f097296@group.calendar.google.com';
const HUB_DB_NAME='RJP_Hub_DB_V4';
const HUB_DRIVE_ROOT='RJP Hub';

function doGet(e){
  const p=(e&&e.parameter)||{}; let payload={};
  try{ if(p.payload) payload=JSON.parse(p.payload); }catch(_){}
  const result=route(Object.assign({},payload,{action:p.action||'ping'}));
  const body=JSON.stringify(result);
  if(p.callback){ const cb=String(p.callback).replace(/[^a-zA-Z0-9_.$]/g,''); return ContentService.createTextOutput(cb+'('+body+');').setMimeType(ContentService.MimeType.JAVASCRIPT); }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e){ let req={}; try{req=JSON.parse((e.postData&&e.postData.contents)||'{}')}catch(_){} return json(route(req)); }
function json(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)}
function route(req){
 try{
  const a=String(req.action||'ping');
  if(['ping','test','status','health'].includes(a)) return ping();
  if(['syncAll','syncHub','sincronizarTudo'].includes(a)) return syncAll(req);
  if(['calendar.list','listEvents','events','readCalendar','lerCalendar'].includes(a)) return calendarList();
  if(['calendar.sync','syncEvents','syncCalendar'].includes(a)) return calendarSync(req.events||[]);
  if(['calendar.add','addEvent'].includes(a)) return calendarSync([req.event||req]);
  if(['calendar.delete','deleteEvent'].includes(a)) return calendarDelete(req.id);
  if(['study.publish','study.bulkPublish','study.push'].includes(a)) return studyPublish(req.items||req.events||[req.item||req.event||req]);
  if(['study.import','importStudy','study.list','syncStudy'].includes(a)) return {ok:true,items:tableRead('STUDY_EVENTS'),source:'RJP Study'};
  if(['swim.publish','swim.bulkPublish','swim.push'].includes(a)) return swimPublish(req.items||req.events||[req.item||req.event||req]);
  if(['swim.import','importSwim','swim.list','syncSwim','importSwimTrack'].includes(a)) return {ok:true,items:tableRead('SWIM_EVENTS'),source:'SwimTrack'};
  if(a==='sheets.get') return {ok:true,table:req.table||'DATA',items:tableRead(req.table||'DATA')};
  if(a==='sheets.save') return tableSave(req.table||'DATA',req.items||[]);
  if(a==='sheets.append') return tableAppend(req.table||'DATA',req.item||req);
  if(['drive.ensureStructure','drive.folders'].includes(a)) return driveEnsureStructure();
  if(a==='drive.list') return driveList(req.folder);
  if(a==='config.get') return {ok:true,version:HUB_VERSION,calendar:getCalendarName(),apps:['Família V8','RJP Study V3','SwimTrack']};
  return {ok:false,error:'Ação desconhecida: '+a,hub:HUB_VERSION};
 }catch(err){return {ok:false,error:String(err.message||err),hub:HUB_VERSION}}
}
function ping(){return {ok:true,app:'RJP Hub Core',version:HUB_VERSION,calendar:getCalendarName(),studyCount:tableRead('STUDY_EVENTS').length,swimCount:tableRead('SWIM_EVENTS').length,now:new Date()}}
function syncAll(req){
 if((req.events||[]).length) calendarSync(req.events||[]);
 const study=tableRead('STUDY_EVENTS'), swim=tableRead('SWIM_EVENTS');
 const external=study.concat(swim); if(external.length) calendarSync(external);
 if(req.tasks||req.tarefas) tableSave('FAMILY_TASKS',req.tasks||req.tarefas||[]);
 if(req.compras) tableSave('FAMILY_SHOPPING',req.compras||[]);
 driveEnsureStructure();
 const cal=calendarList();
 return {ok:true,message:'RJP Hub Core V4 sincronizado',version:HUB_VERSION,events:cal.events,study:study,swim:swim,status:{family:true,study:true,calendar:true,drive:true}};
}
function studyPublish(items){ const list=(Array.isArray(items)?items:[items]).map(x=>normalizeEvent(x,'RJP Study')).filter(validEvent); tableSave('STUDY_EVENTS',list); calendarSync(list); return {ok:true,count:list.length,items:list}; }
function swimPublish(items){ const list=(Array.isArray(items)?items:[items]).map(x=>normalizeEvent(x,'SwimTrack')).filter(validEvent); tableSave('SWIM_EVENTS',list); calendarSync(list); return {ok:true,count:list.length,items:list}; }
function cal(){const c=CalendarApp.getCalendarById(FAMILY_CALENDAR_ID); if(!c) throw new Error('Calendário Família Rolim Pedro não encontrado'); return c}
function getCalendarName(){return cal().getName()}
function calendarList(){const c=cal(),s=new Date(),e=new Date();s.setDate(s.getDate()-30);e.setDate(e.getDate()+365);const tz=Session.getScriptTimeZone();return {ok:true,calendar:c.getName(),events:c.getEvents(s,e).map(x=>({id:(x.getTag&&x.getTag('rjpId'))||x.getId(),titulo:cleanTitle(x.getTitle()),data:Utilities.formatDate(x.getStartTime(),tz,'yyyy-MM-dd'),hora:x.isAllDayEvent()?'':Utilities.formatDate(x.getStartTime(),tz,'HH:mm'),membro:readDesc(x.getDescription(),'Membro')||'Todos',origem:(x.getTag&&x.getTag('origem'))||originFromTitle(x.getTitle()),prioridade:readDesc(x.getDescription(),'Prioridade')||'Normal',notas:readDesc(x.getDescription(),'Notas')||''}))}}
function calendarSync(events){const c=cal(),s=new Date(),e=new Date();s.setDate(s.getDate()-180);e.setDate(e.getDate()+900);const by={};c.getEvents(s,e).forEach(x=>{const id=x.getTag&&x.getTag('rjpId');if(id)by[id]=x});let count=0;(events||[]).map(x=>normalizeEvent(x,x.origem||'Família')).filter(validEvent).forEach(ev=>{const id=String(ev.id||stableId(ev)),title='['+ev.origem+'] '+ev.titulo,desc='Membro: '+ev.membro+'\nPrioridade: '+ev.prioridade+'\nNotas: '+(ev.notas||'');let ce=by[id];const d=makeDate(ev.data,ev.hora||'09:00');if(ce){ce.setTitle(title);ce.setDescription(desc); if(ev.hora)ce.setTime(d,new Date(d.getTime()+3600000));else if(ce.setAllDayDate)ce.setAllDayDate(d)}else{ce=ev.hora?c.createEvent(title,d,new Date(d.getTime()+3600000),{description:desc}):c.createAllDayEvent(title,d,{description:desc});if(ce.setTag){ce.setTag('rjpId',id);ce.setTag('origem',ev.origem)}}count++});return {ok:true,count,calendar:c.getName()}}
function calendarDelete(id){if(!id)return {ok:false,error:'ID em falta'};const s=new Date(),e=new Date();s.setDate(s.getDate()-365);e.setDate(e.getDate()+730);cal().getEvents(s,e).forEach(x=>{if((x.getTag&&x.getTag('rjpId'))===id||x.getId()===id)x.deleteEvent()});return {ok:true}}
function db(){const files=DriveApp.getFilesByName(HUB_DB_NAME);if(files.hasNext())return SpreadsheetApp.open(files.next());return SpreadsheetApp.create(HUB_DB_NAME)}
function sheet(name){const ss=db();return ss.getSheetByName(name)||ss.insertSheet(name)}
function tableSave(name,items){const sh=sheet(name);sh.clearContents();sh.appendRow(['json','updatedAt']);(items||[]).forEach(x=>sh.appendRow([JSON.stringify(x),new Date()]));return {ok:true,table:name,count:(items||[]).length}}
function tableAppend(name,item){const sh=sheet(name);if(sh.getLastRow()===0)sh.appendRow(['json','updatedAt']);sh.appendRow([JSON.stringify(item),new Date()]);return {ok:true,table:name}}
function tableRead(name){const sh=sheet(name),v=sh.getDataRange().getValues();if(v.length<2)return [];return v.slice(1).map(r=>{try{return JSON.parse(r[0])}catch(_){return null}}).filter(Boolean)}
function driveEnsureStructure(){const root=getFolder(HUB_DRIVE_ROOT);const names=['Família','RJP Study','SwimTrack','Obras','EDF_Oeste','EBTCC','AMV','Backups'];names.forEach(n=>getFolder(n,root));return {ok:true,root:root.getName(),folders:names}}
function driveList(folder){const root=getFolder(HUB_DRIVE_ROOT),f=folder?getFolder(folder,root):root,files=[],it=f.getFiles();while(it.hasNext()){const x=it.next();files.push({id:x.getId(),name:x.getName(),url:x.getUrl()})}return {ok:true,folder:f.getName(),files}}
function getFolder(name,parent){const it=parent?parent.getFoldersByName(name):DriveApp.getFoldersByName(name);return it.hasNext()?it.next():(parent?parent.createFolder(name):DriveApp.createFolder(name))}
function normalizeEvent(x,origin){x=x||{};return {id:String(x.id||x.eventId||stableId(x)),titulo:String(x.titulo||x.title||x.nome||x.type||'Evento'),data:dateOnly(x.data||x.date||x.inicio),hora:String(x.hora||x.time||''),membro:String(x.membro||x.perfil||x.user||'Todos'),origem:String(x.origem||origin||'RJP Hub'),prioridade:String(x.prioridade||((x.type==='Exame'||x.type==='Teste')?'Alta':'Normal')),notas:String(x.notas||x.notes||x.topics||'')}}
function validEvent(x){return !!(x&&x.titulo&&x.data)}
function stableId(x){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,JSON.stringify([x.titulo||x.title||'',x.data||x.date||'',x.hora||'',x.origem||'']))).slice(0,24)}
function dateOnly(v){if(!v)return '';if(Object.prototype.toString.call(v)==='[object Date]')return Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd');const s=String(v);const m=s.match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:s.slice(0,10)}
function makeDate(d,t){const p=d.split('-').map(Number),q=(t||'09:00').split(':').map(Number);return new Date(p[0],p[1]-1,p[2],q[0]||0,q[1]||0,0)}
function cleanTitle(t){return String(t||'').replace(/^\[[^\]]+\]\s*/,'')}
function originFromTitle(t){const m=String(t||'').match(/^\[([^\]]+)\]/);return m?m[1]:'Família'}
function readDesc(desc,key){const m=String(desc||'').match(new RegExp('^'+key+':\\s*(.*)$','mi'));return m?m[1].trim():''}
