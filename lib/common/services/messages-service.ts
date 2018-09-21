import * as util from "util";
import * as path from "path";

export class MessagesService implements IMessagesService {
	private _pathsToMessageJsonFiles: string[] = null;
	private _messageJsonFilesContentsCache: any[] = null;

	private get pathToDefaultMessageJson(): string {
		return path.join(__dirname, "..", "resources", "messages", "errorMessages.json");
	}

	private get messageJsonFilesContents(): any[] {
		if (!this._messageJsonFilesContentsCache || !this._messageJsonFilesContentsCache.length) {
			this.refreshMessageJsonContentsCache();
		}

		return this._messageJsonFilesContentsCache;
	}

	constructor(private $fs: IFileSystem) {
		this._pathsToMessageJsonFiles = [this.pathToDefaultMessageJson];
	}

	public get pathsToMessageJsonFiles(): string[] {
		if (!this._pathsToMessageJsonFiles) {
			throw new Error("No paths to message json files provided.");
		}

		return this._pathsToMessageJsonFiles;
	}

	public set pathsToMessageJsonFiles(pathsToMessageJsonFiles: string[]) {
		this._pathsToMessageJsonFiles = pathsToMessageJsonFiles.concat(this.pathToDefaultMessageJson);
		this.refreshMessageJsonContentsCache();
	}

	public getMessage(id: string, ...args: string[]): string {
		const argsArray = args || [];

		const keys = id.split(".");
		let result = this.getFormatedMessage.apply(this, [id].concat(argsArray));

		_.each(this.messageJsonFilesContents, jsonFileContents => {
			const messageValue = this.getMessageFromJsonRecursive(keys, jsonFileContents, 0);
			if (messageValue) {
				result = this.getFormatedMessage.apply(this, [messageValue].concat(argsArray));
				return false;
			}
		});

		return result;
	}

	private getMessageFromJsonRecursive(keys: string[], jsonContents: any, index: number): string {
		if (index >= keys.length) {
			return null;
		}

		const jsonValue = jsonContents[keys[index]];
		if (!jsonValue) {
			return null;
		}

		if (typeof jsonValue === "string") {
			return jsonValue;
		}

		return this.getMessageFromJsonRecursive(keys, jsonValue, index + 1);
	}

	private refreshMessageJsonContentsCache(): void {
		this._messageJsonFilesContentsCache = [];
		_.each(this.pathsToMessageJsonFiles, path => {
			if (!this.$fs.exists(path)) {
				throw new Error("Message json file " + path + " does not exist.");
			}

			this._messageJsonFilesContentsCache.push(this.$fs.readJson(path));
		});
	}

	private getFormatedMessage(message: string, ...args: string[]): string {
		return ~message.indexOf("%") ? util.format.apply(null, [message].concat(args || [])) : message;
	}
}

$injector.register("messagesService", MessagesService);
