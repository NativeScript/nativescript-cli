import * as path from "path";
import { IosProjectConstants } from "../constants";
import { IXcprojService } from "../declarations";
import { IProjectData } from "../definitions/project";

class XcprojService implements IXcprojService {
	public getXcodeprojPath(projectData: IProjectData, projectRoot: string): string {
		return path.join(projectRoot, projectData.projectName + IosProjectConstants.XcodeProjExtName);
	}
}

$injector.register("xcprojService", XcprojService);
