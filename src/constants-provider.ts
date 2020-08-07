import * as constants from './constants';

export class Constants implements IDictionary<any> {
	constructor () {
		Object.assign(this, constants);
	}
}

$injector.register("constants", Constants);
