import * as fs from "fs";
import * as _ from "lodash";
import {
	join,
	dirname,
	basename,
	resolve as pathResolve,
	extname,
	normalize,
} from "path";
import * as minimatch from "minimatch";
import * as injector from "./yok";
import * as crypto from "crypto";
import * as shelljs from "shelljs";
import { parseJson } from "./helpers";
import { PACKAGE_JSON_FILE_NAME } from "../constants";
import { EOL } from "os";
import { detectNewline } from "detect-newline";
import { IFileSystem, IReadFileOptions, IFsStats } from "./declarations";
import { IInjector } from "./definitions/yok";
import { create as createArchiver } from "archiver";

// TODO: Add .d.ts for mkdirp module (or use it from @types repo).
const mkdirp = require("mkdirp");

@injector.register("fs")
export class FileSystem implements IFileSystem {
	private static DEFAULT_INDENTATION_CHARACTER = "\t";
	private static JSON_OBJECT_REGEXP = new RegExp(`{\\r*\\n*(\\W*)"`, "m");

	constructor(private $injector: IInjector) {}

	public async zipFiles(
		zipFile: string,
		files: string[],
		zipPathCallback: (path: string) => string,
	): Promise<void> {
		//we are resolving it here instead of in the constructor, because config has dependency on file system and config shouldn't require logger
		const $logger = this.$injector.resolve("logger");
		const zip = createArchiver("zip", {
			zlib: {
				level: 9,
			},
		});
		const outFile = fs.createWriteStream(zipFile);
		zip.pipe(outFile);

		return new Promise<void>((resolve, reject) => {
			outFile.on("error", (err: Error) => reject(err));
			outFile.on("close", () => {
				$logger.trace("zip: %d bytes written", zip.pointer());
				resolve();
			});

			for (const file of files) {
				let relativePath = zipPathCallback(file);
				relativePath = relativePath.replace(/\\/g, "/");
				$logger.trace("zipping as '%s' file '%s'", relativePath, file);
				zip.append(fs.createReadStream(file), { name: relativePath });
			}
			zip.finalize();
		});
	}

	public utimes(path: string, atime: Date, mtime: Date): void {
		return fs.utimesSync(path, atime, mtime);
	}

	public async unzip(
		zipFile: string,
		destinationDir: string,
		options?: { overwriteExisitingFiles?: boolean; caseSensitive?: boolean },
		fileFilters?: string[],
	): Promise<void> {
		const shouldOverwriteFiles = !(
			options && options.overwriteExisitingFiles === false
		);
		const isCaseSensitive = !(options && options.caseSensitive === false);
		const $hostInfo = this.$injector.resolve("$hostInfo");

		this.createDirectory(destinationDir);

		let proc: string;
		if ($hostInfo.isWindows) {
			proc = join(__dirname, "resources/platform-tools/unzip/win32/unzip");
		} else if ($hostInfo.isDarwin) {
			proc = "unzip"; // darwin unzip is info-zip
		} else if ($hostInfo.isLinux) {
			proc = "unzip"; // linux unzip is info-zip
		}

		if (!isCaseSensitive) {
			zipFile = this.findFileCaseInsensitive(zipFile);
		}

		const args = _.flatten<string>([
			"-b",
			shouldOverwriteFiles ? "-o" : "-n",
			isCaseSensitive ? [] : "-C",
			zipFile,
			fileFilters || [],
			"-d",
			destinationDir,
		]);

		const $childProcess = this.$injector.resolve("childProcess");
		await $childProcess.spawnFromEvent(proc, args, "close", {
			stdio: "ignore",
			detached: true,
		});
	}

	private findFileCaseInsensitive(file: string): string {
		const dir = dirname(file);
		const baseName = basename(file);
		const entries = this.readDirectory(dir);
		const match = minimatch.match(entries, baseName, {
			nocase: true,
			nonegate: true,
			nonull: true,
		})[0];
		const result = join(dir, match);
		return result;
	}

	public exists(path: string): boolean {
		return fs.existsSync(path);
	}

	public deleteFile(path: string): void {
		try {
			fs.unlinkSync(path);
		} catch (err) {
			if (err && err.code !== "ENOENT") {
				// ignore "file doesn't exist" error
				throw err;
			}
		}
	}

	public deleteDirectory(directory: string): void {
		shelljs.rm("-rf", directory);

		const err = shelljs.error();

		if (err !== null) {
			throw new Error(err);
		}
	}

	public deleteDirectorySafe(directory: string): void {
		try {
			this.deleteDirectory(directory);
		} catch (e) {
			return;
		}
	}

	public getFileSize(path: string): number {
		const stat = this.getFsStats(path);
		return stat.size;
	}

	public getSize(path: string): number {
		const dirSize = (
			dir: string,
			paths: Map<string, number> = new Map(),
			root = true,
		) => {
			const files = fs.readdirSync(dir, { withFileTypes: true });
			files.map((file: any) => {
				const path = join(dir, file.name);

				if (file.isDirectory()) {
					dirSize(path, paths, false);
					return;
				}

				if (file.isFile()) {
					const { size } = fs.statSync(path);
					paths.set(path, size);
				}
			});

			if (root) {
				// console.log("root", paths);
				return Array.from(paths.values()).reduce(
					(sum, current) => sum + current,
					0,
				);
			}
		};

		try {
			return dirSize(path);
		} catch (err) {
			return 0;
		}
	}

	public async futureFromEvent(eventEmitter: any, event: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			eventEmitter.once(event, function () {
				const args = _.toArray(arguments);

				if (event === "error") {
					const err = <Error>args[0];
					reject(err);
					return;
				}

				switch (args.length) {
					case 0:
						resolve(undefined);
						break;
					case 1:
						resolve(args[0]);
						break;
					default:
						resolve(args);
						break;
				}
			});
		});
	}

	public createDirectory(path: string): void {
		try {
			mkdirp.sync(path);
		} catch (error) {
			const $errors = this.$injector.resolve("errors");
			let errorMessage = `Unable to create directory ${path}. \nError is: ${error}.`;
			if (error.code === "EACCES") {
				errorMessage += "\n\nYou may need to call the command with 'sudo'.";
			}
			$errors.fail(errorMessage);
		}
	}

	public readDirectory(path: string): string[] {
		return fs.readdirSync(path);
	}

	public readFile(
		filename: string,
		options?: IReadFileOptions,
	): string | Buffer {
		return fs.readFileSync(filename, options);
	}

	public readText(
		filename: string,
		options?: IReadFileOptions | string,
	): string {
		options = options || { encoding: "utf8" };

		if (_.isString(options)) {
			options = { encoding: <BufferEncoding>options };
		}

		if (!options.encoding) {
			options.encoding = "utf8";
		}

		return <string>this.readFile(filename, options);
	}

	public readJson(filename: string, encoding?: string): any {
		const data = this.readText(filename, encoding);
		if (data) {
			return parseJson(data);
		}
		return null;
	}

	public writeFile(
		filename: string,
		data: string | Buffer,
		encoding?: string,
	): void {
		this.createDirectory(dirname(filename));
		if (!data) {
			// node 14 will no longer coerce unsupported input to strings anymore.
			// clean any null or undefined data
			data = "";
		}
		fs.writeFileSync(filename, data, { encoding: <BufferEncoding>encoding });
	}

	public appendFile(filename: string, data: any, encoding?: string): void {
		fs.appendFileSync(filename, data, { encoding: <BufferEncoding>encoding });
	}

	public writeJson(
		filename: string,
		data: any,
		space?: string,
		encoding?: string,
	): void {
		if (!space) {
			space = this.getIndentationCharacter(filename);
		}

		let stringifiedData;
		if (basename(filename) === PACKAGE_JSON_FILE_NAME) {
			let newline = EOL;
			if (fs.existsSync(filename)) {
				const existingFile = this.readText(filename);
				newline = detectNewline(existingFile);
			}
			stringifiedData = JSON.stringify(data, null, space).concat(newline);
		} else {
			stringifiedData = JSON.stringify(data, null, space);
		}

		return this.writeFile(filename, stringifiedData, encoding);
	}

	public copyFile(sourceFileName: string, destinationFileName: string): void {
		if (pathResolve(sourceFileName) === pathResolve(destinationFileName)) {
			return;
		}

		this.createDirectory(dirname(destinationFileName));

		// MobileApplication.app is resolved as a directory on Mac,
		// therefore we need to copy it recursively as it's not a single file.
		shelljs.cp("-rf", sourceFileName, destinationFileName);

		const err = shelljs.error();

		if (err) {
			throw new Error(err);
		}
	}

	public createReadStream(
		path: string,
		options?: {
			flags?: string;
			encoding?: BufferEncoding;
			fd?: number;
			mode?: number;
			autoClose?: boolean;
			emitClose?: boolean;
			start?: number;
			end?: number;
			highWaterMark?: number;
		},
	): NodeJS.ReadableStream {
		return fs.createReadStream(path, options);
	}

	public createWriteStream(
		path: string,
		options?: {
			flags?: string;
			encoding?: BufferEncoding;
			fd?: number;
			mode?: number;
			autoClose?: boolean;
			emitClose?: boolean;
			start?: number;
			highWaterMark?: number;
		},
	): any {
		return fs.createWriteStream(path, options);
	}

	public chmod(path: string, mode: any): void {
		fs.chmodSync(path, mode);
	}

	public getFsStats(path: string): fs.Stats {
		return fs.statSync(path);
	}

	public getLsStats(path: string): fs.Stats {
		return fs.lstatSync(path);
	}

	public getUniqueFileName(baseName: string): string {
		if (!this.exists(baseName)) {
			return baseName;
		}
		const extension = extname(baseName);
		const prefix = basename(baseName, extension);

		for (let i = 2; ; ++i) {
			const numberedName = prefix + i + extension;
			if (!this.exists(numberedName)) {
				return numberedName;
			}
		}
	}

	public isEmptyDir(directoryPath: string): boolean {
		const directoryContent = this.readDirectory(directoryPath);
		return directoryContent.length === 0;
	}

	public isRelativePath(p: string): boolean {
		const normal = normalize(p);
		const absolute = pathResolve(p);
		return normal !== absolute;
	}

	public ensureDirectoryExists(directoryPath: string): void {
		if (!this.exists(directoryPath)) {
			this.createDirectory(directoryPath);
		}
	}

	public rename(oldPath: string, newPath: string): void {
		fs.renameSync(oldPath, newPath);
	}

	public renameIfExists(oldPath: string, newPath: string): boolean {
		try {
			this.rename(oldPath, newPath);
			return true;
		} catch (e) {
			if (e.code === "ENOENT") {
				return false;
			}
			throw e;
		}
	}

	public symlink(
		sourcePath: string,
		destinationPath: string,
		type?: fs.symlink.Type,
	): void {
		fs.symlinkSync(sourcePath, destinationPath, type);
	}

	public async setCurrentUserAsOwner(
		path: string,
		owner: string,
	): Promise<void> {
		const $childProcess = this.$injector.resolve("childProcess");

		if (!this.$injector.resolve("$hostInfo").isWindows) {
			const chown = $childProcess.spawn("chown", ["-R", owner, path], {
				stdio: "ignore",
				detached: true,
			});
			await this.futureFromEvent(chown, "close");
		}
		// nothing to do on Windows, as chown does not work on this platform
	}

	// filterCallback: function(path: String, stat: fs.Stats): Boolean
	public enumerateFilesInDirectorySync(
		directoryPath: string,
		filterCallback?: (_file: string, _stat: IFsStats) => boolean,
		opts?: {
			enumerateDirectories?: boolean;
			includeEmptyDirectories?: boolean;
		},
		foundFiles?: string[],
	): string[] {
		foundFiles = foundFiles || [];

		if (!this.exists(directoryPath)) {
			const $logger = this.$injector.resolve("logger");
			$logger.warn("Could not find folder: " + directoryPath);
			return foundFiles;
		}

		const contents = this.readDirectory(directoryPath);
		for (let i = 0; i < contents.length; ++i) {
			const file = join(directoryPath, contents[i]);
			let stat: fs.Stats = null;
			if (this.exists(file)) {
				stat = this.getFsStats(file);
			}

			if (!stat || (filterCallback && !filterCallback(file, stat))) {
				continue;
			}

			if (stat.isDirectory()) {
				if (opts && opts.enumerateDirectories) {
					foundFiles.push(file);
				}
				if (
					opts &&
					opts.includeEmptyDirectories &&
					this.readDirectory(file).length === 0
				) {
					foundFiles.push(file);
				}

				this.enumerateFilesInDirectorySync(
					file,
					filterCallback,
					opts,
					foundFiles,
				);
			} else {
				foundFiles.push(file);
			}
		}
		return foundFiles;
	}

	public async getFileShasum(
		fileName: string,
		options?: { algorithm?: string; encoding?: "hex" | "base64" },
	): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			const algorithm = (options && options.algorithm) || "sha1";
			const encoding = (options && options.encoding) || "hex";
			const logger: ILogger = this.$injector.resolve("$logger");
			const shasumData = crypto.createHash(algorithm);
			const fileStream = this.createReadStream(fileName);
			fileStream.on("data", (data: Buffer | string) => {
				shasumData.update(data);
			});

			fileStream.on("end", () => {
				const shasum: string = shasumData.digest(encoding);
				logger.trace(`Shasum of file ${fileName} is ${shasum}`);
				resolve(shasum);
			});

			fileStream.on("error", (err: Error) => {
				reject(err);
			});
		});
	}

	public async readStdin(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let buffer = "";
			process.stdin.on("data", (data: string) => (buffer += data));
			process.stdin.on("end", () => resolve(buffer));
		});
	}

	public rm(options?: string, ...files: string[]): void {
		shelljs.rm(options, files);
	}

	public deleteEmptyParents(directory: string): void {
		let parent = this.exists(directory) ? directory : dirname(directory);

		while (this.isEmptyDir(parent)) {
			this.deleteDirectory(parent);
			parent = dirname(parent);
		}
	}

	public realpath(filePath: string): string {
		return fs.realpathSync(filePath);
	}

	private getIndentationCharacter(filePath: string): string {
		if (!this.exists(filePath)) {
			return FileSystem.DEFAULT_INDENTATION_CHARACTER;
		}

		const fileContent = this.readText(filePath).trim();
		const matches = fileContent.match(FileSystem.JSON_OBJECT_REGEXP);

		if (!matches || !matches[1]) {
			return FileSystem.DEFAULT_INDENTATION_CHARACTER;
		}

		const indentation = matches[1];

		return indentation[0] === " "
			? indentation
			: FileSystem.DEFAULT_INDENTATION_CHARACTER;
	}
}
