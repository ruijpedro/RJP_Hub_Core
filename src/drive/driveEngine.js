import { hub } from '../api/hubClient';
export const DriveEngine = {
  folders: () => hub('drive.folders'),
  ensureStructure: () => hub('drive.ensureStructure'),
  list: (folder) => hub('drive.list', { folder })
};
