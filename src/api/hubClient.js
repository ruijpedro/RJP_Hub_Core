import { Capacitor, CapacitorHttp } from '@capacitor/core';
const URL_KEY = 'rjp_hub_backend_url';
const DEFAULT_HUB_URL = 'https://script.google.com/macros/s/AKfycbwEwGvvI3npMqg3V17rALVdGKbe9sRguaGM1_gYSS2ifRb5epYdbipq-4zPSZufVKsK/exec';
export function getHubUrl(){ return localStorage.getItem(URL_KEY) || DEFAULT_HUB_URL; }
export function setHubUrl(url){ localStorage.setItem(URL_KEY, String(url || '').trim()); }
function jsonp(url, action, payload={}){
  return new Promise((resolve,reject)=>{
    const cb=`__rjp_hub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script=document.createElement('script');
    const timer=setTimeout(()=>done(new Error('Tempo esgotado ao contactar o Hub')),20000);
    function done(err,value){ clearTimeout(timer); try{delete window[cb]}catch{}; script.remove(); err?reject(err):resolve(value); }
    window[cb]=(v)=>done(null,v);
    const q=new URLSearchParams({action,callback:cb,payload:JSON.stringify(payload)});
    script.onerror=()=>done(new Error('Não foi possível contactar o Hub'));
    script.src=`${url}${url.includes('?')?'&':'?'}${q.toString()}`;
    document.head.appendChild(script);
  });
}
export async function hub(action,payload={}){
  const url=getHubUrl(); if(!url) return {ok:false,error:'URL do RJP Hub em falta.'};
  try{
    if(Capacitor.isNativePlatform()){
      const r=await CapacitorHttp.post({url,headers:{'Content-Type':'application/json'},data:{action,...payload},connectTimeout:20000,readTimeout:30000});
      return typeof r.data==='string'?JSON.parse(r.data):r.data;
    }
    return await jsonp(url,action,payload);
  }catch(err){ return {ok:false,error:err.message||'Falha de ligação ao RJP Hub'}; }
}
export async function ping(){ return hub('ping'); }
export async function syncAll(payload){ return hub('syncAll',payload); }
