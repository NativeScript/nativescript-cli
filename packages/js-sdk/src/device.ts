import { getAppKey } from './kinvey';
import { Storage, Entity } from './storage';

const COLLECTION_NAME = '_Device';

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function uuidv4() {
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

export interface DeviceEntity extends Entity {
  uuid: string;
}

export async function getDeviceId(): Promise<string> {
  const storage = new Storage<DeviceEntity>(getAppKey(), COLLECTION_NAME);
  const docs = await storage.find();
  let doc = docs.shift();

  if (!doc) {
    doc = await storage.save({ uuid: uuidv4() });
  }

  return doc.uuid;
}
