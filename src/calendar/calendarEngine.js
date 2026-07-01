import { hub } from '../api/hubClient';
export const CalendarEngine = {
  list: () => hub('calendar.list'),
  add: (event) => hub('calendar.add', { event }),
  sync: (events) => hub('calendar.sync', { events }),
  delete: (id) => hub('calendar.delete', { id })
};
