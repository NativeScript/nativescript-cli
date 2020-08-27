import * as constants from "./constants";
import { IDictionary } from "./common/declarations";
import { injector } from "./common/yok";
export class Constants implements IDictionary<any> {
	constructor() {
		Object.assign(this, constants);
	}
}

injector.register("constants", Constants);
