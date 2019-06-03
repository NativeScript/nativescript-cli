module.exports =
(global["webpackJsonp"] = global["webpackJsonp"] || []).push([["bundle"],{

/***/ "./ sync ^\\.\\/app\\.(css|scss|less|sass)$":
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./app.css": "./app.css"
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) { // check for number or string
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return id;
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "./ sync ^\\.\\/app\\.(css|scss|less|sass)$";

/***/ }),

/***/ "./ sync recursive (root|page)\\.(xml|css|js|ts|scss)$":
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./app-root.xml": "./app-root.xml",
	"./main-page.js": "./main-page.js",
	"./main-page.ts": "./main-page.ts",
	"./main-page.xml": "./main-page.xml"
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) { // check for number or string
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return id;
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "./ sync recursive (root|page)\\.(xml|css|js|ts|scss)$";

/***/ }),

/***/ "./app-root.xml":
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {
module.exports = "<Frame defaultPage=\"main-page\">\n</Frame>\n";
    if (true) {
        module.hot.accept();
        module.hot.dispose(() => {
            global.hmrRefresh({ type: 'markup', path: './app-root.xml' });
        })
    }

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__("../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./app.css":
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {exports = module.exports = __webpack_require__("../node_modules/css-loader/dist/runtime/api.js")(false);
// Imports
exports.i(__webpack_require__("../node_modules/css-loader/dist/cjs.js?!../node_modules/nativescript-theme-core/css/core.light.css"), "");

// Module
exports.push([module.i, "/*\nIn NativeScript, the app.css file is where you place CSS rules that\nyou would like to apply to your entire application. Check out\nhttp://docs.nativescript.org/ui/styling for a full list of the CSS\nselectors and properties you can use to style UI components.\n\n/*\nIn many cases you may want to use the NativeScript core theme instead\nof writing your own CSS rules. For a full list of class names in the theme\nrefer to http://docs.nativescript.org/ui/theme. \nThe imported CSS rules must precede all other types of rules.\n*/\n\n/*\nThe following CSS rule changes the font size of all UI\ncomponents that have the btn class name.\n*/\n.btn {\n    font-size: 18;\n}\n", ""]);

;
    if (true) {
        module.hot.accept();
        module.hot.dispose(() => {
            global.hmrRefresh({ type: 'style', path: './app.css' });
        })
    }

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__("../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./app.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var tns_core_modules_application__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("../node_modules/tns-core-modules/application/application.js");
/* harmony import */ var tns_core_modules_application__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(tns_core_modules_application__WEBPACK_IMPORTED_MODULE_0__);

        let applicationCheckPlatform = __webpack_require__("../node_modules/tns-core-modules/application/application.js");
        if (applicationCheckPlatform.android && !global["__snapshot"]) {
            __webpack_require__("../node_modules/tns-core-modules/ui/frame/frame.js");
__webpack_require__("../node_modules/tns-core-modules/ui/frame/activity.js");
        }

        
            __webpack_require__("../node_modules/nativescript-dev-webpack/load-application-css-regular.js")();
            
            
        if (true) {
            const hmrUpdate = __webpack_require__("../node_modules/nativescript-dev-webpack/hmr/index.js").hmrUpdate;
            global.__initialHmrUpdate = true;
            global.__hmrSyncBackup = global.__onLiveSync;

            global.__onLiveSync = function () {
                hmrUpdate();
            };

            global.hmrRefresh = function({ type, path } = {}) {
                if (global.__initialHmrUpdate) {
                    return;
                }

                setTimeout(() => {
                    global.__hmrSyncBackup({ type, path });
                });
            };

            hmrUpdate().then(() => {
                global.__initialHmrUpdate = false;
            })
        }
        
            const context = __webpack_require__("./ sync recursive (root|page)\\.(xml|css|js|ts|scss)$");
            global.registerWebpackModules(context);
            
        __webpack_require__("../node_modules/tns-core-modules/bundle-entry-points.js");
        /*
In NativeScript, the app.ts file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/

tns_core_modules_application__WEBPACK_IMPORTED_MODULE_0__["run"]({ moduleName: "app-root" });
/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/

    
        
        
    
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__("../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./main-page.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/
Object.defineProperty(exports, "__esModule", { value: true });
var main_view_model_1 = __webpack_require__("./main-view-model.ts");
// Event handler for Page "navigatingTo" event attached in main-page.xml
function navigatingTo(args) {
    /*
    This gets a reference this page’s <Page> UI component. You can
    view the API reference of the Page to see what’s available at
    https://docs.nativescript.org/api-reference/classes/_ui_page_.page.html
    */
    var page = args.object;
    /*
    A page’s bindingContext is an object that should be used to perform
    data binding between XML markup and TypeScript code. Properties
    on the bindingContext can be accessed using the {{ }} syntax in XML.
    In this example, the {{ message }} and {{ onTap }} bindings are resolved
    against the object returned by createViewModel().

    You can learn more about data binding in NativeScript at
    https://docs.nativescript.org/core-concepts/data-binding.
    */
    page.bindingContext = new main_view_model_1.HelloWorldModel();
}
exports.navigatingTo = navigatingTo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7OztFQUlFOztBQUlGLHFEQUFvRDtBQUVwRCx3RUFBd0U7QUFDeEUsU0FBZ0IsWUFBWSxDQUFDLElBQWU7SUFDeEM7Ozs7TUFJRTtJQUNGLElBQU0sSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFFL0I7Ozs7Ozs7OztNQVNFO0lBQ0YsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLGlDQUFlLEVBQUUsQ0FBQztBQUNoRCxDQUFDO0FBbkJELG9DQW1CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5JbiBOYXRpdmVTY3JpcHQsIGEgZmlsZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgYW4gWE1MIGZpbGUgaXMga25vd24gYXNcbmEgY29kZS1iZWhpbmQgZmlsZS4gVGhlIGNvZGUtYmVoaW5kIGlzIGEgZ3JlYXQgcGxhY2UgdG8gcGxhY2UgeW91ciB2aWV3XG5sb2dpYywgYW5kIHRvIHNldCB1cCB5b3VyIHBhZ2XigJlzIGRhdGEgYmluZGluZy5cbiovXG5cbmltcG9ydCB7IEV2ZW50RGF0YSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2RhdGEvb2JzZXJ2YWJsZVwiO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL3BhZ2VcIjtcbmltcG9ydCB7IEhlbGxvV29ybGRNb2RlbCB9IGZyb20gXCIuL21haW4tdmlldy1tb2RlbFwiO1xuXG4vLyBFdmVudCBoYW5kbGVyIGZvciBQYWdlIFwibmF2aWdhdGluZ1RvXCIgZXZlbnQgYXR0YWNoZWQgaW4gbWFpbi1wYWdlLnhtbFxuZXhwb3J0IGZ1bmN0aW9uIG5hdmlnYXRpbmdUbyhhcmdzOiBFdmVudERhdGEpIHtcbiAgICAvKlxuICAgIFRoaXMgZ2V0cyBhIHJlZmVyZW5jZSB0aGlzIHBhZ2XigJlzIDxQYWdlPiBVSSBjb21wb25lbnQuIFlvdSBjYW5cbiAgICB2aWV3IHRoZSBBUEkgcmVmZXJlbmNlIG9mIHRoZSBQYWdlIHRvIHNlZSB3aGF04oCZcyBhdmFpbGFibGUgYXRcbiAgICBodHRwczovL2RvY3MubmF0aXZlc2NyaXB0Lm9yZy9hcGktcmVmZXJlbmNlL2NsYXNzZXMvX3VpX3BhZ2VfLnBhZ2UuaHRtbFxuICAgICovXG4gICAgY29uc3QgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuXG4gICAgLypcbiAgICBBIHBhZ2XigJlzIGJpbmRpbmdDb250ZXh0IGlzIGFuIG9iamVjdCB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIHBlcmZvcm1cbiAgICBkYXRhIGJpbmRpbmcgYmV0d2VlbiBYTUwgbWFya3VwIGFuZCBUeXBlU2NyaXB0IGNvZGUuIFByb3BlcnRpZXNcbiAgICBvbiB0aGUgYmluZGluZ0NvbnRleHQgY2FuIGJlIGFjY2Vzc2VkIHVzaW5nIHRoZSB7eyB9fSBzeW50YXggaW4gWE1MLlxuICAgIEluIHRoaXMgZXhhbXBsZSwgdGhlIHt7IG1lc3NhZ2UgfX0gYW5kIHt7IG9uVGFwIH19IGJpbmRpbmdzIGFyZSByZXNvbHZlZFxuICAgIGFnYWluc3QgdGhlIG9iamVjdCByZXR1cm5lZCBieSBjcmVhdGVWaWV3TW9kZWwoKS5cblxuICAgIFlvdSBjYW4gbGVhcm4gbW9yZSBhYm91dCBkYXRhIGJpbmRpbmcgaW4gTmF0aXZlU2NyaXB0IGF0XG4gICAgaHR0cHM6Ly9kb2NzLm5hdGl2ZXNjcmlwdC5vcmcvY29yZS1jb25jZXB0cy9kYXRhLWJpbmRpbmcuXG4gICAgKi9cbiAgICBwYWdlLmJpbmRpbmdDb250ZXh0ID0gbmV3IEhlbGxvV29ybGRNb2RlbCgpO1xufVxuIl19

/***/ }),

/***/ "./main-page.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "navigatingTo", function() { return navigatingTo; });
/* harmony import */ var _main_view_model__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./main-view-model.ts");
/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

// Event handler for Page "navigatingTo" event attached in main-page.xml
function navigatingTo(args) {
    /*
    This gets a reference this page’s <Page> UI component. You can
    view the API reference of the Page to see what’s available at
    https://docs.nativescript.org/api-reference/classes/_ui_page_.page.html
    */
    var page = args.object;
    /*
    A page’s bindingContext is an object that should be used to perform
    data binding between XML markup and TypeScript code. Properties
    on the bindingContext can be accessed using the {{ }} syntax in XML.
    In this example, the {{ message }} and {{ onTap }} bindings are resolved
    against the object returned by createViewModel().

    You can learn more about data binding in NativeScript at
    https://docs.nativescript.org/core-concepts/data-binding.
    */
    page.bindingContext = new _main_view_model__WEBPACK_IMPORTED_MODULE_0__["HelloWorldModel"]();
}
;
    if (true) {
        module.hot.accept();
        module.hot.dispose(() => {
            global.hmrRefresh({ type: 'script', path: './main-page.ts' });
        })
    }

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__("../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./main-page.xml":
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {
module.exports = "<!--\nThe markup in NativeScript apps contains a series of user interface components, each\nof which NativeScript renders with a platform-specific iOS or Android native control.\nYou can find a full list of user interface components you can use in your app at\nhttps://docs.nativescript.org/ui/components.\n-->\n<Page xmlns=\"http://schemas.nativescript.org/tns.xsd\" navigatingTo=\"navigatingTo\" class=\"page\">\n    <!--\n    The ActionBar is the NativeScript common abstraction over the Android ActionBar and iOS NavigationBar.\n    http://docs.nativescript.org/ui/action-bar\n    -->\n    <Page.actionBar>\n        <ActionBar title=\"My App\" icon=\"\" class=\"action-bar\">\n        </ActionBar>\n    </Page.actionBar>\n    <!--\n    The StackLayout stacks UI components on the screen—either vertically or horizontally.\n    In this case, the StackLayout does vertical stacking; you can change the stacking to\n    horizontal by applying a orientation=\"horizontal\" attribute to the <StackLayout> element.\n    You can learn more about NativeScript layouts at\n    https://docs.nativescript.org/ui/layout-containers.\n\n    These components make use of several CSS class names that are part of the NativeScript\n    core theme, such as p-20, btn, h2, and text-center. You can view a full list of the\n    class names available for styling your app at https://docs.nativescript.org/ui/theme.\n    -->\n    <StackLayout class=\"p-20\">\n        <Label text=\"Tap the button\" class=\"h1 text-center\"/>\n        <Button text=\"TAP\" tap=\"{{ onTap }}\" class=\"btn btn-primary btn-active\"/>\n        <Label text=\"{{ message }}\" class=\"h2 text-center\" textWrap=\"true\"/>\n    </StackLayout>\n</Page>\n";
    if (true) {
        module.hot.accept();
        module.hot.dispose(() => {
            global.hmrRefresh({ type: 'markup', path: './main-page.xml' });
        })
    }

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__("../node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./main-view-model.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HelloWorldModel", function() { return HelloWorldModel; });
/* harmony import */ var tns_core_modules_data_observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("../node_modules/tns-core-modules/data/observable/observable.js");
/* harmony import */ var tns_core_modules_data_observable__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(tns_core_modules_data_observable__WEBPACK_IMPORTED_MODULE_0__);

var HelloWorldModel = /** @class */ (function (_super) {
    __extends(HelloWorldModel, _super);
    function HelloWorldModel() {
        var _this = _super.call(this) || this;
        // Initialize default values.
        _this._counter = 42;
        _this.updateMessage();
        return _this;
    }
    Object.defineProperty(HelloWorldModel.prototype, "message", {
        get: function () {
            return this._message;
        },
        set: function (value) {
            if (this._message !== value) {
                this._message = value;
                this.notifyPropertyChange("message", value);
            }
        },
        enumerable: true,
        configurable: true
    });
    HelloWorldModel.prototype.onTap = function () {
        this._counter--;
        console.log("Test.");
        console.trace("Test");
        throw new Error("Test");
        this.updateMessage();
    };
    HelloWorldModel.prototype.updateMessage = function () {
        if (this._counter <= 0) {
            this.message = "Hoorraaay! You unlocked the NativeScript clicker achievement!";
        }
        else {
            this.message = this._counter + " taps left";
        }
    };
    return HelloWorldModel;
}(tns_core_modules_data_observable__WEBPACK_IMPORTED_MODULE_0__["Observable"]));



/***/ }),

/***/ "./package.json":
/***/ (function(module) {

module.exports = {"main":"app.js","android":{"v8Flags":"--expose_gc"}};

/***/ })

},[["./app.ts","runtime","vendor"]]]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLiBzeW5jIG5vbnJlY3Vyc2l2ZSBeXFwuXFwvYXBwXFwuKGNzc3xzY3NzfGxlc3N8c2FzcykkIiwid2VicGFjazovLy8uIHN5bmMgKHJvb3R8cGFnZSlcXC4oeG1sfGNzc3xqc3x0c3xzY3NzKSQiLCJ3ZWJwYWNrOi8vLy4vYXBwLXJvb3QueG1sIiwid2VicGFjazovLy8uL2FwcC5jc3MiLCJ3ZWJwYWNrOi8vLy4vYXBwLnRzIiwid2VicGFjazovLy8uL21haW4tcGFnZS5qcyIsIndlYnBhY2s6Ly8vLi9tYWluLXBhZ2UudHMiLCJ3ZWJwYWNrOi8vLy4vbWFpbi1wYWdlLnhtbCIsIndlYnBhY2s6Ly8vLi9tYWluLXZpZXctbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFOzs7Ozs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0RTs7Ozs7Ozs7QUN6QkE7QUFDQSxRQUFRLElBQVU7QUFDbEI7QUFDQTtBQUNBLCtCQUErQix5Q0FBeUM7QUFDeEUsU0FBUztBQUNUOzs7Ozs7Ozs7QUNQQSx5RUFBMkIsbUJBQU8sQ0FBQyxnREFBZ0Q7QUFDbkY7QUFDQSxVQUFVLG1CQUFPLENBQUMsb0dBQTZGOztBQUUvRztBQUNBLGNBQWMsUUFBUyw2b0JBQTZvQixvQkFBb0IsR0FBRzs7QUFFM3JCO0FBQ0EsUUFBUSxJQUFVO0FBQ2xCO0FBQ0E7QUFDQSwrQkFBK0IsbUNBQW1DO0FBQ2xFLFNBQVM7QUFDVDs7Ozs7Ozs7OztBQ2JBO0FBQUE7QUFBQTtBQUFBOzs7O21CQUlFO0FBRUYsT0FBTyxFQUFxRDtBQUVoQjtBQUU1Qzs7O0VBR0U7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDYlc7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQsd0JBQXdCLG1CQUFPLENBQUMsc0JBQW1CO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzREFBc0QsR0FBRztBQUN6RCwyQkFBMkIsV0FBVyxPQUFPLFNBQVM7QUFDdEQ7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDLHVxRTs7Ozs7Ozs7QUM3QjNDO0FBQUE7QUFBQTtBQUFBOzs7O0VBSUU7QUFJa0Q7QUFFcEQsd0VBQXdFO0FBQ2pFLFNBQVMsWUFBWSxDQUFDLElBQWU7SUFDeEM7Ozs7TUFJRTtJQUNGLElBQU0sSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFFL0I7Ozs7Ozs7OztNQVNFO0lBQ0YsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLGdFQUFlLEVBQUUsQ0FBQztBQUNoRCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OztBQzdCRCxzNEJBQXM0QixzcEJBQXNwQixTQUFTLG1FQUFtRSxXQUFXO0FBQ25uRCxRQUFRLElBQVU7QUFDbEI7QUFDQTtBQUNBLCtCQUErQiwwQ0FBMEM7QUFDekUsU0FBUztBQUNUOzs7Ozs7Ozs7O0FDUEE7QUFBQTtBQUFBO0FBQUE7QUFBOEQ7QUFFOUQ7SUFBcUMsbUNBQVU7SUFLM0M7UUFBQSxZQUNJLGlCQUFPLFNBS1Y7UUFIRyw2QkFBNkI7UUFDN0IsS0FBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsS0FBSSxDQUFDLGFBQWEsRUFBRSxDQUFDOztJQUN6QixDQUFDO0lBRUQsc0JBQUksb0NBQU87YUFBWDtZQUNJLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN6QixDQUFDO2FBRUQsVUFBWSxLQUFhO1lBQ3JCLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLLEVBQUU7Z0JBQ3pCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO2dCQUN0QixJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQy9DO1FBQ0wsQ0FBQzs7O09BUEE7SUFTRCwrQkFBSyxHQUFMO1FBQ0ksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckIsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUN2QixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVPLHVDQUFhLEdBQXJCO1FBQ0ksSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsRUFBRTtZQUNwQixJQUFJLENBQUMsT0FBTyxHQUFHLCtEQUErRCxDQUFDO1NBQ2xGO2FBQU07WUFDSCxJQUFJLENBQUMsT0FBTyxHQUFNLElBQUksQ0FBQyxRQUFRLGVBQVksQ0FBQztTQUMvQztJQUNMLENBQUM7SUFDTCxzQkFBQztBQUFELENBQUMsQ0F2Q29DLDJFQUFVLEdBdUM5QyIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgbWFwID0ge1xuXHRcIi4vYXBwLmNzc1wiOiBcIi4vYXBwLmNzc1wiXG59O1xuXG5cbmZ1bmN0aW9uIHdlYnBhY2tDb250ZXh0KHJlcSkge1xuXHR2YXIgaWQgPSB3ZWJwYWNrQ29udGV4dFJlc29sdmUocmVxKTtcblx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oaWQpO1xufVxuZnVuY3Rpb24gd2VicGFja0NvbnRleHRSZXNvbHZlKHJlcSkge1xuXHR2YXIgaWQgPSBtYXBbcmVxXTtcblx0aWYoIShpZCArIDEpKSB7IC8vIGNoZWNrIGZvciBudW1iZXIgb3Igc3RyaW5nXG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgcmVxICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdHJldHVybiBpZDtcbn1cbndlYnBhY2tDb250ZXh0LmtleXMgPSBmdW5jdGlvbiB3ZWJwYWNrQ29udGV4dEtleXMoKSB7XG5cdHJldHVybiBPYmplY3Qua2V5cyhtYXApO1xufTtcbndlYnBhY2tDb250ZXh0LnJlc29sdmUgPSB3ZWJwYWNrQ29udGV4dFJlc29sdmU7XG5tb2R1bGUuZXhwb3J0cyA9IHdlYnBhY2tDb250ZXh0O1xud2VicGFja0NvbnRleHQuaWQgPSBcIi4vIHN5bmMgXlxcXFwuXFxcXC9hcHBcXFxcLihjc3N8c2Nzc3xsZXNzfHNhc3MpJFwiOyIsInZhciBtYXAgPSB7XG5cdFwiLi9hcHAtcm9vdC54bWxcIjogXCIuL2FwcC1yb290LnhtbFwiLFxuXHRcIi4vbWFpbi1wYWdlLmpzXCI6IFwiLi9tYWluLXBhZ2UuanNcIixcblx0XCIuL21haW4tcGFnZS50c1wiOiBcIi4vbWFpbi1wYWdlLnRzXCIsXG5cdFwiLi9tYWluLXBhZ2UueG1sXCI6IFwiLi9tYWluLXBhZ2UueG1sXCJcbn07XG5cblxuZnVuY3Rpb24gd2VicGFja0NvbnRleHQocmVxKSB7XG5cdHZhciBpZCA9IHdlYnBhY2tDb250ZXh0UmVzb2x2ZShyZXEpO1xuXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhpZCk7XG59XG5mdW5jdGlvbiB3ZWJwYWNrQ29udGV4dFJlc29sdmUocmVxKSB7XG5cdHZhciBpZCA9IG1hcFtyZXFdO1xuXHRpZighKGlkICsgMSkpIHsgLy8gY2hlY2sgZm9yIG51bWJlciBvciBzdHJpbmdcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyByZXEgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0cmV0dXJuIGlkO1xufVxud2VicGFja0NvbnRleHQua2V5cyA9IGZ1bmN0aW9uIHdlYnBhY2tDb250ZXh0S2V5cygpIHtcblx0cmV0dXJuIE9iamVjdC5rZXlzKG1hcCk7XG59O1xud2VicGFja0NvbnRleHQucmVzb2x2ZSA9IHdlYnBhY2tDb250ZXh0UmVzb2x2ZTtcbm1vZHVsZS5leHBvcnRzID0gd2VicGFja0NvbnRleHQ7XG53ZWJwYWNrQ29udGV4dC5pZCA9IFwiLi8gc3luYyByZWN1cnNpdmUgKHJvb3R8cGFnZSlcXFxcLih4bWx8Y3NzfGpzfHRzfHNjc3MpJFwiOyIsIlxubW9kdWxlLmV4cG9ydHMgPSBcIjxGcmFtZSBkZWZhdWx0UGFnZT1cXFwibWFpbi1wYWdlXFxcIj5cXG48L0ZyYW1lPlxcblwiO1xuICAgIGlmIChtb2R1bGUuaG90KSB7XG4gICAgICAgIG1vZHVsZS5ob3QuYWNjZXB0KCk7XG4gICAgICAgIG1vZHVsZS5ob3QuZGlzcG9zZSgoKSA9PiB7XG4gICAgICAgICAgICBnbG9iYWwuaG1yUmVmcmVzaCh7IHR5cGU6ICdtYXJrdXAnLCBwYXRoOiAnLi9hcHAtcm9vdC54bWwnIH0pO1xuICAgICAgICB9KVxuICAgIH1cbiIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCIpKGZhbHNlKTtcbi8vIEltcG9ydHNcbmV4cG9ydHMuaShyZXF1aXJlKFwiLSEuLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcz8/cmVmLS05IW5hdGl2ZXNjcmlwdC10aGVtZS1jb3JlL2Nzcy9jb3JlLmxpZ2h0LmNzc1wiKSwgXCJcIik7XG5cbi8vIE1vZHVsZVxuZXhwb3J0cy5wdXNoKFttb2R1bGUuaWQsIFwiLypcXG5JbiBOYXRpdmVTY3JpcHQsIHRoZSBhcHAuY3NzIGZpbGUgaXMgd2hlcmUgeW91IHBsYWNlIENTUyBydWxlcyB0aGF0XFxueW91IHdvdWxkIGxpa2UgdG8gYXBwbHkgdG8geW91ciBlbnRpcmUgYXBwbGljYXRpb24uIENoZWNrIG91dFxcbmh0dHA6Ly9kb2NzLm5hdGl2ZXNjcmlwdC5vcmcvdWkvc3R5bGluZyBmb3IgYSBmdWxsIGxpc3Qgb2YgdGhlIENTU1xcbnNlbGVjdG9ycyBhbmQgcHJvcGVydGllcyB5b3UgY2FuIHVzZSB0byBzdHlsZSBVSSBjb21wb25lbnRzLlxcblxcbi8qXFxuSW4gbWFueSBjYXNlcyB5b3UgbWF5IHdhbnQgdG8gdXNlIHRoZSBOYXRpdmVTY3JpcHQgY29yZSB0aGVtZSBpbnN0ZWFkXFxub2Ygd3JpdGluZyB5b3VyIG93biBDU1MgcnVsZXMuIEZvciBhIGZ1bGwgbGlzdCBvZiBjbGFzcyBuYW1lcyBpbiB0aGUgdGhlbWVcXG5yZWZlciB0byBodHRwOi8vZG9jcy5uYXRpdmVzY3JpcHQub3JnL3VpL3RoZW1lLiBcXG5UaGUgaW1wb3J0ZWQgQ1NTIHJ1bGVzIG11c3QgcHJlY2VkZSBhbGwgb3RoZXIgdHlwZXMgb2YgcnVsZXMuXFxuKi9cXG5cXG4vKlxcblRoZSBmb2xsb3dpbmcgQ1NTIHJ1bGUgY2hhbmdlcyB0aGUgZm9udCBzaXplIG9mIGFsbCBVSVxcbmNvbXBvbmVudHMgdGhhdCBoYXZlIHRoZSBidG4gY2xhc3MgbmFtZS5cXG4qL1xcbi5idG4ge1xcbiAgICBmb250LXNpemU6IDE4O1xcbn1cXG5cIiwgXCJcIl0pO1xuXG47XG4gICAgaWYgKG1vZHVsZS5ob3QpIHtcbiAgICAgICAgbW9kdWxlLmhvdC5hY2NlcHQoKTtcbiAgICAgICAgbW9kdWxlLmhvdC5kaXNwb3NlKCgpID0+IHtcbiAgICAgICAgICAgIGdsb2JhbC5obXJSZWZyZXNoKHsgdHlwZTogJ3N0eWxlJywgcGF0aDogJy4vYXBwLmNzcycgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuIiwiLypcbkluIE5hdGl2ZVNjcmlwdCwgdGhlIGFwcC50cyBmaWxlIGlzIHRoZSBlbnRyeSBwb2ludCB0byB5b3VyIGFwcGxpY2F0aW9uLlxuWW91IGNhbiB1c2UgdGhpcyBmaWxlIHRvIHBlcmZvcm0gYXBwLWxldmVsIGluaXRpYWxpemF0aW9uLCBidXQgdGhlIHByaW1hcnlcbnB1cnBvc2Ugb2YgdGhlIGZpbGUgaXMgdG8gcGFzcyBjb250cm9sIHRvIHRoZSBhcHDigJlzIGZpcnN0IG1vZHVsZS5cbiovXG5cbmltcG9ydCAqIGFzIGFwcGxpY2F0aW9uIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2FwcGxpY2F0aW9uXCI7XG5cbmFwcGxpY2F0aW9uLnJ1bih7IG1vZHVsZU5hbWU6IFwiYXBwLXJvb3RcIiB9KTtcblxuLypcbkRvIG5vdCBwbGFjZSBhbnkgY29kZSBhZnRlciB0aGUgYXBwbGljYXRpb24gaGFzIGJlZW4gc3RhcnRlZCBhcyBpdCB3aWxsIG5vdFxuYmUgZXhlY3V0ZWQgb24gaU9TLlxuKi9cbiIsIlwidXNlIHN0cmljdFwiO1xuLypcbkluIE5hdGl2ZVNjcmlwdCwgYSBmaWxlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBhbiBYTUwgZmlsZSBpcyBrbm93biBhc1xuYSBjb2RlLWJlaGluZCBmaWxlLiBUaGUgY29kZS1iZWhpbmQgaXMgYSBncmVhdCBwbGFjZSB0byBwbGFjZSB5b3VyIHZpZXdcbmxvZ2ljLCBhbmQgdG8gc2V0IHVwIHlvdXIgcGFnZeKAmXMgZGF0YSBiaW5kaW5nLlxuKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBtYWluX3ZpZXdfbW9kZWxfMSA9IHJlcXVpcmUoXCIuL21haW4tdmlldy1tb2RlbFwiKTtcbi8vIEV2ZW50IGhhbmRsZXIgZm9yIFBhZ2UgXCJuYXZpZ2F0aW5nVG9cIiBldmVudCBhdHRhY2hlZCBpbiBtYWluLXBhZ2UueG1sXG5mdW5jdGlvbiBuYXZpZ2F0aW5nVG8oYXJncykge1xuICAgIC8qXG4gICAgVGhpcyBnZXRzIGEgcmVmZXJlbmNlIHRoaXMgcGFnZeKAmXMgPFBhZ2U+IFVJIGNvbXBvbmVudC4gWW91IGNhblxuICAgIHZpZXcgdGhlIEFQSSByZWZlcmVuY2Ugb2YgdGhlIFBhZ2UgdG8gc2VlIHdoYXTigJlzIGF2YWlsYWJsZSBhdFxuICAgIGh0dHBzOi8vZG9jcy5uYXRpdmVzY3JpcHQub3JnL2FwaS1yZWZlcmVuY2UvY2xhc3Nlcy9fdWlfcGFnZV8ucGFnZS5odG1sXG4gICAgKi9cbiAgICB2YXIgcGFnZSA9IGFyZ3Mub2JqZWN0O1xuICAgIC8qXG4gICAgQSBwYWdl4oCZcyBiaW5kaW5nQ29udGV4dCBpcyBhbiBvYmplY3QgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBwZXJmb3JtXG4gICAgZGF0YSBiaW5kaW5nIGJldHdlZW4gWE1MIG1hcmt1cCBhbmQgVHlwZVNjcmlwdCBjb2RlLiBQcm9wZXJ0aWVzXG4gICAgb24gdGhlIGJpbmRpbmdDb250ZXh0IGNhbiBiZSBhY2Nlc3NlZCB1c2luZyB0aGUge3sgfX0gc3ludGF4IGluIFhNTC5cbiAgICBJbiB0aGlzIGV4YW1wbGUsIHRoZSB7eyBtZXNzYWdlIH19IGFuZCB7eyBvblRhcCB9fSBiaW5kaW5ncyBhcmUgcmVzb2x2ZWRcbiAgICBhZ2FpbnN0IHRoZSBvYmplY3QgcmV0dXJuZWQgYnkgY3JlYXRlVmlld01vZGVsKCkuXG5cbiAgICBZb3UgY2FuIGxlYXJuIG1vcmUgYWJvdXQgZGF0YSBiaW5kaW5nIGluIE5hdGl2ZVNjcmlwdCBhdFxuICAgIGh0dHBzOi8vZG9jcy5uYXRpdmVzY3JpcHQub3JnL2NvcmUtY29uY2VwdHMvZGF0YS1iaW5kaW5nLlxuICAgICovXG4gICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBtYWluX3ZpZXdfbW9kZWxfMS5IZWxsb1dvcmxkTW9kZWwoKTtcbn1cbmV4cG9ydHMubmF2aWdhdGluZ1RvID0gbmF2aWdhdGluZ1RvO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYldGcGJpMXdZV2RsTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhNaU9sc2liV0ZwYmkxd1lXZGxMblJ6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGQlFUczdPenRGUVVsRk96dEJRVWxHTEhGRVFVRnZSRHRCUVVWd1JDeDNSVUZCZDBVN1FVRkRlRVVzVTBGQlowSXNXVUZCV1N4RFFVRkRMRWxCUVdVN1NVRkRlRU03T3pzN1RVRkpSVHRKUVVOR0xFbEJRVTBzU1VGQlNTeEhRVUZUTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1NVRkZMMEk3T3pzN096czdPenROUVZORk8wbEJRMFlzU1VGQlNTeERRVUZETEdOQlFXTXNSMEZCUnl4SlFVRkpMR2xEUVVGbExFVkJRVVVzUTBGQlF6dEJRVU5vUkN4RFFVRkRPMEZCYmtKRUxHOURRVzFDUXlJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYklpOHFYRzVKYmlCT1lYUnBkbVZUWTNKcGNIUXNJR0VnWm1sc1pTQjNhWFJvSUhSb1pTQnpZVzFsSUc1aGJXVWdZWE1nWVc0Z1dFMU1JR1pwYkdVZ2FYTWdhMjV2ZDI0Z1lYTmNibUVnWTI5a1pTMWlaV2hwYm1RZ1ptbHNaUzRnVkdobElHTnZaR1V0WW1Wb2FXNWtJR2x6SUdFZ1ozSmxZWFFnY0d4aFkyVWdkRzhnY0d4aFkyVWdlVzkxY2lCMmFXVjNYRzVzYjJkcFl5d2dZVzVrSUhSdklITmxkQ0IxY0NCNWIzVnlJSEJoWjJYaWdKbHpJR1JoZEdFZ1ltbHVaR2x1Wnk1Y2Jpb3ZYRzVjYm1sdGNHOXlkQ0I3SUVWMlpXNTBSR0YwWVNCOUlHWnliMjBnWENKMGJuTXRZMjl5WlMxdGIyUjFiR1Z6TDJSaGRHRXZiMkp6WlhKMllXSnNaVndpTzF4dWFXMXdiM0owSUhzZ1VHRm5aU0I5SUdaeWIyMGdYQ0owYm5NdFkyOXlaUzF0YjJSMWJHVnpMM1ZwTDNCaFoyVmNJanRjYm1sdGNHOXlkQ0I3SUVobGJHeHZWMjl5YkdSTmIyUmxiQ0I5SUdaeWIyMGdYQ0l1TDIxaGFXNHRkbWxsZHkxdGIyUmxiRndpTzF4dVhHNHZMeUJGZG1WdWRDQm9ZVzVrYkdWeUlHWnZjaUJRWVdkbElGd2libUYyYVdkaGRHbHVaMVJ2WENJZ1pYWmxiblFnWVhSMFlXTm9aV1FnYVc0Z2JXRnBiaTF3WVdkbExuaHRiRnh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJRzVoZG1sbllYUnBibWRVYnloaGNtZHpPaUJGZG1WdWRFUmhkR0VwSUh0Y2JpQWdJQ0F2S2x4dUlDQWdJRlJvYVhNZ1oyVjBjeUJoSUhKbFptVnlaVzVqWlNCMGFHbHpJSEJoWjJYaWdKbHpJRHhRWVdkbFBpQlZTU0JqYjIxd2IyNWxiblF1SUZsdmRTQmpZVzVjYmlBZ0lDQjJhV1YzSUhSb1pTQkJVRWtnY21WbVpYSmxibU5sSUc5bUlIUm9aU0JRWVdkbElIUnZJSE5sWlNCM2FHRjA0b0NaY3lCaGRtRnBiR0ZpYkdVZ1lYUmNiaUFnSUNCb2RIUndjem92TDJSdlkzTXVibUYwYVhabGMyTnlhWEIwTG05eVp5OWhjR2t0Y21WbVpYSmxibU5sTDJOc1lYTnpaWE12WDNWcFgzQmhaMlZmTG5CaFoyVXVhSFJ0YkZ4dUlDQWdJQ292WEc0Z0lDQWdZMjl1YzNRZ2NHRm5aU0E5SUR4UVlXZGxQbUZ5WjNNdWIySnFaV04wTzF4dVhHNGdJQ0FnTHlwY2JpQWdJQ0JCSUhCaFoyWGlnSmx6SUdKcGJtUnBibWREYjI1MFpYaDBJR2x6SUdGdUlHOWlhbVZqZENCMGFHRjBJSE5vYjNWc1pDQmlaU0IxYzJWa0lIUnZJSEJsY21admNtMWNiaUFnSUNCa1lYUmhJR0pwYm1ScGJtY2dZbVYwZDJWbGJpQllUVXdnYldGeWEzVndJR0Z1WkNCVWVYQmxVMk55YVhCMElHTnZaR1V1SUZCeWIzQmxjblJwWlhOY2JpQWdJQ0J2YmlCMGFHVWdZbWx1WkdsdVowTnZiblJsZUhRZ1kyRnVJR0psSUdGalkyVnpjMlZrSUhWemFXNW5JSFJvWlNCN2V5QjlmU0J6ZVc1MFlYZ2dhVzRnV0UxTUxseHVJQ0FnSUVsdUlIUm9hWE1nWlhoaGJYQnNaU3dnZEdobElIdDdJRzFsYzNOaFoyVWdmWDBnWVc1a0lIdDdJRzl1VkdGd0lIMTlJR0pwYm1ScGJtZHpJR0Z5WlNCeVpYTnZiSFpsWkZ4dUlDQWdJR0ZuWVdsdWMzUWdkR2hsSUc5aWFtVmpkQ0J5WlhSMWNtNWxaQ0JpZVNCamNtVmhkR1ZXYVdWM1RXOWtaV3dvS1M1Y2JseHVJQ0FnSUZsdmRTQmpZVzRnYkdWaGNtNGdiVzl5WlNCaFltOTFkQ0JrWVhSaElHSnBibVJwYm1jZ2FXNGdUbUYwYVhabFUyTnlhWEIwSUdGMFhHNGdJQ0FnYUhSMGNITTZMeTlrYjJOekxtNWhkR2wyWlhOamNtbHdkQzV2Y21jdlkyOXlaUzFqYjI1alpYQjBjeTlrWVhSaExXSnBibVJwYm1jdVhHNGdJQ0FnS2k5Y2JpQWdJQ0J3WVdkbExtSnBibVJwYm1kRGIyNTBaWGgwSUQwZ2JtVjNJRWhsYkd4dlYyOXliR1JOYjJSbGJDZ3BPMXh1ZlZ4dUlsMTkiLCIvKlxuSW4gTmF0aXZlU2NyaXB0LCBhIGZpbGUgd2l0aCB0aGUgc2FtZSBuYW1lIGFzIGFuIFhNTCBmaWxlIGlzIGtub3duIGFzXG5hIGNvZGUtYmVoaW5kIGZpbGUuIFRoZSBjb2RlLWJlaGluZCBpcyBhIGdyZWF0IHBsYWNlIHRvIHBsYWNlIHlvdXIgdmlld1xubG9naWMsIGFuZCB0byBzZXQgdXAgeW91ciBwYWdl4oCZcyBkYXRhIGJpbmRpbmcuXG4qL1xuXG5pbXBvcnQgeyBFdmVudERhdGEgfSBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9kYXRhL29ic2VydmFibGVcIjtcbmltcG9ydCB7IFBhZ2UgfSBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9wYWdlXCI7XG5pbXBvcnQgeyBIZWxsb1dvcmxkTW9kZWwgfSBmcm9tIFwiLi9tYWluLXZpZXctbW9kZWxcIjtcblxuLy8gRXZlbnQgaGFuZGxlciBmb3IgUGFnZSBcIm5hdmlnYXRpbmdUb1wiIGV2ZW50IGF0dGFjaGVkIGluIG1haW4tcGFnZS54bWxcbmV4cG9ydCBmdW5jdGlvbiBuYXZpZ2F0aW5nVG8oYXJnczogRXZlbnREYXRhKSB7XG4gICAgLypcbiAgICBUaGlzIGdldHMgYSByZWZlcmVuY2UgdGhpcyBwYWdl4oCZcyA8UGFnZT4gVUkgY29tcG9uZW50LiBZb3UgY2FuXG4gICAgdmlldyB0aGUgQVBJIHJlZmVyZW5jZSBvZiB0aGUgUGFnZSB0byBzZWUgd2hhdOKAmXMgYXZhaWxhYmxlIGF0XG4gICAgaHR0cHM6Ly9kb2NzLm5hdGl2ZXNjcmlwdC5vcmcvYXBpLXJlZmVyZW5jZS9jbGFzc2VzL191aV9wYWdlXy5wYWdlLmh0bWxcbiAgICAqL1xuICAgIGNvbnN0IHBhZ2UgPSA8UGFnZT5hcmdzLm9iamVjdDtcblxuICAgIC8qXG4gICAgQSBwYWdl4oCZcyBiaW5kaW5nQ29udGV4dCBpcyBhbiBvYmplY3QgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBwZXJmb3JtXG4gICAgZGF0YSBiaW5kaW5nIGJldHdlZW4gWE1MIG1hcmt1cCBhbmQgVHlwZVNjcmlwdCBjb2RlLiBQcm9wZXJ0aWVzXG4gICAgb24gdGhlIGJpbmRpbmdDb250ZXh0IGNhbiBiZSBhY2Nlc3NlZCB1c2luZyB0aGUge3sgfX0gc3ludGF4IGluIFhNTC5cbiAgICBJbiB0aGlzIGV4YW1wbGUsIHRoZSB7eyBtZXNzYWdlIH19IGFuZCB7eyBvblRhcCB9fSBiaW5kaW5ncyBhcmUgcmVzb2x2ZWRcbiAgICBhZ2FpbnN0IHRoZSBvYmplY3QgcmV0dXJuZWQgYnkgY3JlYXRlVmlld01vZGVsKCkuXG5cbiAgICBZb3UgY2FuIGxlYXJuIG1vcmUgYWJvdXQgZGF0YSBiaW5kaW5nIGluIE5hdGl2ZVNjcmlwdCBhdFxuICAgIGh0dHBzOi8vZG9jcy5uYXRpdmVzY3JpcHQub3JnL2NvcmUtY29uY2VwdHMvZGF0YS1iaW5kaW5nLlxuICAgICovXG4gICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBIZWxsb1dvcmxkTW9kZWwoKTtcbn1cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBcIjwhLS1cXG5UaGUgbWFya3VwIGluIE5hdGl2ZVNjcmlwdCBhcHBzIGNvbnRhaW5zIGEgc2VyaWVzIG9mIHVzZXIgaW50ZXJmYWNlIGNvbXBvbmVudHMsIGVhY2hcXG5vZiB3aGljaCBOYXRpdmVTY3JpcHQgcmVuZGVycyB3aXRoIGEgcGxhdGZvcm0tc3BlY2lmaWMgaU9TIG9yIEFuZHJvaWQgbmF0aXZlIGNvbnRyb2wuXFxuWW91IGNhbiBmaW5kIGEgZnVsbCBsaXN0IG9mIHVzZXIgaW50ZXJmYWNlIGNvbXBvbmVudHMgeW91IGNhbiB1c2UgaW4geW91ciBhcHAgYXRcXG5odHRwczovL2RvY3MubmF0aXZlc2NyaXB0Lm9yZy91aS9jb21wb25lbnRzLlxcbi0tPlxcbjxQYWdlIHhtbG5zPVxcXCJodHRwOi8vc2NoZW1hcy5uYXRpdmVzY3JpcHQub3JnL3Rucy54c2RcXFwiIG5hdmlnYXRpbmdUbz1cXFwibmF2aWdhdGluZ1RvXFxcIiBjbGFzcz1cXFwicGFnZVxcXCI+XFxuICAgIDwhLS1cXG4gICAgVGhlIEFjdGlvbkJhciBpcyB0aGUgTmF0aXZlU2NyaXB0IGNvbW1vbiBhYnN0cmFjdGlvbiBvdmVyIHRoZSBBbmRyb2lkIEFjdGlvbkJhciBhbmQgaU9TIE5hdmlnYXRpb25CYXIuXFxuICAgIGh0dHA6Ly9kb2NzLm5hdGl2ZXNjcmlwdC5vcmcvdWkvYWN0aW9uLWJhclxcbiAgICAtLT5cXG4gICAgPFBhZ2UuYWN0aW9uQmFyPlxcbiAgICAgICAgPEFjdGlvbkJhciB0aXRsZT1cXFwiTXkgQXBwXFxcIiBpY29uPVxcXCJcXFwiIGNsYXNzPVxcXCJhY3Rpb24tYmFyXFxcIj5cXG4gICAgICAgIDwvQWN0aW9uQmFyPlxcbiAgICA8L1BhZ2UuYWN0aW9uQmFyPlxcbiAgICA8IS0tXFxuICAgIFRoZSBTdGFja0xheW91dCBzdGFja3MgVUkgY29tcG9uZW50cyBvbiB0aGUgc2NyZWVu4oCUZWl0aGVyIHZlcnRpY2FsbHkgb3IgaG9yaXpvbnRhbGx5LlxcbiAgICBJbiB0aGlzIGNhc2UsIHRoZSBTdGFja0xheW91dCBkb2VzIHZlcnRpY2FsIHN0YWNraW5nOyB5b3UgY2FuIGNoYW5nZSB0aGUgc3RhY2tpbmcgdG9cXG4gICAgaG9yaXpvbnRhbCBieSBhcHBseWluZyBhIG9yaWVudGF0aW9uPVxcXCJob3Jpem9udGFsXFxcIiBhdHRyaWJ1dGUgdG8gdGhlIDxTdGFja0xheW91dD4gZWxlbWVudC5cXG4gICAgWW91IGNhbiBsZWFybiBtb3JlIGFib3V0IE5hdGl2ZVNjcmlwdCBsYXlvdXRzIGF0XFxuICAgIGh0dHBzOi8vZG9jcy5uYXRpdmVzY3JpcHQub3JnL3VpL2xheW91dC1jb250YWluZXJzLlxcblxcbiAgICBUaGVzZSBjb21wb25lbnRzIG1ha2UgdXNlIG9mIHNldmVyYWwgQ1NTIGNsYXNzIG5hbWVzIHRoYXQgYXJlIHBhcnQgb2YgdGhlIE5hdGl2ZVNjcmlwdFxcbiAgICBjb3JlIHRoZW1lLCBzdWNoIGFzIHAtMjAsIGJ0biwgaDIsIGFuZCB0ZXh0LWNlbnRlci4gWW91IGNhbiB2aWV3IGEgZnVsbCBsaXN0IG9mIHRoZVxcbiAgICBjbGFzcyBuYW1lcyBhdmFpbGFibGUgZm9yIHN0eWxpbmcgeW91ciBhcHAgYXQgaHR0cHM6Ly9kb2NzLm5hdGl2ZXNjcmlwdC5vcmcvdWkvdGhlbWUuXFxuICAgIC0tPlxcbiAgICA8U3RhY2tMYXlvdXQgY2xhc3M9XFxcInAtMjBcXFwiPlxcbiAgICAgICAgPExhYmVsIHRleHQ9XFxcIlRhcCB0aGUgYnV0dG9uXFxcIiBjbGFzcz1cXFwiaDEgdGV4dC1jZW50ZXJcXFwiLz5cXG4gICAgICAgIDxCdXR0b24gdGV4dD1cXFwiVEFQXFxcIiB0YXA9XFxcInt7IG9uVGFwIH19XFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1hY3RpdmVcXFwiLz5cXG4gICAgICAgIDxMYWJlbCB0ZXh0PVxcXCJ7eyBtZXNzYWdlIH19XFxcIiBjbGFzcz1cXFwiaDIgdGV4dC1jZW50ZXJcXFwiIHRleHRXcmFwPVxcXCJ0cnVlXFxcIi8+XFxuICAgIDwvU3RhY2tMYXlvdXQ+XFxuPC9QYWdlPlxcblwiO1xuICAgIGlmIChtb2R1bGUuaG90KSB7XG4gICAgICAgIG1vZHVsZS5ob3QuYWNjZXB0KCk7XG4gICAgICAgIG1vZHVsZS5ob3QuZGlzcG9zZSgoKSA9PiB7XG4gICAgICAgICAgICBnbG9iYWwuaG1yUmVmcmVzaCh7IHR5cGU6ICdtYXJrdXAnLCBwYXRoOiAnLi9tYWluLXBhZ2UueG1sJyB9KTtcbiAgICAgICAgfSlcbiAgICB9XG4iLCJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvZGF0YS9vYnNlcnZhYmxlXCI7XG5cbmV4cG9ydCBjbGFzcyBIZWxsb1dvcmxkTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcblxuICAgIHByaXZhdGUgX2NvdW50ZXI6IG51bWJlcjtcbiAgICBwcml2YXRlIF9tZXNzYWdlOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIGRlZmF1bHQgdmFsdWVzLlxuICAgICAgICB0aGlzLl9jb3VudGVyID0gNDI7XG4gICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZSgpO1xuICAgIH1cblxuICAgIGdldCBtZXNzYWdlKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tZXNzYWdlO1xuICAgIH1cblxuICAgIHNldCBtZXNzYWdlKHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuX21lc3NhZ2UgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9tZXNzYWdlID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLm5vdGlmeVByb3BlcnR5Q2hhbmdlKFwibWVzc2FnZVwiLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvblRhcCgpIHtcbiAgICAgICAgdGhpcy5fY291bnRlci0tO1xuICAgICAgICBjb25zb2xlLmxvZyhcIlRlc3QuXCIpO1xuICAgICAgICBjb25zb2xlLnRyYWNlKFwiVGVzdFwiKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGVzdFwiKVxuICAgICAgICB0aGlzLnVwZGF0ZU1lc3NhZ2UoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZU1lc3NhZ2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb3VudGVyIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IFwiSG9vcnJhYWF5ISBZb3UgdW5sb2NrZWQgdGhlIE5hdGl2ZVNjcmlwdCBjbGlja2VyIGFjaGlldmVtZW50IVwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gYCR7dGhpcy5fY291bnRlcn0gdGFwcyBsZWZ0YDtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0=