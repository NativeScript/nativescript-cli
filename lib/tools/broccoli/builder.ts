///<reference path="../../.d.ts"/>
"use strict";

let broccoli = require('broccoli');
let path = require('path');
import Future = require("fibers/future");
import {TreeDiffer} from './tree-differ';
import destCopy = require('./node-modules-dest-copy');

export class Builder implements IBroccoliBuilder {
  constructor(private $fs: IFileSystem,
    private $nodeModulesTree: INodeModulesTree,
    private $projectDataService: IProjectDataService,
    private $logger: ILogger) { }
  
  public prepareNodeModules(absoluteOutputPath: string, projectDir: string): IFuture<void> {
    return (() => {
      // TODO: figure out a better way for doing this
      this.$projectDataService.initialize(projectDir);
      let cachedNodeModulesPath = this.$projectDataService.getValue("node-modules-cache-path").wait();
      if (cachedNodeModulesPath && this.$fs.exists(cachedNodeModulesPath).wait()) {
        let diffTree = new TreeDiffer(cachedNodeModulesPath);
        let diffTreeResult = diffTree.diffTree(path.join(projectDir, absoluteOutputPath, "node_modules"));
        
        if(diffTreeResult.changedDirectories.length > 0 || diffTreeResult.removedDirectories.length > 0) {
          this.rebuildNodeModulesTree(absoluteOutputPath, projectDir).wait();
        }
      } else { 
         this.rebuildNodeModulesTree(absoluteOutputPath, projectDir).wait();
      }
    }).future<void>()();
  }

  private rebuildNodeModulesTree(outputPath: string, projectDir: string): IFuture<any> {
    let nodeModulesBuilder = this.makeNodeModulesBuilder(outputPath, projectDir);
    return this.rebuild(nodeModulesBuilder);
  }

  private makeNodeModulesBuilder(outputPath: string, projectDir: string): BroccoliBuilder {
    let tree = this.$nodeModulesTree.makeNodeModulesTree(outputPath, projectDir);
    return new broccoli.Builder(tree);
  }

  private rebuild(builder: any): IFuture<any> {
    let future = new Future<any>();
    builder.build()
        .then((result: any) => {
              future.return(result);
        })
        .catch((err: any) => {
              if(err.file) {
                this.$logger.error("File: " + err.file); 
              }
              if(err.stack) {
                this.$logger.error(err.stack);
              }
              future.throw(err);                        
        });
    
    return future;
  }
}
$injector.register("broccoliBuilder", Builder);
