// RJP Hub Core V1 - Google Apps Script
// Publicar como Web App: Executar como Eu; acesso Qualquer pessoa.

const HUB_CONFIG = {
  FAMILY_CALENDAR_ID: '5ed755d114d6482c9b0fe7db37fd1b3330c17389ef8e83f5d4806da71f097296@group.calendar.google.com',
  DB_SHEET_NAME: 'RJP_Hub_DB',
  STUDY_SHEET_ID: '',
  SWIM_SHEET_ID: ''
};

function doGet(e){ return handle({ action: (e.parameter.action || 'ping'), params: e.parameter }); }
function doPost(e){
  let req = {};
  try { req = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch(err) {}
  return handle(req);
}
function handle(req){
  try{
    const action = String(req.action || 'ping');
    if(['ping','test','status'].includes(action)) return json(ping());
    if(['syncAll','syncHub','family.sync'].includes(action)) return json(syncAll(req));
    if(['calendar.list','listEvents','events'].includes(action)) return json(calendarList());
    if(['calendar.add','addEvent'].includes(action)) return json(calendarAdd(req.event || req));
    if(['study.import','importStudy','syncStudy'].includes(action)) return json(studyImport());
    if(['swim.import','importSwim','syncSwim'].includes(action)) return json(swimImport());
    if(['backup.create'].includes(action)) return json(backupCreate(req));
    return json({ ok:true, warning:'Ação recebida sem rotina específica: '+action, action: action, calendar: calendar().getName() });
  }catch(err){ return json({ ok:false, error:String(err.message || err) }); }
}
function ping(){ return { ok:true, app:'RJP Hub Core', version:'1.0', calendar:calendar().getName(), now:new Date() }; }
function json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function calendar(){ const c=CalendarApp.getCalendarById(HUB_CONFIG.FAMILY_CALENDAR_ID); if(!c) throw new Error('Calendário não encontrado'); return c; }
