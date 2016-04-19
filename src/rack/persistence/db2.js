import ydnDB from 'ydn.db';

export class DB {
  constructor(name) {
    if (!name) {
      throw new Error('A name for the datahase is required.');
    }

    this.db = new ydnDB.Storage(name);
  }

  get objectIdPrefix() {
    return '';
  }

  generateObjectId(length = 24) {
    const chars = 'abcdef0123456789';
    let objectId = '';

    for (let i = 0, j = chars.length; i < length; i++) {
      const pos = Math.floor(Math.random() * j);
      objectId += chars.substring(pos, pos + 1);
    }

    objectId = `${this.objectIdPrefix}${objectId}`;
    return objectId;
  }
}
