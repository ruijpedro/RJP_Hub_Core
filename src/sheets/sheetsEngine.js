import { hub } from '../api/hubClient';
export const SheetsEngine = {
  get: (table) => hub('sheets.get', { table }),
  save: (table, items) => hub('sheets.save', { table, items }),
  append: (table, item) => hub('sheets.append', { table, item })
};
