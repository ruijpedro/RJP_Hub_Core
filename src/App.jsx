import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Calendar, Cloud, Database, Server, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { hub } from './api/hubClient.js';
import './style.css';

function App(){
  const [url, setUrl] = useState(localStorage.getItem('rjp_hub_url') || '');
  const [status, setStatus] = useState('Pronto para configurar.');
  const [online, setOnline] = useState(false);
  const [events, setEvents] = useState([]);
  const [study, setStudy] = useState([]);
  const [swim, setSwim] = useState([]);

  const total = useMemo(() => events.length + study.length + swim.length, [events, study, swim]);

  function saveUrl(){
    hub.setUrl(url.trim());
    setStatus('URL guardado.');
  }

  async function test(){
    try{
      hub.setUrl(url.trim());
      const r = await hub.ping();
      setOnline(!!r.ok);
      setStatus(r.ok ? `Ligado ao ${r.app || 'RJP Hub'} · ${r.calendar || ''}` : JSON.stringify(r));
    }catch(e){
      setOnline(false);
      setStatus(e.message || 'Erro de ligação');
    }
  }

  async function sync(){
    try{
      hub.setUrl(url.trim());
      const r = await hub.syncAll({});
      setEvents(r.events || []);
      setStudy(r.study || []);
      setSwim(r.swim || []);
      setOnline(!!r.ok);
      setStatus(r.ok ? `Sincronização concluída · ${r.calendar || ''}` : JSON.stringify(r));
    }catch(e){
      setOnline(false);
      setStatus(e.message || 'Erro de sincronização');
    }
  }

  return <main>
    <header className="top">
      <img src="/icon.png" alt="RJP Hub" />
      <div>
        <small>RJP Platform</small>
        <h1>RJP Hub Core</h1>
      </div>
    </header>

    <section className="hero">
      <Server size={42}/>
      <h2>Motor comum para WebApp e APK</h2>
      <p>Backend Google reutilizável para Família Rolim Pedro, RJP Study, SwimTrack e futuras apps.</p>
      <div className={online ? 'badge ok' : 'badge warn'}>{online ? <Wifi/> : <WifiOff/>}{online ? 'Online' : 'Por configurar'}</div>
    </section>

    <section className="panel">
      <h3><Cloud/> Ligação ao Apps Script</h3>
      <input placeholder="Cola aqui o URL /exec do RJP Hub" value={url} onChange={e=>setUrl(e.target.value)} />
      <div className="actions">
        <button onClick={saveUrl}>Guardar URL</button>
        <button onClick={test}>Testar</button>
        <button onClick={sync}>Sincronizar tudo</button>
      </div>
      <pre>{status}</pre>
    </section>

    <section className="grid">
      <div className="stat"><Calendar/><b>{events.length}</b><span>Eventos Calendar</span></div>
      <div className="stat"><Database/><b>{study.length}</b><span>Itens Study</span></div>
      <div className="stat"><Smartphone/><b>{swim.length}</b><span>Itens SwimTrack</span></div>
      <div className="stat"><Server/><b>{total}</b><span>Total Hub</span></div>
    </section>

    <section className="panel">
      <h3><Calendar/> Próximos eventos</h3>
      {events.length === 0 && <p className="muted">Sem eventos carregados. Clica em “Sincronizar tudo”.</p>}
      {events.slice(0,10).map(e => <div className="card" key={e.id}>{e.data} {e.hora} · <b>{e.titulo}</b><small>{e.origem || 'Calendar'}</small></div>)}
    </section>
  </main>
}

createRoot(document.getElementById('root')).render(<App/>);
