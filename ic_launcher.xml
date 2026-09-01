import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Home, CheckSquare, ShoppingCart, CalendarDays, Users, Utensils, Plane, Waves, GraduationCap, Bell, Search, Plus, Download, RefreshCw, Trash2, WalletCards, Car, HeartPulse, UploadCloud, Settings, Cloud, Clock, Sparkles } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { GOOGLE_SCRIPT_URL, FAMILY_MEMBERS } from './googleConfig.js'
import './style.css'

const logoUrl = `${import.meta.env.BASE_URL}logo.png`
const membros = FAMILY_MEMBERS?.length ? FAMILY_MEMBERS : ['Rui','Gina','Constança','Lourenço']
const configuredScriptUrl = () => (localStorage.getItem('frp_google_script_url') || GOOGLE_SCRIPT_URL || '').trim()
const todayISO = () => new Date().toISOString().slice(0,10)
const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`
const emptyForm = { titulo:'', data:todayISO(), hora:'', membro:'Todos', notas:'', origem:'Família', prioridade:'Normal' }
const STORAGE = 'frp_v30'

const initial = {
  tarefas: [], compras: [], refeicoes: [], ferias: [], despesas: [], veiculos: [], saude: [], eventos: [], study: [], swim: [],
  syncAt: '', autoSync: true, alerts: []
}

const sections = [
  ['inicio','Início',Home], ['calendario','Calendário',CalendarDays], ['tarefas','Tarefas',CheckSquare], ['compras','Compras',ShoppingCart],
  ['refeicoes','Refeições',Utensils], ['familia','Família',Users], ['ferias','Férias',Plane], ['study','RJP Study',GraduationCap],
  ['swim','SwimTrack',Waves], ['despesas','Despesas',WalletCards], ['veiculos','Veículos',Car], ['saude','Saúde',HeartPulse], ['definicoes','Sync',Settings]
]

function migrate(){
  const keys = [STORAGE,'frp_v23','frp_v22','familia_rolim_pedro']
  for(const k of keys){
    try{ const raw = localStorage.getItem(k); if(raw) return {...initial, ...JSON.parse(raw)} }catch{}
  }
  return initial
}
function saveAll(next){ localStorage.setItem(STORAGE, JSON.stringify(next)); return next }

async function api(action, payload={}){
  const url = configuredScriptUrl()
  if(!url) throw new Error('Falta configurar o URL do Apps Script no separador Sync')
  const res = await fetch(url, { method:'POST', body: JSON.stringify({action, ...payload}) })
  const json = await res.json().catch(()=>({ok:false,error:'Resposta inválida do Apps Script'}))
  if(!json.ok) throw new Error(json.error || 'Erro no Apps Script')
  return json
}
function toEvent(item, origem='Família'){
  return { id:item.eventId || item.id || uid(), titulo:item.titulo || item.nome || item.destino || origem, data:item.data || item.inicio || todayISO(), hora:item.hora || '', membro:item.membro || item.resp || 'Todos', origem:item.origem || origem, notas:item.notas || item.obs || '', prioridade:item.prioridade || 'Normal' }
}
function uniqueById(list){ const seen=new Set(); return list.filter(x=>{ const id=x.id || `${x.origem}_${x.titulo}_${x.data}_${x.hora}`; if(seen.has(id)) return false; seen.add(id); x.id=id; return true }) }

function App(){
  const [tab,setTab]=useState('inicio')
  const [data,setData]=useState(migrate)
  const [user,setUser]=useState(localStorage.getItem('frp_user') || 'Rui')
  const [scriptUrl,setScriptUrl]=useState(configuredScriptUrl())
  const [msg,setMsg]=useState('')
  const [q,setQ]=useState('')
  const [busy,setBusy]=useState(false)
  const persist = next => setData(saveAll(next))
  const flash = t => { setMsg(t); setTimeout(()=>setMsg(''),5500) }
  const setU = u => { setUser(u); localStorage.setItem('frp_user',u) }

  useEffect(()=>{ localStorage.setItem(STORAGE, JSON.stringify(data)) },[])
  useEffect(()=>{ if(data.autoSync && scriptUrl){ setTimeout(()=>syncTudo(true),600) } },[])

  const addItem = (kind, item, addCalendar=true) => {
    const novo = { id:uid(), ...item }
    const next = { ...data, [kind]: [novo, ...(data[kind]||[])] }
    if(addCalendar && item.data) next.eventos = uniqueById([toEvent(novo, labelOf(kind)), ...next.eventos])
    persist(next); flash('Guardado na Família')
  }
  const removeItem = (kind,id) => persist({...data,[kind]:data[kind].filter(x=>x.id!==id), eventos: kind==='eventos'?data.eventos.filter(x=>x.id!==id):data.eventos})
  const toggle = (kind,id) => persist({...data,[kind]:data[kind].map(x=>x.id===id?{...x,ok:!x.ok}:x)})

  const syncTudo = async (silent=false) => {
    if(busy) return
    setBusy(true)
    try{
      const payload = { events:data.eventos, tasks:data.tarefas, compras:data.compras }
      const r = await api('syncHub', payload)
      const study = r.study || []
      const swim = r.swim || []
      const calendarEvents = r.events || []
      const evs = uniqueById([...calendarEvents, ...study.map(x=>toEvent(x,'RJP Study')), ...swim.map(x=>toEvent(x,'SwimTrack')), ...data.eventos])
      persist({...data, study:uniqueById([...study,...data.study]), swim:uniqueById([...swim,...data.swim]), eventos:evs, syncAt:new Date().toLocaleString('pt-PT')})
      if(!silent) flash('Sincronização automática concluída: Família + Study + SwimTrack + Calendário')
    }catch(e){ if(!silent) flash(e.message) }
    finally{ setBusy(false) }
  }
  const syncCalendar = async () => { setBusy(true); try{ await api('syncEvents',{events:data.eventos}); persist({...data,syncAt:new Date().toLocaleString('pt-PT')}); flash('Calendário familiar sincronizado') } catch(e){ flash(e.message) } finally{ setBusy(false) } }
  const readCalendar = async () => { setBusy(true); try{ const r=await api('listEvents'); persist({...data,eventos:uniqueById([...(r.events||[]),...data.eventos]),syncAt:new Date().toLocaleString('pt-PT')}); flash('Google Calendar lido') } catch(e){ flash(e.message) } finally{ setBusy(false) } }
  const importStudy = async () => { setBusy(true); try{ const r=await api('importStudy'); const study=r.items||[]; persist({...data,study:uniqueById([...study,...data.study]),eventos:uniqueById([...study.map(x=>toEvent(x,'RJP Study')),...data.eventos])}); flash(`${study.length} itens importados da Study`) } catch(e){ flash(e.message) } finally{ setBusy(false) } }
  const importSwim = async () => { setBusy(true); try{ const r=await api('importSwim'); const swim=r.items||[]; persist({...data,swim:uniqueById([...swim,...data.swim]),eventos:uniqueById([...swim.map(x=>toEvent(x,'SwimTrack')),...data.eventos])}); flash(`${swim.length} itens importados do SwimTrack`) } catch(e){ flash(e.message) } finally{ setBusy(false) } }

  const filtered = useMemo(()=>{ const text=q.trim().toLowerCase(); if(!text) return null; return Object.entries(data).flatMap(([kind,arr])=>Array.isArray(arr)?arr.filter(x=>JSON.stringify(x).toLowerCase().includes(text)).map(x=>({...x,kind})):[]) },[q,data])
  const proximos = useMemo(()=>data.eventos.filter(e=>e.data>=todayISO()).sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora)),[data.eventos])

  return <div className="app">
    <header className="top"><img src={logoUrl} alt="logo"/><div><b>Família</b><h1>Rolim Pedro</h1></div><select value={user} onChange={e=>setU(e.target.value)}>{membros.map(m=><option key={m}>{m}</option>)}</select><Bell/></header>
    <main>
      <div className="search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Pesquisar em tudo..."/></div>
      {msg && <div className={msg.includes('Falta')||msg.includes('Erro')?'notice warn':'notice'}>{msg}</div>}
      {!scriptUrl && <div className="notice warn">Falta configurar o URL do Apps Script no separador <b>Sync</b>. A app funciona offline, mas não sincroniza.</div>}
      {filtered ? <SearchResults items={filtered}/> : <>
        {tab==='inicio' && <Inicio data={data} user={user} proximos={proximos} setTab={setTab} syncTudo={syncTudo} readCalendar={readCalendar} busy={busy}/>} 
        {tab==='calendario' && <Calendario data={data} addItem={addItem} removeItem={removeItem} syncTudo={syncTudo} syncCalendar={syncCalendar} readCalendar={readCalendar} busy={busy}/>} 
        {tab==='tarefas' && <Generic title="Tarefas" kind="tarefas" data={data.tarefas} addItem={addItem} removeItem={removeItem} toggle={toggle}/>} 
        {tab==='compras' && <Generic title="Compras" kind="compras" data={data.compras} addItem={addItem} removeItem={removeItem} toggle={toggle} noDate/>} 
        {tab==='refeicoes' && <Generic title="Refeições" kind="refeicoes" data={data.refeicoes} addItem={addItem} removeItem={removeItem}/>} 
        {tab==='familia' && <Familia data={data}/>} 
        {tab==='ferias' && <Generic title="Férias" kind="ferias" data={data.ferias} addItem={addItem} removeItem={removeItem}/>} 
        {tab==='study' && <ImportPage title="RJP Study" kind="study" icon={<GraduationCap/>} data={data.study} importer={importStudy} removeItem={removeItem} addItem={addItem} busy={busy}/>} 
        {tab==='swim' && <ImportPage title="SwimTrack" kind="swim" icon={<Waves/>} data={data.swim} importer={importSwim} removeItem={removeItem} addItem={addItem} busy={busy}/>} 
        {tab==='despesas' && <Generic title="Despesas" kind="despesas" data={data.despesas} addItem={addItem} removeItem={removeItem}/>} 
        {tab==='veiculos' && <Generic title="Veículos" kind="veiculos" data={data.veiculos} addItem={addItem} removeItem={removeItem}/>} 
        {tab==='saude' && <Generic title="Saúde" kind="saude" data={data.saude} addItem={addItem} removeItem={removeItem}/>} 
        {tab==='definicoes' && <Definicoes data={data} persist={persist} syncTudo={syncTudo} busy={busy} scriptUrl={scriptUrl} setScriptUrl={setScriptUrl} flash={flash}/>} 
      </>}
    </main>
    <nav>{sections.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>{setQ('');setTab(id)}}><Icon size={19}/><span>{label}</span></button>)}</nav>
  </div>
}

function labelOf(kind){ return ({tarefas:'Tarefa', compras:'Compras', refeicoes:'Refeição', ferias:'Férias', despesas:'Despesa', veiculos:'Veículo', saude:'Saúde', eventos:'Família', study:'RJP Study', swim:'SwimTrack'})[kind] || kind }
function Card({title,children,action,onClick}){return <section className="card"><div className="cardTop"><h2>{title}</h2>{action&&<button onClick={onClick}>{action}</button>}</div>{children}</section>}
function Inicio({data,user,proximos,setTab,syncTudo,readCalendar,busy}){return <><section className="hero"><Sparkles/><h1>Bom dia, {user}</h1><p>Hub familiar sincronizado com Study, SwimTrack e Google Calendar.</p><small>{data.tarefas.filter(x=>!x.ok).length} tarefas abertas · {proximos.length} próximos eventos · Última sync: {data.syncAt || 'ainda não sincronizado'}</small></section><div className="quick"><button onClick={()=>syncTudo(false)} disabled={busy}><Cloud/> Sincronizar tudo</button><button onClick={readCalendar} disabled={busy}><CalendarDays/> Ler Calendar</button><button onClick={()=>exportPDF(data)}><Download/> PDF</button><button onClick={()=>exportICS(data.eventos)}><Download/> ICS</button></div><Card title="Hoje e próximos dias" action="Ver calendário" onClick={()=>setTab('calendario')}>{proximos.slice(0,6).map(e=><Event key={e.id} e={e}/>)}</Card><Card title="Tarefas pendentes" action="Ver todas" onClick={()=>setTab('tarefas')}>{data.tarefas.filter(x=>!x.ok).slice(0,5).map(t=><Item key={t.id} item={t}/>)}</Card><div className="stats"><Stat n={data.compras.filter(x=>!x.ok).length} t="Compras"/><Stat n={data.study.length} t="Study"/><Stat n={data.swim.length} t="SwimTrack"/></div></>}
function Stat({n,t}){return <div className="stat"><b>{n}</b><span>{t}</span></div>}
function Event({e,onDelete}){return <div className={`item origem-${slug(e.origem)}`}><span className="dot"></span><div><b>{e.titulo}</b><p>{e.data||'Sem data'} {e.hora && `· ${e.hora}`} · {e.membro||'Todos'} · {e.origem||'Família'} · {e.prioridade||'Normal'}</p>{e.notas&&<p>{e.notas}</p>}</div>{onDelete&&<button className="small" onClick={onDelete}><Trash2 size={16}/></button>}</div>}
function Item({item,onDelete,onToggle}){return <div className="item"><button className={item.ok?'check on':'check'} onClick={onToggle}></button><div><b className={item.ok?'done':''}>{item.titulo||item.nome||item.destino}</b><p>{item.data||'Sem data'} · {item.membro||item.resp||'Todos'} {item.notas?`· ${item.notas}`:''}</p></div>{onDelete&&<button className="small" onClick={onDelete}><Trash2 size={16}/></button>}</div>}
function MiniForm({kind,addItem,noDate=false}){const [f,setF]=useState({...emptyForm,data:noDate?'':todayISO()}); return <form className="form" onSubmit={e=>{e.preventDefault(); if(!f.titulo.trim())return; addItem(kind,{...f,nome:f.titulo},!noDate); setF({...emptyForm,data:noDate?'':todayISO()})}}><input value={f.titulo} onChange={e=>setF({...f,titulo:e.target.value})} placeholder={`Adicionar ${labelOf(kind).toLowerCase()}`}/>{!noDate&&<input type="date" value={f.data} onChange={e=>setF({...f,data:e.target.value})}/>}<input type="time" value={f.hora} onChange={e=>setF({...f,hora:e.target.value})}/><select value={f.membro} onChange={e=>setF({...f,membro:e.target.value})}>{['Todos',...membros].map(m=><option key={m}>{m}</option>)}</select><select value={f.prioridade} onChange={e=>setF({...f,prioridade:e.target.value})}>{['Baixa','Normal','Alta','Crítica'].map(p=><option key={p}>{p}</option>)}</select><input value={f.notas} onChange={e=>setF({...f,notas:e.target.value})} placeholder="Notas"/><button><Plus/> Guardar</button></form>}
function Generic({title,kind,data,addItem,removeItem,toggle,noDate}){return <><Toolbar title={title}/><MiniForm kind={kind} addItem={addItem} noDate={noDate}/><Card title={`${data.length} registos`}>{data.map(x=><Item key={x.id} item={x} onDelete={()=>removeItem(kind,x.id)} onToggle={toggle?()=>toggle(kind,x.id):undefined}/>)}</Card></>}
function Calendario({data,addItem,removeItem,syncTudo,syncCalendar,readCalendar,busy}){const evs=[...data.eventos].sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora)); return <><Toolbar title="Calendário familiar"/><div className="quick"><button onClick={()=>syncTudo(false)} disabled={busy}><Cloud/> Sync tudo</button><button onClick={syncCalendar} disabled={busy}><RefreshCw/> Enviar</button><button onClick={readCalendar} disabled={busy}><CalendarDays/> Ler Google</button></div><MiniForm kind="eventos" addItem={(k,item)=>addItem('eventos',toEvent(item,'Família'),false)}/><Card title="Eventos familiares">{evs.map(e=><Event key={e.id} e={e} onDelete={()=>removeItem('eventos',e.id)}/>)}</Card></>}
function Familia({data}){return <><Toolbar title="Família"/><div className="people">{membros.map(m=><div key={m}><div className="avatar">{m[0]}</div><b>{m}</b><p>{data.eventos.filter(e=>e.membro===m||e.membro==='Todos').length} eventos</p><p>{data.tarefas.filter(t=>t.membro===m||t.resp===m).length} tarefas</p></div>)}</div></>}
function ImportPage({title,kind,icon,data,importer,removeItem,addItem,busy}){return <><Toolbar title={title}/><section className="hero smallHero">{icon}<h1>{title}</h1><p>Agora também entra na sincronização automática. O botão fica como importação manual.</p></section><div className="quick"><button onClick={importer} disabled={busy}><UploadCloud/> Importar agora</button></div><MiniForm kind={kind} addItem={addItem}/><Card title={`${data.length} itens`}>{data.map(x=><Item key={x.id} item={x} onDelete={()=>removeItem(kind,x.id)}/>)}</Card></>}
function Definicoes({data,persist,syncTudo,busy,scriptUrl,setScriptUrl,flash}){
  const [url,setUrl]=useState(scriptUrl || '')
  const guardarUrl=()=>{
    const clean=url.trim()
    localStorage.setItem('frp_google_script_url', clean)
    setScriptUrl(clean)
    flash(clean ? 'URL do Apps Script guardado. Já podes testar a sincronização.' : 'URL removido. A app fica offline.')
  }
  return <><Toolbar title="Sincronização"/>
    <Card title="Ligar ao Google Apps Script">
      <div className="item"><Cloud/><div><b>{scriptUrl?'Apps Script configurado':'Apps Script por configurar'}</b><p>Última sincronização: {data.syncAt || 'sem registo'}</p></div></div>
      <div className="form oneLine"><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Colar aqui o URL /exec do Apps Script"/><button type="button" onClick={guardarUrl}><Cloud/> Guardar URL</button></div>
      <label className="switch"><input type="checkbox" checked={!!data.autoSync} onChange={e=>persist({...data,autoSync:e.target.checked})}/><span>Sincronizar automaticamente ao abrir a app</span></label>
    </Card>
    <div className="quick"><button onClick={()=>syncTudo(false)} disabled={busy || !scriptUrl}><RefreshCw/> Testar sincronização</button></div>
    <Card title="O que sincroniza"><p>Calendário familiar, tarefas com data, RJP Study, SwimTrack, saúde, veículos, despesas, refeições e férias.</p></Card>
  </>
}
function SearchResults({items}){return <Card title="Resultados da pesquisa">{items.map((x,i)=><Item key={i} item={{...x,titulo:x.titulo||x.nome||x.destino,notas:labelOf(x.kind)}} />)}</Card>}
function Toolbar({title}){return <div className="toolbar"><h1>{title}</h1></div>}
function slug(s='familia'){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-')}
function exportICS(events){ const dt=s=>(s||todayISO()).replaceAll('-',''); const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Familia Rolim Pedro//PT'].concat(events.map(e=>['BEGIN:VEVENT',`UID:${e.id}@familia-rp`,`DTSTAMP:${dt(todayISO())}T090000Z`,`DTSTART;VALUE=DATE:${dt(e.data)}`,`SUMMARY:${e.titulo}`,`DESCRIPTION:${e.origem||''} ${e.membro||''} ${e.notas||''}`,'END:VEVENT']).flat(),['END:VCALENDAR']).join('\n'); download('familia-rolim-pedro.ics',body,'text/calendar') }
function exportPDF(data){ const doc=new jsPDF(); doc.setFontSize(18); doc.text('Família Rolim Pedro - Hub V3',14,18); doc.setFontSize(11); let y=32; Object.entries(data).forEach(([k,v])=>{ if(!Array.isArray(v))return; doc.text(`${labelOf(k)}: ${v.length}`,14,y); y+=8; v.slice(0,8).forEach(x=>{doc.text(`- ${x.titulo||x.nome||x.destino||''} ${x.data||''}`,18,y); y+=6; if(y>280){doc.addPage(); y=18}})}); doc.save('familia-rolim-pedro.pdf') }
function download(name,text,type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); URL.revokeObjectURL(a.href) }

createRoot(document.getElementById('root')).render(<App />)
