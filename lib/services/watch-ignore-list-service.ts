import { IWatchIgnoreListService } from "../declarations";
import { IDictionary } from "../common/declarations";
import * as _ from "lodash";
import { injector } from "../common/yok";

export class WatchIgnoreListService implements IWatchIgnoreListService {
	private ignoreMap: IDictionary<boolean> = {};

	public addFileToIgnoreList(filePath: string): void {
		this.ignoreMap[filePath] = true;
	}

	public removeFileFromIgnoreList(filePath: string): void {
		this.ignoreMap[filePath] = false;
	}

	public isFileInIgnoreList(filePath: string): boolean {
		return !!this.ignoreMap[filePath];
	}
}
injector.register("watchIgnoreListService", WatchIgnoreListService);
