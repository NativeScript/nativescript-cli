import * as yok from "../src/common/yok";
import { IInjector } from "../src/common/definitions/yok";
import { IDictionary } from "../src/common/declarations";

export abstract class BaseServiceTest {
	protected injector: IInjector;
	constructor() {
		this.injector = new yok.Yok();

		this.initInjector();
	}

	abstract initInjector(): void;

	resolve(name: string, ctorArguments?: IDictionary<any>): any {
		return this.injector.resolve(name);
	}
}
