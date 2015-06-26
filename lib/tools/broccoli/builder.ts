///<reference path="../../.d.ts"/>
"use strict";

let broccoli = require('broccoli');
let path = require('path');
import Future = require("fibers/future");
import {TreeDiffer} from './tree-differ';
import destCopyLib = require('./node-modules-dest-copy');

var gulp = require("gulp");
var vinylFilterSince = require('vinyl-filter-since')
var through = require("through2"); 

export class Builder implements IBroccoliBuilder {
   private nodeModules: any = {};
  
  constructor(private $fs: IFileSystem,
    private $nodeModulesTree: INodeModulesTree,
    private $projectDataService: IProjectDataService,
    private $injector: IInjector,
    private $logger: ILogger) { }
  
  public prepareNodeModules(absoluteOutputPath: string, projectDir: string, platform: string, lastModifiedTime?: Date): IFuture<void> {
    return (() => {
      let isNodeModulesModified = false;
      let nodeModulesPath = path.join(projectDir, "node_modules");
            
      if(lastModifiedTime) {
        let pipeline = gulp.src(path.join(projectDir, "node_modules/**"))
          .pipe(vinylFilterSince(lastModifiedTime))
          .pipe(through.obj( (chunk: any, enc: any, cb: Function) => {
              if(chunk.path === nodeModulesPath) {
                isNodeModulesModified = true;
              }  
              
              if(!isNodeModulesModified) {
                let rootModuleName = chunk.path.split(nodeModulesPath)[1].split(path.sep)[1];
                let rootModuleFullPath = path.join(nodeModulesPath, rootModuleName);
                this.nodeModules[rootModuleFullPath] = rootModuleFullPath;
              }
              
              cb(null); 
          }))
          .pipe(gulp.dest(absoluteOutputPath));
          
         let future = new Future<void>();
         
         pipeline.on('end', (err: any, data: any) => {
           if(err) {
             future.throw(err);
           } else {
            future.return();
           }
         });
         
         future.wait();
      }
      
      if(isNodeModulesModified && this.$fs.exists(absoluteOutputPath).wait()) {
        let currentPreparedTnsModules = this.$fs.readDirectory(absoluteOutputPath).wait();
        let tnsModulesInApp = this.$fs.readDirectory(path.join(projectDir, "app", "tns_modules")).wait();
        let modulesToDelete = _.difference(currentPreparedTnsModules, tnsModulesInApp);
        _.each(modulesToDelete, moduleName => this.$fs.deleteDirectory(path.join(absoluteOutputPath, moduleName)).wait())
      } 
      
      if(!lastModifiedTime || isNodeModulesModified) {
         let nodeModulesDirectories = this.$fs.readDirectory(nodeModulesPath).wait();
         _.each(nodeModulesDirectories, nodeModuleDirectoryName => {
           let nodeModuleFullPath = path.join(nodeModulesPath, nodeModuleDirectoryName);
           this.nodeModules[nodeModuleFullPath] = nodeModuleFullPath;
         });
      }
      
     let destCopy = this.$injector.resolve(destCopyLib.DestCopy, {
           inputPath: projectDir,  
           cachePath: "", 
           outputRoot: absoluteOutputPath,
           projectDir: projectDir,
           platform: platform
      });
      
      destCopy.rebuildChangedDirectories(_.keys(this.nodeModules));
      
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
