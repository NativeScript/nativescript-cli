import * as path from "path";
import { IosProjectConstants } from "../constants";
import { IXcprojService } from "../declarations";
import { IProjectData } from "../definitions/project";
import * as _ from 'lodash';
import { injector } from "../common/yok";

class XcprojService implements IXcprojService {
	public getXcodeprojPath(projectData: IProjectData, projectRoot: string): string {
		return path.join(projectRoot, projectData.projectName + IosProjectConstants.XcodeProjExtName);
	}
}

injector.register("xcprojService", XcprojService);
