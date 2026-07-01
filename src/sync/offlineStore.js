export const offlineStore = {
  get(key, fallback=[]){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)); },
  remove(key){ localStorage.removeItem(key); }
};
