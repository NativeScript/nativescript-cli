import times from 'lodash/times';

export function domStringListToStringArray(domStringList) {
  const result = [];
  times(domStringList.length, (index) => {
    result.push(domStringList[index]);
  });
  return result;
}

export const inedxedDbTransctionMode = {
  readWrite: 'readwrite',
  readOnly: 'readonly',
};

export const browserStorageCollectionsMaster = '__master__';
export const sqliteCollectionsMaster = 'sqlite_master';
export const webSqlCollectionsMaster = 'sqlite_master'; // wat? check it
export const webSqlDatabaseSize = 2 * 1024 * 1024;
