import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Cloud, Database, FolderOpen, RefreshCw, Bell, Brain, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getHubUrl, setHubUrl, ping, syncAll } from './api/hubClient';
import { CalendarEngine } from './calendar/calendarEngine';
import { DriveEngine } from './drive/driveEngine';
import { StudyConnector } from './study/studyConnector';
import { SwimConnector } from './swimtrack/swimConnector';
import { requestNotifications } from './notifications/notificationEngine';
import { localAssistant } from './ai/aiEngine';
import { offlineStore } from './sync/offlineStore';
import './style.css';

const modules = [
  { id:'calendar', title:'Calendar Engine', icon:CalendarDays, desc:'Criar, listar e sincronizar eventos.' },
  { id:'sheets', title:'Sheets Engine', icon:Database, desc:'Base de dados Google Sheets comum.' },
  { id:'drive', title:'Drive Engine', icon:FolderOpen, desc:'Pastas e documentos do ecossistema.' },
  { id:'study', title:'RJP Study', icon:CheckCircle2, desc:'Exames, testes, trabalhos e sessões.' },
  { id:'swim', title:'SwimTrack', icon:CheckCircle2, desc:'Treinos, provas, TAC e natação.' },
  { id:'notifications', title:'Notificações', icon:Bell, desc:'Preparado para alertas locais.' },
  { id:'ai', title:'IA Core', icon:Brain, desc:'Assistente local preparado para contexto.' }
];

export default function App(){
  const [url,setUrl] = useState(getHubUrl());
  const [status,setStatus] = useState(null);
  const [events,setEvents] = useState(() => offlineStore.get('rjp_hub_events', []));
  const [question,setQuestion] = useState('Que eventos tenho esta semana?');
  const [answer,setAnswer] = useState([]);

  const nextEvents = useMemo(() => events.slice(0,6), [events]);

  useEffect(() => { offlineStore.set('rjp_hub_events', events); }, [events]);

  async function saveUrl(){ setHubUrl(url); setStatus({ok:true,message:'URL guardado.'}); }
  async function test(){ const r = await ping(); setStatus({ok:r.ok,message:r.ok ? `Ligado: ${r.calendar || r.app || 'RJP Hub'}` : r.error}); }
  async function runSync(){
    const r = await syncAll({});
    setStatus({ok:r.ok,message:r.ok ? (r.message || 'Sincronização concluída') : r.error});
    if(r.events) setEvents(r.events);
  }
  async function readCalendar(){
    const r = await CalendarEngine.list();
    setStatus({ok:r.ok,message:r.ok ? `Calendar OK: ${r.events?.length || 0} eventos` : r.error});
    if(r.events) setEvents(r.events);
  }
  async function importStudy(){ const r = await StudyConnector.importFamily(); setStatus({ok:r.ok,message:r.ok ? `Study: ${r.items?.length || 0} itens` : r.error}); }
  async function importSwim(){ const r = await SwimConnector.importFamily(); setStatus({ok:r.ok,message:r.ok ? `SwimTrack: ${r.items?.length || 0} itens` : r.error}); }
  async function ensureDrive(){ const r = await DriveEngine.ensureStructure(); setStatus({ok:r.ok,message:r.ok ? 'Drive estruturado/preparado' : r.error}); }
  async function notify(){ const r = await requestNotifications(); setStatus({ok:r.ok,message:r.ok ? 'Notificações permitidas' : r.error || r.permission}); }
  function askAI(){ const res = localAssistant(question, {events}); setAnswer(res); }

  return <div className="app">
    <header className="hero">
      <div>
        <p className="eyebrow">RJP OS</p>
        <h1>RJP Hub Core V3</h1>
        <p>Motor comum para Família, Study, SwimTrack e futuras apps.</p>
      </div>
      <div className="badge"><Cloud size={18}/> Hub Core</div>
    </header>

    <section className="card config">
      <h2>Backend Google Apps Script</h2>
      <div className="row">
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Cola aqui o URL /exec do RJP Hub" />
        <button onClick={saveUrl}>Guardar</button>
        <button onClick={test}>Testar</button>
      </div>
      {status && <div className={status.ok ? 'ok msg' : 'err msg'}>{status.ok ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>} {status.message}</div>}
    </section>

    <section className="grid stats">
      <div className="card"><strong>{events.length}</strong><span>eventos em cache</span></div>
      <div className="card"><strong>7</strong><span>módulos core</span></div>
      <div className="card"><strong>3</strong><span>apps preparadas</span></div>
    </section>

    <section className="card actions">
      <h2>Testes rápidos</h2>
      <div className="buttons">
        <button onClick={runSync}><RefreshCw size={16}/> Sincronizar tudo</button>
        <button onClick={readCalendar}><CalendarDays size={16}/> Ler Calendar</button>
        <button onClick={importStudy}>Importar Study</button>
        <button onClick={importSwim}>Importar SwimTrack</button>
        <button onClick={ensureDrive}><FolderOpen size={16}/> Preparar Drive</button>
        <button onClick={notify}><Bell size={16}/> Notificações</button>
      </div>
    </section>

    <section className="grid modules">
      {modules.map(m => { const Icon = m.icon; return <div className="card module" key={m.id}><Icon/><h3>{m.title}</h3><p>{m.desc}</p></div>; })}
    </section>

    <section className="grid two">
      <div className="card">
        <h2>Próximos eventos</h2>
        {nextEvents.length === 0 ? <p className="muted">Sem eventos carregados. Usa “Ler Calendar”.</p> : nextEvents.map(ev => <div className="event" key={ev.id || ev.titulo}><b>{ev.titulo}</b><span>{ev.data} {ev.hora} · {ev.membro || 'Todos'} · {ev.origem || 'Hub'}</span></div>)}
      </div>
      <div className="card">
        <h2>IA Core local</h2>
        <div className="row compact"><input value={question} onChange={e=>setQuestion(e.target.value)} /><button onClick={askAI}>Perguntar</button></div>
        <div className="answer">{answer.length === 0 ? <p className="muted">A resposta aparece aqui.</p> : answer.map((a,i)=><div className="event" key={i}><b>{a.titulo}</b><span>{a.data} {a.hora} · {a.origem}</span></div>)}</div>
      </div>
    </section>
  </div>;
}
