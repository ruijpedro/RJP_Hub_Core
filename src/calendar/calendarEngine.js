import { hub } from '../api/hubClient.js';
export const CalendarEngine = {
  list: () => hub.listCalendar(),
  add: (event) => hub.addCalendar(event),
  normalize: (x) => ({
    id: x.id || crypto.randomUUID?.() || String(Date.now()),
    titulo: x.titulo || x.title || x.nome || 'Evento',
    data: String(x.data || x.date || '').slice(0,10),
    hora: x.hora || x.time || '',
    membro: x.membro || 'Todos',
    origem: x.origem || 'RJP Hub',
    notas: x.notas || x.description || '',
    prioridade: x.prioridade || 'Normal'
  })
};
