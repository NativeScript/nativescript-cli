import { exported } from "../../../decorators";

export class TestPublicAPI {
	@exported("testPublicApi")
	public async myMethod(expectedResult: any): Promise<any> {
		return expectedResult;
	}
}
$injector.register("testPublicApi", TestPublicAPI);
