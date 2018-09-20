import * as os from "os";
import { formatListOfNames } from '../helpers';

export class DynamicHelpService implements IDynamicHelpService {
	constructor(private $dynamicHelpProvider: IDynamicHelpProvider) { }

	public isProjectType(...args: string[]): boolean {
		return this.$dynamicHelpProvider.isProjectType(args);
	}

	public isPlatform(...args: string[]): boolean {
		const platform = os.platform().toLowerCase();
		return _.some(args, arg => arg.toLowerCase() === platform);
	}

	public getLocalVariables(options: { isHtml: boolean }): IDictionary<any> {
		const isHtml = options.isHtml;
		// in html help we want to show all help. Only CONSOLE specific help(wrapped in if(isConsole) ) must be omitted
		const localVariables = this.$dynamicHelpProvider.getLocalVariables(options);
		localVariables["isLinux"] = isHtml || this.isPlatform("linux");
		localVariables["isWindows"] = isHtml || this.isPlatform("win32");
		localVariables["isMacOS"] = isHtml || this.isPlatform("darwin");
		localVariables["isConsole"] = !isHtml;
		localVariables["isHtml"] = isHtml;
		localVariables["formatListOfNames"] = formatListOfNames;
		localVariables["isJekyll"] = false;

		return localVariables;
	}
}
$injector.register("dynamicHelpService", DynamicHelpService);
