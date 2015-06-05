///<reference path="../../../.d.ts"/>
"use strict";

let Funnel = require('broccoli-funnel');

import path = require("path");
import destCopy from '../node-modules-dest-copy';

class NodeModulesTree implements INodeModulesTree {	
	public makeNodeModulesTree(absoluteOutputPath: string, projectDir: string): any {
		let nodeModulesFunnel = new Funnel(".", { include: ["node_modules/**"] });
   		let result = destCopy(nodeModulesFunnel, absoluteOutputPath, "node_modules", projectDir);   
		return result;	
	}
}
$injector.register("nodeModulesTree", NodeModulesTree);