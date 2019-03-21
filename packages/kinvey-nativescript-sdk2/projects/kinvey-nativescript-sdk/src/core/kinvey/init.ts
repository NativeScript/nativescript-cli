import { getDataFromPackageJson } from '../helpers';
import initCommon from './initCommon';

export default function init(config) {
  const configFromPackageJson = getDataFromPackageJson();
  const mergedConfig = Object.assign({}, configFromPackageJson, config);
  return initCommon(mergedConfig);
}
