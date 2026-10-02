import {
	ICommandParameter,
	IStringParameterBuilder,
} from "./definitions/commands";
import { IInjector } from "./definitions/yok";
import { injector } from "./yok";

/**
 * @deprecated Positional arguments of a defineCommand definition are declared with
 * `arguments`. Kept for commands still implementing ICommand.
 */
export class StringCommandParameter implements ICommandParameter {
	public mandatory = false;
	public errorMessage: string;

	constructor(private $injector: IInjector) {}

	public async validate(validationValue: string): Promise<boolean> {
		if (!validationValue) {
			if (this.errorMessage) {
				this.$injector.resolve("errors").fail(this.errorMessage);
			}

			return false;
		}

		return true;
	}
}
injector.register("stringParameter", StringCommandParameter);

/**
 * @deprecated Use a required `arguments` spec with an errorMessage instead. Kept for
 * commands still implementing ICommand.
 */
export class StringParameterBuilder implements IStringParameterBuilder {
	constructor(private $injector: IInjector) {}

	public createMandatoryParameter(errorMsg: string): ICommandParameter {
		const commandParameter = new StringCommandParameter(this.$injector);
		commandParameter.mandatory = true;
		commandParameter.errorMessage = errorMsg;

		return commandParameter;
	}
}
injector.register("stringParameterBuilder", StringParameterBuilder);
