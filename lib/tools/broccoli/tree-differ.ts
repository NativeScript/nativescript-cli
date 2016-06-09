import * as fs from "fs";
import * as path from "path";

export class TreeDiffer {
  private rootDirName: string;

  constructor(private rootPath: string) {
    this.rootDirName = path.basename(rootPath);
  }

  public diffTree(absoluteOutputPath: string, treeRootDirName?: string): IDiffResult {
    let rootDir = treeRootDirName ? path.join(this.rootPath, treeRootDirName) : this.rootPath;
    let result = this.dirtyCheckPath(absoluteOutputPath, rootDir);
    return result;
  }

  private dirtyCheckPath(absoluteOutputPath: string, rootDir: string): IDiffResult {
    // TODO: improve this - we should compare directory sizes and should remove uninstalled dependencies
    let result = new DirtyCheckingDiffResult();
    let cachedDirectories = fs.existsSync(rootDir) ?  fs.readdirSync(rootDir) : []; // rootPath is funnel_output-path
    let currentDirectories = fs.existsSync(absoluteOutputPath) ? fs.readdirSync(absoluteOutputPath) : []; // the node_modules in output directory

    result.changedDirectories = _.difference(cachedDirectories, currentDirectories);
    result.removedDirectories = _.difference(currentDirectories, cachedDirectories);
    return result;
  }
}

class DirtyCheckingDiffResult implements IDiffResult {
  public changedDirectories: string[] = [];
  public removedDirectories: string[] = [];
}
