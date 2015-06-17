import DataStore from './datastore';
import Database from './database';
import utils from './utils';
const objectIdPrefix = 'local_';

function generateObjectId(prefix = '', length = 24) {
  let chars = 'abcdef0123456789';
  let objectId = '';

  for (let i = 0, j = chars.length; i < length; i++) {
    let pos = Math.floor(Math.random() * j);
    objectId = objectId + chars.substring(pos, pos + 1);
  }

  return `${prefix}${objectId}`;
}

class LocalDataStore extends DataStore {

  static read(id) {
    return Database.read(id);
  }

  static save(doc) {
    // Generate an Id
    if (!utils.isDefined(doc._id)) {
      doc._id = generateObjectId(objectIdPrefix);
    }

    // Save the doc
    return Database.save(doc);
  }
}

export default LocalDataStore;
