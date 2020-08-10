import * as constants from './constants';
import { $injector } from './common/definitions/yok';
import { IDictionary } from './common/declarations';

export class Constants implements IDictionary<any> {
	constructor () {
		Object.assign(this, constants);
	}
}

$injector.register("constants", Constants);
