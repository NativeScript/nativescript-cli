import * as constants from './constants';

export class DynamicHelpProvider implements IDynamicHelpProvider {
	public isProjectType(args: string[]): boolean {
		return true;
	}

	public getLocalVariables(options: { isHtml: boolean }): IDictionary<any> {
		let localVariables: IDictionary<any> = {
			constants: constants
		};
		return localVariables;
	}
}
$injector.register("dynamicHelpProvider", DynamicHelpProvider);
