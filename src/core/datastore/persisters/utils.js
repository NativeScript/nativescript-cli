import times from 'lodash/times';

/**
 * @private
 */
export function domStringListToStringArray(domStringList) {
  const result = [];
  times(domStringList.length, (index) => {
    result.push(domStringList[index]);
  });
  return result;
}

/**
 * @private
 */
export const inedxedDbTransctionMode = {
  readWrite: 'readwrite',
  readOnly: 'readonly',
};

/**
 * @private
 */
export const browserStorageCollectionsMaster = '__master__';

/**
 * @private
 */
export const sqliteCollectionsMaster = 'sqlite_master';

/**
 * @private
 */
export const webSqlCollectionsMaster = 'sqlite_master'; // wat? check it

/**
 * @private
 */
export const webSqlDatabaseSize = 2 * 1024 * 1024;
