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
