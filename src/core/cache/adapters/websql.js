import KinveyError from '../../errors/error';
import Queue from 'promise-queue';
import Query from '../../query';
import when from 'when';
import isArray from 'lodash/lang/isArray';
import isFunction from 'lodash/lang/isFunction';
import isString from 'lodash/lang/isString';

// Configure queue
Queue.configure(when.promise);

export default class WebSQLAdapter {
  constructor(dbInfo) {
    this.dbInfo = dbInfo;
    this.queue = new Queue(1, Infinity);
  }

  transaction(sql, parameters, write = false) {
    const name = this.dbInfo.name;
    const collection = this.dbInfo.collection;
    const escapedCollection = '"' + collection + '"';
    const isMaster = collection === 'sqlite_master';
    const isMulti = isArray(sql);
    sql = isMulti ? sql : [[sql, parameters]];

    if (!this.db) {
      this.db = global.openDatabase(name, 1, '', 5 * 1024 * 1024);
    }

    const promise = when.promise((resolve, reject) => {
      const writeTxn = write || !isFunction(this.db.readTransaction);
      this.db[writeTxn ? 'transaction' : 'readTransaction'](txn => {
        if (write && !isMaster) {
          txn.executeSQL(`CREATE TABLE IF NOT EXISTS ${escapedCollection} (key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)`);
        }

        let pending = this.sql.length;
        const responses = [];

        sql.forEach(parts => {
          const sql = parts[0].replace('#{collection}', escapedCollection);

          txn.executeSQL(sql, parts[1], (_, resultSet) => {
            const response = { rowCount: resultSet.rowsAffected, result: [] };

            if (resultSet.rows.length) {
              for (let i = 0, len = resultSet.rows.length; i < len; i++) {
                const value = resultSet.rows.item(i).value;
                const doc = isMaster ? value : JSON.parse(value);
                response.result.push(doc);
              }
            }

            responses.push(response);
            pending -= 1;

            if (pending === 0) {
              resolve(isMulti ? responses : responses.shift());
            }
          });
        });
      }, err => {
        err = isString(err) ? err : err.message;

        if (err && err.indexOf('no such table') !== -1) {
          return reject(new KinveyError('The collection was not found for this app backend.', collection));
        }

        const sql = 'SELECT name AS value from #{collection} WHERE type = ? and name = ?';
        const parameters = ['table', collection];
        const adapter = new WebSQLAdapter({
          name: name,
          collection: 'sqlite_master'
        });

        return adapter.transaction(sql, parameters, false).then(response => {
          if (response.result.length === 0) {
            err = new KinveyError('The collection was not found for this app backend.', collection);
          } else {
            err = new KinveyError('Database Error', err);
          }

          reject(err);
        });
      });
    });

    return promise;
  }

  find(query) {
    const sql = 'SELECT value FROM #{collection}';
    const promise = this.transaction(sql, []. false).then(response => {
      const docs = response.result;

      if (query) {
        return query.process(docs);
      }

      return docs;
    });

    return promise;
  }

  count(query) {
    const promise = this.find(query).then(docs => {
      return { count: docs.length };
    });
    return promise;
  }

  findAndModify(id, fn) {
    const promise = this.queue.add(() => {
      return this.get(id).then(null, (err) => {
        if (err.name === 'Entity Not Found') {
          return null;
        }

        throw err;
      }).then(doc => {
        doc = fn(doc);
        return this.save(doc);
      });
    });

    return promise;
  }

  group(aggregation) {
    const query = new Query({ filter: aggregation.condition });

    // const reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    // aggregation.reduce = new Function(['doc', 'out'], reduce);

    const promise = this.find(query).then(docs => {
      const groups = {};

      docs.forEach((doc) => {
        const group = {};

        for (const name in aggregation.key) {
          if (aggregation.key.hasOwnProperty(name)) {
            group[name] = doc[name];
          }
        }

        const key = JSON.stringify(group);
        if (!groups[key]) {
          groups[key] = group;

          for (const attr in aggregation.initial) {
            if (aggregation.initial.hasOwnProperty(attr)) {
              groups[key][attr] = aggregation.initial[attr];
            }
          }
        }

        aggregation.reduce(doc, groups[key]);
      });

      const response = [];
      for (const segment in groups) {
        if (groups.hasOwnProperty(segment)) {
          response.push(groups[segment]);
        }
      }

      return response;
    });

    return promise;
  }

  get(id) {
    const sql = 'SELECT value FROM #{collection} WHERE key = ?';
    const promise = this.transaction(sql, [id], false).then(response => {
      const docs = response.result;

      if (docs.length === 0) {
        throw new KinveyError('The entity was not found in the collection.');
      }

      return docs[0];
    });

    return promise;
  }

  save(doc) {
    const sql = 'REPLACE INTO #{collection} (key, value) VALUES (?, ?)';
    const parameters = [doc._id, JSON.stringify(doc)];
    const promise = this.transaction(sql, parameters, true).then(() => {
      return doc;
    });
    return promise;
  }

  batch(docs) {
    const sql = [];

    docs = docs.map(doc => {
      sql.push([
        'REPLACE INTO #{collection} (key, value) VALUES (?, ?)',
        [doc._id, JSON.stringify(doc)]
      ]);

      return doc;
    });

    const promise = this.transaction(sql, null, true).then(() => {
      return docs;
    });

    return promise;
  }

  delete(id) {
    const sql = [
      ['SELECT value FROM #{collection} WHERE key = ?', [id]],
      ['DELETE FROM #{collection} WHERE key = ?', [id]]
    ];

    const promise = this.transaction(sql, null, true).then(response => {
      const docs = response[0].result;
      let count = response[1].rowCount;

      // Some implmentations do not return rowCount
      count = count ? count : docs.length;

      if (count === 0) {
        throw new KinveyError('The entity not found in the collection.', { collection: this.dbInfo.collection, id: id });
      }

      return { count: count, documents: docs };
    });

    return promise;
  }

  clean(query) {
    const promise = this.queue.add(() => {
      return this.find(query).then(docs => {
        if (docs.length === 0) {
          return { count: 0, documents: [] };
        }

        const infix = [];
        const parameters = docs.map(doc => {
          infix.push('?');
          return doc._id;
        });

        const sql = `DELETE FROM #{collection} WHERE key IN(${infix.join(',')})`;
        return this.transaction(sql, parameters, true).then(response => {
          // Some implmentations do not return rowCount
          const count = response.rowCount ? response.rowCount : docs.length;
          return { count: count, documents: docs };
        });
      });
    });

    return promise;
  }

  clear() {
    const promise = this.queue.add(() => {
      const sql = 'SELECT name AS value FROM #{collection} WHERE type = ?';
      const parameters = ['table'];
      const adapter = new WebSQLAdapter({
        name: this.dbInfo.name,
        collection: 'sqlite_master'
      });

      return adapter.transaction(sql, parameters, false).then(response => {
        const tables = response.result;

        if (tables.length === 0) {
          return null;
        }

        const tableFilterRegex = /^[a-zA-Z0-9\-]{1,128}/;
        const sql2 = tables.filter(table => {
          return tableFilterRegex.text(table);
        }).map(table => {
          return [`DROP TABLE IF EXISTS '${table}'`];
        });

        return adapter.transaction(sql2, null, true);
      }).then(() => {
        return null;
      });
    });

    return promise;
  }

  static isSupported() {
    return global.openDatabase ? true : false;
  }
}
