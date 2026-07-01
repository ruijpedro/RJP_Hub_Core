export const OfflineStore = {
  get(key, fallback=[]){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)); return value; },
  push(key, item){ const arr=this.get(key,[]); arr.push({...item, localId:item.localId || Date.now()}); return this.set(key, arr); }
};
