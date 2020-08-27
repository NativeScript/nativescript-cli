import * as tar from "tar";
import { IProxySettingsBase } from "../common/declarations";

declare global {
	interface IPacoteService {
		/**
		 * Returns the package's json file content
		 * @param packageName The name of the package
		 * @param options The provided options can control which properties from package.json file will be returned. In case when fullMetadata option is provided, all data from package.json file will be returned.
		 */
		manifest(
			packageName: string,
			options?: IPacoteManifestOptions
		): Promise<any>;
		/**
		 * Downloads the specified package and extracts it in specified destination directory
		 * @param packageName The name of the package
		 * @param destinationDirectory The path to directory where the downloaded tarball will be extracted.
		 */
		extractPackage(
			packageName: string,
			destinationDirectory: string,
			options?: IPacoteExtractOptions
		): Promise<void>;
	}

	interface IPacoteBaseOptions extends IProxySettingsBase {
		/**
		 * The path to npm cache
		 */
		cache?: string;
	}

	interface IPacoteManifestOptions extends IPacoteBaseOptions {
		/**
		 * If true, the whole package.json data will be returned
		 */
		fullMetadata?: boolean;
	}

	interface IPacoteExtractOptions {
		filter?: (path: string, stat: tar.FileStat) => boolean;
	}
}
