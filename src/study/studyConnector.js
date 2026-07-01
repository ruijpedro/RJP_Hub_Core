import { hub } from '../api/hubClient';
export const StudyConnector = {
  importFamily: () => hub('study.import'),
  publishEvent: (event) => hub('study.publish', { event })
};
