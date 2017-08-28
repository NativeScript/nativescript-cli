import * as semver from "semver";
import * as helpers from "../common/helpers";
import { EOL } from "os";

class XcprojService implements IXcprojService {
	private xcprojInfoCache: IXcprojInfo;

	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $logger: ILogger,
		private $sysInfo: ISysInfo,
		private $xcodeSelectService: IXcodeSelectService) {
	}

	public async verifyXcproj(shouldFail: boolean): Promise<boolean> {
		const xcprojInfo = await this.getXcprojInfo();
		if (xcprojInfo.shouldUseXcproj && !xcprojInfo.xcprojAvailable) {
			const errorMessage = `You are using CocoaPods version ${xcprojInfo.cocoapodVer} which does not support Xcode ${xcprojInfo.xcodeVersion.major}.${xcprojInfo.xcodeVersion.minor} yet.${EOL}${EOL}You can update your cocoapods by running $sudo gem install cocoapods from a terminal.${EOL}${EOL}In order for the NativeScript CLI to be able to work correctly with this setup you need to install xcproj command line tool and add it to your PATH. Xcproj can be installed with homebrew by running $ brew install xcproj from the terminal`;
			if (shouldFail) {
				this.$errors.failWithoutHelp(errorMessage);
			} else {
				this.$logger.warn(errorMessage);
			}

			return true;
		}

		return false;
	}

	public async getXcprojInfo(): Promise<IXcprojInfo> {
		if (!this.xcprojInfoCache) {
			let cocoapodVer = await this.$sysInfo.getCocoapodVersion();
			const xcodeVersion = await this.$xcodeSelectService.getXcodeVersion();

			if (cocoapodVer && !semver.valid(cocoapodVer)) {
				// Cocoapods betas have names like 1.0.0.beta.8
				// These 1.0.0 betas are not valid semver versions, but they are working fine with XCode 7.3
				// So get only the major.minor.patch version and consider them as 1.0.0
				cocoapodVer = _.take(cocoapodVer.split("."), 3).join(".");
			}

			xcodeVersion.patch = xcodeVersion.patch || "0";
			// CocoaPods with version lower than 1.0.0 don't support Xcode 7.3 yet
			// https://github.com/CocoaPods/CocoaPods/issues/2530#issuecomment-210470123
			// as a result of this all .pbxprojects touched by CocoaPods get converted to XML plist format
			const shouldUseXcproj = cocoapodVer && !!(semver.lt(cocoapodVer, "1.0.0") && ~helpers.versionCompare(xcodeVersion, "7.3.0"));
			let xcprojAvailable: boolean;

			if (shouldUseXcproj) {
				// if that's the case we can use xcproj gem to convert them back to ASCII plist format
				try {
					await this.$childProcess.exec("xcproj --version");
					xcprojAvailable = true;
				} catch (e) {
					xcprojAvailable = false;
				}
			}

			this.xcprojInfoCache = { cocoapodVer, xcodeVersion, shouldUseXcproj, xcprojAvailable };
		}

		return this.xcprojInfoCache;
	}
}

$injector.register("xcprojService", XcprojService);
