// import Loki from 'lokijs';

// const memAdapter = new Loki.LokiMemoryAdapter();

// export default class MemoryStore {
//   public dbName: string;
//   public collectionName: string;

//   constructor(dbName: string, collectionName: string) {
//     this.dbName = dbName;
//     this.collectionName = collectionName;
//   }

//   open() {
//     return new Promise((resolve, reject) => {
//       const db = new Loki(this.dbName, {
//         adapter: memAdapter,
//         autosave: false,
//         autoload: true,
//         autoloadCallback: (error) => {
//           if (error) {
//             reject(error);
//           } else {
//             if (this.collectionName) {
//               let collection = db.getCollection(this.collectionName);

//               if (!collection) {
//                 collection = db.addCollection(this.collectionName, {
//                   clone: true,
//                   unique: ['_id'],
//                   disableMeta: true
//                 });
//               }
//             }

//             resolve(db);
//           }
//         }
//       });
//     });
//   }

//   async find() {
//     const db = await this.open();
//     const collection = db.getCollection(this.collectionName);
//     return collection.chain().data({ removeMeta: true });
//   }

//   async count() {
//     const docs = await this.find();
//     return docs.length;
//   }

//   async findById(id) {
//     const db = await this.open();
//     const collection = db.getCollection(this.collectionName);
//     const doc = collection.by('_id', id);

//     if (doc) {
//       delete doc.$loki;
//     }

//     return doc;
//   }

//   async save(docsToSaveOrUpdate) {
//     const db = await this.open();
//     const collection = db.getCollection(this.collectionName);
//     let docs = docsToSaveOrUpdate;

//     if (!docs) {
//       return null;
//     }

//     docs = docs.map((doc) => {
//       let savedDoc = collection.by('_id', doc._id);

//       if (savedDoc) {
//         savedDoc = Object.assign({ $loki: savedDoc.$loki }, doc);
//         collection.update(savedDoc);
//         return savedDoc;
//       }

//       collection.insert(doc);
//       return doc;
//     });

//     return new Promise((resolve, reject) => {
//       db.save((error) => {
//         if (error) {
//           return reject(error);
//         }

//         return resolve(docs);
//       });
//     });
//   }

//   async removeById(id) {
//     const db = await this.open();
//     const collection = db.getCollection(this.collectionName);
//     const doc = collection.by('_id', id);

//     if (doc) {
//       const removedDoc = collection.remove(doc);

//       if (removedDoc) {
//         return new Promise((resolve, reject) => {
//           db.save((error) => {
//             if (error) {
//               return reject(error);
//             }

//             return resolve(1);
//           });
//         });
//       }
//     }

//     return 0;
//   }

//   async clear() {
//     const db = await this.open();
//     const collection = db.getCollection(this.collectionName);
//     collection.clear();

//     return new Promise((resolve, reject) => {
//       db.save((error) => {
//         if (error) {
//           return reject(error);
//         }

//         return resolve(true);
//       });
//     });
//   }

//   async clearAll() {
//     const db = await this.open();
//     return new Promise((resolve, reject) => {
//       db.deleteDatabase((error) => {
//         if (error) {
//           return reject(error);
//         }

//         return resolve(true);
//       });
//     });
//   }
// }
