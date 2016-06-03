let Funnel = require("broccoli-funnel");
import destCopy from "../node-modules-dest-copy";

export class NodeModulesTree implements INodeModulesTree {
	public makeNodeModulesTree(absoluteOutputPath: string, projectDir: string): any {
		let nodeModulesFunnel = new Funnel(projectDir, { include: ["node_modules/**"] });
   		let result = destCopy(nodeModulesFunnel, absoluteOutputPath, "node_modules", projectDir);
		return result;
	}
}
$injector.register("nodeModulesTree", NodeModulesTree);
