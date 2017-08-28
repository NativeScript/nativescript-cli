import { EOL } from "os";

interface IRubyFunction {
	functionName: string;
	functionParameters?: string;
}

export class CocoaPodsService implements ICocoaPodsService {
	constructor(private $fs: IFileSystem) { }

	public getPodfileHeader(targetName: string): string {
		return `use_frameworks!${EOL}${EOL}target "${targetName}" do${EOL}`;
	}

	public getPodfileFooter(): string {
		return `${EOL}end`;
	}

	public mergePodfileHookContent(hookName: string, pathToPodfile: string): void {
		if (!this.$fs.exists(pathToPodfile)) {
			throw new Error(`The Podfile ${pathToPodfile} does not exist.`);
		}

		const podfileContent = this.$fs.readText(pathToPodfile);
		const hookStart = `${hookName} do`;

		const hookDefinitionRegExp = new RegExp(`${hookStart} *(\\|(\\w+)\\|)?`, "g");
		let newFunctionNameIndex = 1;
		const newFunctions: IRubyFunction[] = [];

		const replacedContent = podfileContent.replace(hookDefinitionRegExp, (substring: string, firstGroup: string, secondGroup: string, index: number): string => {
			const newFunctionName = `${hookName}${newFunctionNameIndex++}`;
			let newDefinition = `def ${newFunctionName}`;

			const rubyFunction: IRubyFunction = { functionName: newFunctionName };
			// firstGroup is the block parameter, secondGroup is the block parameter name.
			if (firstGroup && secondGroup) {
				newDefinition = `${newDefinition} (${secondGroup})`;
				rubyFunction.functionParameters = secondGroup;
			}

			newFunctions.push(rubyFunction);
			return newDefinition;
		});

		if (newFunctions.length > 1) {
			// Execute all methods in the hook and pass the parameter to them.
			const blokParameterName = "installer";
			let mergedHookContent = `${hookStart} |${blokParameterName}|${EOL}`;

			_.each(newFunctions, (rubyFunction: IRubyFunction) => {
				let functionExecution = rubyFunction.functionName;
				if (rubyFunction.functionParameters && rubyFunction.functionParameters.length) {
					functionExecution = `${functionExecution} ${blokParameterName}`;
				}

				mergedHookContent = `${mergedHookContent}  ${functionExecution}${EOL}`;
			});

			mergedHookContent = `${mergedHookContent}end`;

			const newPodfileContent = `${replacedContent}${EOL}${mergedHookContent}`;
			this.$fs.writeFile(pathToPodfile, newPodfileContent);
		}
	}
}

$injector.register("cocoapodsService", CocoaPodsService);
