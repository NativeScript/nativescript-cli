/// <reference path=".d.ts" />

import PlatformServiceLib = require('../lib/services/platform-service');
import NodePackageManagerLib = require('../lib/node-package-manager');
import ProjectLib = require('../lib/services/project-service');
import stubs = require('./stubs');

import yok = require('../lib/common/yok');

require('should');

var testInjector = new yok.Yok();
testInjector.register('platformService', PlatformServiceLib.PlatformService);
testInjector.register('errors', stubs.ErrorsStub);
testInjector.register('fs', stubs.FileSystemStub);
testInjector.register('logger', stubs.LoggerStub);
testInjector.register('npm', stubs.NPMStub);
testInjector.register('projectData', stubs.ProjectDataStub);
testInjector.register('platformsData', stubs.PlatformsDataStub);
testInjector.register('devicesServices', {});
testInjector.register('androidEmulatorServices', {});
testInjector.register('projectDataService', {});
testInjector.register('prompter', {});

describe('PlatformService', function(){
    describe('#updatePlatforms()', function(){
        it('should fail when no services provided', function(){
            var platformService = testInjector.resolve('platformService');
            (function(){return platformService.updatePlatforms().wait(); }).should.throw();

        })
    })
});
