import { run } from '@nativescript/schematics-engine';

export class GenerateCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $logger: ILogger, private $errors: IErrors) {}

	public async execute(args: string[]): Promise<void> {
		try {
			await run({
				logger: this.$logger,
				schematic: 'component',
				schematicOptions: {
					name: 'random',
					// project: 'web-mobile-project'
				},
				directory: process.cwd(),
			});
		} catch (error) {
			this.$errors.failWithoutHelp(error.message);
		}
	}
}

$injector.registerCommand("generate", GenerateCommand);
