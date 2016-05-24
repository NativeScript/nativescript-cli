/// <reference path="./node.d.ts"/>

declare module "gulp-env" {
  interface EnvironmentMapping {
    [key: string]: any;
  }

  interface ForceableStream extends NodeJS.ReadWriteStream {
    force: boolean;
  }

  interface EnvStream extends NodeJS.ReadWriteStream {
    reset: ForceableStream;
    restore(force?: boolean): boolean;
  }

  interface Env {
    (file: string): EnvStream;

    (options: {
      vars: EnvironmentMapping,
    }): EnvStream;

    (options: {
      file: string,
      handler?: (contents: string) => EnvironmentMapping,
      vars?: EnvironmentMapping,
    }): EnvStream;

    (options: {
      file: string,
      type: string,
      vars?: EnvironmentMapping,
    }): EnvStream;

    set(vars: EnvironmentMapping): EnvStream;
  }

  export default Env;
}
