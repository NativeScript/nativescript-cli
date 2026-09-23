import { Contract } from "../common/di/contract";
import type { IFsStats, IReadFileOptions } from "../common/declarations";

/**
 * Wraps the host file system — reads, writes, directory traversal and archive
 * handling used throughout the CLI.
 */
@Contract({ name: "fs" })
export abstract class FileSystem {
	abstract zipFiles(
		zipFile: string,
		files: string[],
		zipPathCallback: (path: string) => string,
	): Promise<void>;

	abstract unzip(
		zipFile: string,
		destinationDir: string,
		options?: { overwriteExisitingFiles?: boolean; caseSensitive?: boolean },
		fileFilters?: string[],
	): Promise<void>;

	/**
	 * Test whether or not the given path exists by checking with the file system.
	 * @param {string} path Path to be checked.
	 * @returns {boolean} True if path exists, false otherwise.
	 */
	abstract exists(path: string): boolean;

	/**
	 * Deletes a file.
	 * @param {string} path Path to be deleted.
	 * @returns {void} undefined
	 */
	abstract deleteFile(path: string): void;

	/**
	 * Deletes whole directory.
	 * @param {string} directory Path to directory that has to be deleted.
	 * @returns {void}
	 */
	abstract deleteDirectory(directory: string): void;

	/**
	 * Deletes whole directory without throwing exceptions.
	 * @param {string} directory Path to directory that has to be deleted.
	 * @returns {void}
	 */
	abstract deleteDirectorySafe(directory: string): void;

	/**
	 * Returns the size of specified file.
	 * @param {string} path Path to file.
	 * @returns {number} File size in bytes.
	 */
	abstract getFileSize(path: string): number;

	/**
	 * Returns the size of specified path (recurses into all sub-directories if the path is a directory).
	 * @param {string} path Path to file or directory.
	 * @returns {number} File size in bytes.
	 */
	abstract getSize(path: string): number;

	/**
	 * Change file timestamps of the file referenced by the supplied path.
	 * @param {string} path  File path
	 * @param {Date}   atime Access time
	 * @param {Date}   mtime Modified time
	 * @returns {void}
	 */
	abstract utimes(path: string, atime: Date, mtime: Date): void;

	abstract futureFromEvent(
		eventEmitter: NodeJS.EventEmitter,
		event: string,
	): Promise<any>;

	/**
	 * Create a new directory and any necessary subdirectories at specified location.
	 * @param {string} path Directory to be created.
	 * @returns {void}
	 */
	abstract createDirectory(path: string): void;

	/**
	 * Reads contents of directory and returns an array of filenames excluding '.' and '..'.
	 * @param {string} path Path to directory to be checked.
	 * @retruns {string[]} Array of filenames excluding '.' and '..'
	 */
	abstract readDirectory(path: string): string[];

	/**
	 * Reads the entire contents of a file.
	 * @param {string} filename Path to the file that has to be read.
	 * @param {string} options Options used for reading the file - encoding and flags.
	 * @returns {string|Buffer} Content of the file as buffer. In case encoding is specified, the content is returned as string.
	 */
	abstract readFile(
		filename: string,
		options?: IReadFileOptions,
	): string | Buffer;

	/**
	 * Reads the entire contents of a file and returns the result as string.
	 * @param {string} filename Path to the file that has to be read.
	 * @param {IReadFileOptions | string} encoding Options used for reading the file - encoding and flags. If options are not passed, utf8 is used.
	 * @returns {string} Content of the file as string.
	 */
	abstract readText(
		filename: string,
		encoding?: IReadFileOptions | string,
	): string;

	/**
	 * Reads the entire content of a file and parses it to JSON object.
	 * @param {string} filename Path to the file that has to be read.
	 * @param {string} encoding File encoding, defaults to utf8.
	 * @returns {string} Content of the file as JSON object.
	 */
	abstract readJson(filename: string, encoding?: string): any;

	abstract readStdin(): Promise<string>;

	/**
	 * Writes data to a file, replacing the file if it already exists. data can be a string or a buffer.
	 * @param {string} filename Path to file to be created.
	 * @param {string | Buffer} data Data to be written to file.
	 * @param {string} encoding @optional File encoding, defaults to utf8.
	 * @returns {void}
	 */
	abstract writeFile(
		filename: string,
		data: string | Buffer,
		encoding?: string,
	): void;

	/**
	 * Appends data to a file, creating the file if it does not yet exist. Data can be a string or a buffer.
	 * @param {string} filename Path to file to be created.
	 * @param {string | Buffer} data Data to be appended to file.
	 * @param {string} encoding @optional File encoding, defaults to utf8.
	 * @returns {void}
	 */
	abstract appendFile(
		filename: string,
		data: string | Buffer,
		encoding?: string,
	): void;

	/**
	 * Writes JSON data to file.
	 * @param {string} filename Path to file to be created.
	 * @param {any} data JSON data to be written to file.
	 * @param {string} space Identation that will be used for the file.
	 * @param {string} encoding @optional File encoding, defaults to utf8.
	 * @returns {void}
	 */
	abstract writeJson(
		filename: string,
		data: any,
		space?: string,
		encoding?: string,
	): void;

	/**
	 * Copies a file.
	 * @param {string} sourceFileName The original file that has to be copied.
	 * @param {string} destinationFileName The filepath where the file should be copied.
	 * @returns {void}
	 */
	abstract copyFile(sourceFileName: string, destinationFileName: string): void;

	/**
	 * Returns unique file name based on the passed name by checkin if it exists and adding numbers to the passed name until a non-existent file is found.
	 * @param {string} baseName The name based on which the unique name will be generated.
	 * @returns {string} Unique filename. In case baseName does not exist, it will be returned.
	 */
	abstract getUniqueFileName(baseName: string): string;

	/**
	 * Checks if specified directory is empty.
	 * @param {string} directoryPath The directory that will be checked.
	 * @returns {boolean} True in case the directory is empty. False otherwise.
	 */
	abstract isEmptyDir(directoryPath: string): boolean;

	abstract isRelativePath(path: string): boolean;

	/**
	 * Checks if directory exists and if not - creates it.
	 * @param {string} directoryPath Directory path.
	 * @returns {void}
	 */
	abstract ensureDirectoryExists(directoryPath: string): void;

	/**
	 * Renames file/directory. This method throws error in case the original file name does not exist.
	 * @param {string} oldPath The original filename.
	 * @param {string} newPath New filename.
	 * @returns {string} void.
	 */
	abstract rename(oldPath: string, newPath: string): void;

	/**
	 * Renames specified file to the specified name only in case it exists.
	 * Used to skip ENOENT errors when rename is called directly.
	 * @param {string} oldPath Path to original file that has to be renamed. If this file does not exists, no operation is executed.
	 * @param {string} newPath The path where the file will be moved.
	 * @return {boolean} True in case of successful rename. False in case the file does not exist.
	 */
	abstract renameIfExists(oldPath: string, newPath: string): boolean;

	/**
	 * Returns information about the specified file.
	 * In case the passed path is symlink, the returned information is about the original file.
	 * @param {string} path Path to file for which the information will be taken.
	 * @returns {IFsStats} Inforamation about the specified file.
	 */
	abstract getFsStats(path: string): IFsStats;

	/**
	 * Returns information about the specified file.
	 * In case the passed path is symlink, the returned information is about the symlink itself.
	 * @param {string} path Path to file for which the information will be taken.
	 * @returns {IFsStats} Inforamation about the specified file.
	 */
	abstract getLsStats(path: string): IFsStats;

	abstract symlink(
		sourcePath: string,
		destinationPath: string,
		type: "file",
	): void;
	abstract symlink(
		sourcePath: string,
		destinationPath: string,
		type: "dir",
	): void;
	abstract symlink(
		sourcePath: string,
		destinationPath: string,
		type: "junction",
	): void;
	/**
	 * Creates a symbolic link.
	 * Symbolic links are interpreted at run time as if the contents of the
	 * link had been substituted into the path being followed to find a file
	 * or directory.
	 * @param {string} sourcePath The original path of the file/dir.
	 * @param {string} destinationPath The destination where symlink will be created.
	 * @param {string} type "file", "dir" or "junction". Default is 'file'.
	 * Type option is only available on Windows (ignored on other platforms).
	 * Note that Windows junction points require the destination path to be absolute.
	 * When using 'junction', the target argument will automatically be normalized to absolute path.
	 * @returns {void}
	 */
	abstract symlink(
		sourcePath: string,
		destinationPath: string,
		type?: string,
	): void;

	abstract createReadStream(
		path: string,
		options?: {
			flags?: string;
			encoding?: string;
			fd?: number;
			mode?: number;
			bufferSize?: number;
			start?: number;
			end?: number;
			highWaterMark?: number;
		},
	): NodeJS.ReadableStream;

	abstract createWriteStream(
		path: string,
		options?: {
			flags?: string;
			encoding?: string;
			string?: string;
		},
	): any;

	/**
	 * Changes file mode of the specified file. In case it is a symlink, the original file's mode is modified.
	 * @param {string} path Filepath to be modified.
	 * @param {number | string} mode File mode.
	 * @returns {void}
	 */
	abstract chmod(path: string, mode: number | string): void;

	abstract setCurrentUserAsOwner(path: string, owner: string): Promise<void>;

	abstract enumerateFilesInDirectorySync(
		directoryPath: string,
		filterCallback?: (file: string, stat: IFsStats) => boolean,
		opts?: {
			enumerateDirectories?: boolean;
			includeEmptyDirectories?: boolean;
		},
	): string[];

	/**
	 * Hashes a file's contents.
	 * @param {string} fileName Path to file
	 * @param {Object} options algorithm and digest encoding. Default values are sha1 for algorithm and hex for encoding
	 * @return {Promise<string>} The computed shasum
	 */
	abstract getFileShasum(
		fileName: string,
		options?: { algorithm?: string; encoding?: "hex" | "base64" },
	): Promise<string>;

	/**
	 * @param {string} options Options, can be undefined or a combination of "-r" (recursive) and "-f" (force)
	 * @param {string[]} files files and direcories to delete
	 */
	abstract rm(options: string, ...files: string[]): void;

	/**
	 * Deletes all empty parent directories.
	 * @param {string} directory The directory from which this method will start looking for empty parents.
	 * @returns {void}
	 */
	abstract deleteEmptyParents(directory: string): void;

	/**
	 * Return the canonicalized absolute pathname.
	 * NOTE: The method accepts second argument, but it's type and usage is different in Node 4 and Node 6. Once we drop support for Node 4, we can use the second argument as well.
	 * @param {string} filePath Path to file which should be resolved.
	 * @returns {string} The canonicalized absolute path to file.
	 */
	abstract realpath(filePath: string): string;
}
