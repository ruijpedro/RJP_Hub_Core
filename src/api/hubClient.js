const URL_KEY = 'rjp_hub_backend_url';

export function getHubUrl(){ return localStorage.getItem(URL_KEY) || ''; }
export function setHubUrl(url){ localStorage.setItem(URL_KEY, String(url || '').trim()); }

export async function hub(action, payload = {}){
  const url = getHubUrl();
  if(!url) return { ok:false, error:'URL do RJP Hub em falta.' };
  try{
    const res = await fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload })
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { ok:false, error:text || 'Resposta inválida' }; }
  }catch(err){
    return { ok:false, error: err.message || 'Falha de ligação ao RJP Hub' };
  }
}

export async function ping(){ return hub('ping'); }
export async function syncAll(payload){ return hub('syncAll', payload); }
