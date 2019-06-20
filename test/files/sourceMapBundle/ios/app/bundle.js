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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLiBzeW5jIG5vbnJlY3Vyc2l2ZSBeXFwuXFwvYXBwXFwuKGNzc3xzY3NzfGxlc3N8c2FzcykkIiwid2VicGFjazovLy8uIHN5bmMgKHJvb3R8cGFnZSlcXC4oeG1sfGNzc3xqc3x0c3xzY3NzKSQiLCJ3ZWJwYWNrOi8vLy4vYXBwLXJvb3QueG1sIiwid2VicGFjazovLy8uL2FwcC5jc3MiLCJ3ZWJwYWNrOi8vLy4vYXBwLnRzIiwid2VicGFjazovLy8uL21haW4tcGFnZS5qcyIsIndlYnBhY2s6Ly8vLi9tYWluLXBhZ2UudHMiLCJ3ZWJwYWNrOi8vLy4vbWFpbi1wYWdlLnhtbCIsIndlYnBhY2s6Ly8vLi9tYWluLXZpZXctbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFOzs7Ozs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0RTs7Ozs7Ozs7QUN6QkE7QUFDQSxRQUFRLElBQVU7QUFDbEI7QUFDQTtBQUNBLCtCQUErQix5Q0FBeUM7QUFDeEUsU0FBUztBQUNUOzs7Ozs7Ozs7QUNQQSx5RUFBMkIsbUJBQU8sQ0FBQyxnREFBZ0Q7QUFDbkY7QUFDQSxVQUFVLG1CQUFPLENBQUMsb0dBQTZGOztBQUUvRztBQUNBLGNBQWMsUUFBUyw2b0JBQTZvQixvQkFBb0IsR0FBRzs7QUFFM3JCO0FBQ0EsUUFBUSxJQUFVO0FBQ2xCO0FBQ0E7QUFDQSwrQkFBK0IsbUNBQW1DO0FBQ2xFLFNBQVM7QUFDVDs7Ozs7Ozs7OztBQ2JBO0FBQUE7QUFBQTtBQUFBOzs7O0VBSUU7QUFFRixPQUFPLEtBQUssV0FBVyxNQUFNLDRFQUErQjtBQUU1RCxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFFNUM7OztFQUdFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNiVztBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RCx3QkFBd0IsbUJBQU8sQ0FBQyxzQkFBbUI7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxHQUFHO0FBQ3pELDJCQUEyQixXQUFXLE9BQU8sU0FBUztBQUN0RDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsdXFFOzs7Ozs7OztBQzdCM0M7QUFBQTtBQUFBO0FBQUE7Ozs7RUFJRTtBQUlrRDtBQUVwRCx3RUFBd0U7QUFDakUsU0FBUyxZQUFZLENBQUMsSUFBZTtJQUN4Qzs7OztNQUlFO0lBQ0YsSUFBTSxJQUFJLEdBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUUvQjs7Ozs7Ozs7O01BU0U7SUFDRixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksZ0VBQWUsRUFBRSxDQUFDO0FBQ2hELENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDN0JELHM0QkFBczRCLHNwQkFBc3BCLFNBQVMsbUVBQW1FLFdBQVc7QUFDbm5ELFFBQVEsSUFBVTtBQUNsQjtBQUNBO0FBQ0EsK0JBQStCLDBDQUEwQztBQUN6RSxTQUFTO0FBQ1Q7Ozs7Ozs7Ozs7QUNQQTtBQUFBO0FBQUE7QUFBQTtBQUE4RDtBQUU5RDtJQUFxQyxtQ0FBVTtJQUszQztRQUFBLFlBQ0ksaUJBQU8sU0FLVjtRQUhHLDZCQUE2QjtRQUM3QixLQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNuQixLQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7O0lBQ3pCLENBQUM7SUFFRCxzQkFBSSxvQ0FBTzthQUFYO1lBQ0ksT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3pCLENBQUM7YUFFRCxVQUFZLEtBQWE7WUFDckIsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLEtBQUssRUFBRTtnQkFDekIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDL0M7UUFDTCxDQUFDOzs7T0FQQTtJQVNELCtCQUFLLEdBQUw7UUFDSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQixPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBRU8sdUNBQWEsR0FBckI7UUFDSSxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxFQUFFO1lBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsK0RBQStELENBQUM7U0FDbEY7YUFBTTtZQUNILElBQUksQ0FBQyxPQUFPLEdBQU0sSUFBSSxDQUFDLFFBQVEsZUFBWSxDQUFDO1NBQy9DO0lBQ0wsQ0FBQztJQUNMLHNCQUFDO0FBQUQsQ0FBQyxDQXZDb0MsMkVBQVUsR0F1QzlDIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBtYXAgPSB7XG5cdFwiLi9hcHAuY3NzXCI6IFwiLi9hcHAuY3NzXCJcbn07XG5cblxuZnVuY3Rpb24gd2VicGFja0NvbnRleHQocmVxKSB7XG5cdHZhciBpZCA9IHdlYnBhY2tDb250ZXh0UmVzb2x2ZShyZXEpO1xuXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhpZCk7XG59XG5mdW5jdGlvbiB3ZWJwYWNrQ29udGV4dFJlc29sdmUocmVxKSB7XG5cdHZhciBpZCA9IG1hcFtyZXFdO1xuXHRpZighKGlkICsgMSkpIHsgLy8gY2hlY2sgZm9yIG51bWJlciBvciBzdHJpbmdcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyByZXEgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0cmV0dXJuIGlkO1xufVxud2VicGFja0NvbnRleHQua2V5cyA9IGZ1bmN0aW9uIHdlYnBhY2tDb250ZXh0S2V5cygpIHtcblx0cmV0dXJuIE9iamVjdC5rZXlzKG1hcCk7XG59O1xud2VicGFja0NvbnRleHQucmVzb2x2ZSA9IHdlYnBhY2tDb250ZXh0UmVzb2x2ZTtcbm1vZHVsZS5leHBvcnRzID0gd2VicGFja0NvbnRleHQ7XG53ZWJwYWNrQ29udGV4dC5pZCA9IFwiLi8gc3luYyBeXFxcXC5cXFxcL2FwcFxcXFwuKGNzc3xzY3NzfGxlc3N8c2FzcykkXCI7IiwidmFyIG1hcCA9IHtcblx0XCIuL2FwcC1yb290LnhtbFwiOiBcIi4vYXBwLXJvb3QueG1sXCIsXG5cdFwiLi9tYWluLXBhZ2UuanNcIjogXCIuL21haW4tcGFnZS5qc1wiLFxuXHRcIi4vbWFpbi1wYWdlLnRzXCI6IFwiLi9tYWluLXBhZ2UudHNcIixcblx0XCIuL21haW4tcGFnZS54bWxcIjogXCIuL21haW4tcGFnZS54bWxcIlxufTtcblxuXG5mdW5jdGlvbiB3ZWJwYWNrQ29udGV4dChyZXEpIHtcblx0dmFyIGlkID0gd2VicGFja0NvbnRleHRSZXNvbHZlKHJlcSk7XG5cdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKGlkKTtcbn1cbmZ1bmN0aW9uIHdlYnBhY2tDb250ZXh0UmVzb2x2ZShyZXEpIHtcblx0dmFyIGlkID0gbWFwW3JlcV07XG5cdGlmKCEoaWQgKyAxKSkgeyAvLyBjaGVjayBmb3IgbnVtYmVyIG9yIHN0cmluZ1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIHJlcSArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRyZXR1cm4gaWQ7XG59XG53ZWJwYWNrQ29udGV4dC5rZXlzID0gZnVuY3Rpb24gd2VicGFja0NvbnRleHRLZXlzKCkge1xuXHRyZXR1cm4gT2JqZWN0LmtleXMobWFwKTtcbn07XG53ZWJwYWNrQ29udGV4dC5yZXNvbHZlID0gd2VicGFja0NvbnRleHRSZXNvbHZlO1xubW9kdWxlLmV4cG9ydHMgPSB3ZWJwYWNrQ29udGV4dDtcbndlYnBhY2tDb250ZXh0LmlkID0gXCIuLyBzeW5jIHJlY3Vyc2l2ZSAocm9vdHxwYWdlKVxcXFwuKHhtbHxjc3N8anN8dHN8c2NzcykkXCI7IiwiXG5tb2R1bGUuZXhwb3J0cyA9IFwiPEZyYW1lIGRlZmF1bHRQYWdlPVxcXCJtYWluLXBhZ2VcXFwiPlxcbjwvRnJhbWU+XFxuXCI7XG4gICAgaWYgKG1vZHVsZS5ob3QpIHtcbiAgICAgICAgbW9kdWxlLmhvdC5hY2NlcHQoKTtcbiAgICAgICAgbW9kdWxlLmhvdC5kaXNwb3NlKCgpID0+IHtcbiAgICAgICAgICAgIGdsb2JhbC5obXJSZWZyZXNoKHsgdHlwZTogJ21hcmt1cCcsIHBhdGg6ICcuL2FwcC1yb290LnhtbCcgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIikoZmFsc2UpO1xuLy8gSW1wb3J0c1xuZXhwb3J0cy5pKHJlcXVpcmUoXCItIS4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzPz9yZWYtLTkhbmF0aXZlc2NyaXB0LXRoZW1lLWNvcmUvY3NzL2NvcmUubGlnaHQuY3NzXCIpLCBcIlwiKTtcblxuLy8gTW9kdWxlXG5leHBvcnRzLnB1c2goW21vZHVsZS5pZCwgXCIvKlxcbkluIE5hdGl2ZVNjcmlwdCwgdGhlIGFwcC5jc3MgZmlsZSBpcyB3aGVyZSB5b3UgcGxhY2UgQ1NTIHJ1bGVzIHRoYXRcXG55b3Ugd291bGQgbGlrZSB0byBhcHBseSB0byB5b3VyIGVudGlyZSBhcHBsaWNhdGlvbi4gQ2hlY2sgb3V0XFxuaHR0cDovL2RvY3MubmF0aXZlc2NyaXB0Lm9yZy91aS9zdHlsaW5nIGZvciBhIGZ1bGwgbGlzdCBvZiB0aGUgQ1NTXFxuc2VsZWN0b3JzIGFuZCBwcm9wZXJ0aWVzIHlvdSBjYW4gdXNlIHRvIHN0eWxlIFVJIGNvbXBvbmVudHMuXFxuXFxuLypcXG5JbiBtYW55IGNhc2VzIHlvdSBtYXkgd2FudCB0byB1c2UgdGhlIE5hdGl2ZVNjcmlwdCBjb3JlIHRoZW1lIGluc3RlYWRcXG5vZiB3cml0aW5nIHlvdXIgb3duIENTUyBydWxlcy4gRm9yIGEgZnVsbCBsaXN0IG9mIGNsYXNzIG5hbWVzIGluIHRoZSB0aGVtZVxcbnJlZmVyIHRvIGh0dHA6Ly9kb2NzLm5hdGl2ZXNjcmlwdC5vcmcvdWkvdGhlbWUuIFxcblRoZSBpbXBvcnRlZCBDU1MgcnVsZXMgbXVzdCBwcmVjZWRlIGFsbCBvdGhlciB0eXBlcyBvZiBydWxlcy5cXG4qL1xcblxcbi8qXFxuVGhlIGZvbGxvd2luZyBDU1MgcnVsZSBjaGFuZ2VzIHRoZSBmb250IHNpemUgb2YgYWxsIFVJXFxuY29tcG9uZW50cyB0aGF0IGhhdmUgdGhlIGJ0biBjbGFzcyBuYW1lLlxcbiovXFxuLmJ0biB7XFxuICAgIGZvbnQtc2l6ZTogMTg7XFxufVxcblwiLCBcIlwiXSk7XG5cbjtcbiAgICBpZiAobW9kdWxlLmhvdCkge1xuICAgICAgICBtb2R1bGUuaG90LmFjY2VwdCgpO1xuICAgICAgICBtb2R1bGUuaG90LmRpc3Bvc2UoKCkgPT4ge1xuICAgICAgICAgICAgZ2xvYmFsLmhtclJlZnJlc2goeyB0eXBlOiAnc3R5bGUnLCBwYXRoOiAnLi9hcHAuY3NzJyB9KTtcbiAgICAgICAgfSlcbiAgICB9XG4iLCIvKlxuSW4gTmF0aXZlU2NyaXB0LCB0aGUgYXBwLnRzIGZpbGUgaXMgdGhlIGVudHJ5IHBvaW50IHRvIHlvdXIgYXBwbGljYXRpb24uXG5Zb3UgY2FuIHVzZSB0aGlzIGZpbGUgdG8gcGVyZm9ybSBhcHAtbGV2ZWwgaW5pdGlhbGl6YXRpb24sIGJ1dCB0aGUgcHJpbWFyeVxucHVycG9zZSBvZiB0aGUgZmlsZSBpcyB0byBwYXNzIGNvbnRyb2wgdG8gdGhlIGFwcOKAmXMgZmlyc3QgbW9kdWxlLlxuKi9cblxuaW1wb3J0ICogYXMgYXBwbGljYXRpb24gZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvYXBwbGljYXRpb25cIjtcblxuYXBwbGljYXRpb24ucnVuKHsgbW9kdWxlTmFtZTogXCJhcHAtcm9vdFwiIH0pO1xuXG4vKlxuRG8gbm90IHBsYWNlIGFueSBjb2RlIGFmdGVyIHRoZSBhcHBsaWNhdGlvbiBoYXMgYmVlbiBzdGFydGVkIGFzIGl0IHdpbGwgbm90XG5iZSBleGVjdXRlZCBvbiBpT1MuXG4qL1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKlxuSW4gTmF0aXZlU2NyaXB0LCBhIGZpbGUgd2l0aCB0aGUgc2FtZSBuYW1lIGFzIGFuIFhNTCBmaWxlIGlzIGtub3duIGFzXG5hIGNvZGUtYmVoaW5kIGZpbGUuIFRoZSBjb2RlLWJlaGluZCBpcyBhIGdyZWF0IHBsYWNlIHRvIHBsYWNlIHlvdXIgdmlld1xubG9naWMsIGFuZCB0byBzZXQgdXAgeW91ciBwYWdl4oCZcyBkYXRhIGJpbmRpbmcuXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIG1haW5fdmlld19tb2RlbF8xID0gcmVxdWlyZShcIi4vbWFpbi12aWV3LW1vZGVsXCIpO1xuLy8gRXZlbnQgaGFuZGxlciBmb3IgUGFnZSBcIm5hdmlnYXRpbmdUb1wiIGV2ZW50IGF0dGFjaGVkIGluIG1haW4tcGFnZS54bWxcbmZ1bmN0aW9uIG5hdmlnYXRpbmdUbyhhcmdzKSB7XG4gICAgLypcbiAgICBUaGlzIGdldHMgYSByZWZlcmVuY2UgdGhpcyBwYWdl4oCZcyA8UGFnZT4gVUkgY29tcG9uZW50LiBZb3UgY2FuXG4gICAgdmlldyB0aGUgQVBJIHJlZmVyZW5jZSBvZiB0aGUgUGFnZSB0byBzZWUgd2hhdOKAmXMgYXZhaWxhYmxlIGF0XG4gICAgaHR0cHM6Ly9kb2NzLm5hdGl2ZXNjcmlwdC5vcmcvYXBpLXJlZmVyZW5jZS9jbGFzc2VzL191aV9wYWdlXy5wYWdlLmh0bWxcbiAgICAqL1xuICAgIHZhciBwYWdlID0gYXJncy5vYmplY3Q7XG4gICAgLypcbiAgICBBIHBhZ2XigJlzIGJpbmRpbmdDb250ZXh0IGlzIGFuIG9iamVjdCB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIHBlcmZvcm1cbiAgICBkYXRhIGJpbmRpbmcgYmV0d2VlbiBYTUwgbWFya3VwIGFuZCBUeXBlU2NyaXB0IGNvZGUuIFByb3BlcnRpZXNcbiAgICBvbiB0aGUgYmluZGluZ0NvbnRleHQgY2FuIGJlIGFjY2Vzc2VkIHVzaW5nIHRoZSB7eyB9fSBzeW50YXggaW4gWE1MLlxuICAgIEluIHRoaXMgZXhhbXBsZSwgdGhlIHt7IG1lc3NhZ2UgfX0gYW5kIHt7IG9uVGFwIH19IGJpbmRpbmdzIGFyZSByZXNvbHZlZFxuICAgIGFnYWluc3QgdGhlIG9iamVjdCByZXR1cm5lZCBieSBjcmVhdGVWaWV3TW9kZWwoKS5cblxuICAgIFlvdSBjYW4gbGVhcm4gbW9yZSBhYm91dCBkYXRhIGJpbmRpbmcgaW4gTmF0aXZlU2NyaXB0IGF0XG4gICAgaHR0cHM6Ly9kb2NzLm5hdGl2ZXNjcmlwdC5vcmcvY29yZS1jb25jZXB0cy9kYXRhLWJpbmRpbmcuXG4gICAgKi9cbiAgICBwYWdlLmJpbmRpbmdDb250ZXh0ID0gbmV3IG1haW5fdmlld19tb2RlbF8xLkhlbGxvV29ybGRNb2RlbCgpO1xufVxuZXhwb3J0cy5uYXZpZ2F0aW5nVG8gPSBuYXZpZ2F0aW5nVG87XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2liV0ZwYmkxd1lXZGxMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaWJXRnBiaTF3WVdkbExuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVRzN096dEZRVWxGT3p0QlFVbEdMSEZFUVVGdlJEdEJRVVZ3UkN4M1JVRkJkMFU3UVVGRGVFVXNVMEZCWjBJc1dVRkJXU3hEUVVGRExFbEJRV1U3U1VGRGVFTTdPenM3VFVGSlJUdEpRVU5HTEVsQlFVMHNTVUZCU1N4SFFVRlRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03U1VGRkwwSTdPenM3T3pzN096dE5RVk5GTzBsQlEwWXNTVUZCU1N4RFFVRkRMR05CUVdNc1IwRkJSeXhKUVVGSkxHbERRVUZsTEVWQlFVVXNRMEZCUXp0QlFVTm9SQ3hEUVVGRE8wRkJia0pFTEc5RFFXMUNReUlzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSWk4cVhHNUpiaUJPWVhScGRtVlRZM0pwY0hRc0lHRWdabWxzWlNCM2FYUm9JSFJvWlNCellXMWxJRzVoYldVZ1lYTWdZVzRnV0UxTUlHWnBiR1VnYVhNZ2EyNXZkMjRnWVhOY2JtRWdZMjlrWlMxaVpXaHBibVFnWm1sc1pTNGdWR2hsSUdOdlpHVXRZbVZvYVc1a0lHbHpJR0VnWjNKbFlYUWdjR3hoWTJVZ2RHOGdjR3hoWTJVZ2VXOTFjaUIyYVdWM1hHNXNiMmRwWXl3Z1lXNWtJSFJ2SUhObGRDQjFjQ0I1YjNWeUlIQmhaMlhpZ0pseklHUmhkR0VnWW1sdVpHbHVaeTVjYmlvdlhHNWNibWx0Y0c5eWRDQjdJRVYyWlc1MFJHRjBZU0I5SUdaeWIyMGdYQ0owYm5NdFkyOXlaUzF0YjJSMWJHVnpMMlJoZEdFdmIySnpaWEoyWVdKc1pWd2lPMXh1YVcxd2IzSjBJSHNnVUdGblpTQjlJR1p5YjIwZ1hDSjBibk10WTI5eVpTMXRiMlIxYkdWekwzVnBMM0JoWjJWY0lqdGNibWx0Y0c5eWRDQjdJRWhsYkd4dlYyOXliR1JOYjJSbGJDQjlJR1p5YjIwZ1hDSXVMMjFoYVc0dGRtbGxkeTF0YjJSbGJGd2lPMXh1WEc0dkx5QkZkbVZ1ZENCb1lXNWtiR1Z5SUdadmNpQlFZV2RsSUZ3aWJtRjJhV2RoZEdsdVoxUnZYQ0lnWlhabGJuUWdZWFIwWVdOb1pXUWdhVzRnYldGcGJpMXdZV2RsTG5odGJGeHVaWGh3YjNKMElHWjFibU4wYVc5dUlHNWhkbWxuWVhScGJtZFVieWhoY21kek9pQkZkbVZ1ZEVSaGRHRXBJSHRjYmlBZ0lDQXZLbHh1SUNBZ0lGUm9hWE1nWjJWMGN5QmhJSEpsWm1WeVpXNWpaU0IwYUdseklIQmhaMlhpZ0pseklEeFFZV2RsUGlCVlNTQmpiMjF3YjI1bGJuUXVJRmx2ZFNCallXNWNiaUFnSUNCMmFXVjNJSFJvWlNCQlVFa2djbVZtWlhKbGJtTmxJRzltSUhSb1pTQlFZV2RsSUhSdklITmxaU0IzYUdGMDRvQ1pjeUJoZG1GcGJHRmliR1VnWVhSY2JpQWdJQ0JvZEhSd2N6b3ZMMlJ2WTNNdWJtRjBhWFpsYzJOeWFYQjBMbTl5Wnk5aGNHa3RjbVZtWlhKbGJtTmxMMk5zWVhOelpYTXZYM1ZwWDNCaFoyVmZMbkJoWjJVdWFIUnRiRnh1SUNBZ0lDb3ZYRzRnSUNBZ1kyOXVjM1FnY0dGblpTQTlJRHhRWVdkbFBtRnlaM011YjJKcVpXTjBPMXh1WEc0Z0lDQWdMeXBjYmlBZ0lDQkJJSEJoWjJYaWdKbHpJR0pwYm1ScGJtZERiMjUwWlhoMElHbHpJR0Z1SUc5aWFtVmpkQ0IwYUdGMElITm9iM1ZzWkNCaVpTQjFjMlZrSUhSdklIQmxjbVp2Y20xY2JpQWdJQ0JrWVhSaElHSnBibVJwYm1jZ1ltVjBkMlZsYmlCWVRVd2diV0Z5YTNWd0lHRnVaQ0JVZVhCbFUyTnlhWEIwSUdOdlpHVXVJRkJ5YjNCbGNuUnBaWE5jYmlBZ0lDQnZiaUIwYUdVZ1ltbHVaR2x1WjBOdmJuUmxlSFFnWTJGdUlHSmxJR0ZqWTJWemMyVmtJSFZ6YVc1bklIUm9aU0I3ZXlCOWZTQnplVzUwWVhnZ2FXNGdXRTFNTGx4dUlDQWdJRWx1SUhSb2FYTWdaWGhoYlhCc1pTd2dkR2hsSUh0N0lHMWxjM05oWjJVZ2ZYMGdZVzVrSUh0N0lHOXVWR0Z3SUgxOUlHSnBibVJwYm1keklHRnlaU0J5WlhOdmJIWmxaRnh1SUNBZ0lHRm5ZV2x1YzNRZ2RHaGxJRzlpYW1WamRDQnlaWFIxY201bFpDQmllU0JqY21WaGRHVldhV1YzVFc5a1pXd29LUzVjYmx4dUlDQWdJRmx2ZFNCallXNGdiR1ZoY200Z2JXOXlaU0JoWW05MWRDQmtZWFJoSUdKcGJtUnBibWNnYVc0Z1RtRjBhWFpsVTJOeWFYQjBJR0YwWEc0Z0lDQWdhSFIwY0hNNkx5OWtiMk56TG01aGRHbDJaWE5qY21sd2RDNXZjbWN2WTI5eVpTMWpiMjVqWlhCMGN5OWtZWFJoTFdKcGJtUnBibWN1WEc0Z0lDQWdLaTljYmlBZ0lDQndZV2RsTG1KcGJtUnBibWREYjI1MFpYaDBJRDBnYm1WM0lFaGxiR3h2VjI5eWJHUk5iMlJsYkNncE8xeHVmVnh1SWwxOSIsIi8qXG5JbiBOYXRpdmVTY3JpcHQsIGEgZmlsZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgYW4gWE1MIGZpbGUgaXMga25vd24gYXNcbmEgY29kZS1iZWhpbmQgZmlsZS4gVGhlIGNvZGUtYmVoaW5kIGlzIGEgZ3JlYXQgcGxhY2UgdG8gcGxhY2UgeW91ciB2aWV3XG5sb2dpYywgYW5kIHRvIHNldCB1cCB5b3VyIHBhZ2XigJlzIGRhdGEgYmluZGluZy5cbiovXG5cbmltcG9ydCB7IEV2ZW50RGF0YSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2RhdGEvb2JzZXJ2YWJsZVwiO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL3BhZ2VcIjtcbmltcG9ydCB7IEhlbGxvV29ybGRNb2RlbCB9IGZyb20gXCIuL21haW4tdmlldy1tb2RlbFwiO1xuXG4vLyBFdmVudCBoYW5kbGVyIGZvciBQYWdlIFwibmF2aWdhdGluZ1RvXCIgZXZlbnQgYXR0YWNoZWQgaW4gbWFpbi1wYWdlLnhtbFxuZXhwb3J0IGZ1bmN0aW9uIG5hdmlnYXRpbmdUbyhhcmdzOiBFdmVudERhdGEpIHtcbiAgICAvKlxuICAgIFRoaXMgZ2V0cyBhIHJlZmVyZW5jZSB0aGlzIHBhZ2XigJlzIDxQYWdlPiBVSSBjb21wb25lbnQuIFlvdSBjYW5cbiAgICB2aWV3IHRoZSBBUEkgcmVmZXJlbmNlIG9mIHRoZSBQYWdlIHRvIHNlZSB3aGF04oCZcyBhdmFpbGFibGUgYXRcbiAgICBodHRwczovL2RvY3MubmF0aXZlc2NyaXB0Lm9yZy9hcGktcmVmZXJlbmNlL2NsYXNzZXMvX3VpX3BhZ2VfLnBhZ2UuaHRtbFxuICAgICovXG4gICAgY29uc3QgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuXG4gICAgLypcbiAgICBBIHBhZ2XigJlzIGJpbmRpbmdDb250ZXh0IGlzIGFuIG9iamVjdCB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIHBlcmZvcm1cbiAgICBkYXRhIGJpbmRpbmcgYmV0d2VlbiBYTUwgbWFya3VwIGFuZCBUeXBlU2NyaXB0IGNvZGUuIFByb3BlcnRpZXNcbiAgICBvbiB0aGUgYmluZGluZ0NvbnRleHQgY2FuIGJlIGFjY2Vzc2VkIHVzaW5nIHRoZSB7eyB9fSBzeW50YXggaW4gWE1MLlxuICAgIEluIHRoaXMgZXhhbXBsZSwgdGhlIHt7IG1lc3NhZ2UgfX0gYW5kIHt7IG9uVGFwIH19IGJpbmRpbmdzIGFyZSByZXNvbHZlZFxuICAgIGFnYWluc3QgdGhlIG9iamVjdCByZXR1cm5lZCBieSBjcmVhdGVWaWV3TW9kZWwoKS5cblxuICAgIFlvdSBjYW4gbGVhcm4gbW9yZSBhYm91dCBkYXRhIGJpbmRpbmcgaW4gTmF0aXZlU2NyaXB0IGF0XG4gICAgaHR0cHM6Ly9kb2NzLm5hdGl2ZXNjcmlwdC5vcmcvY29yZS1jb25jZXB0cy9kYXRhLWJpbmRpbmcuXG4gICAgKi9cbiAgICBwYWdlLmJpbmRpbmdDb250ZXh0ID0gbmV3IEhlbGxvV29ybGRNb2RlbCgpO1xufVxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IFwiPCEtLVxcblRoZSBtYXJrdXAgaW4gTmF0aXZlU2NyaXB0IGFwcHMgY29udGFpbnMgYSBzZXJpZXMgb2YgdXNlciBpbnRlcmZhY2UgY29tcG9uZW50cywgZWFjaFxcbm9mIHdoaWNoIE5hdGl2ZVNjcmlwdCByZW5kZXJzIHdpdGggYSBwbGF0Zm9ybS1zcGVjaWZpYyBpT1Mgb3IgQW5kcm9pZCBuYXRpdmUgY29udHJvbC5cXG5Zb3UgY2FuIGZpbmQgYSBmdWxsIGxpc3Qgb2YgdXNlciBpbnRlcmZhY2UgY29tcG9uZW50cyB5b3UgY2FuIHVzZSBpbiB5b3VyIGFwcCBhdFxcbmh0dHBzOi8vZG9jcy5uYXRpdmVzY3JpcHQub3JnL3VpL2NvbXBvbmVudHMuXFxuLS0+XFxuPFBhZ2UgeG1sbnM9XFxcImh0dHA6Ly9zY2hlbWFzLm5hdGl2ZXNjcmlwdC5vcmcvdG5zLnhzZFxcXCIgbmF2aWdhdGluZ1RvPVxcXCJuYXZpZ2F0aW5nVG9cXFwiIGNsYXNzPVxcXCJwYWdlXFxcIj5cXG4gICAgPCEtLVxcbiAgICBUaGUgQWN0aW9uQmFyIGlzIHRoZSBOYXRpdmVTY3JpcHQgY29tbW9uIGFic3RyYWN0aW9uIG92ZXIgdGhlIEFuZHJvaWQgQWN0aW9uQmFyIGFuZCBpT1MgTmF2aWdhdGlvbkJhci5cXG4gICAgaHR0cDovL2RvY3MubmF0aXZlc2NyaXB0Lm9yZy91aS9hY3Rpb24tYmFyXFxuICAgIC0tPlxcbiAgICA8UGFnZS5hY3Rpb25CYXI+XFxuICAgICAgICA8QWN0aW9uQmFyIHRpdGxlPVxcXCJNeSBBcHBcXFwiIGljb249XFxcIlxcXCIgY2xhc3M9XFxcImFjdGlvbi1iYXJcXFwiPlxcbiAgICAgICAgPC9BY3Rpb25CYXI+XFxuICAgIDwvUGFnZS5hY3Rpb25CYXI+XFxuICAgIDwhLS1cXG4gICAgVGhlIFN0YWNrTGF5b3V0IHN0YWNrcyBVSSBjb21wb25lbnRzIG9uIHRoZSBzY3JlZW7igJRlaXRoZXIgdmVydGljYWxseSBvciBob3Jpem9udGFsbHkuXFxuICAgIEluIHRoaXMgY2FzZSwgdGhlIFN0YWNrTGF5b3V0IGRvZXMgdmVydGljYWwgc3RhY2tpbmc7IHlvdSBjYW4gY2hhbmdlIHRoZSBzdGFja2luZyB0b1xcbiAgICBob3Jpem9udGFsIGJ5IGFwcGx5aW5nIGEgb3JpZW50YXRpb249XFxcImhvcml6b250YWxcXFwiIGF0dHJpYnV0ZSB0byB0aGUgPFN0YWNrTGF5b3V0PiBlbGVtZW50LlxcbiAgICBZb3UgY2FuIGxlYXJuIG1vcmUgYWJvdXQgTmF0aXZlU2NyaXB0IGxheW91dHMgYXRcXG4gICAgaHR0cHM6Ly9kb2NzLm5hdGl2ZXNjcmlwdC5vcmcvdWkvbGF5b3V0LWNvbnRhaW5lcnMuXFxuXFxuICAgIFRoZXNlIGNvbXBvbmVudHMgbWFrZSB1c2Ugb2Ygc2V2ZXJhbCBDU1MgY2xhc3MgbmFtZXMgdGhhdCBhcmUgcGFydCBvZiB0aGUgTmF0aXZlU2NyaXB0XFxuICAgIGNvcmUgdGhlbWUsIHN1Y2ggYXMgcC0yMCwgYnRuLCBoMiwgYW5kIHRleHQtY2VudGVyLiBZb3UgY2FuIHZpZXcgYSBmdWxsIGxpc3Qgb2YgdGhlXFxuICAgIGNsYXNzIG5hbWVzIGF2YWlsYWJsZSBmb3Igc3R5bGluZyB5b3VyIGFwcCBhdCBodHRwczovL2RvY3MubmF0aXZlc2NyaXB0Lm9yZy91aS90aGVtZS5cXG4gICAgLS0+XFxuICAgIDxTdGFja0xheW91dCBjbGFzcz1cXFwicC0yMFxcXCI+XFxuICAgICAgICA8TGFiZWwgdGV4dD1cXFwiVGFwIHRoZSBidXR0b25cXFwiIGNsYXNzPVxcXCJoMSB0ZXh0LWNlbnRlclxcXCIvPlxcbiAgICAgICAgPEJ1dHRvbiB0ZXh0PVxcXCJUQVBcXFwiIHRhcD1cXFwie3sgb25UYXAgfX1cXFwiIGNsYXNzPVxcXCJidG4gYnRuLXByaW1hcnkgYnRuLWFjdGl2ZVxcXCIvPlxcbiAgICAgICAgPExhYmVsIHRleHQ9XFxcInt7IG1lc3NhZ2UgfX1cXFwiIGNsYXNzPVxcXCJoMiB0ZXh0LWNlbnRlclxcXCIgdGV4dFdyYXA9XFxcInRydWVcXFwiLz5cXG4gICAgPC9TdGFja0xheW91dD5cXG48L1BhZ2U+XFxuXCI7XG4gICAgaWYgKG1vZHVsZS5ob3QpIHtcbiAgICAgICAgbW9kdWxlLmhvdC5hY2NlcHQoKTtcbiAgICAgICAgbW9kdWxlLmhvdC5kaXNwb3NlKCgpID0+IHtcbiAgICAgICAgICAgIGdsb2JhbC5obXJSZWZyZXNoKHsgdHlwZTogJ21hcmt1cCcsIHBhdGg6ICcuL21haW4tcGFnZS54bWwnIH0pO1xuICAgICAgICB9KVxuICAgIH1cbiIsImltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9kYXRhL29ic2VydmFibGVcIjtcblxuZXhwb3J0IGNsYXNzIEhlbGxvV29ybGRNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgcHJpdmF0ZSBfY291bnRlcjogbnVtYmVyO1xuICAgIHByaXZhdGUgX21lc3NhZ2U6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgZGVmYXVsdCB2YWx1ZXMuXG4gICAgICAgIHRoaXMuX2NvdW50ZXIgPSA0MjtcbiAgICAgICAgdGhpcy51cGRhdGVNZXNzYWdlKCk7XG4gICAgfVxuXG4gICAgZ2V0IG1lc3NhZ2UoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21lc3NhZ2U7XG4gICAgfVxuXG4gICAgc2V0IG1lc3NhZ2UodmFsdWU6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5fbWVzc2FnZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX21lc3NhZ2UgPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMubm90aWZ5UHJvcGVydHlDaGFuZ2UoXCJtZXNzYWdlXCIsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uVGFwKCkge1xuICAgICAgICB0aGlzLl9jb3VudGVyLS07XG4gICAgICAgIGNvbnNvbGUubG9nKFwiVGVzdC5cIik7XG4gICAgICAgIGNvbnNvbGUudHJhY2UoXCJUZXN0XCIpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUZXN0XCIpXG4gICAgICAgIHRoaXMudXBkYXRlTWVzc2FnZSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlTWVzc2FnZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ZXIgPD0gMCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gXCJIb29ycmFhYXkhIFlvdSB1bmxvY2tlZCB0aGUgTmF0aXZlU2NyaXB0IGNsaWNrZXIgYWNoaWV2ZW1lbnQhXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBgJHt0aGlzLl9jb3VudGVyfSB0YXBzIGxlZnRgO1xuICAgICAgICB9XG4gICAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==