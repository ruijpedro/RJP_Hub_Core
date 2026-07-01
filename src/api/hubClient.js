export class RjpHubClient {
  constructor(baseUrl){ this.baseUrl = baseUrl || localStorage.getItem('rjp_hub_url') || ''; }
  setUrl(url){ this.baseUrl = url; localStorage.setItem('rjp_hub_url', url); }
  async post(action, payload={}){
    if(!this.baseUrl) throw new Error('URL do RJP Hub não configurado');
    const res = await fetch(this.baseUrl, { method:'POST', body: JSON.stringify({ action, ...payload }) });
    return await res.json();
  }
  ping(){ return this.post('ping'); }
  syncAll(payload){ return this.post('syncAll', payload); }
  listCalendar(){ return this.post('calendar.list'); }
  addCalendar(event){ return this.post('calendar.add', { event }); }
  importStudy(){ return this.post('study.import'); }
  importSwim(){ return this.post('swim.import'); }
}
export const hub = new RjpHubClient();
