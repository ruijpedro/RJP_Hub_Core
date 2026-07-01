import { hub } from '../api/hubClient';
export const SwimConnector = {
  importFamily: () => hub('swim.import'),
  publishEvent: (event) => hub('swim.publish', { event })
};
