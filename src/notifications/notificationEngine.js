export async function requestNotifications(){
  if(!('Notification' in window)) return { ok:false, error:'Notificações não suportadas.' };
  const permission = await Notification.requestPermission();
  return { ok: permission === 'granted', permission };
}
