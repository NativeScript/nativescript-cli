import {EOL} from "os";

export class CocoaPodsService implements ICocoaPodsService {
	public getPodfileHeader(targetName: string): string {
		return `use_frameworks!${EOL}${EOL}target "${targetName}" do${EOL}`;
	}

	public getPodfileFooter(): string {
		return `${EOL}end`;
	}
}

$injector.register("cocoapodsService", CocoaPodsService);
