import * as path from "path";
import * as fs from "fs";
import { IosProjectConstants } from "../constants";
import { IXcprojService } from "../declarations";
import { IProjectData } from "../definitions/project";
import * as _ from "lodash";
import { injector } from "../common/yok";

class XcprojService implements IXcprojService {
	public getXcodeprojPath(
		projectData: IProjectData,
		projectRoot: string
	): string {
		return path.join(
			projectRoot,
			projectData.projectName + IosProjectConstants.XcodeProjExtName
		);
	}

	public findXcodeProject(dir: string): string {
		const filesAndDirs = fs.readdirSync(dir);

		for (let i = 0; i < filesAndDirs.length; i++) {
			const fullPath = path.join(dir, filesAndDirs[i]);

			if (
				fs.statSync(fullPath).isDirectory() &&
				filesAndDirs[i].endsWith(".xcodeproj")
			) {
				return fullPath;
			}
		}

		return null;
	}
}

injector.register("xcprojService", XcprojService);
