import {TreeDiffer} from './tree-differ';

export class BroccoliPluginWrapper implements BroccoliTree {
  treeDiffer: TreeDiffer;
  wrappedPlugin: IBroccoliPlugin = null;
  inputTree: any = null;
  description: string = null;
  absoluteOutputPath: string = null;
  treeRootDirName: string = null;
  projectDir: string = null;
  $injector: IInjector = null;

  // props monkey-patched by broccoli builder:
  inputPath: string = null;
  cachePath: string = null;
  outputPath: string = null;

  constructor(private pluginClass: any, wrappedPluginArguments: any) {
      this.inputTree = wrappedPluginArguments[0];
      this.description = this.pluginClass.name;
      this.absoluteOutputPath = wrappedPluginArguments[1];
      this.treeRootDirName = wrappedPluginArguments[2];
      this.projectDir = wrappedPluginArguments[3];
      this.$injector = $injector.resolve("injector");
  }

  rebuild(): void {
      try {
        this.init();

        let diffResult = this.treeDiffer.diffTree(this.absoluteOutputPath, this.treeRootDirName);
        this.wrappedPlugin.rebuild(diffResult);

      } catch (e) {
        e.message = `[${this.description}]: ${e.message}`;
        throw e;
      }
  }

  private init() {
      this.treeDiffer = new TreeDiffer(this.inputPath);
      this.wrappedPlugin = this.$injector.resolve(this.pluginClass,
        { inputPath: this.inputPath,
          cachePath: this.cachePath,
          outputRoot: this.absoluteOutputPath,
          projectDir: this.projectDir });
  }

  cleanup() {
    if (this.wrappedPlugin.cleanup) {
      this.wrappedPlugin.cleanup();
    }
  }
}
