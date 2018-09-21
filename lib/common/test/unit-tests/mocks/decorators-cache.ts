import { cache } from "../../../decorators";

export class CacheDecoratorsTest {
	public counter = 0;

	@cache()
	public method(num: number): number {
		this.counter++;
		return num;
	}

	@cache()
	public async promisifiedMethod(num: number): Promise<number> {
		this.counter++;
		return num;
	}

	public _property = 0;

	@cache()
	public get property(): number {
		this.counter++;
		return this._property;
	}
}
