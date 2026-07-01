function calendarList(){
  const c=calendar(); const s=new Date(); s.setDate(s.getDate()-30); const e=new Date(); e.setDate(e.getDate()+365); const tz=Session.getScriptTimeZone();
  return { ok:true, calendar:c.getName(), events:c.getEvents(s,e).map(ev=>({ id:ev.getId(), titulo:cleanTitle(ev.getTitle()), data:Utilities.formatDate(ev.getStartTime(),tz,'yyyy-MM-dd'), hora:ev.isAllDayEvent()?'':Utilities.formatDate(ev.getStartTime(),tz,'HH:mm'), origem:originFromTitle(ev.getTitle()), notas:ev.getDescription()||'' })) };
}
function calendarAdd(x){
  const ev=normalizeEvent(x); const c=calendar(); const title='['+ev.origem+'] '+ev.titulo;
  const d=new Date(ev.data+'T'+(ev.hora||'09:00')+':00');
  const ce=ev.hora ? c.createEvent(title,d,new Date(d.getTime()+3600000),{description:ev.notas}) : c.createAllDayEvent(title,d,{description:ev.notas});
  return { ok:true, id:ce.getId(), event:ev };
}
function normalizeEvent(x){ return { titulo:x.titulo||x.title||x.nome||'Evento', data:String(x.data||x.date||'').slice(0,10), hora:x.hora||x.time||'', membro:x.membro||'Todos', origem:x.origem||x.source||'RJP Hub', notas:x.notas||x.description||'' }; }
function cleanTitle(t){ return String(t||'').replace(/^\[[^\]]+\]\s*/, ''); }
function originFromTitle(t){ const m=String(t||'').match(/^\[([^\]]+)\]/); return m?m[1]:'Google Calendar'; }
