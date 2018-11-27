import * as fs from "fs";
import * as path from "path";
const yauzl = require("yauzl");
import * as util from "util";

const access = util.promisify(fs.access);
const mkdir = util.promisify(fs.mkdir);

export class FileSystem {
	public exists(path: string): boolean {
		return fs.existsSync(path);
	}

	public extractZip(pathToZip: string, outputDir: string): Promise<void> {
		console.log("pathToZip: ", pathToZip, " outputDir ", outputDir);
		return new Promise((resolve, reject) => {
			yauzl.open(pathToZip, { autoClose: true, lazyEntries: true }, (openError: any, zipFile: any) => {
				if (openError) {
					console.log("BEFORE REJECT openError: ", openError);
					return reject(openError);
				}

				zipFile.on('entry', (entry: any) => {
					console.log("ON ENTRY!!!! ", entry);
					const fn = <string>entry.fileName;
					if (/\/$/.test(fn)) {
						console.log("BEFORE RETURN zipFile.readEntry: ", fn);
						return zipFile.readEntry();
					}

					zipFile.openReadStream(entry, (openStreamError: any, stream: any) => {
						console.log("CALLBACK zipFile.openReadStream", entry, openStreamError, stream);
						if (openStreamError) {
							console.log("BEFORE REJECT openStreamError: ", openStreamError);
							return reject(openStreamError);
						}

						const filePath = `${outputDir}/${fn}`;

						return createParentDirsIfNeeded(filePath)
							.catch(createParentDirError => {
								console.log("ERROR FROM createParentDirsIfNeeded: ", createParentDirError);
								return reject(createParentDirError);
							})
							.then(() => {
								console.log("SUCCESS FROM createParentDirsIfNeeded: ");
								const outfile = fs.createWriteStream(filePath);
								stream.once('end', () => {
									console.log("ON STREAM END ", filePath);
									zipFile.readEntry();
									outfile.close();
								});
								stream.pipe(outfile);
							});
					});
				});

				zipFile.once('end', () => {
					console.log("ZIP FILE ON END!!!!");
					return resolve();
				});

				zipFile.readEntry();
			});
		});
	}

	public readDirectory(path: string): string[] {
		return fs.readdirSync(path);
	}

	public readJson<T>(path: string, options?: { encoding?: null; flag?: string; }): T {
		const content = fs.readFileSync(path, options);
		return JSON.parse(content.toString());
	}
}

function createParentDirsIfNeeded(filePath: string) {
	const dirs = path.dirname(filePath).split(path.sep);
	return dirs.reduce((p, dir) => p.then(parent => {
		const current = `${parent}${path.sep}${dir}`;

		return access(current)
			.catch(e => mkdir(current))
			.then(() => current);
	}), Promise.resolve(''));
}
