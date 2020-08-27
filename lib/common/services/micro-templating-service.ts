import * as util from "util";
import * as os from "os";
import * as constants from "../../constants";
import { IInjector } from "../definitions/yok";
import { injector } from "../yok";
import { IMicroTemplateService, IDictionary } from "../declarations";
import * as _ from "lodash";

export class MicroTemplateService implements IMicroTemplateService {
	private dynamicCallRegex: RegExp;

	constructor(private $injector: IInjector) {
		// Injector's dynamicCallRegex doesn't have 'g' option, which we need here.
		// Use ( ) in order to use $1 to get whole expression later
		this.dynamicCallRegex = new RegExp(
			util.format("(%s)", this.$injector.dynamicCallRegex.source),
			"g"
		);
	}

	public async parseContent(
		data: string,
		options: { isHtml: boolean }
	): Promise<string> {
		const localVariables = this.getLocalVariables(options);
		const compiledTemplate = _.template(
			data.replace(
				this.dynamicCallRegex,
				'this.$injector.getDynamicCallData("$1")'
			)
		);
		// When debugging parsing, uncomment the line below:
		// console.log(compiledTemplate.source);
		return await compiledTemplate.apply(this, [localVariables]);
	}

	private isPlatform(...args: string[]): boolean {
		const platform = os.platform().toLowerCase();
		return _.some(args, (arg) => arg.toLowerCase() === platform);
	}

	private getLocalVariables(options: { isHtml: boolean }): IDictionary<any> {
		const isHtml = options.isHtml;
		// in html help we want to show all help. Only CONSOLE specific help(wrapped in if(isConsole) ) must be omitted
		const localVariables: IDictionary<any> = {
			constants,
		};
		localVariables["isLinux"] = isHtml || this.isPlatform("linux");
		localVariables["isWindows"] = isHtml || this.isPlatform("win32");
		localVariables["isMacOS"] = isHtml || this.isPlatform("darwin");
		localVariables["isConsole"] = !isHtml;
		localVariables["isHtml"] = isHtml;
		localVariables["isJekyll"] = false;

		return localVariables;
	}
}
injector.register("microTemplateService", MicroTemplateService);
