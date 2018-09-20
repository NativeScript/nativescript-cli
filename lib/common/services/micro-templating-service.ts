import * as util from "util";

export class MicroTemplateService implements IMicroTemplateService {
	private dynamicCallRegex: RegExp;

	constructor(private $dynamicHelpService: IDynamicHelpService,
		private $injector: IInjector) {
		// Injector's dynamicCallRegex doesn't have 'g' option, which we need here.
		// Use ( ) in order to use $1 to get whole expression later
		this.dynamicCallRegex = new RegExp(util.format("(%s)", this.$injector.dynamicCallRegex.source), "g");
	}

	public async parseContent(data: string, options: { isHtml: boolean }): Promise<string> {
		const localVariables = this.$dynamicHelpService.getLocalVariables(options);
		const compiledTemplate = _.template(data.replace(this.dynamicCallRegex, "this.$injector.getDynamicCallData(\"$1\")"));
		// When debugging parsing, uncomment the line below:
		// console.log(compiledTemplate.source);
		return await compiledTemplate.apply(this, [localVariables]);
	}
}
$injector.register("microTemplateService", MicroTemplateService);
