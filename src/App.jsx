import React,{useState} from 'react';
import { createRoot } from 'react-dom/client';
import { hub } from './api/hubClient.js';
import { Cloud, Calendar, Database } from 'lucide-react';
import './style.css';
function App(){
  const [url,setUrl]=useState(localStorage.getItem('rjp_hub_url')||'');
  const [msg,setMsg]=useState('');
  const [events,setEvents]=useState([]);
  async function test(){ try{ hub.setUrl(url); const r=await hub.ping(); setMsg(JSON.stringify(r)); }catch(e){setMsg(e.message)} }
  async function sync(){ try{ hub.setUrl(url); const r=await hub.syncAll({}); setEvents(r.events||[]); setMsg('Sync OK: '+(r.calendar||'')); }catch(e){setMsg(e.message)} }
  return <main><h1>RJP Hub Core</h1><p>Backend comum para Família, Study e SwimTrack.</p><input placeholder="URL /exec" value={url} onChange={e=>setUrl(e.target.value)} /><div><button onClick={test}><Cloud/> Testar</button><button onClick={sync}><Database/> Sincronizar</button></div><pre>{msg}</pre><h2><Calendar/> Eventos</h2>{events.map(e=><div className="card" key={e.id}>{e.data} {e.hora} — {e.titulo}</div>)}</main>
}
createRoot(document.getElementById('root')).render(<App/>);
