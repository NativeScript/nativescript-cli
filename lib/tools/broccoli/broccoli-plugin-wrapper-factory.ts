///<reference path="../../.d.ts"/>
"use strict";

import broccoliPluginWrapperLib = require("./broccoli-plugin-wrapper");

/**
 * Makes writing plugins easy.
 *
 * Factory method that takes a class that implements the BroccoliPluginWrapper interface and returns
 * an instance of BroccoliTree.
 *
 * @param pluginClass
 * @returns {BroccoliPluginWrapper}
 */

type BroccoliPluginWrapperFactory = (inputTree: BroccoliTree, ...options: any[]) => BroccoliTree;

export function wrapBroccoliPlugin(pluginClass: any): BroccoliPluginWrapperFactory {
  return function() { return new broccoliPluginWrapperLib.BroccoliPluginWrapper(pluginClass, arguments); };
}