import IndexedDB from '../src/core/persistence/indexeddb';
const indexedDB = new IndexedDB('sampleDB');
const collection = 'sampleCollection';

const entity = { attribute: 'foo' };
indexedDB.find(collection).then(() => {
  return indexedDB.save(collection, entity);
}).then(() => {
  return indexedDB.find(collection);
}).then(entities => {
  console.log(entities);
}).catch(error => {
  console.log(error);
});
