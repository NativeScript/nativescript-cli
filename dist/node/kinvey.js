(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Kinvey = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/create"), __esModule: true };
},{"core-js/library/fn/object/create":14}],2:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/define-property"), __esModule: true };
},{"core-js/library/fn/object/define-property":15}],3:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/freeze"), __esModule: true };
},{"core-js/library/fn/object/freeze":16}],4:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/get-own-property-descriptor"), __esModule: true };
},{"core-js/library/fn/object/get-own-property-descriptor":17}],5:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/keys"), __esModule: true };
},{"core-js/library/fn/object/keys":18}],6:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/set-prototype-of"), __esModule: true };
},{"core-js/library/fn/object/set-prototype-of":19}],7:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/promise"), __esModule: true };
},{"core-js/library/fn/promise":20}],8:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/symbol"), __esModule: true };
},{"core-js/library/fn/symbol":21}],9:[function(require,module,exports){
"use strict";

exports["default"] = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

exports.__esModule = true;
},{}],10:[function(require,module,exports){
"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

exports["default"] = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;

      _Object$defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

exports.__esModule = true;
},{"babel-runtime/core-js/object/define-property":2}],11:[function(require,module,exports){
"use strict";

var _Object$getOwnPropertyDescriptor = require("babel-runtime/core-js/object/get-own-property-descriptor")["default"];

exports["default"] = function get(_x, _x2, _x3) {
  var _again = true;

  _function: while (_again) {
    var object = _x,
        property = _x2,
        receiver = _x3;
    _again = false;
    if (object === null) object = Function.prototype;

    var desc = _Object$getOwnPropertyDescriptor(object, property);

    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);

      if (parent === null) {
        return undefined;
      } else {
        _x = parent;
        _x2 = property;
        _x3 = receiver;
        _again = true;
        desc = parent = undefined;
        continue _function;
      }
    } else if ("value" in desc) {
      return desc.value;
    } else {
      var getter = desc.get;

      if (getter === undefined) {
        return undefined;
      }

      return getter.call(receiver);
    }
  }
};

exports.__esModule = true;
},{"babel-runtime/core-js/object/get-own-property-descriptor":4}],12:[function(require,module,exports){
"use strict";

var _Object$create = require("babel-runtime/core-js/object/create")["default"];

var _Object$setPrototypeOf = require("babel-runtime/core-js/object/set-prototype-of")["default"];

exports["default"] = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = _Object$create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _Object$setPrototypeOf ? _Object$setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

exports.__esModule = true;
},{"babel-runtime/core-js/object/create":1,"babel-runtime/core-js/object/set-prototype-of":6}],13:[function(require,module,exports){
"use strict";

exports["default"] = function (obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
};

exports.__esModule = true;
},{}],14:[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function create(P, D){
  return $.create(P, D);
};
},{"../../modules/$":50}],15:[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function defineProperty(it, key, desc){
  return $.setDesc(it, key, desc);
};
},{"../../modules/$":50}],16:[function(require,module,exports){
require('../../modules/es6.object.freeze');
module.exports = require('../../modules/$.core').Object.freeze;
},{"../../modules/$.core":26,"../../modules/es6.object.freeze":77}],17:[function(require,module,exports){
var $ = require('../../modules/$');
require('../../modules/es6.object.get-own-property-descriptor');
module.exports = function getOwnPropertyDescriptor(it, key){
  return $.getDesc(it, key);
};
},{"../../modules/$":50,"../../modules/es6.object.get-own-property-descriptor":78}],18:[function(require,module,exports){
require('../../modules/es6.object.keys');
module.exports = require('../../modules/$.core').Object.keys;
},{"../../modules/$.core":26,"../../modules/es6.object.keys":79}],19:[function(require,module,exports){
require('../../modules/es6.object.set-prototype-of');
module.exports = require('../../modules/$.core').Object.setPrototypeOf;
},{"../../modules/$.core":26,"../../modules/es6.object.set-prototype-of":80}],20:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.promise');
module.exports = require('../modules/$.core').Promise;
},{"../modules/$.core":26,"../modules/es6.object.to-string":81,"../modules/es6.promise":82,"../modules/es6.string.iterator":83,"../modules/web.dom.iterable":85}],21:[function(require,module,exports){
require('../../modules/es6.symbol');
module.exports = require('../../modules/$.core').Symbol;
},{"../../modules/$.core":26,"../../modules/es6.symbol":84}],22:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],23:[function(require,module,exports){
var isObject = require('./$.is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./$.is-object":43}],24:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./$.cof')
  , TAG = require('./$.wks')('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};
},{"./$.cof":25,"./$.wks":74}],25:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],26:[function(require,module,exports){
var core = module.exports = {version: '1.2.3'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],27:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./$.a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./$.a-function":22}],28:[function(require,module,exports){
var global    = require('./$.global')
  , core      = require('./$.core')
  , PROTOTYPE = 'prototype';
var ctx = function(fn, that){
  return function(){
    return fn.apply(that, arguments);
  };
};
var $def = function(type, name, source){
  var key, own, out, exp
    , isGlobal = type & $def.G
    , isProto  = type & $def.P
    , target   = isGlobal ? global : type & $def.S
        ? global[name] : (global[name] || {})[PROTOTYPE]
    , exports  = isGlobal ? core : core[name] || (core[name] = {});
  if(isGlobal)source = name;
  for(key in source){
    // contains in native
    own = !(type & $def.F) && target && key in target;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    if(isGlobal && typeof target[key] != 'function')exp = source[key];
    // bind timers to global for call from export context
    else if(type & $def.B && own)exp = ctx(out, global);
    // wrap global constructors for prevent change them in library
    else if(type & $def.W && target[key] == out)!function(C){
      exp = function(param){
        return this instanceof C ? new C(param) : C(param);
      };
      exp[PROTOTYPE] = C[PROTOTYPE];
    }(out);
    else exp = isProto && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export
    exports[key] = exp;
    if(isProto)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
  }
};
// type bitmap
$def.F = 1;  // forced
$def.G = 2;  // global
$def.S = 4;  // static
$def.P = 8;  // proto
$def.B = 16; // bind
$def.W = 32; // wrap
module.exports = $def;
},{"./$.core":26,"./$.global":35}],29:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],30:[function(require,module,exports){
var isObject = require('./$.is-object')
  , document = require('./$.global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./$.global":35,"./$.is-object":43}],31:[function(require,module,exports){
// all enumerable object keys, includes symbols
var $ = require('./$');
module.exports = function(it){
  var keys       = $.getKeys(it)
    , getSymbols = $.getSymbols;
  if(getSymbols){
    var symbols = getSymbols(it)
      , isEnum  = $.isEnum
      , i       = 0
      , key;
    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))keys.push(key);
  }
  return keys;
};
},{"./$":50}],32:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],33:[function(require,module,exports){
var ctx         = require('./$.ctx')
  , call        = require('./$.iter-call')
  , isArrayIter = require('./$.is-array-iter')
  , anObject    = require('./$.an-object')
  , toLength    = require('./$.to-length')
  , getIterFn   = require('./core.get-iterator-method');
module.exports = function(iterable, entries, fn, that){
  var iterFn = getIterFn(iterable)
    , f      = ctx(fn, that, entries ? 2 : 1)
    , index  = 0
    , length, step, iterator;
  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
    call(iterator, f, step.value, entries);
  }
};
},{"./$.an-object":23,"./$.ctx":27,"./$.is-array-iter":41,"./$.iter-call":44,"./$.to-length":70,"./core.get-iterator-method":75}],34:[function(require,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toString  = {}.toString
  , toIObject = require('./$.to-iobject')
  , getNames  = require('./$').getNames;

var windowNames = typeof window == 'object' && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function(it){
  try {
    return getNames(it);
  } catch(e){
    return windowNames.slice();
  }
};

module.exports.get = function getOwnPropertyNames(it){
  if(windowNames && toString.call(it) == '[object Window]')return getWindowNames(it);
  return getNames(toIObject(it));
};
},{"./$":50,"./$.to-iobject":69}],35:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],36:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],37:[function(require,module,exports){
var $          = require('./$')
  , createDesc = require('./$.property-desc');
module.exports = require('./$.support-desc') ? function(object, key, value){
  return $.setDesc(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./$":50,"./$.property-desc":56,"./$.support-desc":65}],38:[function(require,module,exports){
module.exports = require('./$.global').document && document.documentElement;
},{"./$.global":35}],39:[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};
},{}],40:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./$.cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":25}],41:[function(require,module,exports){
// check on default Array iterator
var Iterators = require('./$.iterators')
  , ITERATOR  = require('./$.wks')('iterator');
module.exports = function(it){
  return (Iterators.Array || Array.prototype[ITERATOR]) === it;
};
},{"./$.iterators":49,"./$.wks":74}],42:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./$.cof');
module.exports = Array.isArray || function(arg){
  return cof(arg) == 'Array';
};
},{"./$.cof":25}],43:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],44:[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./$.an-object');
module.exports = function(iterator, fn, value, entries){
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch(e){
    var ret = iterator['return'];
    if(ret !== undefined)anObject(ret.call(iterator));
    throw e;
  }
};
},{"./$.an-object":23}],45:[function(require,module,exports){
'use strict';
var $ = require('./$')
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./$.hide')(IteratorPrototype, require('./$.wks')('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = $.create(IteratorPrototype, {next: require('./$.property-desc')(1,next)});
  require('./$.tag')(Constructor, NAME + ' Iterator');
};
},{"./$":50,"./$.hide":37,"./$.property-desc":56,"./$.tag":66,"./$.wks":74}],46:[function(require,module,exports){
'use strict';
var LIBRARY         = require('./$.library')
  , $def            = require('./$.def')
  , $redef          = require('./$.redef')
  , hide            = require('./$.hide')
  , has             = require('./$.has')
  , SYMBOL_ITERATOR = require('./$.wks')('iterator')
  , Iterators       = require('./$.iterators')
  , BUGGY           = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR     = '@@iterator'
  , KEYS            = 'keys'
  , VALUES          = 'values';
var returnThis = function(){ return this; };
module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE){
  require('./$.iter-create')(Constructor, NAME, next);
  var createMethod = function(kind){
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG      = NAME + ' Iterator'
    , proto    = Base.prototype
    , _native  = proto[SYMBOL_ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , _default = _native || createMethod(DEFAULT)
    , methods, key;
  // Fix native
  if(_native){
    var IteratorPrototype = require('./$').getProto(_default.call(new Base));
    // Set @@toStringTag to native iterators
    require('./$.tag')(IteratorPrototype, TAG, true);
    // FF fix
    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, SYMBOL_ITERATOR, returnThis);
  }
  // Define iterator
  if(!LIBRARY || FORCE)hide(proto, SYMBOL_ITERATOR, _default);
  // Plug for library
  Iterators[NAME] = _default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEFAULT == VALUES ? _default : createMethod(VALUES),
      keys:    IS_SET            ? _default : createMethod(KEYS),
      entries: DEFAULT != VALUES ? _default : createMethod('entries')
    };
    if(FORCE)for(key in methods){
      if(!(key in proto))$redef(proto, key, methods[key]);
    } else $def($def.P + $def.F * BUGGY, NAME, methods);
  }
};
},{"./$":50,"./$.def":28,"./$.has":36,"./$.hide":37,"./$.iter-create":45,"./$.iterators":49,"./$.library":52,"./$.redef":57,"./$.tag":66,"./$.wks":74}],47:[function(require,module,exports){
var SYMBOL_ITERATOR = require('./$.wks')('iterator')
  , SAFE_CLOSING    = false;
try {
  var riter = [7][SYMBOL_ITERATOR]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }
module.exports = function(exec, skipClosing){
  if(!skipClosing && !SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[SYMBOL_ITERATOR]();
    iter.next = function(){ safe = true; };
    arr[SYMBOL_ITERATOR] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};
},{"./$.wks":74}],48:[function(require,module,exports){
module.exports = function(done, value){
  return {value: value, done: !!done};
};
},{}],49:[function(require,module,exports){
module.exports = {};
},{}],50:[function(require,module,exports){
var $Object = Object;
module.exports = {
  create:     $Object.create,
  getProto:   $Object.getPrototypeOf,
  isEnum:     {}.propertyIsEnumerable,
  getDesc:    $Object.getOwnPropertyDescriptor,
  setDesc:    $Object.defineProperty,
  setDescs:   $Object.defineProperties,
  getKeys:    $Object.keys,
  getNames:   $Object.getOwnPropertyNames,
  getSymbols: $Object.getOwnPropertySymbols,
  each:       [].forEach
};
},{}],51:[function(require,module,exports){
var $         = require('./$')
  , toIObject = require('./$.to-iobject');
module.exports = function(object, el){
  var O      = toIObject(object)
    , keys   = $.getKeys(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
};
},{"./$":50,"./$.to-iobject":69}],52:[function(require,module,exports){
module.exports = true;
},{}],53:[function(require,module,exports){
var global    = require('./$.global')
  , macrotask = require('./$.task').set
  , Observer  = global.MutationObserver || global.WebKitMutationObserver
  , process   = global.process
  , isNode    = require('./$.cof')(process) == 'process'
  , head, last, notify;

var flush = function(){
  var parent, domain;
  if(isNode && (parent = process.domain)){
    process.domain = null;
    parent.exit();
  }
  while(head){
    domain = head.domain;
    if(domain)domain.enter();
    head.fn.call(); // <- currently we use it only for Promise - try / catch not required
    if(domain)domain.exit();
    head = head.next;
  } last = undefined;
  if(parent)parent.enter();
};

// Node.js
if(isNode){
  notify = function(){
    process.nextTick(flush);
  };
// browsers with MutationObserver
} else if(Observer){
  var toggle = 1
    , node   = document.createTextNode('');
  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
  notify = function(){
    node.data = toggle = -toggle;
  };
// for other environments - macrotask based on:
// - setImmediate
// - MessageChannel
// - window.postMessag
// - onreadystatechange
// - setTimeout
} else {
  notify = function(){
    // strange IE + webpack dev server bug - use .call(global)
    macrotask.call(global, flush);
  };
}

module.exports = function asap(fn){
  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
  if(last)last.next = task;
  if(!head){
    head = task;
    notify();
  } last = task;
};
},{"./$.cof":25,"./$.global":35,"./$.task":67}],54:[function(require,module,exports){
var $redef = require('./$.redef');
module.exports = function(target, src){
  for(var key in src)$redef(target, key, src[key]);
  return target;
};
},{"./$.redef":57}],55:[function(require,module,exports){
// most Object methods by ES6 should accept primitives
module.exports = function(KEY, exec){
  var $def = require('./$.def')
    , fn   = (require('./$.core').Object || {})[KEY] || Object[KEY]
    , exp  = {};
  exp[KEY] = exec(fn);
  $def($def.S + $def.F * require('./$.fails')(function(){ fn(1); }), 'Object', exp);
};
},{"./$.core":26,"./$.def":28,"./$.fails":32}],56:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],57:[function(require,module,exports){
module.exports = require('./$.hide');
},{"./$.hide":37}],58:[function(require,module,exports){
module.exports = Object.is || function is(x, y){
  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
};
},{}],59:[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var getDesc  = require('./$').getDesc
  , isObject = require('./$.is-object')
  , anObject = require('./$.an-object');
var check = function(O, proto){
  anObject(O);
  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = require('./$.ctx')(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};
},{"./$":50,"./$.an-object":23,"./$.ctx":27,"./$.is-object":43}],60:[function(require,module,exports){
var global = require('./$.global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./$.global":35}],61:[function(require,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject  = require('./$.an-object')
  , aFunction = require('./$.a-function')
  , SPECIES   = require('./$.wks')('species');
module.exports = function(O, D){
  var C = anObject(O).constructor, S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};
},{"./$.a-function":22,"./$.an-object":23,"./$.wks":74}],62:[function(require,module,exports){
'use strict';
var $       = require('./$')
  , SPECIES = require('./$.wks')('species');
module.exports = function(C){
  if(require('./$.support-desc') && !(SPECIES in C))$.setDesc(C, SPECIES, {
    configurable: true,
    get: function(){ return this; }
  });
};
},{"./$":50,"./$.support-desc":65,"./$.wks":74}],63:[function(require,module,exports){
module.exports = function(it, Constructor, name){
  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
  return it;
};
},{}],64:[function(require,module,exports){
// true  -> String#at
// false -> String#codePointAt
var toInteger = require('./$.to-integer')
  , defined   = require('./$.defined');
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l
      || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
        ? TO_STRING ? s.charAt(i) : a
        : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"./$.defined":29,"./$.to-integer":68}],65:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./$.fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./$.fails":32}],66:[function(require,module,exports){
var def = require('./$').setDesc
  , has = require('./$.has')
  , TAG = require('./$.wks')('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"./$":50,"./$.has":36,"./$.wks":74}],67:[function(require,module,exports){
'use strict';
var ctx                = require('./$.ctx')
  , invoke             = require('./$.invoke')
  , html               = require('./$.html')
  , cel                = require('./$.dom-create')
  , global             = require('./$.global')
  , process            = global.process
  , setTask            = global.setImmediate
  , clearTask          = global.clearImmediate
  , MessageChannel     = global.MessageChannel
  , counter            = 0
  , queue              = {}
  , ONREADYSTATECHANGE = 'onreadystatechange'
  , defer, channel, port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listner = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(require('./$.cof')(process) == 'process'){
    defer = function(id){
      process.nextTick(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listner;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
    defer = function(id){
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listner, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set:   setTask,
  clear: clearTask
};
},{"./$.cof":25,"./$.ctx":27,"./$.dom-create":30,"./$.global":35,"./$.html":38,"./$.invoke":39}],68:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],69:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./$.iobject')
  , defined = require('./$.defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./$.defined":29,"./$.iobject":40}],70:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./$.to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./$.to-integer":68}],71:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":29}],72:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],73:[function(require,module,exports){
module.exports = function(){ /* empty */ };
},{}],74:[function(require,module,exports){
var store  = require('./$.shared')('wks')
  , Symbol = require('./$.global').Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || require('./$.uid'))('Symbol.' + name));
};
},{"./$.global":35,"./$.shared":60,"./$.uid":72}],75:[function(require,module,exports){
var classof   = require('./$.classof')
  , ITERATOR  = require('./$.wks')('iterator')
  , Iterators = require('./$.iterators');
module.exports = require('./$.core').getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
},{"./$.classof":24,"./$.core":26,"./$.iterators":49,"./$.wks":74}],76:[function(require,module,exports){
'use strict';
var setUnscope = require('./$.unscope')
  , step       = require('./$.iter-step')
  , Iterators  = require('./$.iterators')
  , toIObject  = require('./$.to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
require('./$.iter-define')(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

setUnscope('keys');
setUnscope('values');
setUnscope('entries');
},{"./$.iter-define":46,"./$.iter-step":48,"./$.iterators":49,"./$.to-iobject":69,"./$.unscope":73}],77:[function(require,module,exports){
// 19.1.2.5 Object.freeze(O)
var isObject = require('./$.is-object');

require('./$.object-sap')('freeze', function($freeze){
  return function freeze(it){
    return $freeze && isObject(it) ? $freeze(it) : it;
  };
});
},{"./$.is-object":43,"./$.object-sap":55}],78:[function(require,module,exports){
// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
var toIObject = require('./$.to-iobject');

require('./$.object-sap')('getOwnPropertyDescriptor', function($getOwnPropertyDescriptor){
  return function getOwnPropertyDescriptor(it, key){
    return $getOwnPropertyDescriptor(toIObject(it), key);
  };
});
},{"./$.object-sap":55,"./$.to-iobject":69}],79:[function(require,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = require('./$.to-object');

require('./$.object-sap')('keys', function($keys){
  return function keys(it){
    return $keys(toObject(it));
  };
});
},{"./$.object-sap":55,"./$.to-object":71}],80:[function(require,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $def = require('./$.def');
$def($def.S, 'Object', {setPrototypeOf: require('./$.set-proto').set});
},{"./$.def":28,"./$.set-proto":59}],81:[function(require,module,exports){

},{}],82:[function(require,module,exports){
'use strict';
var $          = require('./$')
  , LIBRARY    = require('./$.library')
  , global     = require('./$.global')
  , ctx        = require('./$.ctx')
  , classof    = require('./$.classof')
  , $def       = require('./$.def')
  , isObject   = require('./$.is-object')
  , anObject   = require('./$.an-object')
  , aFunction  = require('./$.a-function')
  , strictNew  = require('./$.strict-new')
  , forOf      = require('./$.for-of')
  , setProto   = require('./$.set-proto').set
  , same       = require('./$.same')
  , species    = require('./$.species')
  , SPECIES    = require('./$.wks')('species')
  , speciesConstructor = require('./$.species-constructor')
  , RECORD     = require('./$.uid')('record')
  , asap       = require('./$.microtask')
  , PROMISE    = 'Promise'
  , process    = global.process
  , isNode     = classof(process) == 'process'
  , P          = global[PROMISE]
  , Wrapper;

var testResolve = function(sub){
  var test = new P(function(){});
  if(sub)test.constructor = Object;
  return P.resolve(test) === test;
};

var useNative = function(){
  var works = false;
  function P2(x){
    var self = new P(x);
    setProto(self, P2.prototype);
    return self;
  }
  try {
    works = P && P.resolve && testResolve();
    setProto(P2, P);
    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
    // actual Firefox has broken subclass support, test that
    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
      works = false;
    }
    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
    if(works && require('./$.support-desc')){
      var thenableThenGotten = false;
      P.resolve($.setDesc({}, 'then', {
        get: function(){ thenableThenGotten = true; }
      }));
      works = thenableThenGotten;
    }
  } catch(e){ works = false; }
  return works;
}();

// helpers
var isPromise = function(it){
  return isObject(it) && (useNative ? classof(it) == 'Promise' : RECORD in it);
};
var sameConstructor = function(a, b){
  // library wrapper special case
  if(LIBRARY && a === P && b === Wrapper)return true;
  return same(a, b);
};
var getConstructor = function(C){
  var S = anObject(C)[SPECIES];
  return S != undefined ? S : C;
};
var isThenable = function(it){
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var notify = function(record, isReject){
  if(record.n)return;
  record.n = true;
  var chain = record.c;
  asap(function(){
    var value = record.v
      , ok    = record.s == 1
      , i     = 0;
    var run = function(react){
      var cb = ok ? react.ok : react.fail
        , ret, then;
      try {
        if(cb){
          if(!ok)record.h = true;
          ret = cb === true ? value : cb(value);
          if(ret === react.P){
            react.rej(TypeError('Promise-chain cycle'));
          } else if(then = isThenable(ret)){
            then.call(ret, react.res, react.rej);
          } else react.res(ret);
        } else react.rej(value);
      } catch(err){
        react.rej(err);
      }
    };
    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
    chain.length = 0;
    record.n = false;
    if(isReject)setTimeout(function(){
      var promise = record.p
        , handler, console;
      if(isUnhandled(promise)){
        if(isNode){
          process.emit('unhandledRejection', value, promise);
        } else if(handler = global.onunhandledrejection){
          handler({promise: promise, reason: value});
        } else if((console = global.console) && console.error){
          console.error('Unhandled promise rejection', value);
        }
      } record.a = undefined;
    }, 1);
  });
};
var isUnhandled = function(promise){
  var record = promise[RECORD]
    , chain  = record.a || record.c
    , i      = 0
    , react;
  if(record.h)return false;
  while(chain.length > i){
    react = chain[i++];
    if(react.fail || !isUnhandled(react.P))return false;
  } return true;
};
var $reject = function(value){
  var record = this;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  record.v = value;
  record.s = 2;
  record.a = record.c.slice();
  notify(record, true);
};
var $resolve = function(value){
  var record = this
    , then;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  try {
    if(then = isThenable(value)){
      asap(function(){
        var wrapper = {r: record, d: false}; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch(e){
          $reject.call(wrapper, e);
        }
      });
    } else {
      record.v = value;
      record.s = 1;
      notify(record, false);
    }
  } catch(e){
    $reject.call({r: record, d: false}, e); // wrap
  }
};

// constructor polyfill
if(!useNative){
  // 25.4.3.1 Promise(executor)
  P = function Promise(executor){
    aFunction(executor);
    var record = {
      p: strictNew(this, P, PROMISE),         // <- promise
      c: [],                                  // <- awaiting reactions
      a: undefined,                           // <- checked in isUnhandled reactions
      s: 0,                                   // <- state
      d: false,                               // <- done
      v: undefined,                           // <- value
      h: false,                               // <- handled rejection
      n: false                                // <- notify
    };
    this[RECORD] = record;
    try {
      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
    } catch(err){
      $reject.call(record, err);
    }
  };
  require('./$.mix')(P.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected){
      var react = {
        ok:   typeof onFulfilled == 'function' ? onFulfilled : true,
        fail: typeof onRejected == 'function'  ? onRejected  : false
      };
      var promise = react.P = new (speciesConstructor(this, P))(function(res, rej){
        react.res = res;
        react.rej = rej;
      });
      aFunction(react.res);
      aFunction(react.rej);
      var record = this[RECORD];
      record.c.push(react);
      if(record.a)record.a.push(react);
      if(record.s)notify(record, false);
      return promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function(onRejected){
      return this.then(undefined, onRejected);
    }
  });
}

// export
$def($def.G + $def.W + $def.F * !useNative, {Promise: P});
require('./$.tag')(P, PROMISE);
species(P);
species(Wrapper = require('./$.core')[PROMISE]);

// statics
$def($def.S + $def.F * !useNative, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r){
    return new this(function(res, rej){ rej(r); });
  }
});
$def($def.S + $def.F * (!useNative || testResolve(true)), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x){
    return isPromise(x) && sameConstructor(x.constructor, this)
      ? x : new this(function(res){ res(x); });
  }
});
$def($def.S + $def.F * !(useNative && require('./$.iter-detect')(function(iter){
  P.all(iter)['catch'](function(){});
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable){
    var C      = getConstructor(this)
      , values = [];
    return new C(function(res, rej){
      forOf(iterable, false, values.push, values);
      var remaining = values.length
        , results   = Array(remaining);
      if(remaining)$.each.call(values, function(promise, index){
        C.resolve(promise).then(function(value){
          results[index] = value;
          --remaining || res(results);
        }, rej);
      });
      else res(results);
    });
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable){
    var C = getConstructor(this);
    return new C(function(res, rej){
      forOf(iterable, false, function(promise){
        C.resolve(promise).then(res, rej);
      });
    });
  }
});
},{"./$":50,"./$.a-function":22,"./$.an-object":23,"./$.classof":24,"./$.core":26,"./$.ctx":27,"./$.def":28,"./$.for-of":33,"./$.global":35,"./$.is-object":43,"./$.iter-detect":47,"./$.library":52,"./$.microtask":53,"./$.mix":54,"./$.same":58,"./$.set-proto":59,"./$.species":62,"./$.species-constructor":61,"./$.strict-new":63,"./$.support-desc":65,"./$.tag":66,"./$.uid":72,"./$.wks":74}],83:[function(require,module,exports){
'use strict';
var $at  = require('./$.string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./$.iter-define')(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
},{"./$.iter-define":46,"./$.string-at":64}],84:[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var $              = require('./$')
  , global         = require('./$.global')
  , has            = require('./$.has')
  , SUPPORT_DESC   = require('./$.support-desc')
  , $def           = require('./$.def')
  , $redef         = require('./$.redef')
  , $fails         = require('./$.fails')
  , shared         = require('./$.shared')
  , setTag         = require('./$.tag')
  , uid            = require('./$.uid')
  , wks            = require('./$.wks')
  , keyOf          = require('./$.keyof')
  , $names         = require('./$.get-names')
  , enumKeys       = require('./$.enum-keys')
  , isArray        = require('./$.is-array')
  , anObject       = require('./$.an-object')
  , toIObject      = require('./$.to-iobject')
  , createDesc     = require('./$.property-desc')
  , getDesc        = $.getDesc
  , setDesc        = $.setDesc
  , _create        = $.create
  , getNames       = $names.get
  , $Symbol        = global.Symbol
  , $JSON          = global.JSON
  , _stringify     = $JSON && $JSON.stringify
  , setter         = false
  , HIDDEN         = wks('_hidden')
  , isEnum         = $.isEnum
  , SymbolRegistry = shared('symbol-registry')
  , AllSymbols     = shared('symbols')
  , useNative      = typeof $Symbol == 'function'
  , ObjectProto    = Object.prototype;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = SUPPORT_DESC && $fails(function(){
  return _create(setDesc({}, 'a', {
    get: function(){ return setDesc(this, 'a', {value: 7}).a; }
  })).a != 7;
}) ? function(it, key, D){
  var protoDesc = getDesc(ObjectProto, key);
  if(protoDesc)delete ObjectProto[key];
  setDesc(it, key, D);
  if(protoDesc && it !== ObjectProto)setDesc(ObjectProto, key, protoDesc);
} : setDesc;

var wrap = function(tag){
  var sym = AllSymbols[tag] = _create($Symbol.prototype);
  sym._k = tag;
  SUPPORT_DESC && setter && setSymbolDesc(ObjectProto, tag, {
    configurable: true,
    set: function(value){
      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    }
  });
  return sym;
};

var isSymbol = function(it){
  return typeof it == 'symbol';
};

var $defineProperty = function defineProperty(it, key, D){
  if(D && has(AllSymbols, key)){
    if(!D.enumerable){
      if(!has(it, HIDDEN))setDesc(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
      D = _create(D, {enumerable: createDesc(0, false)});
    } return setSymbolDesc(it, key, D);
  } return setDesc(it, key, D);
};
var $defineProperties = function defineProperties(it, P){
  anObject(it);
  var keys = enumKeys(P = toIObject(P))
    , i    = 0
    , l = keys.length
    , key;
  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P){
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key){
  var E = isEnum.call(this, key);
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key]
    ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
  var D = getDesc(it = toIObject(it), key);
  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it){
  var names  = getNames(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(!has(AllSymbols, key = names[i++]) && key != HIDDEN)result.push(key);
  return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
  var names  = getNames(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(has(AllSymbols, key = names[i++]))result.push(AllSymbols[key]);
  return result;
};
var $stringify = function stringify(it){
  var args = [it]
    , i    = 1
    , $$   = arguments
    , replacer, $replacer;
  while($$.length > i)args.push($$[i++]);
  replacer = args[1];
  if(typeof replacer == 'function')$replacer = replacer;
  if($replacer || !isArray(replacer))replacer = function(key, value){
    if($replacer)value = $replacer.call(this, key, value);
    if(!isSymbol(value))return value;
  };
  args[1] = replacer;
  return _stringify.apply($JSON, args);
};
var buggyJSON = $fails(function(){
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
});

// 19.4.1.1 Symbol([description])
if(!useNative){
  $Symbol = function Symbol(){
    if(isSymbol(this))throw TypeError('Symbol is not a constructor');
    return wrap(uid(arguments.length > 0 ? arguments[0] : undefined));
  };
  $redef($Symbol.prototype, 'toString', function toString(){
    return this._k;
  });

  isSymbol = function(it){
    return it instanceof $Symbol;
  };

  $.create     = $create;
  $.isEnum     = $propertyIsEnumerable;
  $.getDesc    = $getOwnPropertyDescriptor;
  $.setDesc    = $defineProperty;
  $.setDescs   = $defineProperties;
  $.getNames   = $names.get = $getOwnPropertyNames;
  $.getSymbols = $getOwnPropertySymbols;

  if(SUPPORT_DESC && !require('./$.library')){
    $redef(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }
}

var symbolStatics = {
  // 19.4.2.1 Symbol.for(key)
  'for': function(key){
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key){
    return keyOf(SymbolRegistry, key);
  },
  useSetter: function(){ setter = true; },
  useSimple: function(){ setter = false; }
};
// 19.4.2.2 Symbol.hasInstance
// 19.4.2.3 Symbol.isConcatSpreadable
// 19.4.2.4 Symbol.iterator
// 19.4.2.6 Symbol.match
// 19.4.2.8 Symbol.replace
// 19.4.2.9 Symbol.search
// 19.4.2.10 Symbol.species
// 19.4.2.11 Symbol.split
// 19.4.2.12 Symbol.toPrimitive
// 19.4.2.13 Symbol.toStringTag
// 19.4.2.14 Symbol.unscopables
$.each.call((
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,' +
  'species,split,toPrimitive,toStringTag,unscopables'
).split(','), function(it){
  var sym = wks(it);
  symbolStatics[it] = useNative ? sym : wrap(sym);
});

setter = true;

$def($def.G + $def.W, {Symbol: $Symbol});

$def($def.S, 'Symbol', symbolStatics);

$def($def.S + $def.F * !useNative, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $def($def.S + $def.F * (!useNative || buggyJSON), 'JSON', {stringify: $stringify});

// 19.4.3.5 Symbol.prototype[@@toStringTag]
setTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setTag(global.JSON, 'JSON', true);
},{"./$":50,"./$.an-object":23,"./$.def":28,"./$.enum-keys":31,"./$.fails":32,"./$.get-names":34,"./$.global":35,"./$.has":36,"./$.is-array":42,"./$.keyof":51,"./$.library":52,"./$.property-desc":56,"./$.redef":57,"./$.shared":60,"./$.support-desc":65,"./$.tag":66,"./$.to-iobject":69,"./$.uid":72,"./$.wks":74}],85:[function(require,module,exports){
require('./es6.array.iterator');
var Iterators = require('./$.iterators');
Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
},{"./$.iterators":49,"./es6.array.iterator":76}],86:[function(require,module,exports){
(function (process,global){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013-2015 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 2.10.2
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, cancel, using, filter, any, each, timers
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule.js");
var Queue = _dereq_("./queue.js");
var util = _dereq_("./util.js");

function Async() {
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule =
        schedule.isStatic ? schedule(this.drainQueues) : schedule;
}

Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
        this._trampolineEnabled = false;
    }
};

Async.prototype.enableTrampoline = function() {
    if (!this._trampolineEnabled) {
        this._trampolineEnabled = true;
        this._schedule = function(fn) {
            setTimeout(fn, 0);
        };
    }
};

Async.prototype.haveItemsQueued = function () {
    return this._normalQueue.length() > 0;
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
} else {
    if (schedule.isStatic) {
        schedule = function(fn) { setTimeout(fn, 0); };
    }
    Async.prototype.invokeLater = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                setTimeout(function() {
                    fn.call(receiver, arg);
                }, 100);
            });
        }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvoke.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                fn.call(receiver, arg);
            });
        }
    };

    Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
            AsyncSettlePromises.call(this, promise);
        } else {
            this._schedule(function() {
                promise._settlePromises();
            });
        }
    };
}

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = new Async();
module.exports.firstLineError = firstLineError;

},{"./queue.js":28,"./schedule.js":31,"./util.js":38}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (this._isPending()) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();

    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, ret._progress, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, ret._progress, ret, context);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 131072;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~131072);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 131072) === 131072;
};

Promise.bind = function (thisArg, value) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);

    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        maybePromise._then(function() {
            ret._resolveCallback(value);
        }, ret._reject, ret._progress, ret, null);
    } else {
        ret._resolveCallback(value);
    }
    return ret;
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise.js")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise.js":23}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util.js":38}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var errors = _dereq_("./errors.js");
var async = _dereq_("./async.js");
var CancellationError = errors.CancellationError;

Promise.prototype._cancel = function (reason) {
    if (!this.isCancellable()) return this;
    var parent;
    var promiseToReject = this;
    while ((parent = promiseToReject._cancellationParent) !== undefined &&
        parent.isCancellable()) {
        promiseToReject = parent;
    }
    this._unsetCancellable();
    promiseToReject._target()._rejectCallback(reason, false, true);
};

Promise.prototype.cancel = function (reason) {
    if (!this.isCancellable()) return this;
    if (reason === undefined) reason = new CancellationError();
    async.invokeLater(this._cancel, this, reason);
    return this;
};

Promise.prototype.cancellable = function () {
    if (this._cancellable()) return this;
    async.enableTrampoline();
    this._setCancellable();
    this._cancellationParent = undefined;
    return this;
};

Promise.prototype.uncancellable = function () {
    var ret = this.then();
    ret._unsetCancellable();
    return ret;
};

Promise.prototype.fork = function (didFulfill, didReject, didProgress) {
    var ret = this._then(didFulfill, didReject, didProgress,
                         undefined, undefined);

    ret._setCancellable();
    ret._cancellationParent = undefined;
    return ret;
};
};

},{"./async.js":2,"./errors.js":13}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](main|debug|zalgo|instrumented)/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var warn;

function CapturedTrace(parent) {
    this._parent = parent;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.parent = function() {
    return this._parent;
};

CapturedTrace.prototype.hasParent = function() {
    return this._parent !== undefined;
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = CapturedTrace.parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = stackFramePattern.test(line) ||
            "    (No stack trace)" === line;
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0) {
        stack = stack.slice(i);
    }
    return stack;
}

CapturedTrace.parseStackAndMessage = function(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: cleanStack(stack)
    };
};

CapturedTrace.formatAndLogError = function(error, title) {
    if (typeof console !== "undefined") {
        var message;
        if (typeof error === "object" || typeof error === "function") {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof warn === "function") {
            warn(message);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
};

CapturedTrace.unhandledRejection = function (reason) {
    CapturedTrace.formatAndLogError(reason, "^--- With additional stack trace: ");
};

CapturedTrace.isSupported = function () {
    return typeof captureStackTrace === "function";
};

CapturedTrace.fireRejectionEvent =
function(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent(name, reason, promise);
    } catch (e) {
        globalEventFired = true;
        async.throwLater(e);
    }

    var domEventFired = false;
    if (fireDomEvent) {
        try {
            domEventFired = fireDomEvent(name.toLowerCase(), {
                reason: reason,
                promise: promise
            });
        } catch (e) {
            domEventFired = true;
            async.throwLater(e);
        }
    }

    if (!globalEventFired && !localEventFired && !domEventFired &&
        name === "unhandledRejection") {
        CapturedTrace.formatAndLogError(reason, "Unhandled rejection ");
    }
};

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj.toString();
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}
CapturedTrace.setBounds = function(firstLineError, lastLineError) {
    if (!CapturedTrace.isSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit = Error.stackTraceLimit + 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

var fireDomEvent;
var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function(name, reason, promise) {
            if (name === "rejectionHandled") {
                return process.emit(name, promise);
            } else {
                return process.emit(name, reason, promise);
            }
        };
    } else {
        var customEventWorks = false;
        var anyEventWorks = true;
        try {
            var ev = new self.CustomEvent("test");
            customEventWorks = ev instanceof CustomEvent;
        } catch (e) {}
        if (!customEventWorks) {
            try {
                var event = document.createEvent("CustomEvent");
                event.initCustomEvent("testingtheevent", false, true, {});
                self.dispatchEvent(event);
            } catch (e) {
                anyEventWorks = false;
            }
        }
        if (anyEventWorks) {
            fireDomEvent = function(type, detail) {
                var event;
                if (customEventWorks) {
                    event = new self.CustomEvent(type, {
                        detail: detail,
                        bubbles: false,
                        cancelable: true
                    });
                } else if (self.dispatchEvent) {
                    event = document.createEvent("CustomEvent");
                    event.initCustomEvent(type, false, true, detail);
                }

                return event ? !self.dispatchEvent(event) : false;
            };
        }

        var toWindowMethodNameMap = {};
        toWindowMethodNameMap["unhandledRejection"] = ("on" +
            "unhandledRejection").toLowerCase();
        toWindowMethodNameMap["rejectionHandled"] = ("on" +
            "rejectionHandled").toLowerCase();

        return function(name, reason, promise) {
            var methodName = toWindowMethodNameMap[name];
            var method = self[methodName];
            if (!method) return false;
            if (name === "rejectionHandled") {
                method.call(self, promise);
            } else {
                method.call(self, reason, promise);
            }
            return true;
        };
    }
})();

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    warn = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        warn = function(message) {
            process.stderr.write("\u001b[31m" + message + "\u001b[39m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        warn = function(message) {
            console.warn("%c" + message, "color: red");
        };
    }
}

return CapturedTrace;
};

},{"./async.js":2,"./util.js":38}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util.js");
var errors = _dereq_("./errors.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var keys = _dereq_("./es5.js").keys;
var TypeError = errors.TypeError;

function CatchFilter(instances, callback, promise) {
    this._instances = instances;
    this._callback = callback;
    this._promise = promise;
}

function safePredicate(predicate, e) {
    var safeObject = {};
    var retfilter = tryCatch(predicate).call(safeObject, e);

    if (retfilter === errorObj) return retfilter;

    var safeKeys = keys(safeObject);
    if (safeKeys.length) {
        errorObj.e = new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a");
        return errorObj;
    }
    return retfilter;
}

CatchFilter.prototype.doFilter = function (e) {
    var cb = this._callback;
    var promise = this._promise;
    var boundTo = promise._boundValue();
    for (var i = 0, len = this._instances.length; i < len; ++i) {
        var item = this._instances[i];
        var itemIsErrorType = item === Error ||
            (item != null && item.prototype instanceof Error);

        if (itemIsErrorType && e instanceof item) {
            var ret = tryCatch(cb).call(boundTo, e);
            if (ret === errorObj) {
                NEXT_FILTER.e = ret.e;
                return NEXT_FILTER;
            }
            return ret;
        } else if (typeof item === "function" && !itemIsErrorType) {
            var shouldHandle = safePredicate(item, e);
            if (shouldHandle === errorObj) {
                e = errorObj.e;
                break;
            } else if (shouldHandle) {
                var ret = tryCatch(cb).call(boundTo, e);
                if (ret === errorObj) {
                    NEXT_FILTER.e = ret.e;
                    return NEXT_FILTER;
                }
                return ret;
            }
        }
    }
    NEXT_FILTER.e = e;
    return NEXT_FILTER;
};

return CatchFilter;
};

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace, isDebugging) {
var contextStack = [];
function Context() {
    this._trace = new CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.pop();
    }
};

function createContext() {
    if (isDebugging()) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}

Promise.prototype._peekContext = peekContext;
Promise.prototype._pushContext = Context.prototype._pushContext;
Promise.prototype._popContext = Context.prototype._popContext;

return createContext;
};

},{}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var Warning = _dereq_("./errors.js").Warning;
var util = _dereq_("./util.js");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var debugging = false || (util.isNode &&
                    (!!process.env["BLUEBIRD_DEBUG"] ||
                     process.env["NODE_ENV"] === "development"));

if (util.isNode && process.env["BLUEBIRD_DEBUG"] == 0) debugging = false;

if (debugging) {
    async.disableTrampolineIfNecessary();
}

Promise.prototype._ignoreRejections = function() {
    this._unsetRejectionIsUnhandled();
    this._bitField = this._bitField | 16777216;
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 16777216) !== 0) return;
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    CapturedTrace.fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._getCarriedStackTrace() || this._settledValue;
        this._setUnhandledRejectionIsNotified();
        CapturedTrace.fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 524288;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~524288);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 524288) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 2097152;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~2097152);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 2097152) > 0;
};

Promise.prototype._setCarriedStackTrace = function (capturedTrace) {
    this._bitField = this._bitField | 1048576;
    this._fulfillmentHandler0 = capturedTrace;
};

Promise.prototype._isCarryingStackTrace = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._getCarriedStackTrace = function () {
    return this._isCarryingStackTrace()
        ? this._fulfillmentHandler0
        : undefined;
};

Promise.prototype._captureStackTrace = function () {
    if (debugging) {
        this._trace = new CapturedTrace(this._peekContext());
    }
    return this;
};

Promise.prototype._attachExtraTrace = function (error, ignoreSelf) {
    if (debugging && canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = CapturedTrace.parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
};

Promise.prototype._warn = function(message) {
    var warning = new Warning(message);
    var ctx = this._peekContext();
    if (ctx) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = CapturedTrace.parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }
    CapturedTrace.formatAndLogError(warning, "");
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var domain = getDomain();
    possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var domain = getDomain();
    unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.longStackTraces = function () {
    if (async.haveItemsQueued() &&
        debugging === false
   ) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/DT1qyG\u000a");
    }
    debugging = CapturedTrace.isSupported();
    if (debugging) {
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return debugging && CapturedTrace.isSupported();
};

if (!CapturedTrace.isSupported()) {
    Promise.longStackTraces = function(){};
    debugging = false;
}

return function() {
    return debugging;
};
};

},{"./async.js":2,"./errors.js":13,"./util.js":38}],11:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;

module.exports = function(Promise) {
var returner = function () {
    return this;
};
var thrower = function () {
    throw this;
};
var returnUndefined = function() {};
var throwUndefined = function() {
    throw undefined;
};

var wrapper = function (value, action) {
    if (action === 1) {
        return function () {
            throw value;
        };
    } else if (action === 2) {
        return function () {
            return value;
        };
    }
};


Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value === undefined) return this.then(returnUndefined);

    if (isPrimitive(value)) {
        return this._then(
            wrapper(value, 2),
            undefined,
            undefined,
            undefined,
            undefined
       );
    } else if (value instanceof Promise) {
        value._ignoreRejections();
    }
    return this._then(returner, undefined, undefined, value, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    if (reason === undefined) return this.then(throwUndefined);

    if (isPrimitive(reason)) {
        return this._then(
            wrapper(reason, 1),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(thrower, undefined, undefined, reason, undefined);
};
};

},{"./util.js":38}],12:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;

Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, null, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, null, INTERNAL);
};
};

},{}],13:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util.js");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    notEnumerableProp(Error, "__BluebirdErrorTypes__", errorTypes);
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5.js":14,"./util.js":38}],14:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, NEXT_FILTER, tryConvertToPromise) {
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;
var thrower = util.thrower;

function returnThis() {
    return this;
}
function throwThis() {
    throw this;
}
function return$(r) {
    return function() {
        return r;
    };
}
function throw$(r) {
    return function() {
        throw r;
    };
}
function promisedFinally(ret, reasonOrValue, isFulfilled) {
    var then;
    if (isPrimitive(reasonOrValue)) {
        then = isFulfilled ? return$(reasonOrValue) : throw$(reasonOrValue);
    } else {
        then = isFulfilled ? returnThis : throwThis;
    }
    return ret._then(then, thrower, undefined, reasonOrValue, undefined);
}

function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundValue())
                    : handler();

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, reasonOrValue,
                                    promise.isFulfilled());
        }
    }

    if (promise.isRejected()) {
        NEXT_FILTER.e = reasonOrValue;
        return NEXT_FILTER;
    } else {
        return reasonOrValue;
    }
}

function tapHandler(value) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundValue(), value)
                    : handler(value);

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, value, true);
        }
    }
    return value;
}

Promise.prototype._passThroughHandler = function (handler, isFinally) {
    if (typeof handler !== "function") return this.then();

    var promiseAndHandler = {
        promise: this,
        handler: handler
    };

    return this._then(
            isFinally ? finallyHandler : tapHandler,
            isFinally ? finallyHandler : undefined, undefined,
            promiseAndHandler, undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThroughHandler(handler, true);
};

Promise.prototype.tap = function (handler) {
    return this._passThroughHandler(handler, false);
};
};

},{"./util.js":38}],17:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise) {
var errors = _dereq_("./errors.js");
var TypeError = errors.TypeError;
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    var promise = this._promise = new Promise(INTERNAL);
    promise._captureStackTrace();
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
}

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._next(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    if (result === errorObj) {
        return this._promise._rejectCallback(result.e, false, true);
    }

    var value = result.value;
    if (result.done === true) {
        this._promise._resolveCallback(value);
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._throw(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/4Y4pDk\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise._then(
            this._next,
            this._throw,
            undefined,
            this,
            null
       );
    }
};

PromiseSpawn.prototype._throw = function (reason) {
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._next = function (value) {
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        spawn._generator = generator;
        spawn._next(undefined);
        return spawn.promise();
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors.js":13,"./util.js":38}],18:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var caller = function(count) {
        var values = [];
        for (var i = 1; i <= count; ++i) values.push("holder.p" + i);
        return new Function("holder", "                                      \n\
            'use strict';                                                    \n\
            var callback = holder.fn;                                        \n\
            return callback(values);                                         \n\
            ".replace(/values/g, values.join(", ")));
    };
    var thenCallbacks = [];
    var callers = [undefined];
    for (var i = 1; i <= 5; ++i) {
        thenCallbacks.push(thenCallback(i));
        callers.push(caller(i));
    }

    var Holder = function(total, fn) {
        this.p1 = this.p2 = this.p3 = this.p4 = this.p5 = null;
        this.fn = fn;
        this.total = total;
        this.now = 0;
    };

    Holder.prototype.callers = callers;
    Holder.prototype.checkFulfillment = function(promise) {
        var now = this.now;
        now++;
        var total = this.total;
        if (now >= total) {
            var handler = this.callers[total];
            promise._pushContext();
            var ret = tryCatch(handler)(this);
            promise._popContext();
            if (ret === errorObj) {
                promise._rejectCallback(ret.e, false, true);
            } else {
                promise._resolveCallback(ret);
            }
        } else {
            this.now = now;
        }
    };

    var reject = function (reason) {
        this._reject(reason);
    };
}
}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last < 6 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var holder = new Holder(last, fn);
                var callbacks = thenCallbacks;
                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        if (maybePromise._isPending()) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                        } else if (maybePromise._isFulfilled()) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else {
                            ret._reject(maybePromise._reason());
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }
                return ret;
            }
        }
    }
    var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util.js":38}],19:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var PENDING = {};
var EMPTY_ARRAY = [];

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
    async.invoke(init, this, undefined);
}
util.inherits(MappingPromiseArray, PromiseArray);
function init() {this._init$(undefined, -2);}

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;
    if (values[index] === PENDING) {
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var callback = this._callback;
        var receiver = this._promise._boundValue();
        this._promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        this._promise._popContext();
        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                if (limit >= 1) this._inFlight++;
                values[index] = PENDING;
                return maybePromise._proxyPromiseArray(this, index);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }

    }
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    var limit = typeof options === "object" && options !== null
        ? options.concurrency
        : 0;
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter);
}

Promise.prototype.map = function (fn, options) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

    return map(this, fn, options, null).promise();
};

Promise.map = function (promises, fn, options, _filter) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    return map(promises, fn, options, _filter).promise();
};


};

},{"./async.js":2,"./util.js":38}],20:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        ret._popContext();
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn, args, ctx) {
    if (typeof fn !== "function") {
        return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value = util.isArray(args)
        ? tryCatch(fn).apply(ctx, args)
        : tryCatch(fn).call(ctx, args);
    ret._popContext();
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false, true);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util.js":38}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var target = promise._target();
        var newReason = target._getCarriedStackTrace();
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback =
Promise.prototype.nodeify = function (nodeback, options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./async.js":2,"./util.js":38}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

Promise.prototype.progressed = function (handler) {
    return this._then(undefined, undefined, handler, undefined, undefined);
};

Promise.prototype._progress = function (progressValue) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._target()._progressUnchecked(progressValue);

};

Promise.prototype._progressHandlerAt = function (index) {
    return index === 0
        ? this._progressHandler0
        : this[(index << 2) + index - 5 + 2];
};

Promise.prototype._doProgressWith = function (progression) {
    var progressValue = progression.value;
    var handler = progression.handler;
    var promise = progression.promise;
    var receiver = progression.receiver;

    var ret = tryCatch(handler).call(receiver, progressValue);
    if (ret === errorObj) {
        if (ret.e != null &&
            ret.e.name !== "StopProgressPropagation") {
            var trace = util.canAttachTrace(ret.e)
                ? ret.e : new Error(util.toString(ret.e));
            promise._attachExtraTrace(trace);
            promise._progress(ret.e);
        }
    } else if (ret instanceof Promise) {
        ret._then(promise._progress, null, null, promise, undefined);
    } else {
        promise._progress(ret);
    }
};


Promise.prototype._progressUnchecked = function (progressValue) {
    var len = this._length();
    var progress = this._progress;
    for (var i = 0; i < len; i++) {
        var handler = this._progressHandlerAt(i);
        var promise = this._promiseAt(i);
        if (!(promise instanceof Promise)) {
            var receiver = this._receiverAt(i);
            if (typeof handler === "function") {
                handler.call(receiver, progressValue, promise);
            } else if (receiver instanceof PromiseArray &&
                       !receiver._isResolved()) {
                receiver._promiseProgressed(progressValue, promise);
            }
            continue;
        }

        if (typeof handler === "function") {
            async.invoke(this._doProgressWith, this, {
                handler: handler,
                promise: promise,
                receiver: this._receiverAt(i),
                value: progressValue
            });
        } else {
            async.invoke(progress, promise, progressValue);
        }
    }
};
};

},{"./async.js":2,"./util.js":38}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/LhFpo0\u000a");
};
var reflect = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};

var util = _dereq_("./util.js");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var UNDEFINED_BINDING = {};
var async = _dereq_("./async.js");
var errors = _dereq_("./errors.js");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {e: null};
var tryConvertToPromise = _dereq_("./thenables.js")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array.js")(Promise, INTERNAL,
                                    tryConvertToPromise, apiRejection);
var CapturedTrace = _dereq_("./captured_trace.js")();
var isDebugging = _dereq_("./debuggability.js")(Promise, CapturedTrace);
 /*jshint unused:false*/
var createContext =
    _dereq_("./context.js")(Promise, CapturedTrace, isDebugging);
var CatchFilter = _dereq_("./catch_filter.js")(NEXT_FILTER);
var PromiseResolver = _dereq_("./promise_resolver.js");
var nodebackForPromise = PromiseResolver._nodebackForPromise;
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function Promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("the promise constructor requires a resolver function\u000a\u000a    See http://goo.gl/EC22Yn\u000a");
    }
    if (this.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/KsIlge\u000a");
    }
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._progressHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settledValue = undefined;
    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (typeof item === "function") {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(
                    new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a"));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter(catchInstances, fn, this);
        return this._then(undefined, catchFilter.doFilter, undefined,
            catchFilter, undefined);
    }
    return this._then(undefined, fn, undefined, undefined, undefined);
};

Promise.prototype.reflect = function () {
    return this._then(reflect, reflect, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject, didProgress) {
    if (isDebugging() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject, didProgress) {
    var promise = this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (didFulfill, didReject) {
    return this.all()._then(didFulfill, didReject, undefined, APPLY, undefined);
};

Promise.prototype.isCancellable = function () {
    return !this.isResolved() &&
        this._cancellable();
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = function(fn) {
    var ret = new Promise(INTERNAL);
    var result = tryCatch(fn)(nodebackForPromise(ret));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true, true);
    }
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.defer = Promise.pending = function () {
    var promise = new Promise(INTERNAL);
    return new PromiseResolver(promise);
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        var val = ret;
        ret = new Promise(INTERNAL);
        ret._fulfillUnchecked(val);
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var prev = async._schedule;
    async._schedule = fn;
    return prev;
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

    if (!haveInternalData) {
        ret._propagateFrom(this, 4 | 1);
        ret._captureStackTrace();
    }

    var target = this._target();
    if (target !== this) {
        if (receiver === undefined) receiver = this._boundTo;
        if (!haveInternalData) ret._setIsMigrated();
    }

    var callbackIndex = target._addCallbacks(didFulfill,
                                             didReject,
                                             didProgress,
                                             ret,
                                             receiver,
                                             getDomain());

    if (target._isResolved() && !target._isSettlePromisesQueued()) {
        async.invoke(
            target._settlePromiseAtPostResolution, target, callbackIndex);
    }

    return ret;
};

Promise.prototype._settlePromiseAtPostResolution = function (index) {
    if (this._isRejectionUnhandled()) this._unsetRejectionIsUnhandled();
    this._settlePromiseAt(index);
};

Promise.prototype._length = function () {
    return this._bitField & 131071;
};

Promise.prototype._isFollowingOrFulfilledOrRejected = function () {
    return (this._bitField & 939524096) > 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 536870912) === 536870912;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -131072) |
        (len & 131071);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 536870912;
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 33554432;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 33554432) > 0;
};

Promise.prototype._cancellable = function () {
    return (this._bitField & 67108864) > 0;
};

Promise.prototype._setCancellable = function () {
    this._bitField = this._bitField | 67108864;
};

Promise.prototype._unsetCancellable = function () {
    this._bitField = this._bitField & (~67108864);
};

Promise.prototype._setIsMigrated = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._unsetIsMigrated = function () {
    this._bitField = this._bitField & (~4194304);
};

Promise.prototype._isMigrated = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0
        ? this._receiver0
        : this[
            index * 5 - 5 + 4];
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return index === 0
        ? this._promise0
        : this[index * 5 - 5 + 3];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return index === 0
        ? this._fulfillmentHandler0
        : this[index * 5 - 5 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return index === 0
        ? this._rejectionHandler0
        : this[index * 5 - 5 + 1];
};

Promise.prototype._boundValue = function() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
};

Promise.prototype._migrateCallbacks = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var progress = follower._progressHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (promise instanceof Promise) promise._setIsMigrated();
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, progress, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    progress,
    promise,
    receiver,
    domain
) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        if (receiver !== undefined) this._receiver0 = receiver;
        if (typeof fulfill === "function" && !this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this._progressHandler0 =
                domain === null ? progress : domain.bind(progress);
        }
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promise;
        this[base + 4] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this[base + 2] =
                domain === null ? progress : domain.bind(progress);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._setProxyHandlers = function (receiver, promiseSlotValue) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }
    if (index === 0) {
        this._promise0 = promiseSlotValue;
        this._receiver0 = receiver;
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promiseSlotValue;
        this[base + 4] = receiver;
    }
    this._setLength(index + 1);
};

Promise.prototype._proxyPromiseArray = function (promiseArray, index) {
    this._setProxyHandlers(promiseArray, index);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false, true);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    var propagationFlags = 1 | (shouldBind ? 4 : 0);
    this._propagateFrom(maybePromise, propagationFlags);
    var promise = maybePromise._target();
    if (promise._isPending()) {
        var len = this._length();
        for (var i = 0; i < len; ++i) {
            promise._migrateCallbacks(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (promise._isFulfilled()) {
        this._fulfillUnchecked(promise._value());
    } else {
        this._rejectUnchecked(promise._reason(),
            promise._getCarriedStackTrace());
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, shouldNotMarkOriginatingFromRejection) {
    if (!shouldNotMarkOriginatingFromRejection) {
        util.markAsOriginatingFromRejection(reason);
    }
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason, hasStack ? undefined : trace);
};

Promise.prototype._resolveFromResolver = function (resolver) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = tryCatch(resolver)(function(value) {
        if (promise === null) return;
        promise._resolveCallback(value);
        promise = null;
    }, function (reason) {
        if (promise === null) return;
        promise._rejectCallback(reason, synchronous);
        promise = null;
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined && r === errorObj && promise !== null) {
        promise._rejectCallback(r.e, true, true);
        promise = null;
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    if (promise._isRejected()) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY && !this._isRejected()) {
        x = tryCatch(handler).apply(this._boundValue(), value);
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    promise._popContext();

    if (x === errorObj || x === promise || x === NEXT_FILTER) {
        var err = x === promise ? makeSelfResolutionError() : x.e;
        promise._rejectCallback(err, false, true);
    } else {
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._cleanValues = function () {
    if (this._cancellable()) {
        this._cancellationParent = undefined;
    }
};

Promise.prototype._propagateFrom = function (parent, flags) {
    if ((flags & 1) > 0 && parent._cancellable()) {
        this._setCancellable();
        this._cancellationParent = parent;
    }
    if ((flags & 4) > 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
};

Promise.prototype._fulfill = function (value) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._fulfillUnchecked(value);
};

Promise.prototype._reject = function (reason, carriedStackTrace) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._rejectUnchecked(reason, carriedStackTrace);
};

Promise.prototype._settlePromiseAt = function (index) {
    var promise = this._promiseAt(index);
    var isPromise = promise instanceof Promise;

    if (isPromise && promise._isMigrated()) {
        promise._unsetIsMigrated();
        return async.invoke(this._settlePromiseAt, this, index);
    }
    var handler = this._isFulfilled()
        ? this._fulfillmentHandlerAt(index)
        : this._rejectionHandlerAt(index);

    var carriedStackTrace =
        this._isCarryingStackTrace() ? this._getCarriedStackTrace() : undefined;
    var value = this._settledValue;
    var receiver = this._receiverAt(index);
    this._clearCallbackDataAtIndex(index);

    if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof PromiseArray) {
        if (!receiver._isResolved()) {
            if (this._isFulfilled()) {
                receiver._promiseFulfilled(value, promise);
            }
            else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (this._isFulfilled()) {
            promise._fulfill(value);
        } else {
            promise._reject(value, carriedStackTrace);
        }
    }

    if (index >= 4 && (index & 31) === 4)
        async.invokeLater(this._setLength, this, 0);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    if (index === 0) {
        if (!this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 = undefined;
        }
        this._rejectionHandler0 =
        this._progressHandler0 =
        this._receiver0 =
        this._promise0 = undefined;
    } else {
        var base = index * 5 - 5;
        this[base + 3] =
        this[base + 4] =
        this[base + 0] =
        this[base + 1] =
        this[base + 2] = undefined;
    }
};

Promise.prototype._isSettlePromisesQueued = function () {
    return (this._bitField &
            -1073741824) === -1073741824;
};

Promise.prototype._setSettlePromisesQueued = function () {
    this._bitField = this._bitField | -1073741824;
};

Promise.prototype._unsetSettlePromisesQueued = function () {
    this._bitField = this._bitField & (~-1073741824);
};

Promise.prototype._queueSettlePromises = function() {
    async.settlePromises(this);
    this._setSettlePromisesQueued();
};

Promise.prototype._fulfillUnchecked = function (value) {
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err, undefined);
    }
    this._setFulfilled();
    this._settledValue = value;
    this._cleanValues();

    if (this._length() > 0) {
        this._queueSettlePromises();
    }
};

Promise.prototype._rejectUncheckedCheckError = function (reason) {
    var trace = util.ensureErrorObject(reason);
    this._rejectUnchecked(reason, trace === reason ? undefined : trace);
};

Promise.prototype._rejectUnchecked = function (reason, trace) {
    if (reason === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._setRejected();
    this._settledValue = reason;
    this._cleanValues();

    if (this._isFinal()) {
        async.throwLater(function(e) {
            if ("stack" in e) {
                async.invokeFirst(
                    CapturedTrace.unhandledRejection, undefined, e);
            }
            throw e;
        }, trace === undefined ? reason : trace);
        return;
    }

    if (trace !== undefined && trace !== reason) {
        this._setCarriedStackTrace(trace);
    }

    if (this._length() > 0) {
        this._queueSettlePromises();
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._settlePromises = function () {
    this._unsetSettlePromisesQueued();
    var len = this._length();
    for (var i = 0; i < len; i++) {
        this._settlePromiseAt(i);
    }
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./progress.js")(Promise, PromiseArray);
_dereq_("./method.js")(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_("./bind.js")(Promise, INTERNAL, tryConvertToPromise);
_dereq_("./finally.js")(Promise, NEXT_FILTER, tryConvertToPromise);
_dereq_("./direct_resolve.js")(Promise);
_dereq_("./synchronous_inspection.js")(Promise);
_dereq_("./join.js")(Promise, PromiseArray, tryConvertToPromise, INTERNAL);
Promise.Promise = Promise;
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./cancel.js')(Promise);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise);
_dereq_('./nodeify.js')(Promise);
_dereq_('./call_get.js')(Promise);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./settle.js')(Promise, PromiseArray);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./any.js')(Promise);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./timers.js')(Promise, INTERNAL);
_dereq_('./filter.js')(Promise, INTERNAL);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._progressHandler0 = value;                                         
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
        p._settledValue = value;                                             
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    CapturedTrace.setBounds(async.firstLineError, util.lastLineError);       
    return Promise;                                                          

};

},{"./any.js":1,"./async.js":2,"./bind.js":3,"./call_get.js":5,"./cancel.js":6,"./captured_trace.js":7,"./catch_filter.js":8,"./context.js":9,"./debuggability.js":10,"./direct_resolve.js":11,"./each.js":12,"./errors.js":13,"./filter.js":15,"./finally.js":16,"./generators.js":17,"./join.js":18,"./map.js":19,"./method.js":20,"./nodeify.js":21,"./progress.js":22,"./promise_array.js":24,"./promise_resolver.js":25,"./promisify.js":26,"./props.js":27,"./race.js":29,"./reduce.js":30,"./settle.js":32,"./some.js":33,"./synchronous_inspection.js":34,"./thenables.js":35,"./timers.js":36,"./using.js":37,"./util.js":38}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection) {
var util = _dereq_("./util.js");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    var parent;
    if (values instanceof Promise) {
        parent = values;
        promise._propagateFrom(parent, 1 | 4);
    }
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        this._values = values;
        if (values._isFulfilled()) {
            values = values._value();
            if (!isArray(values)) {
                var err = new Promise.TypeError("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
                this.__hardReject__(err);
                return;
            }
        } else if (values._isPending()) {
            values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
            return;
        } else {
            this._reject(values._reason());
            return;
        }
    } else if (!isArray(values)) {
        this._promise._reject(apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a")._reason());
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var promise = this._promise;
    for (var i = 0; i < len; ++i) {
        var isResolved = this._isResolved();
        var maybePromise = tryConvertToPromise(values[i], promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (isResolved) {
                maybePromise._ignoreRejections();
            } else if (maybePromise._isPending()) {
                maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                this._promiseFulfilled(maybePromise._value(), i);
            } else {
                this._promiseRejected(maybePromise._reason(), i);
            }
        } else if (!isResolved) {
            this._promiseFulfilled(maybePromise, i);
        }
    }
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype.__hardReject__ =
PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false, true);
};

PromiseArray.prototype._promiseProgressed = function (progressValue, index) {
    this._promise._progress({
        index: index,
        value: progressValue
    });
};


PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

PromiseArray.prototype._promiseRejected = function (reason, index) {
    this._totalResolved++;
    this._reject(reason);
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util.js":38}],25:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors.js");
var TimeoutError = errors.TimeoutError;
var OperationalError = errors.OperationalError;
var haveGetters = util.haveGetters;
var es5 = _dereq_("./es5.js");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise) {
    return function(err, value) {
        if (promise === null) return;

        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (arguments.length > 2) {
            var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
            promise._fulfill(args);
        } else {
            promise._fulfill(value);
        }

        promise = null;
    };
}


var PromiseResolver;
if (!haveGetters) {
    PromiseResolver = function (promise) {
        this.promise = promise;
        this.asCallback = nodebackForPromise(promise);
        this.callback = this.asCallback;
    };
}
else {
    PromiseResolver = function (promise) {
        this.promise = promise;
    };
}
if (haveGetters) {
    var prop = {
        get: function() {
            return nodebackForPromise(this.promise);
        }
    };
    es5.defineProperty(PromiseResolver.prototype, "asCallback", prop);
    es5.defineProperty(PromiseResolver.prototype, "callback", prop);
}

PromiseResolver._nodebackForPromise = nodebackForPromise;

PromiseResolver.prototype.toString = function () {
    return "[object PromiseResolver]";
};

PromiseResolver.prototype.resolve =
PromiseResolver.prototype.fulfill = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._resolveCallback(value);
};

PromiseResolver.prototype.reject = function (reason) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._rejectCallback(reason);
};

PromiseResolver.prototype.progress = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._progress(value);
};

PromiseResolver.prototype.cancel = function (err) {
    this.promise.cancel(err);
};

PromiseResolver.prototype.timeout = function () {
    this.reject(new TimeoutError("timeout"));
};

PromiseResolver.prototype.isResolved = function () {
    return this.promise.isResolved();
};

PromiseResolver.prototype.toJSON = function () {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],26:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util.js");
var nodebackForPromise = _dereq_("./promise_resolver.js")
    ._nodebackForPromise;
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/iWrZbw\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";

    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL","'use strict';                            \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise);                      \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
        "
        .replace("Parameters", parameterDeclaration(newParameterCount))
        .replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode))(
            Promise,
            fn,
            receiver,
            withAppended,
            maybeWrapAsError,
            nodebackForPromise,
            util.tryCatch,
            util.errorObj,
            util.notEnumerableProp,
            INTERNAL
        );
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        if (promisifier === makeNodePromisified) {
            obj[promisifiedKey] =
                makeNodePromisified(key, THIS, key, fn, suffix);
        } else {
            var promisified = promisifier(fn, function() {
                return makeNodePromisified(key, THIS, key, fn, suffix);
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj[promisifiedKey] = promisified;
        }
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver) {
    return makeNodePromisified(callback, receiver, undefined, callback);
}

Promise.promisify = function (fn, receiver) {
    if (typeof fn !== "function") {
        throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    if (isPromisified(fn)) {
        return fn;
    }
    var ret = promisify(fn, arguments.length < 2 ? THIS : receiver);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/9ITlV0\u000a");
    }
    options = Object(options);
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/8FZo5V\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier);
            promisifyAll(value, suffix, filter, promisifier);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier);
};
};


},{"./errors":13,"./promise_resolver.js":25,"./util.js":38}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var isObject = util.isObject;
var es5 = _dereq_("./es5.js");

function PropertiesPromiseArray(obj) {
    var keys = es5.keys(obj);
    var len = keys.length;
    var values = new Array(len * 2);
    for (var i = 0; i < len; ++i) {
        var key = keys[i];
        values[i] = obj[key];
        values[i + len] = key;
    }
    this.constructor$(values);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {
    this._init$(undefined, -3) ;
};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val = {};
        var keyOffset = this.length();
        for (var i = 0, len = this.length(); i < len; ++i) {
            val[this._values[i + keyOffset]] = this._values[i];
        }
        this._resolve(val);
    }
};

PropertiesPromiseArray.prototype._promiseProgressed = function (value, index) {
    this._promise._progress({
        key: this._values[index + this.length()],
        value: value
    });
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/OsFKC8\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 4);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5.js":14,"./util.js":38}],28:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype._unshiftOne = function(value) {
    var capacity = this._capacity;
    this._checkCapacity(this.length() + 1);
    var front = this._front;
    var i = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = value;
    this._front = i;
    this._length = this.length() + 1;
};

Queue.prototype.unshift = function(fn, receiver, arg) {
    this._unshiftOne(arg);
    this._unshiftOne(receiver);
    this._unshiftOne(fn);
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],29:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var isArray = _dereq_("./util.js").isArray;

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else if (!isArray(promises)) {
        return apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 4 | 1);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util.js":38}],30:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
function ReductionPromiseArray(promises, fn, accum, _each) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    this._preservedValues = _each === INTERNAL ? [] : null;
    this._zerothIsAccum = (accum === undefined);
    this._gotAccum = false;
    this._reducingIndex = (this._zerothIsAccum ? 1 : 0);
    this._valuesPhase = undefined;
    var maybePromise = tryConvertToPromise(accum, this._promise);
    var rejected = false;
    var isPromise = maybePromise instanceof Promise;
    if (isPromise) {
        maybePromise = maybePromise._target();
        if (maybePromise._isPending()) {
            maybePromise._proxyPromiseArray(this, -1);
        } else if (maybePromise._isFulfilled()) {
            accum = maybePromise._value();
            this._gotAccum = true;
        } else {
            this._reject(maybePromise._reason());
            rejected = true;
        }
    }
    if (!(isPromise || this._zerothIsAccum)) this._gotAccum = true;
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._accum = accum;
    if (!rejected) async.invoke(init, this, undefined);
}
function init() {
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._init = function () {};

ReductionPromiseArray.prototype._resolveEmptyArray = function () {
    if (this._gotAccum || this._zerothIsAccum) {
        this._resolve(this._preservedValues !== null
                        ? [] : this._accum);
    }
};

ReductionPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    values[index] = value;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var isEach = preservedValues !== null;
    var gotAccum = this._gotAccum;
    var valuesPhase = this._valuesPhase;
    var valuesPhaseIndex;
    if (!valuesPhase) {
        valuesPhase = this._valuesPhase = new Array(length);
        for (valuesPhaseIndex=0; valuesPhaseIndex<length; ++valuesPhaseIndex) {
            valuesPhase[valuesPhaseIndex] = 0;
        }
    }
    valuesPhaseIndex = valuesPhase[index];

    if (index === 0 && this._zerothIsAccum) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
        valuesPhase[index] = ((valuesPhaseIndex === 0)
            ? 1 : 2);
    } else if (index === -1) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
    } else {
        if (valuesPhaseIndex === 0) {
            valuesPhase[index] = 1;
        } else {
            valuesPhase[index] = 2;
            this._accum = value;
        }
    }
    if (!gotAccum) return;

    var callback = this._callback;
    var receiver = this._promise._boundValue();
    var ret;

    for (var i = this._reducingIndex; i < length; ++i) {
        valuesPhaseIndex = valuesPhase[i];
        if (valuesPhaseIndex === 2) {
            this._reducingIndex = i + 1;
            continue;
        }
        if (valuesPhaseIndex !== 1) return;
        value = values[i];
        this._promise._pushContext();
        if (isEach) {
            preservedValues.push(value);
            ret = tryCatch(callback).call(receiver, value, i, length);
        }
        else {
            ret = tryCatch(callback)
                .call(receiver, this._accum, value, i, length);
        }
        this._promise._popContext();

        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                valuesPhase[i] = 4;
                return maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }

        this._reducingIndex = i + 1;
        this._accum = ret;
    }

    this._resolve(isEach ? preservedValues : this._accum);
};

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};
};

},{"./async.js":2,"./util.js":38}],31:[function(_dereq_,module,exports){
"use strict";
var schedule;
var util = _dereq_("./util");
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
};
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            window.navigator.standalone)) {
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new MutationObserver(fn);
        observer.observe(div, {attributes: true});
        return function() { div.classList.toggle("foo"); };
    };
    schedule.isStatic = true;
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":38}],32:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util.js");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 268435456;
    ret._settledValue = value;
    this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 134217728;
    ret._settledValue = reason;
    this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return new SettledPromiseArray(this).promise();
};
};

},{"./util.js":38}],33:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util.js");
var RangeError = _dereq_("./errors.js").RangeError;
var AggregateError = _dereq_("./errors.js").AggregateError;
var isArray = util.isArray;


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
    }

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            e.push(this._values[i]);
        }
        this._reject(e);
    }
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/1wAmHx\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors.js":13,"./util.js":38}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValue = promise._settledValue;
    }
    else {
        this._bitField = 0;
        this._settledValue = undefined;
    }
}

PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.isFulfilled =
Promise.prototype._isFulfilled = function () {
    return (this._bitField & 268435456) > 0;
};

PromiseInspection.prototype.isRejected =
Promise.prototype._isRejected = function () {
    return (this._bitField & 134217728) > 0;
};

PromiseInspection.prototype.isPending =
Promise.prototype._isPending = function () {
    return (this._bitField & 402653184) === 0;
};

PromiseInspection.prototype.isResolved =
Promise.prototype._isResolved = function () {
    return (this._bitField & 402653184) > 0;
};

Promise.prototype.isPending = function() {
    return this._target()._isPending();
};

Promise.prototype.isRejected = function() {
    return this._target()._isRejected();
};

Promise.prototype.isFulfilled = function() {
    return this._target()._isFulfilled();
};

Promise.prototype.isResolved = function() {
    return this._target()._isResolved();
};

Promise.prototype._value = function() {
    return this._settledValue;
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue;
};

Promise.prototype.value = function() {
    var target = this._target();
    if (!target.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return target._settledValue;
};

Promise.prototype.reason = function() {
    var target = this._target();
    if (!target.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    target._unsetRejectionIsUnhandled();
    return target._settledValue;
};


Promise.PromiseInspection = PromiseInspection;
};

},{}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) {
            return obj;
        }
        else if (isAnyBluebirdPromise(obj)) {
            var ret = new Promise(INTERNAL);
            obj._then(
                ret._fulfillUnchecked,
                ret._rejectUncheckedCheckError,
                ret._progressUnchecked,
                ret,
                null
            );
            return ret;
        }
        var then = util.tryCatch(getThen)(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function getThen(obj) {
    return obj.then;
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    return hasProp.call(obj, "_promise0");
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x,
                                        resolveFromThenable,
                                        rejectFromThenable,
                                        progressFromThenable);
    synchronous = false;
    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolveFromThenable(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function rejectFromThenable(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }

    function progressFromThenable(value) {
        if (!promise) return;
        if (typeof promise._progress === "function") {
            promise._progress(value);
        }
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util.js":38}],36:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function (promise, message) {
    if (!promise.isPending()) return;
    
    var err;
    if(!util.isPrimitive(message) && (message instanceof Error)) {
        err = message;
    } else {
        if (typeof message !== "string") {
            message = "operation timed out";
        }
        err = new TimeoutError(message);
    }
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._cancel(err);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (value, ms) {
    if (ms === undefined) {
        ms = value;
        value = undefined;
        var ret = new Promise(INTERNAL);
        setTimeout(function() { ret._fulfill(); }, ms);
        return ret;
    }
    ms = +ms;
    return Promise.resolve(value)._then(afterValue, null, null, ms, undefined);
};

Promise.prototype.delay = function (ms) {
    return delay(this, ms);
};

function successClear(value) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    return value;
}

function failureClear(reason) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret = this.then().cancellable();
    ret._cancellationParent = this;
    var handle = setTimeout(function timeoutTimeout() {
        afterTimeout(ret, message);
    }, ms);
    return ret._then(successClear, failureClear, undefined, handle, undefined);
};

};

},{"./util.js":38}],37:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext) {
    var TypeError = _dereq_("./errors.js").TypeError;
    var inherits = _dereq_("./util.js").inherits;
    var PromiseInspection = Promise.PromiseInspection;

    function inspectionMapper(inspections) {
        var len = inspections.length;
        for (var i = 0; i < len; ++i) {
            var inspection = inspections[i];
            if (inspection.isRejected()) {
                return Promise.reject(inspection.error());
            }
            inspections[i] = inspection._settledValue;
        }
        return inspections;
    }

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = Promise.defer();
        function iterator() {
            if (i >= len) return ret.resolve();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret.promise;
    }

    function disposerSuccess(value) {
        var inspection = new PromiseInspection();
        inspection._settledValue = value;
        inspection._bitField = 268435456;
        return dispose(this, inspection).thenReturn(value);
    }

    function disposerFail(reason) {
        var inspection = new PromiseInspection();
        inspection._settledValue = reason;
        inspection._bitField = 134217728;
        return dispose(this, inspection).thenThrow(reason);
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return null;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== null
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
            input = arguments[0];
            len = input.length;
            spreadArgs = false;
        } else {
            input = arguments;
            len--;
        }
        var resources = new Array(len);
        for (var i = 0; i < len; ++i) {
            var resource = input[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var promise = Promise.settle(resources)
            .then(inspectionMapper)
            .then(function(vals) {
                promise._pushContext();
                var ret;
                try {
                    ret = spreadArgs
                        ? fn.apply(undefined, vals) : fn.call(undefined,  vals);
                } finally {
                    promise._popContext();
                }
                return ret;
            })
            ._then(
                disposerSuccess, disposerFail, undefined, resources, undefined);
        resources.promise = promise;
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 262144;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 262144) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~262144);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors.js":13,"./util.js":38}],38:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var canEvaluate = typeof navigator == "undefined";
var haveGetters = (function(){
    try {
        var o = {};
        es5.defineProperty(o, "f", {
            get: function () {
                return 3;
            }
        });
        return o.f === 3;
    }
    catch (e) {
        return false;
    }

})();

var errorObj = {e: {}};
var tryCatchTarget;
function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return !isPrimitive(value);
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function f() {}
    f.prototype = obj;
    var l = 8;
    while (l--) new f();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return obj instanceof Error && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    haveGetters: haveGetters,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
                 typeof chrome.loadTimes === "function",
    isNode: typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]"
};
ret.isRecentNode = ret.isNode && (function() {
    var version = process.versions.node.split(".").map(Number);
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5.js":14}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":92}],87:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":88,"ieee754":89,"is-array":90}],88:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],89:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],90:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],91:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],92:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],93:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.3.2 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],94:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],95:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],96:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":94,"./encode":95}],97:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = this.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      this.hostname = newOut.join('.');
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  Object.keys(this).forEach(function(k) {
    result[k] = this[k];
  }, this);

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    Object.keys(relative).forEach(function(k) {
      if (k !== 'protocol')
        result[k] = relative[k];
    });

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      Object.keys(relative).forEach(function(k) {
        result[k] = relative[k];
      });
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

function isString(arg) {
  return typeof arg === "string";
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return  arg == null;
}

},{"punycode":93,"querystring":96}],98:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],99:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":98,"_process":92,"inherits":91}],100:[function(require,module,exports){
'use strict';

require('array.prototype.find');
require('array.prototype.findindex');

var FDBFactory = require('./lib/FDBFactory');

module.exports = new FDBFactory();
},{"./lib/FDBFactory":107,"array.prototype.find":133,"array.prototype.findindex":134}],101:[function(require,module,exports){
'use strict';

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-database
module.exports = function (name, version) {
    this.deletePending = false;
    this.transactions = [];
    this.rawObjectStores = {};
    this.connections = [];

    this.name = name;
    this.version = version;

    this.processTransactions = function () {
        setImmediate(function () {
            var anyRunning = this.transactions.some(function (transaction) {
                return transaction._started && !transaction._finished;
            });

            if (!anyRunning) {
                var next = this.transactions.find(function (transaction) {
                    return !transaction._started && !transaction._finished;
                });

                if (next) {
                    next._start();

                    next.addEventListener('complete', this.processTransactions.bind(this));
                    next.addEventListener('abort', this.processTransactions.bind(this));
                }
            }
        }.bind(this));
    };
};
},{}],102:[function(require,module,exports){
'use strict';

module.exports = function (type, eventInitDict) {
    this._eventPath = [];

    // Flags
    this._stopPropagation = false;
    this._stopImmediatePropagation = false;
    this._canceled = false;
    this._initialized = true;
    this._dispatch = false;

    this.type = type;
    this.target = null;
    this.currentTarget = null;

    this.NONE = 0;
    this.CAPTURING_PHASE = 1;
    this.AT_TARGET = 2;
    this.BUBBLING_PHASE = 3;
    this.eventPhase = this.NONE;

    this.stopPropagation = function () {
        this._stopPropagation = true;
    }.bind(this);
    this.stopImmediatePropagation = function () {
        this._stopPropagation = true;
        this._stopImmediatePropagation = true;
    }.bind(this);

    eventInitDict = eventInitDict !== undefined ? eventInitDict : {};
    this.bubbles = eventInitDict.bubbles !== undefined ? eventInitDict.bubbles : false;
    this.cancelable = eventInitDict.cancelable !== undefined ? eventInitDict.cancelable : false;
    this.preventDefault = function () {
        if (this.cancelable) {
            this._canceled = true;
        }
    }.bind(this);
    this.defaultPrevented = false;

    this.isTrusted = false;
    this.timestamp = Date.now();
};
},{}],103:[function(require,module,exports){
'use strict';

var InvalidStateError = require('./errors/InvalidStateError');

function stop(event, listener) {
    return event._stopImmediatePropagation ||
           (event.eventPhase === event.CAPTURING_PHASE && listener.capture === false) ||
           (event.eventPhase === event.BUBBLING_PHASE && listener.capture === true);
}

// http://www.w3.org/TR/dom/#concept-event-listener-invoke
function invokeEventListeners(event, obj) {
    event.currentTarget = obj;

    obj._listeners.forEach(function (listener) {
        if (event.type !== listener.type || stop(event, listener)) {
            return;
        }

        listener.callback.call(event.currentTarget, event);
    });

    if (event.currentTarget['on' + event.type]) {
        var listener = {
            type: event.type,
            callback: event.currentTarget['on' + event.type],
            capture: false
        };
        if (stop(event, listener)) {
            return;
        }
        listener.callback.call(event.currentTarget, event);
    }
}

module.exports = function () {
    this._listeners = [];

    this.addEventListener = function (type, callback, capture) {
        if (callback === null) { return; }
        capture = capture !== undefined ? capture : false;

        this._listeners.push({
            type: type,
            callback: callback,
            capture: capture
        });
    };

    this.removeEventListener = function (type, callback, capture) {
        capture = capture !== undefined ? capture : false;

        var i = this._listeners.findIndex(function (listener) {
            return listener.type === type &&
                   listener.callback === callback &&
                   listener.capture === capture;
        });

        this._listeners.splice(i, 1);
    };

    // http://www.w3.org/TR/dom/#dispatching-events
    this.dispatchEvent = function (event) {
        if (event._dispatch || !event._initialized) {
            throw new InvalidStateError('The object is in an invalid state.');
        }
        event._isTrusted = false;

        event._dispatch = true;
        event.target = this;
// NOT SURE WHEN THIS SHOULD BE SET        event._eventPath = [];

        event.eventPhase = event.CAPTURING_PHASE;
        event._eventPath.forEach(function (obj) {
            if (!event._stopPropagation) {
                invokeEventListeners(event, obj);
            }
        });

        event.eventPhase = event.AT_TARGET;
        if (!event._stopPropagation) {
            invokeEventListeners(event, event.target);
        }

        if (event.bubbles) {
            event._eventPath.reverse();
            event.eventPhase = event.BUBBLING_PHASE;
            event._eventPath.forEach(function (obj) {
                if (!event._stopPropagation) {
                    invokeEventListeners(event, obj);
                }
            });
        }

        event._dispatch = false;
        event.eventPhase = event.NONE;
        event.currentTarget = null;

        if (event._canceled) {
            return false;
        }
        return true;
    };
};
},{"./errors/InvalidStateError":124}],104:[function(require,module,exports){
'use strict';

var structuredClone = require('./structuredClone');
var FDBKeyRange = require('./FDBKeyRange');
var DataError = require('./errors/DataError');
var InvalidStateError = require('./errors/InvalidStateError');
var ReadOnlyError = require('./errors/ReadOnlyError');
var TransactionInactiveError = require('./errors/TransactionInactiveError');
var cmp = require('./cmp');
var extractKey = require('./extractKey');
var validateKey = require('./validateKey');

function getEffectiveObjectStore(cursor) {
    if (cursor.source.hasOwnProperty('_rawIndex')) {
        return cursor.source.objectStore;
    }
    return cursor.source;
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#cursor
module.exports = function (source, range, direction, request) {
    this._gotValue = false;
    this._range = range;
    this._position = undefined; // Key of previously returned record
    this._objectStorePosition = undefined;
    this._request = request;

// Not sure if this is a good way to make things readonly. Messy if other classes need to update a value that is to be presented to the user as readonly, like FDBCursorWithValue.value
    var ro = {
        source: source,
        direction: direction !== undefined ? direction : 'next',
        key: undefined,
        primaryKey: undefined
    };
    Object.defineProperty(this, 'source', {
        get: function () {
            return ro.source;
        }
    });
    Object.defineProperty(this, 'direction', {
        get: function () {
            return ro.direction;
        }
    });
    Object.defineProperty(this, 'key', {
        get: function () {
            return ro.key;
        }
    });
    Object.defineProperty(this, 'primaryKey', {
        get: function () {
            return ro.primaryKey;
        }
    });

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-iterating-a-cursor
    this._iterate = function (key) {
        var sourceIsObjectStore = !this.source.hasOwnProperty('_rawIndex');

        var records;
        if (sourceIsObjectStore) {
            records = this.source._rawObjectStore.records;
        } else {
            records = this.source._rawIndex.records;
        }

        var foundRecord;
        if (this.direction === "next") {
            foundRecord = records.find(function (record) {
                if (key !== undefined) {
                    if (cmp(record.key, key) === -1) {
                        return false;
                    }
                }
                if (this._position !== undefined && sourceIsObjectStore) {
                    if (cmp(record.key, this._position) !== 1) {
                        return false;
                    }
                }
                if (this._position !== undefined && !sourceIsObjectStore) {
                    var cmpResult = cmp(record.key, this._position);
                    if (cmpResult === -1) {
                        return false;
                    }
                    if (cmpResult === 0 && cmp(record.value, this._objectStorePosition) !== 1) {
                        return false;
                    }
                }
                if (this._range !== undefined) {
                    if (!FDBKeyRange.check(this._range, record.key)) {
                        return false;
                    }
                }
                return true;
            }.bind(this));
        } else if (this.direction === "nextunique") {
            foundRecord = records.find(function (record) {
                if (key !== undefined) {
                    if (cmp(record.key, key) === -1) {
                        return false;
                    }
                }
                if (this._position !== undefined) {
                    if (cmp(record.key, this._position) !== 1) {
                        return false;
                    }
                }
                if (this._range !== undefined) {
                    if (!FDBKeyRange.check(this._range, record.key)) {
                        return false;
                    }
                }
                return true;
            }.bind(this));
        } else if (this.direction === "prev") {
            foundRecord = records.reverse().find(function (record) {
                if (key !== undefined) {
                    if (cmp(record.key, key) === 1) {
                        return false;
                    }
                }
                if (this._position !== undefined && sourceIsObjectStore) {
                    if (cmp(record.key, this._position) !== -1) {
                        return false;
                    }
                }
                if (this._position !== undefined && !sourceIsObjectStore) {
                    var cmpResult = cmp(record.key, this._position);
                    if (cmpResult === 1) {
                        return false;
                    }
                    if (cmpResult === 0 && cmp(record.value, this._objectStorePosition) !== -1) {
                        return false;
                    }
                }
                if (this._range !== undefined) {
                    if (!FDBKeyRange.check(this._range, record.key)) {
                        return false;
                    }
                }
                return true;
            }.bind(this));
            records.reverse();
        } else if (this.direction === "prevunique") {
            var tempRecord = records.reverse().find(function (record) {
                if (key !== undefined) {
                    if (cmp(record.key, key) === 1) {
                        return false;
                    }
                }
                if (this._position !== undefined) {
                    if (cmp(record.key, this._position) !== -1) {
                        return false;
                    }
                }
                if (this._range !== undefined) {
                    if (!FDBKeyRange.check(this._range, record.key)) {
                        return false;
                    }
                }
                return true;
            }.bind(this));
            records.reverse();


            if (tempRecord) {
                foundRecord = records.find(function (record) {
                    return cmp(record.key, tempRecord.key) === 0;
                });
            }
        }

        var result;
        if (!foundRecord) {
            ro.key = undefined;
            if (!sourceIsObjectStore) { this._objectStorePosition = undefined; }
            this.value = undefined;
            result = null;
        } else {
            this._position = foundRecord.key;
            if (!sourceIsObjectStore) { this._objectStorePosition = foundRecord.value; }
            ro.key = foundRecord.key;
            if (sourceIsObjectStore) {
                this.value = structuredClone(foundRecord.value);
            } else {
                this.value = structuredClone(this.source.objectStore._rawObjectStore.getValue(foundRecord.value));
                ro.primaryKey = structuredClone(foundRecord.value);
            }
            this._gotValue = true;
            result = this;
        }

        return result;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-update-IDBRequest-any-value
    this.update = function (value) {
        if (value === undefined) { throw new TypeError(); }

        var effectiveObjectStore = getEffectiveObjectStore(this);
        var effectiveKey = this.source.hasOwnProperty('_rawIndex') ? this.primaryKey : this._position;
        var transaction = effectiveObjectStore.transaction;

        if (transaction.mode === 'readonly') {
            throw new ReadOnlyError();
        }

        if (!transaction._active) {
            throw new TransactionInactiveError();
        }

        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new InvalidStateError();
        }

        if (!this._gotValue || !this.hasOwnProperty('value')) {
            throw new InvalidStateError();
        }

        if (effectiveObjectStore.keyPath !== null) {
            var tempKey;

            try {
                tempKey = extractKey(effectiveObjectStore.keyPath, value);
            } catch (err) { /* Handled immediately below */ }

            if (tempKey !== effectiveKey) {
                throw new DataError();
            }
        }

        var record = {
            key: effectiveKey,
            value: structuredClone(value)
        };

        return transaction._execRequestAsync({
            source: this,
            operation: effectiveObjectStore._rawObjectStore.storeRecord.bind(effectiveObjectStore._rawObjectStore, record, false, transaction._rollbackLog)
        });
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-advance-void-unsigned-long-count
    this.advance = function (count) {
        if (!Number.isInteger(count) || count <= 0) { throw new TypeError(); }

        var effectiveObjectStore = getEffectiveObjectStore(this);
        var transaction = effectiveObjectStore.transaction;

        if (!transaction._active) {
            throw new TransactionInactiveError();
        }

        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new InvalidStateError();
        }

        if (!this._gotValue) {
            throw new InvalidStateError();
        }

        this._request.readyState = 'pending';
        transaction._execRequestAsync({
            source: this.source,
            operation: function () {
                var result;
                for (var i = 0; i < count; i++) {
                    result = this._iterate();

                    // Not sure why this is needed
                    if (!result) {
                        break;
                    }
                }
                return result;
            }.bind(this),
            request: this._request
        });

        this._gotValue = false;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-continue-void-any-key
    this.continue = function (key) {
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var transaction = effectiveObjectStore.transaction;

        if (!transaction._active) {
            throw new TransactionInactiveError();
        }

        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new InvalidStateError();
        }

        if (!this._gotValue) {
            throw new InvalidStateError();
        }

        if (key !== undefined) {
            validateKey(key);

            var cmpResult = cmp(key, this._position);

            if ((cmpResult <= 0 && (this.direction === 'next' || this.direction === 'nextunique')) ||
                (cmpResult >= 0 && (this.direction === 'prev' || this.direction === 'prevunique'))) {
                throw new DataError();
            }
        }

        this._request.readyState = 'pending';
        transaction._execRequestAsync({
            source: this.source,
            operation: this._iterate.bind(this, key),
            request: this._request
        });

        this._gotValue = false;
    };

    this.delete = function () {
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var effectiveKey = this.source.hasOwnProperty('_rawIndex') ? this.primaryKey : this._position;
        var transaction = effectiveObjectStore.transaction;

        if (transaction.mode === 'readonly') {
            throw new ReadOnlyError();
        }

        if (!transaction._active) {
            throw new TransactionInactiveError();
        }

        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new InvalidStateError();
        }

        if (!this._gotValue || !this.hasOwnProperty('value')) {
            throw new InvalidStateError();
        }

        return transaction._execRequestAsync({
            source: this,
            operation: effectiveObjectStore._rawObjectStore.deleteRecord.bind(effectiveObjectStore._rawObjectStore, effectiveKey, transaction._rollbackLog)
        });
    };

    this.toString = function () {
        return '[object IDBCursor]';
    };
};
},{"./FDBKeyRange":109,"./cmp":118,"./errors/DataError":122,"./errors/InvalidStateError":124,"./errors/ReadOnlyError":126,"./errors/TransactionInactiveError":127,"./extractKey":129,"./structuredClone":130,"./validateKey":131}],105:[function(require,module,exports){
'use strict';

var util = require('util');
var FDBCursor = require('./FDBCursor');

function FDBCursorWithValue() {
    FDBCursor.apply(this, arguments);

    this.value = undefined;

    this.toString = function () {
        return '[object IDBCursorWithValue]';
    };
}
util.inherits(FDBCursorWithValue, FDBCursor);

module.exports = FDBCursorWithValue;
},{"./FDBCursor":104,"util":99}],106:[function(require,module,exports){
'use strict';

var util = require('util');
var EventTarget = require('./EventTarget');
var FDBTransaction = require('./FDBTransaction');
var ObjectStore = require('./ObjectStore');
var ConstraintError = require('./errors/ConstraintError');
var InvalidAccessError = require('./errors/InvalidAccessError');
var InvalidStateError = require('./errors/InvalidStateError');
var NotFoundError = require('./errors/NotFoundError');
var TransactionInactiveError = require('./errors/TransactionInactiveError');
var validateKeyPath = require('./validateKeyPath');

function confirmActiveVersionchangeTransaction(database) {
    if (!database._runningVersionchangeTransaction) {
        throw new InvalidStateError();
    }

    var transaction = database._rawDatabase.transactions.find(function (transaction) {
        return transaction._active && transaction.mode === 'versionchange';
    });
    if (!transaction) {
        throw new TransactionInactiveError();
    }

    return transaction;
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#database-closing-steps
function closeConnection(connection) {
    connection._closePending = true;

    var transactionsComplete = connection._rawDatabase.transactions.every(function (transaction) {
        return transaction._finished;
    });

    if (transactionsComplete) {
        connection._closed = true;
        connection._rawDatabase.connections = connection._rawDatabase.connections.filter(function (otherConnection) {
            return connection !== otherConnection;
        });
    } else {
        setImmediate(function () {
            closeConnection(connection);
        });
    }
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#database-interface
function FDBDatabase(rawDatabase) {
    EventTarget.call(this);

    this._closePending = false;
    this._closed = false;
    this._runningVersionchangeTransaction = false;
    this._rawDatabase = rawDatabase;
    this._rawDatabase.connections.push(this);

    this.name = rawDatabase.name;
    this.version = rawDatabase.version;
    this.objectStoreNames = Object.keys(rawDatabase.rawObjectStores).sort();

    this.createObjectStore = function (name, optionalParameters) {
        if (name === undefined) { throw new TypeError(); }
        var transaction = confirmActiveVersionchangeTransaction(this);

        if (this._rawDatabase.rawObjectStores.hasOwnProperty(name)) {
            throw new ConstraintError();
        }

        optionalParameters = optionalParameters || {};
        var keyPath = optionalParameters.keyPath !== undefined ? optionalParameters.keyPath : null;
        var autoIncrement = optionalParameters.autoIncrement !== undefined ? optionalParameters.autoIncrement : false;

        if (keyPath !== null) {
            validateKeyPath(keyPath);
        }

        if (autoIncrement && (keyPath === '' || Array.isArray(keyPath))) {
            throw new InvalidAccessError();
        }

        transaction._rollbackLog.push(function (objectStoreNames) {
            this.objectStoreNames = objectStoreNames;
            delete this._rawDatabase.rawObjectStores[name];
        }.bind(this, this.objectStoreNames.slice()));

        var objectStore = new ObjectStore(this._rawDatabase, name, keyPath, autoIncrement);
        this.objectStoreNames.push(name);
        this.objectStoreNames.sort();
        this._rawDatabase.rawObjectStores[name] = objectStore;

        return transaction.objectStore(name);
    };

    this.deleteObjectStore = function (name) {
        if (name === undefined) { throw new TypeError(); }
        var transaction = confirmActiveVersionchangeTransaction(this);

        if (!this._rawDatabase.rawObjectStores.hasOwnProperty(name)) {
            throw new NotFoundError();
        }

        this.objectStoreNames = this.objectStoreNames.filter(function (objectStoreName) {
            return objectStoreName !== name;
        });

        transaction._rollbackLog.push(function (store) {
            store.deleted = false;
            this._rawDatabase.rawObjectStores[name] = store;
            this.objectStoreNames.push(name);
            this.objectStoreNames.sort();
        }.bind(this, this._rawDatabase.rawObjectStores[name]));

        this._rawDatabase.rawObjectStores[name].deleted = true;
        delete this._rawDatabase.rawObjectStores[name];
    };

    this.transaction = function (storeNames, mode) {
        mode = mode !== undefined ? mode : 'readonly';
        if (mode !== 'readonly' && mode !== 'readwrite' && mode !== 'versionchange') {
            throw new TypeError('Invalid mode: ' + mode);
        }

        var hasActiveVersionchange = this._rawDatabase.transactions.some(function (transaction) {
            return transaction._active && transaction.mode === 'versionchange';
        });
        if (hasActiveVersionchange) {
            throw new InvalidStateError();
        }

        if (this._closePending) {
            throw new InvalidStateError();
        }

        if (!Array.isArray(storeNames)) {
            storeNames = [storeNames];
        }
        if (storeNames.length === 0 && mode !== 'versionchange') {
            throw new InvalidAccessError();
        }
        storeNames.forEach(function (storeName) {
            if (this.objectStoreNames.indexOf(storeName) < 0) {
                throw new NotFoundError('No objectStore named ' + storeName + ' in this database');
            }
        }.bind(this));

        var tx = new FDBTransaction(storeNames, mode);
        tx.db = this;
        this._rawDatabase.transactions.push(tx);
        this._rawDatabase.processTransactions(); // See if can start right away (async)

        return tx;
    };

    this.close = function () {
        closeConnection(this);
    };

    this.toString = function () {
        return '[object IDBDatabase]';
    };
}
util.inherits(FDBDatabase, EventTarget);

module.exports = FDBDatabase;
},{"./EventTarget":103,"./FDBTransaction":113,"./ObjectStore":117,"./errors/ConstraintError":120,"./errors/InvalidAccessError":123,"./errors/InvalidStateError":124,"./errors/NotFoundError":125,"./errors/TransactionInactiveError":127,"./validateKeyPath":132,"util":99}],107:[function(require,module,exports){
'use strict';

var Event = require('./Event');
var Database = require('./Database');
var FDBOpenDBRequest = require('./FDBOpenDBRequest');
var FDBDatabase = require('./FDBDatabase');
var FDBVersionChangeEvent = require('./FDBVersionChangeEvent');
var AbortError = require('./errors/AbortError');
var VersionError = require('./errors/VersionError');
var cmp = require('./cmp');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-deleting-a-database
function deleteDatabase(databases, name, request, cb) {
    try {
        var db;
        if (databases.hasOwnProperty(name)) {
            db = databases[name];
        } else {
            cb();
            return;
        }

        db.deletePending = true;

        var openDatabases = db.connections.filter(function (connection) {
            return !connection._closed;
        });

        openDatabases.forEach(function (openDatabase) {
            if (!openDatabase._closePending) {
                var event = new FDBVersionChangeEvent('versionchange', {
                    oldVersion: db.version,
                    newVersion: null
                });
                openDatabase.dispatchEvent(event);
            }
        });

        var anyOpen = openDatabases.some(function (openDatabase) {
            return !openDatabase._closed;
        });

        if (request && anyOpen) {
            var event = new FDBVersionChangeEvent('blocked', {
                oldVersion: db.version,
                newVersion: null
            });
            request.dispatchEvent(event);
        }
    } catch (err) {
        cb(err);
    }

    var waitForOthersClosed = function () {
        var anyOpen = openDatabases.some(function (openDatabase) {
            return !openDatabase._closed;
        });

        if (anyOpen) {
            setImmediate(waitForOthersClosed);
            return;
        }

        delete databases[name];

        cb();
    };

    waitForOthersClosed();
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-running-a-versionchange-transaction
function runVersionchangeTransaction(connection, version, request, cb) {
    connection._runningVersionchangeTransaction = true;

    var oldVersion = connection.version;

    var openDatabases = connection._rawDatabase.connections.filter(function (otherDatabase) {
        return connection !== otherDatabase;
    });

    openDatabases.forEach(function (openDatabase) {
        if (!openDatabase._closed) {
            var event = new FDBVersionChangeEvent('versionchange', {
                oldVersion: oldVersion,
                newVersion: version
            });
            openDatabase.dispatchEvent(event);
        }
    });

    var anyOpen = openDatabases.some(function (openDatabase) {
        return !openDatabase._closed;
    });

    if (anyOpen) {
        var event = new FDBVersionChangeEvent('blocked', {
            oldVersion: oldVersion,
            newVersion: version
        });
        request.dispatchEvent(event);
    }

    var waitForOthersClosed = function () {
        var anyOpen = openDatabases.some(function (openDatabase) {
            return !openDatabase._closed;
        });

        if (anyOpen) {
            setImmediate(waitForOthersClosed);
            return;
        }

//  Set the version of database to version. This change is considered part of the transaction, and so if the transaction is aborted, this change is reverted.
        connection._rawDatabase.version = version;
        connection.version = version;

// Get rid of this setImmediate?
        var transaction = connection.transaction(connection.objectStoreNames, 'versionchange');
        request.result = connection;
        request.transaction = transaction;

        transaction._rollbackLog.push(function () {
            connection._rawDatabase.version = oldVersion;
            connection.version = oldVersion;
        });

        var event = new FDBVersionChangeEvent('upgradeneeded', {
            oldVersion: oldVersion,
            newVersion: version
        });
        request.dispatchEvent(event);

        request.readyState = 'done';

        transaction.addEventListener('error', function () {
            connection._runningVersionchangeTransaction = false;
//throw arguments[0].target.error;
//console.log('error in versionchange transaction - not sure if anything needs to be done here', e.target.error.name);
        });
        transaction.addEventListener('abort', function () {
            connection._runningVersionchangeTransaction = false;
            request.transaction = null;
            setImmediate(function () {
                cb(new AbortError());
            });
        });
        transaction.addEventListener('complete', function () {
            connection._runningVersionchangeTransaction = false;
            request.transaction = null;
            // Let other complete event handlers run before continuing
            setImmediate(function () {
                if (connection._closePending) {
                    cb(new AbortError());
                } else {
                    cb(null);
                }
            });
        });
    };

    waitForOthersClosed();
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-opening-a-database
function openDatabase(databases, name, version, request, cb) {
    var db;
    if (databases.hasOwnProperty(name)) {
        db = databases[name];
    } else {
        db = new Database(name, 0);
        databases[name] = db;
    }

    if (version === undefined) {
        version = db.version !== 0 ? db.version : 1;
    }

    if (db.version > version) {
        return cb(new VersionError());
    }

    var connection = new FDBDatabase(databases[name]);

    if (db.version < version) {
        runVersionchangeTransaction(connection, version, request, function (err) {
            if (err) {
// DO THIS HERE: ensure that connection is closed by running the steps for closing a database connection before these steps are aborted.
                return cb(err);
            }

            cb(null, connection);
        });
    } else {
        cb(null, connection);
    }
}

module.exports = function () {
    this._databases = {};

    this.cmp = cmp;

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBFactory-deleteDatabase-IDBOpenDBRequest-DOMString-name
    this.deleteDatabase = function (name) {
        var request = new FDBOpenDBRequest();
        request.source = null;

        setImmediate(function () {
            var version = this._databases.hasOwnProperty(name) ? this._databases[name].version : null;
            deleteDatabase(this._databases, name, request, function (err) {
                var event;

                if (err) {
                    request.error = new Error();
                    request.error.name = err.name;

                    event = new Event('error', {
                        bubbles: true,
                        cancelable: false
                    });
                    event._eventPath = [];
                    request.dispatchEvent(event);

                    return;
                }

                request.result = undefined;

                event = new FDBVersionChangeEvent('success', {
                    oldVersion: version,
                    newVersion: null
                });
                request.dispatchEvent(event);
            });
        }.bind(this));

        return request;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBFactory-open-IDBOpenDBRequest-DOMString-name-unsigned-long-long-version
    this.open = function (name, version) {
        if (arguments.length > 1 && (isNaN(version) || version < 1 || version >= 9007199254740992)) {
            throw new TypeError();
        }

        var request = new FDBOpenDBRequest();
        request.source = null;

        setImmediate(function () {
            openDatabase(this._databases, name, version, request, function (err, connection) {
                var event;

                if (err) {
                    request.result = undefined;

                    request.error = new Error();
                    request.error.name = err.name;

                    event = new Event('error', {
                        bubbles: true,
                        cancelable: false
                    });
                    event._eventPath = [];
                    request.dispatchEvent(event);

                    return;
                }

                request.result = connection;

                event = new Event('success');
                event._eventPath = [];
                request.dispatchEvent(event);
            });
        }.bind(this));

        return request;
    };

    this.toString = function () {
        return '[object IDBFactory]';
    };
};

},{"./Database":101,"./Event":102,"./FDBDatabase":106,"./FDBOpenDBRequest":111,"./FDBVersionChangeEvent":114,"./cmp":118,"./errors/AbortError":119,"./errors/VersionError":128}],108:[function(require,module,exports){
'use strict';

var structuredClone = require('./structuredClone');
var FDBCursor = require('./FDBCursor');
var FDBCursorWithValue = require('./FDBCursorWithValue');
var FDBKeyRange = require('./FDBKeyRange');
var FDBRequest = require('./FDBRequest');
var InvalidStateError = require('./errors/InvalidStateError');
var TransactionInactiveError = require('./errors/TransactionInactiveError');
var cmp = require('./cmp');
var validateKey = require('./validateKey');

function confirmActiveTransaction(index) {
    if (!index.objectStore.transaction._active) {
        throw new TransactionInactiveError();
    }

    if (index._rawIndex.deleted || index.objectStore._rawObjectStore.deleted) {
        throw new InvalidStateError();
    }
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#idl-def-IDBIndex
module.exports = function (objectStore, rawIndex) {
    this._rawIndex = rawIndex;

    this.name = rawIndex.name;
    this.objectStore = objectStore;
    this.keyPath = rawIndex.keyPath;
    this.multiEntry = rawIndex.multiEntry;
    this.unique = rawIndex.unique;

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-openCursor-IDBRequest-any-range-IDBCursorDirection-direction
    this.openCursor = function (range, direction) {
        confirmActiveTransaction(this);

        if (range === null) { range = undefined; }
        if (range !== undefined && !(range instanceof FDBKeyRange)) {
            range = FDBKeyRange.only(structuredClone(validateKey(range)));
        }

        var request = new FDBRequest();
        request.source = this;
        request.transaction = this.objectStore.transaction;

        var cursor = new FDBCursorWithValue(this, range, direction);
        cursor._request = request;

        return this.objectStore.transaction._execRequestAsync({
            source: this,
            operation: cursor._iterate.bind(cursor),
            request: request
        });
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-openKeyCursor-IDBRequest-any-range-IDBCursorDirection-direction
    this.openKeyCursor = function (range, direction) {
        confirmActiveTransaction(this);

        if (range === null) { range = undefined; }
        if (range !== undefined && !(range instanceof FDBKeyRange)) {
            range = FDBKeyRange.only(structuredClone(validateKey(range)));
        }

        var request = new FDBRequest();
        request.source = this;
        request.transaction = this.objectStore.transaction;

        var cursor = new FDBCursor(this, range, direction);
        cursor._request = request;

        return this.objectStore.transaction._execRequestAsync({
            source: this,
            operation: cursor._iterate.bind(cursor),
            request: request
        });
    };

    this.get = function (key) {
        confirmActiveTransaction(this);

        if (!(key instanceof FDBKeyRange)) {
            key = structuredClone(validateKey(key));
        }

        return this.objectStore.transaction._execRequestAsync({
            source: this,
            operation: this._rawIndex.getValue.bind(this._rawIndex, key)
        });
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-getKey-IDBRequest-any-key
    this.getKey = function (key) {
        confirmActiveTransaction(this);

        if (!(key instanceof FDBKeyRange)) {
            key = structuredClone(validateKey(key));
        }

        return this.objectStore.transaction._execRequestAsync({
            source: this,
            operation: this._rawIndex.getKey.bind(this._rawIndex, key)
        });
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-count-IDBRequest-any-key
    this.count = function (key) {
        confirmActiveTransaction(this);

        if (key !== undefined && !(key instanceof FDBKeyRange)) {
            key = structuredClone(validateKey(key));
        }

// Should really use a cursor under the hood
        return this.objectStore.transaction._execRequestAsync({
            source: this,
            operation: function () {
                var count;

                if (key instanceof FDBKeyRange) {
                    count = 0;
                    this._rawIndex.records.forEach(function (record) {
                        if (FDBKeyRange.check(key, record.key)) {
                            count += 1;
                        }
                    });
                } else if (key !== undefined) {
                    count = 0;
                    this._rawIndex.records.forEach(function (record) {
                        if (cmp(record.key, key) === 0) {
                            count += 1;
                        }
                    });
                } else {
                    count = this._rawIndex.records.length;
                }

                return count;
            }.bind(this)
        });
    };

    this.toString = function () {
        return '[object IDBIndex]';
    };
};
},{"./FDBCursor":104,"./FDBCursorWithValue":105,"./FDBKeyRange":109,"./FDBRequest":112,"./cmp":118,"./errors/InvalidStateError":124,"./errors/TransactionInactiveError":127,"./structuredClone":130,"./validateKey":131}],109:[function(require,module,exports){
'use strict';

var DataError = require('./errors/DataError');
var cmp = require('./cmp');
var validateKey = require('./validateKey');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#range-concept
function FDBKeyRange() {
    this.lower = undefined;
    this.upper = undefined;
    this.lowerOpen = undefined;
    this.upperOpen = undefined;

    this.toString = function () {
        return '[object IDBKeyRange]';
    };
}

FDBKeyRange.only = function (value) {
    if (value === undefined) { throw new TypeError(); }
    validateKey(value);
    var keyRange = new FDBKeyRange();
    keyRange.lower = value;
    keyRange.upper = value;
    keyRange.lowerOpen = false;
    keyRange.upperOpen = false;
    return keyRange;
};

FDBKeyRange.lowerBound = function (lower, open) {
    if (lower === undefined) { throw new TypeError(); }
    validateKey(lower);
    var keyRange = new FDBKeyRange();
    keyRange.lower = lower;
    keyRange.lowerOpen = open === true ? true : false;
    keyRange.upperOpen = true;
    return keyRange;
};

FDBKeyRange.upperBound = function (upper, open) {
    if (upper === undefined) { throw new TypeError(); }
    validateKey(upper);
    var keyRange = new FDBKeyRange();
    keyRange.upper = upper;
    keyRange.lowerOpen = true;
    keyRange.upperOpen = open === true ? true : false;
    return keyRange;
};

FDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
    if (lower === undefined || upper === undefined) { throw new TypeError(); }

    var cmpResult = cmp(lower, upper);
    if (cmpResult === 1 || (cmpResult === 0 && (lowerOpen || upperOpen))) {
        throw new DataError();
    }

    validateKey(lower);
    validateKey(upper);
    var keyRange = new FDBKeyRange();
    keyRange.lower = lower;
    keyRange.upper = upper;
    keyRange.lowerOpen = lowerOpen === true ? true : false;
    keyRange.upperOpen = upperOpen === true ? true : false;
    return keyRange;
};


FDBKeyRange.check = function (keyRange, key) {
    var cmpResult;
    if (keyRange.lower !== undefined) {
        cmpResult = cmp(keyRange.lower, key);

        if (cmpResult === 1 || (cmpResult === 0 && keyRange.lowerOpen)) {
            return false;
        }
    }
    if (keyRange.upper !== undefined) {
        cmpResult = cmp(keyRange.upper, key);

        if (cmpResult === -1 || (cmpResult === 0 && keyRange.upperOpen)) {
            return false;
        }
    }
    return true;
};

module.exports = FDBKeyRange;
},{"./cmp":118,"./errors/DataError":122,"./validateKey":131}],110:[function(require,module,exports){
'use strict';

var structuredClone = require('./structuredClone');
var Index = require('./Index');
var FDBCursorWithValue = require('./FDBCursorWithValue');
var FDBIndex = require('./FDBIndex');
var FDBKeyRange = require('./FDBKeyRange');
var FDBRequest = require('./FDBRequest');
var ConstraintError = require('./errors/ConstraintError');
var DataError = require('./errors/DataError');
var InvalidAccessError = require('./errors/InvalidAccessError');
var InvalidStateError = require('./errors/InvalidStateError');
var NotFoundError = require('./errors/NotFoundError');
var ReadOnlyError = require('./errors/ReadOnlyError');
var TransactionInactiveError = require('./errors/TransactionInactiveError');
var cmp = require('./cmp');
var extractKey = require('./extractKey');
var validateKey = require('./validateKey');
var validateKeyPath = require('./validateKeyPath');

function confirmActiveTransaction(objectStore) {
    if (objectStore._rawObjectStore.deleted) {
        throw new InvalidStateError();
    }

    if (!objectStore.transaction._active) {
        throw new TransactionInactiveError();
    }
}

function buildRecordAddPut(value, key) {
    if (this.transaction.mode === 'readonly') {
        throw new ReadOnlyError();
    }

    confirmActiveTransaction(this);

    if (this.keyPath !== null) {
        if (key !== undefined) {
            throw new DataError();
        }

        var tempKey = extractKey(this.keyPath, value);

        if (tempKey !== undefined) {
            validateKey(tempKey);
        } else {
            if (!this._rawObjectStore.keyGenerator) {
                throw new DataError();
            }
        }
    }

    if (this.keyPath === null && this._rawObjectStore.keyGenerator === null && key === undefined) {
        throw new DataError();
    }

    if (key !== undefined) {
        validateKey(key);
    }

    return {
        key: structuredClone(key),
        value: structuredClone(value)
    };
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#object-store
module.exports = function (transaction, rawObjectStore) {
    this._rawObjectStore = rawObjectStore;
    this._rawIndexesCache = {}; // Store the FDBIndex objects

    this.name = rawObjectStore.name;
    this.keyPath = rawObjectStore.keyPath;
    this.indexNames = Object.keys(rawObjectStore.rawIndexes).sort();
    this.autoIncrement = rawObjectStore.autoIncrement;
    this.transaction = transaction;

    this.put = function (value, key) {
        var record = buildRecordAddPut.call(this, value, key);

        return this.transaction._execRequestAsync({
            source: this,
            operation: this._rawObjectStore.storeRecord.bind(this._rawObjectStore, record, false, this.transaction._rollbackLog)
        });
    };

    this.add = function (value, key) {
        var record = buildRecordAddPut.call(this, value, key);

        return this.transaction._execRequestAsync({
            source: this,
            operation: this._rawObjectStore.storeRecord.bind(this._rawObjectStore, record, true, this.transaction._rollbackLog)
        });
    };

    this.delete = function (key) {
        if (this.transaction.mode === 'readonly') {
            throw new ReadOnlyError();
        }
        confirmActiveTransaction(this);


        if (!(key instanceof FDBKeyRange)) {
            key = structuredClone(validateKey(key));
        }

        return this.transaction._execRequestAsync({
            source: this,
            operation: this._rawObjectStore.deleteRecord.bind(this._rawObjectStore, key, this.transaction._rollbackLog)
        });
    };

    this.get = function (key) {
        confirmActiveTransaction(this);

        if (!(key instanceof FDBKeyRange)) {
            key = structuredClone(validateKey(key));
        }

        return this.transaction._execRequestAsync({
            source: this,
            operation: this._rawObjectStore.getValue.bind(this._rawObjectStore, key)
        });
    };

    this.clear = function () {
        if (this.transaction.mode === 'readonly') {
            throw new ReadOnlyError();
        }
        confirmActiveTransaction(this);

        return this.transaction._execRequestAsync({
            source: this,
            operation: this._rawObjectStore.clear.bind(this._rawObjectStore, this.transaction._rollbackLog)
        });
    };

    this.openCursor = function (range, direction) {
        confirmActiveTransaction(this);

        if (range === null) { range = undefined; }
        if (range !== undefined && !(range instanceof FDBKeyRange)) {
            range = FDBKeyRange.only(structuredClone(validateKey(range)));
        }

        var request = new FDBRequest();
        request.source = this;
        request.transaction = this.transaction;

        var cursor = new FDBCursorWithValue(this, range, direction);
        cursor._request = request;

        return this.transaction._execRequestAsync({
            source: this,
            operation: cursor._iterate.bind(cursor),
            request: request
        });
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBObjectStore-createIndex-IDBIndex-DOMString-name-DOMString-sequence-DOMString--keyPath-IDBIndexParameters-optionalParameters
    this.createIndex = function (name, keyPath, optionalParameters) {
        if (keyPath === undefined) { throw new TypeError(); }

        optionalParameters = optionalParameters !== undefined ? optionalParameters : {};
        var multiEntry = optionalParameters.multiEntry !== undefined ? optionalParameters.multiEntry : false;
        var unique = optionalParameters.unique !== undefined ? optionalParameters.unique : false;

        if (this.transaction.mode !== 'versionchange') {
            throw new InvalidStateError();
        }

        confirmActiveTransaction(this);

        if (this.indexNames.indexOf(name) >= 0) {
            throw new ConstraintError();
        }

        validateKeyPath(keyPath);

        if (Array.isArray(keyPath) && multiEntry) {
            throw new InvalidAccessError();
        }

// The index that is requested to be created can contain constraints on the data allowed in the index's referenced object store, such as requiring uniqueness of the values referenced by the index's keyPath. If the referenced object store already contains data which violates these constraints, this MUST NOT cause the implementation of createIndex to throw an exception or affect what it returns. The implementation MUST still create and return an IDBIndex object. Instead the implementation must queue up an operation to abort the "versionchange" transaction which was used for the createIndex call.

        this.transaction._rollbackLog.push(function (indexNames) {
            this.indexNames = indexNames;
            delete this._rawObjectStore.rawIndexes[name];
        }.bind(this, this.indexNames.slice()));

        var index = new Index(this._rawObjectStore, name, keyPath, multiEntry, unique);
        this.indexNames.push(name);
        this.indexNames.sort();
        this._rawObjectStore.rawIndexes[name] = index;

        index.initialize(this.transaction); // This is async by design

        return new FDBIndex(this, index);
    };

    this.index = function (name) {
        if (name === undefined) { throw new TypeError(); }

        if (this._rawIndexesCache.hasOwnProperty(name)) {
            return this._rawIndexesCache[name];
        }

        if (this.indexNames.indexOf(name) < 0) {
            throw new NotFoundError();
        }

        if (this._rawObjectStore.deleted) {
            throw new InvalidStateError();
        }

        var index = new FDBIndex(this, this._rawObjectStore.rawIndexes[name]);
        this._rawIndexesCache[name] = index;

        return index;
    };

    this.deleteIndex = function (name) {
        if (name === undefined) { throw new TypeError(); }

        if (this.transaction.mode !== 'versionchange') {
            throw new InvalidStateError();
        }

        confirmActiveTransaction(this);

        if (!this._rawObjectStore.rawIndexes.hasOwnProperty(name)) {
            throw new NotFoundError();
        }

        this.transaction._rollbackLog.push(function (index) {
            index.deleted = false;
            this._rawObjectStore.rawIndexes[name] = index;
            this.indexNames.push(name);
            this.indexNames.sort();
        }.bind(this, this._rawObjectStore.rawIndexes[name]));

        this.indexNames = this.indexNames.filter(function (indexName) {
            return indexName !== name;
        });
        this._rawObjectStore.rawIndexes[name].deleted = true; // Not sure if this is supposed to happen synchronously

        this.transaction._execRequestAsync({
            source: this,
            operation: function () {
                delete this._rawObjectStore.rawIndexes[name];
            }.bind(this)
        });
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBObjectStore-count-IDBRequest-any-key
    this.count = function (key) {
        confirmActiveTransaction(this);

        if (key !== undefined && !(key instanceof FDBKeyRange)) {
            key = structuredClone(validateKey(key));
        }

// Should really use a cursor under the hood
        return this.transaction._execRequestAsync({
            source: this,
            operation: function () {
                var count;

                if (key instanceof FDBKeyRange) {
                    count = 0;
                    this._rawObjectStore.records.forEach(function (record) {
                        if (FDBKeyRange.check(key, record.key)) {
                            count += 1;
                        }
                    });
                } else if (key !== undefined) {
                    count = 0;
                    this._rawObjectStore.records.forEach(function (record) {
                        if (cmp(record.key, key) === 0) {
                            count += 1;
                        }
                    });
                } else {
                    count = this._rawObjectStore.records.length;
                }

                return count;
            }.bind(this)
        });
    };

    this.toString = function () {
        return '[object IDBObjectStore]';
    };
};
},{"./FDBCursorWithValue":105,"./FDBIndex":108,"./FDBKeyRange":109,"./FDBRequest":112,"./Index":115,"./cmp":118,"./errors/ConstraintError":120,"./errors/DataError":122,"./errors/InvalidAccessError":123,"./errors/InvalidStateError":124,"./errors/NotFoundError":125,"./errors/ReadOnlyError":126,"./errors/TransactionInactiveError":127,"./extractKey":129,"./structuredClone":130,"./validateKey":131,"./validateKeyPath":132}],111:[function(require,module,exports){
'use strict';

var util = require('util');
var FDBRequest = require('./FDBRequest');

function FDBOpenDBRequest() {
    FDBRequest.call(this);

    this.onupgradeneeded = null;
    this.onblocked = null;

    this.toString = function () {
        return '[object IDBOpenDBRequest]';
    };
}
util.inherits(FDBOpenDBRequest, FDBRequest);

module.exports = FDBOpenDBRequest;
},{"./FDBRequest":112,"util":99}],112:[function(require,module,exports){
'use strict';

var util = require('util');
var EventTarget = require('./EventTarget');

function FDBRequest() {
    EventTarget.call(this);

    this.result = null;
    this.error = null;
    this.source = null;
    this.transaction = null;
    this.readyState = 'pending';
    this.onsuccess = null;
    this.onerror = null;

    this.toString = function () {
        return '[object IDBRequest]';
    };
}
util.inherits(FDBRequest, EventTarget);

module.exports = FDBRequest;
},{"./EventTarget":103,"util":99}],113:[function(require,module,exports){
'use strict';

var util = require('util');
var Event = require('./Event');
var EventTarget = require('./EventTarget');
var FDBObjectStore = require('./FDBObjectStore');
var FDBRequest = require('./FDBRequest');
var AbortError = require('./errors/AbortError');
var TransactionInactiveError = require('./errors/TransactionInactiveError');
var NotFoundError = require('./errors/NotFoundError');
var InvalidStateError = require('./errors/InvalidStateError');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#transaction
function FDBTransaction(storeNames, mode) {
    EventTarget.call(this);

    this._scope = storeNames;
    this._started = false;
    this._active = true;
    this._finished = false; // Set true after commit or abort
    this._requests = [];
    this._rollbackLog = [];

    this.mode = mode;
    this.db = null;
    this.error = null;
    this.onabort = null;
    this.oncomplete = null;
    this.onerror = null;

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-aborting-a-transaction
    this._abort = function (error) {
        this._rollbackLog.reverse().forEach(function (f) {
            f();
        });

        var e;
        if (error !== null) {
            e = new Error();
            e.name = error;
            this.error = e;
        }

// Should this directly remove from _requests?
        this._requests.forEach(function (r) {
            var request = r.request;
            if (request.readyState !== 'done') {
                request.readyState = 'done'; // This will cancel execution of this request's operation
                if (request.source) {
                    request.result = undefined;
                    request.error = new AbortError();

                    var event = new Event('error', {
                        bubbles: true,
                        cancelable: true
                    });
                    event._eventPath = [this.db, this];
                    request.dispatchEvent(event);
                }
            }
        }.bind(this));

        setImmediate(function () {
            var event = new Event('abort', {
                bubbles: true,
                cancelable: false
            });
            event._eventPath = [this.db];
            this.dispatchEvent(event);
        }.bind(this));

        this._finished = true;
    };

    this.abort = function () {
        if (this._finished) {
            throw new InvalidStateError();
        }
        this._active = false;

        this._abort(null);
    };

    this.objectStore = function (name) {
        if (this._scope.indexOf(name) < 0) {
            throw new NotFoundError();
        }

        if (!this._active) {
            throw new InvalidStateError();
        }

        return new FDBObjectStore(this, this.db._rawDatabase.rawObjectStores[name]);
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-asynchronously-executing-a-request
    this._execRequestAsync = function (obj) {
        var source = obj.source;
        var operation = obj.operation;
        var request = obj.hasOwnProperty('request') ? obj.request : null;

        if (!this._active) {
            throw new TransactionInactiveError();
        }

        // Request should only be passed for cursors
        if (!request) {
            if (!source) {
                // Special requests like indexes that just need to run some coe
                request = {
                    readyState: 'pending'
                };
            } else {
                request = new FDBRequest();
                request.source = source;
                request.transaction = source.transaction;
            }
        }

        this._requests.push({
            request: request,
            operation: operation
        });

        return request;
    };

    this._start = function () {
        var event;

        this._started = true;

        if (this._requests.length > 0) {
            // Remove from request queue - cursor ones will be added back if necessary by cursor.continue and such
            var r = this._requests.shift();

            var request = r.request;
            var operation = r.operation;

            if (request.readyState === 'done') {
                // Must have been aborted transaction, so stop this.
// Could probably look through and check these
                setImmediate(this._start.bind(this));
                return;
            }

            if (!request.source) {
                // Special requests like indexes that just need to run some code, with error handling already built into operation
                operation();
            } else {
                var defaultAction;
                try {
                    var result = operation();
                    request.readyState = 'done';
                    request.result = result;
                    request.error = undefined;

                    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-fire-a-success-event
                    this._active = true;
                    event = new Event('success', {
                        bubbles: false,
                        cancelable: false
                    });
                } catch (err) {
                    request.readyState = 'done';
                    request.result = undefined;
                    request.error = err;

                    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-fire-an-error-event
                    this._active = true;
                    event = new Event('error', {
                        bubbles: true,
                        cancelable: true
                    });

                    defaultAction = this._abort.bind(this, err.name);
                }

                try {
                    event._eventPath = [this.db, this];
                    request.dispatchEvent(event);

                    // You're supposed to set this._active to false here, but I'm skipping that.
                    // Why? Because scheduling gets tricky when promises are involved. I know that
                    // promises and IndexedDB transactions in general are tricky
                    // https://lists.w3.org/Archives/Public/public-webapps/2015AprJun/0126.html but
                    // for some reason I still tend to do it. So this line is commented out for me,
                    // and for any other masochists who do similar things. It doesn't seem to break
                    // any tests or functionality, and in fact if I uncomment this line it does make
                    // transaction/promise interactions wonky.
                    //this._active = false;
                } catch (err) {
//console.error(err);
                    this._abort('AbortError');
                    throw err;
                }

                // Default action of event
                if (!event._canceled) {
                    if (defaultAction) {
                        defaultAction();
                    }
                }
            }

            // On to the next one
            if (this._requests.length > 0) {
                this._start();
            } else {
                setImmediate(this._start.bind(this));
            }
            return;
        }

        // Check if transaction complete event needs to be fired
        if (!this._finished) { // Either aborted or committed already
            this._active = false;
            this._finished = true;

            if (!this.error) {
                event = new Event();
                event.type = 'complete';
                this.dispatchEvent(event);
            }
        }
    };

//    setImmediate(this._start.bind(this));

    this.toString = function () {
        return '[object IDBRequest]';
    };
}
util.inherits(FDBTransaction, EventTarget);

module.exports = FDBTransaction;
},{"./Event":102,"./EventTarget":103,"./FDBObjectStore":110,"./FDBRequest":112,"./errors/AbortError":119,"./errors/InvalidStateError":124,"./errors/NotFoundError":125,"./errors/TransactionInactiveError":127,"util":99}],114:[function(require,module,exports){
'use strict';

var util = require('util');
var Event = require('./Event');

function FDBVersionChangeEvent(type, parameters) {
    Event.call(this, type);

    parameters = parameters !== undefined ? parameters : {};
    this.oldVersion = parameters.oldVersion !== undefined ? parameters.oldVersion : 0;
    this.newVersion = parameters.newVersion !== undefined ? parameters.newVersion : null;

    this.toString = function () {
        return '[object IDBVersionChangeEvent]';
    };
}
util.inherits(FDBVersionChangeEvent, Event);

module.exports = FDBVersionChangeEvent;
},{"./Event":102,"util":99}],115:[function(require,module,exports){
'use strict';

var FDBKeyRange = require('./FDBKeyRange');
var ConstraintError = require('./errors/ConstraintError');
var cmp = require('./cmp');
var extractKey = require('./extractKey');
var validateKey = require('./validateKey');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-index
module.exports = function (rawObjectStore, name, keyPath, multiEntry, unique) {
    this.records = [];
    this.rawObjectStore = rawObjectStore;
    this.initialized = false;
    this.deleted = false;
// Initialized should be used to decide whether to throw an error or abort the versionchange transaction when there is a constraint

    this.name = name;
    this.keyPath = keyPath;
    this.multiEntry = multiEntry;
    this.unique = unique;

    this._getRecord = function (key) {
        var record;
        if (key instanceof FDBKeyRange) {
            record = this.records.find(function (record) {
                return FDBKeyRange.check(key, record.key);
            });
        } else {
            record = this.records.find(function (record) {
                return cmp(record.key, key) === 0;
            });
        }
        return record;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-index
    this.getKey = function (key) {
        var record = this._getRecord(key);

        return record !== undefined ? record.value : undefined;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#index-referenced-value-retrieval-operation
    this.getValue = function (key) {
        var record = this._getRecord(key);

        return record !== undefined ? this.rawObjectStore.getValue(record.value) : undefined;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-storing-a-record-into-an-object-store (step 7)
    this.storeRecord = function (newRecord) {
        var indexKey = extractKey(this.keyPath, newRecord.value);
        if (indexKey === undefined) {
            return;
        }

        if (!this.multiEntry || !Array.isArray(indexKey)) {
            try {
                validateKey(indexKey);
            } catch (e) {
                return;
            }
        } else {
            // remove any elements from index key that are not valid keys and remove any duplicate elements from index key such that only one instance of the duplicate value remains.
            var keep = [];
            indexKey.forEach(function (part) {
                if (keep.indexOf(part) < 0) {
                    try {
                        validateKey(part);
                        keep.push(part);
                    } catch (err) { /* Do nothing */ }
                }
            });
            indexKey = keep;
        }

        if (!this.multiEntry || !Array.isArray(indexKey)) {
            if (this.unique) {
                var i = this.records.findIndex(function (record) {
                    return cmp(record.key, indexKey) === 0;
                });
                if (i >= 0) {
                    throw new ConstraintError();
                }
            }
        } else {
            if (this.unique) {
                indexKey.forEach(function (individualIndexKey) {
                    this.records.forEach(function (record) {
                        if (cmp(record.key, individualIndexKey) === 0) {
                            throw new ConstraintError();
                        }
                    });
                }.bind(this));
            }
        }

        // Store record {key (indexKey) and value (recordKey)} sorted ascending by key (primarily) and value (secondarily)
        var storeInIndex = function (newRecord) {
            var i = this.records.findIndex(function (record) {
                return cmp(record.key, newRecord.key) >= 0;
            });

            // If no matching key, add to end
            if (i === -1) {
                i = this.records.length;
            } else {
                // If matching key, advance to appropriate position based on value
                while (i < this.records.length && cmp(this.records[i].key, newRecord.key) === 0) {
                    if (cmp(this.records[i].value, newRecord.value) !== -1) {
                        // Record value >= newRecord value, so insert here
                        break;
                    }

                    i += 1; // Look at next record
                }
            }

            this.records.splice(i, 0, newRecord);
        }.bind(this);

        if (!this.multiEntry || !Array.isArray(indexKey)) {
            storeInIndex({
                key: indexKey,
                value: newRecord.key
            });
        } else {
            indexKey.forEach(function (individualIndexKey) {
                storeInIndex({
                    key: individualIndexKey,
                    value: newRecord.key
                });
            });
        }
    };

    this.initialize = function (transaction) {
        if (this.initialized) {
            throw new Error("Index already initialized");
        }

        transaction._execRequestAsync({
            source: null,
            operation: function () {
                try {
                    // Create index based on current value of objectstore
                    this.rawObjectStore.records.forEach(function (record) {
                        this.storeRecord(record);
                    }.bind(this));

                    this.initialized = true;
                } catch (err) {
                    transaction._abort(err.name);
                }
            }.bind(this)
        });
    };
};
},{"./FDBKeyRange":109,"./cmp":118,"./errors/ConstraintError":120,"./extractKey":129,"./validateKey":131}],116:[function(require,module,exports){
'use strict';

var ConstraintError = require('./errors/ConstraintError');

module.exports = function () {
// This is kind of wrong. Should start at 1 and increment only after record is saved
    this.num = 0;

    this.next = function () {
        if (this.num >= 9007199254740992) {
            throw new ConstraintError();
        }

        this.num += 1;

        return this.num;
    };

    this.setIfLarger = function (num) {
        if (num > 9007199254740992) {
            throw new ConstraintError();
        }

        if (num > this.num) {
            this.num = Math.floor(num);
        }
    };
};
},{"./errors/ConstraintError":120}],117:[function(require,module,exports){
'use strict';

var structuredClone = require('./structuredClone');
var FDBKeyRange = require('../lib/FDBKeyRange');
var KeyGenerator = require('./KeyGenerator');
var ConstraintError = require('./errors/ConstraintError');
var DataError = require('./errors/DataError');
var cmp = require('./cmp');
var extractKey = require('./extractKey');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-object-store
module.exports = function (rawDatabase, name, keyPath, autoIncrement) {
    this.rawDatabase = rawDatabase;
    this.records = [];
    this.rawIndexes = {};
    this.keyGenerator = autoIncrement === true ? new KeyGenerator() : null;
    this.deleted = false;

    this.name = name;
    this.keyPath = keyPath;
    this.autoIncrement = autoIncrement;

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-object-store
    this.getValue = function (key) {
        var record;
        if (key instanceof FDBKeyRange) {
            record = this.records.find(function (record) {
                return FDBKeyRange.check(key, record.key);
            });
        } else {
            record = this.records.find(function (record) {
                return cmp(record.key, key) === 0;
            });
        }

        return record !== undefined ? structuredClone(record.value) : undefined;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-storing-a-record-into-an-object-store
    this.storeRecord = function (newRecord, noOverwrite, rollbackLog) {
        if (this.keyPath !== null) {
            var key = extractKey(this.keyPath, newRecord.value);
            if (key !== undefined) {
                newRecord.key = key;
            }
        }

        var i;
        if (this.keyGenerator !== null && newRecord.key === undefined) {
            if (rollbackLog) {
                rollbackLog.push(function (keyGeneratorBefore) {
                    this.keyGenerator.num = keyGeneratorBefore;
                }.bind(this, this.keyGenerator.num));
            }

            newRecord.key = this.keyGenerator.next();

            // Set in value if keyPath defiend but led to no key
            // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-to-assign-a-key-to-a-value-using-a-key-path
            if (this.keyPath !== null) {
                var remainingKeyPath = this.keyPath;
                var object = newRecord.value;
                var identifier;

                i = 0; // Just to run the loop at least once
                while (i >= 0) {
                    if (typeof object !== 'object') {
                        throw new DataError();
                    }

                    i = remainingKeyPath.indexOf('.');
                    if (i >= 0) {
                        identifier = remainingKeyPath.slice(0, i);
                        remainingKeyPath = remainingKeyPath.slice(i + 1);

                        if (!object.hasOwnProperty(identifier)) {
                            object[identifier] = {};
                        }

                        object = object[identifier];
                    }
                }

                identifier = remainingKeyPath;

                object[identifier] = newRecord.key;
            }
        } else if (this.keyGenerator !== null && typeof newRecord.key === 'number') {
            this.keyGenerator.setIfLarger(newRecord.key);
        }

        i = this.records.findIndex(function (record) {
            return cmp(record.key, newRecord.key) === 0;
        });

        if (i >= 0) {
            if (noOverwrite) {
                throw new ConstraintError();
            }
            this.deleteRecord(newRecord.key, rollbackLog);
        }

        // Find where to put it so it's sorted by key
        if (this.records.length === 0) {
            i = 0;
        }
        i = this.records.findIndex(function (record) {
            return cmp(record.key, newRecord.key) === 1;
        });
        if (i === -1) {
            i = this.records.length;
        }
        this.records.splice(i, 0, newRecord);

        // Update indexes
        Object.keys(this.rawIndexes).forEach(function (name) {
            if (this.rawIndexes[name].initialized) {
                this.rawIndexes[name].storeRecord(newRecord);
            }
        }.bind(this));

        if (rollbackLog) {
            rollbackLog.push(this.deleteRecord.bind(this, newRecord.key));
        }

        return newRecord.key;
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-deleting-records-from-an-object-store
    this.deleteRecord = function (key, rollbackLog) {
        var range;
        if (key instanceof FDBKeyRange) {
            range = key;
        } else {
            range = FDBKeyRange.only(key);
        }

        this.records = this.records.filter(function (record) {
            var shouldDelete = FDBKeyRange.check(range, record.key);

            if (shouldDelete && rollbackLog) {
                rollbackLog.push(this.storeRecord.bind(this, record, true));
            }

            return !shouldDelete;
        }.bind(this));

        Object.keys(this.rawIndexes).forEach(function (name) {
            var rawIndex = this.rawIndexes[name];
            rawIndex.records = rawIndex.records.filter(function (record) {
                return !FDBKeyRange.check(range, record.value);
            });
        }.bind(this));
    };

    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-clearing-an-object-store
    this.clear = function (rollbackLog) {
        if (rollbackLog) {
            this.records.forEach(function (record) {
                rollbackLog.push(this.storeRecord.bind(this, record, true));
            }.bind(this));
        }

        this.records = [];
        Object.keys(this.rawIndexes).forEach(function (name) {
            var rawIndex = this.rawIndexes[name];
            rawIndex.records = [];
        }.bind(this));
    };
};
},{"../lib/FDBKeyRange":109,"./KeyGenerator":116,"./cmp":118,"./errors/ConstraintError":120,"./errors/DataError":122,"./extractKey":129,"./structuredClone":130}],118:[function(require,module,exports){
'use strict';

var DataError = require('./errors/DataError');
var validateKey = require('./validateKey');

function getType(x) {
    if (typeof x === 'number') {
        return 'Number';
    }
    if (x instanceof Date) {
        return 'Date';
    }
    if (Array.isArray(x)) {
        return 'Array';
    }
    if (typeof x === 'string') {
        return 'String';
    }

    throw new DataError();
}

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBFactory-cmp-short-any-first-any-second
function cmp(first, second) {
    if (second === undefined) { throw new TypeError(); }

    validateKey(first);
    validateKey(second);

    var t1 = getType(first);
    var t2 = getType(second);

    if (t1 !== t2) {
        if (t1 === 'Array') {
            return 1;
        }
        if (t1 === 'String' && (t2 === 'Date' || t2 === 'Number')) {
            return 1;
        }
        if (t1 === 'Date' && t2 === 'Number') {
            return 1;
        }
        return -1;
    }

    if (t1 === 'Array') {
        var length = Math.min(first.length, second.length);
        for (var i = 0; i < length; i++) {
            var result = cmp(first[i], second[i]);

            if (result !== 0) {
                return result;
            }
        }

        if (first.length > second.length) {
            return 1;
        }
        if (first.length < second.length) {
            return -1;
        }
        return 0;
    }

    if (t1 === 'Date') {
        if (first.getTime() === second.getTime()) {
            return 0;
        }
    } else {
        if (first === second) {
            return 0;
        }
    }
    return first > second ? 1 : -1;
}

module.exports = cmp;

},{"./errors/DataError":122,"./validateKey":131}],119:[function(require,module,exports){
'use strict';

var util = require('util');

function AbortError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : ' A request was aborted, for example through a call to IDBTransaction.abort.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, AbortError);
    }
}
util.inherits(AbortError, Error);

module.exports = AbortError;
},{"util":99}],120:[function(require,module,exports){
'use strict';

var util = require('util');

function ConstraintError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : ' A mutation operation in the transaction failed because a constraint was not satisfied. For example, an object such as an object store or index already exists and a request attempted to create a new one.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ConstraintError);
    }
}
util.inherits(ConstraintError, Error);

module.exports = ConstraintError;
},{"util":99}],121:[function(require,module,exports){
'use strict';

var util = require('util');

function DataCloneError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'The data being stored could not be cloned by the internal structured cloning algorithm.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DataCloneError);
    }
}
util.inherits(DataCloneError, Error);

module.exports = DataCloneError;
},{"util":99}],122:[function(require,module,exports){
'use strict';

var util = require('util');

function DataError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'Data provided to an operation does not meet requirements.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DataError);
    }
}
util.inherits(DataError, Error);

module.exports = DataError;
},{"util":99}],123:[function(require,module,exports){
'use strict';

var util = require('util');

function InvalidAccessError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'An invalid operation was performed on an object. For example transaction creation attempt was made, but an empty scope was provided.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, InvalidAccessError);
    }
}
util.inherits(InvalidAccessError, Error);

module.exports = InvalidAccessError;
},{"util":99}],124:[function(require,module,exports){
'use strict';

var util = require('util');

function InvalidStateError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'An operation was called on an object on which it is not allowed or at a time when it is not allowed. Also occurs if a request is made on a source object that has been deleted or removed. Use TransactionInactiveError or ReadOnlyError when possible, as they are more specific variations of InvalidStateError.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, InvalidStateError);
    }
}
util.inherits(InvalidStateError, Error);

module.exports = InvalidStateError;
},{"util":99}],125:[function(require,module,exports){
'use strict';

var util = require('util');

function NotFoundError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, NotFoundError);
    }
}
util.inherits(NotFoundError, Error);

module.exports = NotFoundError;
},{"util":99}],126:[function(require,module,exports){
'use strict';

var util = require('util');

function ReadOnlyError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'The mutating operation was attempted in a "readonly" transaction.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ReadOnlyError);
    }
}
util.inherits(ReadOnlyError, Error);

module.exports = ReadOnlyError;
},{"util":99}],127:[function(require,module,exports){
'use strict';

var util = require('util');

function TransactionInactiveError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'A request was placed against a transaction which is currently not active, or which is finished.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, TransactionInactiveError);
    }
}
util.inherits(TransactionInactiveError, Error);

module.exports = TransactionInactiveError;
},{"util":99}],128:[function(require,module,exports){
'use strict';

var util = require('util');

function VersionError(message) {
    this.name = this.constructor.name;
    this.message = message !== undefined ? message : 'An attempt was made to open a database using a lower version than the existing version.';
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, VersionError);
    }
}
util.inherits(VersionError, Error);

module.exports = VersionError;
},{"util":99}],129:[function(require,module,exports){
'use strict';

var structuredClone = require('./structuredClone');
var validateKey = require('./validateKey');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-extracting-a-key-from-a-value-using-a-key-path
function extractKey(keyPath, value) {
    if (Array.isArray(keyPath)) {
        var result = [];

        keyPath.forEach(function (item) {
            // This doesn't make sense to me based on the spec, but it is needed to pass the W3C KeyPath tests (see same comment in validateKey)
            if (item !== undefined && item !== null && typeof item !== 'string' && item.toString) {
                item = item.toString();
            }
            result.push(structuredClone(validateKey(extractKey(item, value))));
        });

        return result;
    }

    if (keyPath === '') {
        return value;
    }

    var remainingKeyPath = keyPath;
    var object = value;

    while (remainingKeyPath !== null) {
        var identifier;

        var i = remainingKeyPath.indexOf('.');
        if (i >= 0) {
            identifier = remainingKeyPath.slice(0, i);
            remainingKeyPath = remainingKeyPath.slice(i + 1);
        } else {
            identifier = remainingKeyPath;
            remainingKeyPath = null;
        }

        if (!object.hasOwnProperty(identifier)) {
            return;
        }

        object = object[identifier];
    }

    return object;
}

module.exports = extractKey;
},{"./structuredClone":130,"./validateKey":131}],130:[function(require,module,exports){
'use strict';

var realisticStructuredClone = require('realistic-structured-clone');
var DataCloneError = require('./errors/DataCloneError');

module.exports = function (input) {
    try {
        return realisticStructuredClone(input);
    } catch (err) {
        throw new DataCloneError();
    }
};
},{"./errors/DataCloneError":121,"realistic-structured-clone":135}],131:[function(require,module,exports){
'use strict';

var DataError = require('./errors/DataError');

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-valid-key
function validateKey(key, seen) {
    if (typeof key === 'number') {
        if (isNaN(key)) {
            throw new DataError();
        }
    } else if (key instanceof Date) {
        if (isNaN(key.valueOf())) {
            throw new DataError();
        }
    } else if (Array.isArray(key)) {
        seen = seen !== undefined ? seen : [];
        key.forEach(function (x) {
            // Only need to test objects, because otherwise [0, 0] shows up as circular
            if (typeof x === 'object' && seen.indexOf(x) >= 0) {
                throw new DataError();
            }
            seen.push(x);
        });

        var count = 0;
        key = key.map(function (item) {
            count += 1;
            return validateKey(item, seen);
        });
        if (count !== key.length) {
            throw new DataError();
        }
        return key;
    } else if (typeof key !== 'string') {
        throw new DataError();
    }

    return key;
}

module.exports = validateKey;
},{"./errors/DataError":122}],132:[function(require,module,exports){
'use strict';

// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-valid-key-path
function validateKeyPath(keyPath, parent) {
    // This doesn't make sense to me based on the spec, but it is needed to pass the W3C KeyPath tests (see same comment in extractKey)
    if (keyPath !== undefined && keyPath !== null && typeof keyPath !== 'string' && keyPath.toString && (parent === 'array' || !Array.isArray(keyPath))) {
        keyPath = keyPath.toString();
    }

    if (typeof keyPath === 'string') {
        if (keyPath === '' && parent !== 'string') {
            return;
        }
        try {
            // https://mathiasbynens.be/demo/javascript-identifier-regex for ECMAScript 5.1 / Unicode v7.0.0, with reserved words at beginning removed
            var validIdentifierRegex = /^(?:[\$A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC])(?:[\$0-9A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC])*$/;
            if (keyPath.length >= 1 && validIdentifierRegex.test(keyPath)) {
                return;
            }
        } catch (err) {
            throw new SyntaxError(err.message);
        }
        if (keyPath.indexOf(' ') >= 0) {
            throw new SyntaxError('The keypath argument contains an invalid key path (no spaces allowed).');
        }
    }

    if (Array.isArray(keyPath) && keyPath.length > 0) {
        if (parent) {
            // No nested arrays
            throw new SyntaxError('The keypath argument contains an invalid key path (nested arrays).');
        }
        keyPath.forEach(function (part) {
            validateKeyPath(part, 'array');
        });
        return;
    } else if (typeof keyPath === 'string' && keyPath.indexOf('.') >= 0) {
        keyPath = keyPath.split('.');
        keyPath.forEach(function (part) {
            validateKeyPath(part, 'string');
        });
        return;
    }

    throw new SyntaxError();
}

module.exports = validateKeyPath;
},{}],133:[function(require,module,exports){
// Array.prototype.find - MIT License (c) 2013 Paul Miller <http://paulmillr.com>
// For all details and docs: https://github.com/paulmillr/array.prototype.find
// Fixes and tests supplied by Duncan Hall <http://duncanhall.net> 
(function(globals){
  if (Array.prototype.find) return;

  var find = function(predicate) {
    var list = Object(this);
    var length = list.length < 0 ? 0 : list.length >>> 0; // ES.ToUint32;
    if (length === 0) return undefined;
    if (typeof predicate !== 'function' || Object.prototype.toString.call(predicate) !== '[object Function]') {
      throw new TypeError('Array#find: predicate must be a function');
    }
    var thisArg = arguments[1];
    for (var i = 0, value; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) return value;
    }
    return undefined;
  };

  if (Object.defineProperty) {
    try {
      Object.defineProperty(Array.prototype, 'find', {
        value: find, configurable: true, enumerable: false, writable: true
      });
    } catch(e) {}
  }

  if (!Array.prototype.find) {
    Array.prototype.find = find;
  }
})(this);

},{}],134:[function(require,module,exports){
// Array.prototype.findIndex - MIT License (c) 2013 Paul Miller <http://paulmillr.com>
// For all details and docs: <https://github.com/paulmillr/Array.prototype.findIndex>
(function (globals) {
  if (Array.prototype.findIndex) return;

  var findIndex = function(predicate) {
    var list = Object(this);
    var length = Math.max(0, list.length) >>> 0; // ES.ToUint32;
    if (length === 0) return -1;
    if (typeof predicate !== 'function' || Object.prototype.toString.call(predicate) !== '[object Function]') {
      throw new TypeError('Array#findIndex: predicate must be a function');
    }
    var thisArg = arguments.length > 1 ? arguments[1] : undefined;
    for (var i = 0; i < length; i++) {
      if (predicate.call(thisArg, list[i], i, list)) return i;
    }
    return -1;
  };

  if (Object.defineProperty) {
    try {
      Object.defineProperty(Array.prototype, 'findIndex', {
        value: findIndex, configurable: true, writable: true
      });
    } catch(e) {}
  }

  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = findIndex;
  }
}(this));

},{}],135:[function(require,module,exports){
'use strict';

var util = require('util');
var isPlainObject = require('lodash.isplainobject');

function DataCloneError(message) {
    this.name = this.constructor.name;
    this.message = message;
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DataCloneError);
    }
}
util.inherits(DataCloneError, Error);

// http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm
function structuredClone(input, memory) {
    memory = memory !== undefined ? memory : [];

    for (var i = 0; i < memory.length; i++) {
        if (memory[i].source === input) {
            return memory[i].destination;
        }
    }

    var type = typeof input;
    var output;

    if (type === 'string' || type === 'number' || type === 'boolean' || type === 'undefined' || input === null) {
        return input;
    }

    var deepClone = 'none';

    if (input instanceof Boolean || input instanceof Number || input instanceof String || input instanceof Date) {
        output = new input.constructor(input.valueOf());
    } else if (input instanceof RegExp) {
        output = new RegExp(input.source, "g".substr(0, Number(input.global)) + "i".substr(0, Number(input.ignoreCase)) + "m".substr(0, Number(input.multiline)));

        // Supposed to also handle Blob, FileList, ImageData, ImageBitmap, ArrayBuffer, and "object with a [[DataView]] internal slot", but fuck it
    } else if (Array.isArray(input)) {
        output = new Array(input.length);
        deepClone = 'own';
    } else if (isPlainObject(input)) {
        output = {};
        deepClone = 'own';
    } else if (input instanceof Map) {
        output = new Map();
        deepClone = 'map';
    } else if (input instanceof Set) {
        output = new Set();
        deepClone = 'set';
    } else {
        throw new DataCloneError();
    }

    memory.push({
        source: input,
        destination: output
    });

    if (deepClone === 'map') {
        throw new DataCloneError('Map support not implemented yet');
    } else if (deepClone === 'set') {
        throw new DataCloneError('Set support not implemented yet');
    } else if (deepClone === 'own') {
        for (var name in input) {
            if (input.hasOwnProperty(name)) {
                var sourceValue = input[name];
                var clonedValue = structuredClone(sourceValue, memory);
                output[name] = clonedValue;
            }
        }
    }

    return output;
}

module.exports = structuredClone;
},{"lodash.isplainobject":136,"util":99}],136:[function(require,module,exports){
/**
 * lodash 3.2.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var baseFor = require('lodash._basefor'),
    isArguments = require('lodash.isarguments'),
    keysIn = require('lodash.keysin');

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * **Note:** This method assumes objects created by the `Object` constructor
 * have no inherited enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  var Ctor;

  // Exit early for non `Object` objects.
  if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
      (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
    return false;
  }
  // IE < 9 iterates inherited properties before own properties. If the first
  // iterated property is an object's own property then there are no inherited
  // enumerable properties.
  var result;
  // In most environments an object's own properties are iterated before
  // its inherited properties. If the last iterated property is an object's
  // own property then there are no inherited enumerable properties.
  baseForIn(value, function(subValue, key) {
    result = key;
  });
  return result === undefined || hasOwnProperty.call(value, result);
}

module.exports = isPlainObject;

},{"lodash._basefor":137,"lodash.isarguments":138,"lodash.keysin":139}],137:[function(require,module,exports){
/**
 * lodash 3.0.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = baseFor;

},{}],138:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{}],139:[function(require,module,exports){
/**
 * lodash 3.0.8 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var isArguments = require('lodash.isarguments'),
    isArray = require('lodash.isarray');

/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"lodash.isarguments":138,"lodash.isarray":140}],140:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var arrayTag = '[object Array]',
    funcTag = '[object Function]';

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 equivalents which return 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isArray;

},{}],141:[function(require,module,exports){
(function (global){
var exports = module.exports = {};
var localStorageMemory = require('localstorage-memory');
exports.hasLocalStorage = require('has-localstorage');

/**
 * returns localStorage-compatible API, either backed by window.localStorage
 * or memory if it's not available or not persistent.
 *
 * It also adds an object API (`.getObject(key)`,
 * `.setObject(key, properties)`) and a `isPresistent` property
 *
 * @returns {Object}
 */
exports.create = function () {
  var api;

  if (!exports.hasLocalStorage()) {
    api = localStorageMemory;
    api.isPersistent = false;
  } else {
    api = global.localStorage;
    api = {
      get length() { return global.localStorage.length; },
      getItem: global.localStorage.getItem.bind(global.localStorage),
      setItem: global.localStorage.setItem.bind(global.localStorage),
      removeItem: global.localStorage.removeItem.bind(global.localStorage),
      key: global.localStorage.key.bind(global.localStorage),
      clear: global.localStorage.clear.bind(global.localStorage),
    };

    api.isPersistent = true;
  }

  api.getObject = exports.getObject.bind(null, api);
  api.setObject = exports.setObject.bind(null, api);

  return api;
};

/**
 * sets key to passed Object.
 *
 * @returns undefined
 */
exports.setObject = function (store, key, object) {
  if (typeof object !== 'object') {
    return store.setItem(key, object);
  }

  return store.setItem(key, JSON.stringify(object));
};

/**
 * returns Object for key, or null
 *
 * @returns {Object|null}
 */
exports.getObject = function (store, key) {
  var item = store.getItem(key);

  if (!item) {
    return null;
  }

  try {
    return JSON.parse(item);
  } catch (e) {
    return item;
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"has-localstorage":143,"localstorage-memory":144}],142:[function(require,module,exports){
var api = require('./api');
module.exports = api.create();

},{"./api":141}],143:[function(require,module,exports){
/**
 * # hasLocalStorage()
 *
 * returns `true` or `false` depending on whether localStorage is supported or not.
 * Beware that some browsers like Safari do not support localStorage in private mode.
 *
 * inspired by this cappuccino commit
 * https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
 *
 * @returns {Boolean}
 */
function hasLocalStorage() {
  try {

    // we've to put this in here. I've seen Firefox throwing `Security error: 1000`
    // when cookies have been disabled
    if (typeof localStorage === 'undefined') {
      return false;
    }

    // Just because localStorage exists does not mean it works. In particular it might be disabled
    // as it is when Safari's private browsing mode is active.
    localStorage.setItem('Storage-Test', '1');

    // that should not happen ...
    if (localStorage.getItem('Storage-Test') !== '1') {
      return false;
    }

    // okay, let's clean up if we got here.
    localStorage.removeItem('Storage-Test');
  } catch (_error) {

    // in case of an error, like Safari's Private Mode, return false
    return false;
  }

  // we're good.
  return true;
}


if (typeof exports === 'object') {
  module.exports = hasLocalStorage;
}

},{}],144:[function(require,module,exports){
(function(root) {
  var localStorageMemory = {};
  var cache = {};

  /**
   * number of stored items.
   */
  localStorageMemory.length = 0;

  /**
   * returns item for passed key, or null
   *
   * @para {String} key
   *       name of item to be returned
   * @returns {String|null}
   */
  localStorageMemory.getItem = function(key) {
    return cache[key] || null;
  };

  /**
   * sets item for key to passed value, as String
   *
   * @para {String} key
   *       name of item to be set
   * @para {String} value
   *       value, will always be turned into a String
   * @returns {undefined}
   */
  localStorageMemory.setItem = function(key, value) {
    if (typeof value === 'undefined') {
      localStorageMemory.removeItem(key);
    } else {
      cache[key] = '' + value;
      localStorageMemory.length++;
    }
  };

  /**
   * removes item for passed key
   *
   * @para {String} key
   *       name of item to be removed
   * @returns {undefined}
   */
  localStorageMemory.removeItem = function(key) {
    delete cache[key];
    localStorageMemory.length--;
  };

  /**
   * returns name of key at passed index
   *
   * @para {Number} index
   *       Position for key to be returned (starts at 0)
   * @returns {String|null}
   */
  localStorageMemory.key = function(index) {
    return Object.keys(cache)[index] || null;
  };

  /**
   * removes all stored items and sets length to 0
   *
   * @returns {undefined}
   */
  localStorageMemory.clear = function() {
    cache = {};
    localStorageMemory.length = 0;
  };

  if (typeof exports === 'object') {
    module.exports = localStorageMemory;
  } else {
    root.localStorageMemory = localStorageMemory;
  }
})(this);



},{}],145:[function(require,module,exports){
'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var levels = [];
var c0 = String.fromCharCode(9500);
var c1 = String.fromCharCode(9472);
var c2 = String.fromCharCode(9492);
var c3 = String.fromCharCode(9474);

function compose(node, end) {
  if (node.level === 0) {
    return node.value;
  }

  var ret = '\r\n';
  var c = end ? c2 : c0;

  for (var i = 1; i < node.level; i++) {
    ret = '' + ret + '' + (levels[i] ? ' ' : c3);
    ret = '' + ret + '  ';
  }

  return '' + ret + '' + c + '' + c1 + ' ' + node.value;
}

function _generate(tree, end) {
  var result = compose(tree, end);

  if (tree.nodes.length > 0) {
    (function () {
      var last = tree.nodes.length - 1;
      tree.nodes.forEach(function (subTree, index) {
        levels[subTree.level] = index === last;
        result = result + _generate(subTree, index === last);
      });
    })();
  }

  return result;
}

var AsciiTree = (function () {
  function AsciiTree() {
    _classCallCheck(this, AsciiTree);
  }

  _createClass(AsciiTree, null, [{
    key: 'generate',
    value: function generate() {
      var tree = arguments[0] === void 0 ? {} : arguments[0];

      return _generate(tree);
    }
  }]);

  return AsciiTree;
})();

exports['default'] = AsciiTree;
module.exports = exports['default'];
},{"babel-runtime/core-js/object/define-property":2,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10}],146:[function(require,module,exports){
'use strict';

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var Rack = require('./rack');
Rack.Middleware = require('./middleware');
exports['default'] = Rack;
module.exports = exports['default'];
},{"./middleware":147,"./rack":148,"babel-runtime/core-js/object/define-property":2}],147:[function(require,module,exports){
'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var _asciiTree = require('./asciiTree');

var _asciiTree2 = _interopRequireDefault(_asciiTree);

var Middleware = (function () {
  function Middleware() {
    var name = arguments[0] === void 0 ? 'Middleware' : arguments[0];

    _classCallCheck(this, Middleware);

    this.name = name;
  }

  _createClass(Middleware, [{
    key: 'handle',
    value: function handle() {
      var request = arguments[0] === void 0 ? {} : arguments[0];

      return _Promise.resolve(request);
    }
  }, {
    key: 'generateTree',
    value: function generateTree() {
      var level = arguments[0] === void 0 ? 0 : arguments[0];

      var root = {
        value: this.name,
        level: level,
        nodes: []
      };
      return root;
    }
  }, {
    key: 'toString',
    value: function toString() {
      var root = this.generateTree(0);
      return _asciiTree2['default'].generate(root);
    }
  }]);

  return Middleware;
})();

exports['default'] = Middleware;
module.exports = exports['default'];
},{"./asciiTree":145,"babel-runtime/core-js/object/define-property":2,"babel-runtime/core-js/promise":7,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13}],148:[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _get = require('babel-runtime/helpers/get')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var _execute = function _execute(index, middlewares, request) {
  var _this = this;

  if (index < -1 || index >= middlewares.length) {
    throw new Error('Index ' + index + ' is out of bounds.');
  }

  var middleware = middlewares[index];

  return middleware.handle(request).then(function (response) {
    index = index + 1;

    if (index < middlewares.length) {
      return _execute.call(_this, index, middlewares, response);
    }

    return response;
  });
};

var Rack = (function (_Middleware) {
  function Rack() {
    var name = arguments[0] === void 0 ? 'Rack' : arguments[0];

    _classCallCheck(this, Rack);

    _get(Object.getPrototypeOf(Rack.prototype), 'constructor', this).call(this, name);
    this._middlewares = [];
  }

  _inherits(Rack, _Middleware);

  _createClass(Rack, [{
    key: 'getMiddleware',
    value: function getMiddleware() {
      var index = arguments[0] === void 0 ? -1 : arguments[0];

      var middlewares = this.middlewares;

      if (index < -1 || index >= middlewares.length) {
        throw new Error('Index ' + index + ' is out of bounds.');
      }

      return middlewares[index];
    }
  }, {
    key: 'use',
    value: function use(middleware) {
      if (middleware !== null && middleware !== void 0) {
        if (middleware instanceof _middleware2['default']) {
          this._middlewares.push(middleware);
          return;
        }

        throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
      }
    }
  }, {
    key: 'useBefore',
    value: function useBefore(middlewareClass, middleware) {
      if (middleware !== null && middleware !== void 0) {
        if (middleware instanceof _middleware2['default']) {
          var middlewares = this.middlewares;
          var index = middlewares.findIndex(function (existingMiddleware) {
            return existingMiddleware instanceof middlewareClass;
          });

          if (index > -1) {
            middlewares.splice(index, 0, middleware);
            this._middlewares = middlewares;
          }

          return;
        }

        throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
      }
    }
  }, {
    key: 'useAfter',
    value: function useAfter(middlewareClass, middleware) {
      if (middleware !== null && middleware !== void 0) {
        if (middleware instanceof _middleware2['default']) {
          var middlewares = this.middlewares;
          var index = middlewares.findIndex(function (existingMiddleware) {
            return existingMiddleware instanceof middlewareClass;
          });

          if (index > -1) {
            middlewares.splice(index + 1, 0, middleware);
            this._middlewares = middlewares;
          }

          return;
        }

        throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
      }
    }
  }, {
    key: 'swap',
    value: function swap(middlewareClass, middleware) {
      if (middleware !== null && middleware !== void 0) {
        if (middleware instanceof _middleware2['default']) {
          var middlewares = this.middlewares;
          var index = middlewares.findIndex(function (existingMiddleware) {
            return existingMiddleware instanceof middlewareClass;
          });

          if (index > -1) {
            middlewares.splice(index, 1, middleware);
            this._middlewares = middlewares;
          }

          return;
        }

        throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
      }
    }
  }, {
    key: 'remove',
    value: function remove(middlewareClass) {
      var middlewares = this.middlewares;
      var index = middlewares.findIndex(function (existingMiddleware) {
        return existingMiddleware instanceof middlewareClass;
      });

      if (index > -1) {
        middlewares.splice(index, 1);
        this._middlewares = middlewares;
        this.remove(middlewareClass);
      }
    }
  }, {
    key: 'reset',
    value: function reset() {
      this._middlewares = [];
    }
  }, {
    key: 'execute',
    value: function execute(request) {
      return _execute.call(this, 0, this.middlewares, request);
    }
  }, {
    key: 'handle',
    value: function handle(request) {
      return this.execute(request);
    }
  }, {
    key: 'generateTree',
    value: function generateTree() {
      var level = arguments[0] === void 0 ? 0 : arguments[0];

      var root = _get(Object.getPrototypeOf(Rack.prototype), 'generateTree', this).call(this, level);
      var middlewares = this.middlewares;

      middlewares.forEach(function (middleware) {
        root.nodes.push(middleware.generateTree(level + 1));
      });

      return root;
    }
  }, {
    key: 'middlewares',
    get: function () {
      return this._middlewares.slice();
    }
  }]);

  return Rack;
})(_middleware2['default']);

exports['default'] = Rack;
module.exports = exports['default'];
},{"./middleware":147,"babel-runtime/core-js/object/define-property":2,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13}],149:[function(require,module,exports){
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],150:[function(require,module,exports){
var createAggregator = require('../internal/createAggregator');

/**
 * Creates an object composed of keys generated from the results of running
 * each element of `collection` through `iteratee`. The corresponding value
 * of each key is the last element responsible for generating the key. The
 * iteratee function is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Object} Returns the composed aggregate object.
 * @example
 *
 * var keyData = [
 *   { 'dir': 'left', 'code': 97 },
 *   { 'dir': 'right', 'code': 100 }
 * ];
 *
 * _.indexBy(keyData, 'dir');
 * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
 *
 * _.indexBy(keyData, function(object) {
 *   return String.fromCharCode(object.code);
 * });
 * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
 *
 * _.indexBy(keyData, function(object) {
 *   return this.fromCharCode(object.code);
 * }, String);
 * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
 */
var indexBy = createAggregator(function(result, value, key) {
  result[key] = value;
});

module.exports = indexBy;

},{"../internal/createAggregator":183}],151:[function(require,module,exports){
var arrayReduce = require('../internal/arrayReduce'),
    baseEach = require('../internal/baseEach'),
    createReduce = require('../internal/createReduce');

/**
 * Reduces `collection` to a value which is the accumulated result of running
 * each element in `collection` through `iteratee`, where each successive
 * invocation is supplied the return value of the previous. If `accumulator`
 * is not provided the first element of `collection` is used as the initial
 * value. The `iteratee` is bound to `thisArg` and invoked with four arguments:
 * (accumulator, value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.reduce`, `_.reduceRight`, and `_.transform`.
 *
 * The guarded methods are:
 * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `sortByAll`,
 * and `sortByOrder`
 *
 * @static
 * @memberOf _
 * @alias foldl, inject
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {*} Returns the accumulated value.
 * @example
 *
 * _.reduce([1, 2], function(total, n) {
 *   return total + n;
 * });
 * // => 3
 *
 * _.reduce({ 'a': 1, 'b': 2 }, function(result, n, key) {
 *   result[key] = n * 3;
 *   return result;
 * }, {});
 * // => { 'a': 3, 'b': 6 } (iteration order is not guaranteed)
 */
var reduce = createReduce(arrayReduce, baseEach);

module.exports = reduce;

},{"../internal/arrayReduce":156,"../internal/baseEach":164,"../internal/createReduce":188}],152:[function(require,module,exports){
var getLength = require('../internal/getLength'),
    isLength = require('../internal/isLength'),
    keys = require('../object/keys');

/**
 * Gets the size of `collection` by returning its length for array-like
 * values or the number of own enumerable properties for objects.
 *
 * @static
 * @memberOf _
 * @category Collection
 * @param {Array|Object|string} collection The collection to inspect.
 * @returns {number} Returns the size of `collection`.
 * @example
 *
 * _.size([1, 2, 3]);
 * // => 3
 *
 * _.size({ 'a': 1, 'b': 2 });
 * // => 2
 *
 * _.size('pebbles');
 * // => 7
 */
function size(collection) {
  var length = collection ? getLength(collection) : 0;
  return isLength(length) ? length : keys(collection).length;
}

module.exports = size;

},{"../internal/getLength":192,"../internal/isLength":202,"../object/keys":225}],153:[function(require,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/Web/JavaScript/Reference/Functions/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.restParam(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function restParam(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        rest = Array(length);

    while (++index < length) {
      rest[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, args[0], rest);
      case 2: return func.call(this, args[0], args[1], rest);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = rest;
    return func.apply(this, otherArgs);
  };
}

module.exports = restParam;

},{}],154:[function(require,module,exports){
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function arrayCopy(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = arrayCopy;

},{}],155:[function(require,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],156:[function(require,module,exports){
/**
 * A specialized version of `_.reduce` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initFromArray] Specify using the first element of `array`
 *  as the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initFromArray) {
  var index = -1,
      length = array.length;

  if (initFromArray && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

module.exports = arrayReduce;

},{}],157:[function(require,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],158:[function(require,module,exports){
/**
 * Used by `_.defaults` to customize its `_.assign` use.
 *
 * @private
 * @param {*} objectValue The destination object property value.
 * @param {*} sourceValue The source object property value.
 * @returns {*} Returns the value to assign to the destination object.
 */
function assignDefaults(objectValue, sourceValue) {
  return objectValue === undefined ? sourceValue : objectValue;
}

module.exports = assignDefaults;

},{}],159:[function(require,module,exports){
var keys = require('../object/keys');

/**
 * A specialized version of `_.assign` for customizing assigned values without
 * support for argument juggling, multiple sources, and `this` binding `customizer`
 * functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns `object`.
 */
function assignWith(object, source, customizer) {
  var index = -1,
      props = keys(source),
      length = props.length;

  while (++index < length) {
    var key = props[index],
        value = object[key],
        result = customizer(value, source[key], key, object, source);

    if ((result === result ? (result !== value) : (value === value)) ||
        (value === undefined && !(key in object))) {
      object[key] = result;
    }
  }
  return object;
}

module.exports = assignWith;

},{"../object/keys":225}],160:[function(require,module,exports){
var baseCopy = require('./baseCopy'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.assign` without support for argument juggling,
 * multiple sources, and `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return source == null
    ? object
    : baseCopy(source, keys(source), object);
}

module.exports = baseAssign;

},{"../object/keys":225,"./baseCopy":163}],161:[function(require,module,exports){
var baseMatches = require('./baseMatches'),
    baseMatchesProperty = require('./baseMatchesProperty'),
    bindCallback = require('./bindCallback'),
    identity = require('../utility/identity'),
    property = require('../utility/property');

/**
 * The base implementation of `_.callback` which supports specifying the
 * number of arguments to provide to `func`.
 *
 * @private
 * @param {*} [func=_.identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function baseCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (type == 'function') {
    return thisArg === undefined
      ? func
      : bindCallback(func, thisArg, argCount);
  }
  if (func == null) {
    return identity;
  }
  if (type == 'object') {
    return baseMatches(func);
  }
  return thisArg === undefined
    ? property(func)
    : baseMatchesProperty(func, thisArg);
}

module.exports = baseCallback;

},{"../utility/identity":230,"../utility/property":231,"./baseMatches":172,"./baseMatchesProperty":173,"./bindCallback":181}],162:[function(require,module,exports){
var arrayCopy = require('./arrayCopy'),
    arrayEach = require('./arrayEach'),
    baseAssign = require('./baseAssign'),
    baseForOwn = require('./baseForOwn'),
    initCloneArray = require('./initCloneArray'),
    initCloneByTag = require('./initCloneByTag'),
    initCloneObject = require('./initCloneObject'),
    isArray = require('../lang/isArray'),
    isObject = require('../lang/isObject');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
cloneableTags[dateTag] = cloneableTags[float32Tag] =
cloneableTags[float64Tag] = cloneableTags[int8Tag] =
cloneableTags[int16Tag] = cloneableTags[int32Tag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[stringTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[mapTag] = cloneableTags[setTag] =
cloneableTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * The base implementation of `_.clone` without support for argument juggling
 * and `this` binding `customizer` functions.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The object `value` belongs to.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates clones with source counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
  var result;
  if (customizer) {
    result = object ? customizer(value, key, object) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return arrayCopy(value, result);
    }
  } else {
    var tag = objToString.call(value),
        isFunc = tag == funcTag;

    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return baseAssign(result, value);
      }
    } else {
      return cloneableTags[tag]
        ? initCloneByTag(value, tag, isDeep)
        : (object ? value : {});
    }
  }
  // Check for circular references and return its corresponding clone.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == value) {
      return stackB[length];
    }
  }
  // Add the source value to the stack of traversed objects and associate it with its clone.
  stackA.push(value);
  stackB.push(result);

  // Recursively populate clone (susceptible to call stack limits).
  (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
    result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
  });
  return result;
}

module.exports = baseClone;

},{"../lang/isArray":210,"../lang/isObject":216,"./arrayCopy":154,"./arrayEach":155,"./baseAssign":160,"./baseForOwn":167,"./initCloneArray":195,"./initCloneByTag":196,"./initCloneObject":197}],163:[function(require,module,exports){
/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property names to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @returns {Object} Returns `object`.
 */
function baseCopy(source, props, object) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];
    object[key] = source[key];
  }
  return object;
}

module.exports = baseCopy;

},{}],164:[function(require,module,exports){
var baseForOwn = require('./baseForOwn'),
    createBaseEach = require('./createBaseEach');

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"./baseForOwn":167,"./createBaseEach":185}],165:[function(require,module,exports){
var createBaseFor = require('./createBaseFor');

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"./createBaseFor":186}],166:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keysIn = require('../object/keysIn');

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

module.exports = baseForIn;

},{"../object/keysIn":226,"./baseFor":165}],167:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"../object/keys":225,"./baseFor":165}],168:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * The base implementation of `get` without support for string paths
 * and default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path of the property to get.
 * @param {string} [pathKey] The key representation of path.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path, pathKey) {
  if (object == null) {
    return;
  }
  if (pathKey !== undefined && pathKey in toObject(object)) {
    path = [pathKey];
  }
  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[path[index++]];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"./toObject":206}],169:[function(require,module,exports){
var baseIsEqualDeep = require('./baseIsEqualDeep'),
    isObject = require('../lang/isObject'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.isEqual` without support for `this` binding
 * `customizer` functions.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
}

module.exports = baseIsEqual;

},{"../lang/isObject":216,"./baseIsEqualDeep":170,"./isObjectLike":203}],170:[function(require,module,exports){
var equalArrays = require('./equalArrays'),
    equalByTag = require('./equalByTag'),
    equalObjects = require('./equalObjects'),
    isArray = require('../lang/isArray'),
    isTypedArray = require('../lang/isTypedArray');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

module.exports = baseIsEqualDeep;

},{"../lang/isArray":210,"../lang/isTypedArray":220,"./equalArrays":189,"./equalByTag":190,"./equalObjects":191}],171:[function(require,module,exports){
var baseIsEqual = require('./baseIsEqual'),
    toObject = require('./toObject');

/**
 * The base implementation of `_.isMatch` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} matchData The propery names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = toObject(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var result = customizer ? customizer(objValue, srcValue, key) : undefined;
      if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"./baseIsEqual":169,"./toObject":206}],172:[function(require,module,exports){
var baseIsMatch = require('./baseIsMatch'),
    getMatchData = require('./getMatchData'),
    toObject = require('./toObject');

/**
 * The base implementation of `_.matches` which does not clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    var key = matchData[0][0],
        value = matchData[0][1];

    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === value && (value !== undefined || (key in toObject(object)));
    };
  }
  return function(object) {
    return baseIsMatch(object, matchData);
  };
}

module.exports = baseMatches;

},{"./baseIsMatch":171,"./getMatchData":193,"./toObject":206}],173:[function(require,module,exports){
var baseGet = require('./baseGet'),
    baseIsEqual = require('./baseIsEqual'),
    baseSlice = require('./baseSlice'),
    isArray = require('../lang/isArray'),
    isKey = require('./isKey'),
    isStrictComparable = require('./isStrictComparable'),
    last = require('../array/last'),
    toObject = require('./toObject'),
    toPath = require('./toPath');

/**
 * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to compare.
 * @returns {Function} Returns the new function.
 */
function baseMatchesProperty(path, srcValue) {
  var isArr = isArray(path),
      isCommon = isKey(path) && isStrictComparable(srcValue),
      pathKey = (path + '');

  path = toPath(path);
  return function(object) {
    if (object == null) {
      return false;
    }
    var key = pathKey;
    object = toObject(object);
    if ((isArr || !isCommon) && !(key in object)) {
      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
      if (object == null) {
        return false;
      }
      key = last(path);
      object = toObject(object);
    }
    return object[key] === srcValue
      ? (srcValue !== undefined || (key in object))
      : baseIsEqual(srcValue, object[key], undefined, true);
  };
}

module.exports = baseMatchesProperty;

},{"../array/last":149,"../lang/isArray":210,"./baseGet":168,"./baseIsEqual":169,"./baseSlice":179,"./isKey":201,"./isStrictComparable":204,"./toObject":206,"./toPath":207}],174:[function(require,module,exports){
var arrayEach = require('./arrayEach'),
    baseMergeDeep = require('./baseMergeDeep'),
    isArray = require('../lang/isArray'),
    isArrayLike = require('./isArrayLike'),
    isObject = require('../lang/isObject'),
    isObjectLike = require('./isObjectLike'),
    isTypedArray = require('../lang/isTypedArray'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.merge` without support for argument juggling,
 * multiple sources, and `this` binding `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates values with source counterparts.
 * @returns {Object} Returns `object`.
 */
function baseMerge(object, source, customizer, stackA, stackB) {
  if (!isObject(object)) {
    return object;
  }
  var isSrcArr = isArrayLike(source) && (isArray(source) || isTypedArray(source)),
      props = isSrcArr ? undefined : keys(source);

  arrayEach(props || source, function(srcValue, key) {
    if (props) {
      key = srcValue;
      srcValue = source[key];
    }
    if (isObjectLike(srcValue)) {
      stackA || (stackA = []);
      stackB || (stackB = []);
      baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
    }
    else {
      var value = object[key],
          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
          isCommon = result === undefined;

      if (isCommon) {
        result = srcValue;
      }
      if ((result !== undefined || (isSrcArr && !(key in object))) &&
          (isCommon || (result === result ? (result !== value) : (value === value)))) {
        object[key] = result;
      }
    }
  });
  return object;
}

module.exports = baseMerge;

},{"../lang/isArray":210,"../lang/isObject":216,"../lang/isTypedArray":220,"../object/keys":225,"./arrayEach":155,"./baseMergeDeep":175,"./isArrayLike":198,"./isObjectLike":203}],175:[function(require,module,exports){
var arrayCopy = require('./arrayCopy'),
    isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isArrayLike = require('./isArrayLike'),
    isPlainObject = require('../lang/isPlainObject'),
    isTypedArray = require('../lang/isTypedArray'),
    toPlainObject = require('../lang/toPlainObject');

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates values with source counterparts.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
  var length = stackA.length,
      srcValue = source[key];

  while (length--) {
    if (stackA[length] == srcValue) {
      object[key] = stackB[length];
      return;
    }
  }
  var value = object[key],
      result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
      isCommon = result === undefined;

  if (isCommon) {
    result = srcValue;
    if (isArrayLike(srcValue) && (isArray(srcValue) || isTypedArray(srcValue))) {
      result = isArray(value)
        ? value
        : (isArrayLike(value) ? arrayCopy(value) : []);
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      result = isArguments(value)
        ? toPlainObject(value)
        : (isPlainObject(value) ? value : {});
    }
    else {
      isCommon = false;
    }
  }
  // Add the source value to the stack of traversed objects and associate
  // it with its merged value.
  stackA.push(srcValue);
  stackB.push(result);

  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
  } else if (result === result ? (result !== value) : (value === value)) {
    object[key] = result;
  }
}

module.exports = baseMergeDeep;

},{"../lang/isArguments":209,"../lang/isArray":210,"../lang/isPlainObject":217,"../lang/isTypedArray":220,"../lang/toPlainObject":221,"./arrayCopy":154,"./isArrayLike":198}],176:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],177:[function(require,module,exports){
var baseGet = require('./baseGet'),
    toPath = require('./toPath');

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 */
function basePropertyDeep(path) {
  var pathKey = (path + '');
  path = toPath(path);
  return function(object) {
    return baseGet(object, path, pathKey);
  };
}

module.exports = basePropertyDeep;

},{"./baseGet":168,"./toPath":207}],178:[function(require,module,exports){
/**
 * The base implementation of `_.reduce` and `_.reduceRight` without support
 * for callback shorthands and `this` binding, which iterates over `collection`
 * using the provided `eachFunc`.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} accumulator The initial value.
 * @param {boolean} initFromCollection Specify using the first or last element
 *  of `collection` as the initial value.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @returns {*} Returns the accumulated value.
 */
function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
  eachFunc(collection, function(value, index, collection) {
    accumulator = initFromCollection
      ? (initFromCollection = false, value)
      : iteratee(accumulator, value, index, collection);
  });
  return accumulator;
}

module.exports = baseReduce;

},{}],179:[function(require,module,exports){
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  start = start == null ? 0 : (+start || 0);
  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = (end === undefined || end > length) ? length : (+end || 0);
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],180:[function(require,module,exports){
/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  return value == null ? '' : (value + '');
}

module.exports = baseToString;

},{}],181:[function(require,module,exports){
var identity = require('../utility/identity');

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"../utility/identity":230}],182:[function(require,module,exports){
(function (global){
/** Native method references. */
var ArrayBuffer = global.ArrayBuffer,
    Uint8Array = global.Uint8Array;

/**
 * Creates a clone of the given array buffer.
 *
 * @private
 * @param {ArrayBuffer} buffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function bufferClone(buffer) {
  var result = new ArrayBuffer(buffer.byteLength),
      view = new Uint8Array(result);

  view.set(new Uint8Array(buffer));
  return result;
}

module.exports = bufferClone;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],183:[function(require,module,exports){
var baseCallback = require('./baseCallback'),
    baseEach = require('./baseEach'),
    isArray = require('../lang/isArray');

/**
 * Creates a `_.countBy`, `_.groupBy`, `_.indexBy`, or `_.partition` function.
 *
 * @private
 * @param {Function} setter The function to set keys and values of the accumulator object.
 * @param {Function} [initializer] The function to initialize the accumulator object.
 * @returns {Function} Returns the new aggregator function.
 */
function createAggregator(setter, initializer) {
  return function(collection, iteratee, thisArg) {
    var result = initializer ? initializer() : {};
    iteratee = baseCallback(iteratee, thisArg, 3);

    if (isArray(collection)) {
      var index = -1,
          length = collection.length;

      while (++index < length) {
        var value = collection[index];
        setter(result, value, iteratee(value, index, collection), collection);
      }
    } else {
      baseEach(collection, function(value, key, collection) {
        setter(result, value, iteratee(value, key, collection), collection);
      });
    }
    return result;
  };
}

module.exports = createAggregator;

},{"../lang/isArray":210,"./baseCallback":161,"./baseEach":164}],184:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isIterateeCall = require('./isIterateeCall'),
    restParam = require('../function/restParam');

/**
 * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return restParam(function(object, sources) {
    var index = -1,
        length = object == null ? 0 : sources.length,
        customizer = length > 2 ? sources[length - 2] : undefined,
        guard = length > 2 ? sources[2] : undefined,
        thisArg = length > 1 ? sources[length - 1] : undefined;

    if (typeof customizer == 'function') {
      customizer = bindCallback(customizer, thisArg, 5);
      length -= 2;
    } else {
      customizer = typeof thisArg == 'function' ? thisArg : undefined;
      length -= (customizer ? 1 : 0);
    }
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"../function/restParam":153,"./bindCallback":181,"./isIterateeCall":200}],185:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength'),
    toObject = require('./toObject');

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      return eachFunc(collection, iteratee);
    }
    var index = fromRight ? length : -1,
        iterable = toObject(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"./getLength":192,"./isLength":202,"./toObject":206}],186:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{"./toObject":206}],187:[function(require,module,exports){
var restParam = require('../function/restParam');

/**
 * Creates a `_.defaults` or `_.defaultsDeep` function.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Function} Returns the new defaults function.
 */
function createDefaults(assigner, customizer) {
  return restParam(function(args) {
    var object = args[0];
    if (object == null) {
      return object;
    }
    args.push(customizer);
    return assigner.apply(undefined, args);
  });
}

module.exports = createDefaults;

},{"../function/restParam":153}],188:[function(require,module,exports){
var baseCallback = require('./baseCallback'),
    baseReduce = require('./baseReduce'),
    isArray = require('../lang/isArray');

/**
 * Creates a function for `_.reduce` or `_.reduceRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createReduce(arrayFunc, eachFunc) {
  return function(collection, iteratee, accumulator, thisArg) {
    var initFromArray = arguments.length < 3;
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee, accumulator, initFromArray)
      : baseReduce(collection, baseCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
  };
}

module.exports = createReduce;

},{"../lang/isArray":210,"./baseCallback":161,"./baseReduce":178}],189:[function(require,module,exports){
var arraySome = require('./arraySome');

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing arrays.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

module.exports = equalArrays;

},{"./arraySome":157}],190:[function(require,module,exports){
/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object)
        ? other != +other
        : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings primitives and string
      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
      return object == (other + '');
  }
  return false;
}

module.exports = equalByTag;

},{}],191:[function(require,module,exports){
var keys = require('../object/keys');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isLoose) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

    // Recursively compare objects (susceptible to call stack limits).
    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

module.exports = equalObjects;

},{"../object/keys":225}],192:[function(require,module,exports){
var baseProperty = require('./baseProperty');

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"./baseProperty":176}],193:[function(require,module,exports){
var isStrictComparable = require('./isStrictComparable'),
    pairs = require('../object/pairs');

/**
 * Gets the propery names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = pairs(object),
      length = result.length;

  while (length--) {
    result[length][2] = isStrictComparable(result[length][1]);
  }
  return result;
}

module.exports = getMatchData;

},{"../object/pairs":228,"./isStrictComparable":204}],194:[function(require,module,exports){
var isNative = require('../lang/isNative');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"../lang/isNative":214}],195:[function(require,module,exports){
/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add array properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

module.exports = initCloneArray;

},{}],196:[function(require,module,exports){
var bufferClone = require('./bufferClone');

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return bufferClone(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      var buffer = object.buffer;
      return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      var result = new Ctor(object.source, reFlags.exec(object));
      result.lastIndex = object.lastIndex;
  }
  return result;
}

module.exports = initCloneByTag;

},{"./bufferClone":182}],197:[function(require,module,exports){
/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  var Ctor = object.constructor;
  if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
    Ctor = Object;
  }
  return new Ctor;
}

module.exports = initCloneObject;

},{}],198:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

module.exports = isArrayLike;

},{"./getLength":192,"./isLength":202}],199:[function(require,module,exports){
/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],200:[function(require,module,exports){
var isArrayLike = require('./isArrayLike'),
    isIndex = require('./isIndex'),
    isObject = require('../lang/isObject');

/**
 * Checks if the provided arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
      ? (isArrayLike(object) && isIndex(index, object.length))
      : (type == 'string' && index in object)) {
    var other = object[index];
    return value === value ? (value === other) : (other !== other);
  }
  return false;
}

module.exports = isIterateeCall;

},{"../lang/isObject":216,"./isArrayLike":198,"./isIndex":199}],201:[function(require,module,exports){
var isArray = require('../lang/isArray'),
    toObject = require('./toObject');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  var type = typeof value;
  if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
    return true;
  }
  if (isArray(value)) {
    return false;
  }
  var result = !reIsDeepProp.test(value);
  return result || (object != null && value in toObject(object));
}

module.exports = isKey;

},{"../lang/isArray":210,"./toObject":206}],202:[function(require,module,exports){
/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],203:[function(require,module,exports){
/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],204:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"../lang/isObject":216}],205:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('./isIndex'),
    isLength = require('./isLength'),
    keysIn = require('../object/keysIn');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"../lang/isArguments":209,"../lang/isArray":210,"../object/keysIn":226,"./isIndex":199,"./isLength":202}],206:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"../lang/isObject":216}],207:[function(require,module,exports){
var baseToString = require('./baseToString'),
    isArray = require('../lang/isArray');

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `value` to property path array if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Array} Returns the property path array.
 */
function toPath(value) {
  if (isArray(value)) {
    return value;
  }
  var result = [];
  baseToString(value).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
}

module.exports = toPath;

},{"../lang/isArray":210,"./baseToString":180}],208:[function(require,module,exports){
var baseClone = require('../internal/baseClone'),
    bindCallback = require('../internal/bindCallback'),
    isIterateeCall = require('../internal/isIterateeCall');

/**
 * Creates a clone of `value`. If `isDeep` is `true` nested objects are cloned,
 * otherwise they are assigned by reference. If `customizer` is provided it's
 * invoked to produce the cloned values. If `customizer` returns `undefined`
 * cloning is handled by the method instead. The `customizer` is bound to
 * `thisArg` and invoked with up to three argument; (value [, index|key, object]).
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
 * The enumerable properties of `arguments` objects and objects created by
 * constructors other than `Object` are cloned to plain `Object` objects. An
 * empty object is returned for uncloneable values such as functions, DOM nodes,
 * Maps, Sets, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {*} Returns the cloned value.
 * @example
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * var shallow = _.clone(users);
 * shallow[0] === users[0];
 * // => true
 *
 * var deep = _.clone(users, true);
 * deep[0] === users[0];
 * // => false
 *
 * // using a customizer callback
 * var el = _.clone(document.body, function(value) {
 *   if (_.isElement(value)) {
 *     return value.cloneNode(false);
 *   }
 * });
 *
 * el === document.body
 * // => false
 * el.nodeName
 * // => BODY
 * el.childNodes.length;
 * // => 0
 */
function clone(value, isDeep, customizer, thisArg) {
  if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
    isDeep = false;
  }
  else if (typeof isDeep == 'function') {
    thisArg = customizer;
    customizer = isDeep;
    isDeep = false;
  }
  return typeof customizer == 'function'
    ? baseClone(value, isDeep, bindCallback(customizer, thisArg, 3))
    : baseClone(value, isDeep);
}

module.exports = clone;

},{"../internal/baseClone":162,"../internal/bindCallback":181,"../internal/isIterateeCall":200}],209:[function(require,module,exports){
var isArrayLike = require('../internal/isArrayLike'),
    isObjectLike = require('../internal/isObjectLike');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{"../internal/isArrayLike":198,"../internal/isObjectLike":203}],210:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var arrayTag = '[object Array]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

module.exports = isArray;

},{"../internal/getNative":194,"../internal/isLength":202,"../internal/isObjectLike":203}],211:[function(require,module,exports){
var isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isArrayLike = require('../internal/isArrayLike'),
    isFunction = require('./isFunction'),
    isObjectLike = require('../internal/isObjectLike'),
    isString = require('./isString'),
    keys = require('../object/keys');

/**
 * Checks if `value` is empty. A value is considered empty unless it's an
 * `arguments` object, array, string, or jQuery-like collection with a length
 * greater than `0` or an object with own enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {Array|Object|string} value The value to inspect.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (isArrayLike(value) && (isArray(value) || isString(value) || isArguments(value) ||
      (isObjectLike(value) && isFunction(value.splice)))) {
    return !value.length;
  }
  return !keys(value).length;
}

module.exports = isEmpty;

},{"../internal/isArrayLike":198,"../internal/isObjectLike":203,"../object/keys":225,"./isArguments":209,"./isArray":210,"./isFunction":213,"./isString":219}],212:[function(require,module,exports){
var baseIsEqual = require('../internal/baseIsEqual'),
    bindCallback = require('../internal/bindCallback');

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent. If `customizer` is provided it's invoked to compare values.
 * If `customizer` returns `undefined` comparisons are handled by the method
 * instead. The `customizer` is bound to `thisArg` and invoked with up to
 * three arguments: (value, other [, index|key]).
 *
 * **Note:** This method supports comparing arrays, booleans, `Date` objects,
 * numbers, `Object` objects, regexes, and strings. Objects are compared by
 * their own, not inherited, enumerable properties. Functions and DOM nodes
 * are **not** supported. Provide a customizer function to extend support
 * for comparing other values.
 *
 * @static
 * @memberOf _
 * @alias eq
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize value comparisons.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'user': 'fred' };
 * var other = { 'user': 'fred' };
 *
 * object == other;
 * // => false
 *
 * _.isEqual(object, other);
 * // => true
 *
 * // using a customizer callback
 * var array = ['hello', 'goodbye'];
 * var other = ['hi', 'goodbye'];
 *
 * _.isEqual(array, other, function(value, other) {
 *   if (_.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/)) {
 *     return true;
 *   }
 * });
 * // => true
 */
function isEqual(value, other, customizer, thisArg) {
  customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
  var result = customizer ? customizer(value, other) : undefined;
  return  result === undefined ? baseIsEqual(value, other, customizer) : !!result;
}

module.exports = isEqual;

},{"../internal/baseIsEqual":169,"../internal/bindCallback":181}],213:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 which returns 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

module.exports = isFunction;

},{"./isObject":216}],214:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isObjectLike = require('../internal/isObjectLike');

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isNative;

},{"../internal/isObjectLike":203,"./isFunction":213}],215:[function(require,module,exports){
var isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
 * as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isNumber(8.4);
 * // => true
 *
 * _.isNumber(NaN);
 * // => true
 *
 * _.isNumber('8.4');
 * // => false
 */
function isNumber(value) {
  return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
}

module.exports = isNumber;

},{"../internal/isObjectLike":203}],216:[function(require,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],217:[function(require,module,exports){
var baseForIn = require('../internal/baseForIn'),
    isArguments = require('./isArguments'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * **Note:** This method assumes objects created by the `Object` constructor
 * have no inherited enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  var Ctor;

  // Exit early for non `Object` objects.
  if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
      (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
    return false;
  }
  // IE < 9 iterates inherited properties before own properties. If the first
  // iterated property is an object's own property then there are no inherited
  // enumerable properties.
  var result;
  // In most environments an object's own properties are iterated before
  // its inherited properties. If the last iterated property is an object's
  // own property then there are no inherited enumerable properties.
  baseForIn(value, function(subValue, key) {
    result = key;
  });
  return result === undefined || hasOwnProperty.call(value, result);
}

module.exports = isPlainObject;

},{"../internal/baseForIn":166,"../internal/isObjectLike":203,"./isArguments":209}],218:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var regexpTag = '[object RegExp]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `RegExp` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isRegExp(/abc/);
 * // => true
 *
 * _.isRegExp('/abc/');
 * // => false
 */
function isRegExp(value) {
  return isObject(value) && objToString.call(value) == regexpTag;
}

module.exports = isRegExp;

},{"./isObject":216}],219:[function(require,module,exports){
var isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
}

module.exports = isString;

},{"../internal/isObjectLike":203}],220:[function(require,module,exports){
var isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

module.exports = isTypedArray;

},{"../internal/isLength":202,"../internal/isObjectLike":203}],221:[function(require,module,exports){
var baseCopy = require('../internal/baseCopy'),
    keysIn = require('../object/keysIn');

/**
 * Converts `value` to a plain object flattening inherited enumerable
 * properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return baseCopy(value, keysIn(value));
}

module.exports = toPlainObject;

},{"../internal/baseCopy":163,"../object/keysIn":226}],222:[function(require,module,exports){
var assignWith = require('../internal/assignWith'),
    baseAssign = require('../internal/baseAssign'),
    createAssigner = require('../internal/createAssigner');

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object. Subsequent sources overwrite property assignments of previous sources.
 * If `customizer` is provided it's invoked to produce the assigned values.
 * The `customizer` is bound to `thisArg` and invoked with five arguments:
 * (objectValue, sourceValue, key, object, source).
 *
 * **Note:** This method mutates `object` and is based on
 * [`Object.assign`](http://ecma-international.org/ecma-262/6.0/#sec-object.assign).
 *
 * @static
 * @memberOf _
 * @alias extend
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
 * // => { 'user': 'fred', 'age': 40 }
 *
 * // using a customizer callback
 * var defaults = _.partialRight(_.assign, function(value, other) {
 *   return _.isUndefined(value) ? other : value;
 * });
 *
 * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
 * // => { 'user': 'barney', 'age': 36 }
 */
var assign = createAssigner(function(object, source, customizer) {
  return customizer
    ? assignWith(object, source, customizer)
    : baseAssign(object, source);
});

module.exports = assign;

},{"../internal/assignWith":159,"../internal/baseAssign":160,"../internal/createAssigner":184}],223:[function(require,module,exports){
var assign = require('./assign'),
    assignDefaults = require('../internal/assignDefaults'),
    createDefaults = require('../internal/createDefaults');

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object for all destination properties that resolve to `undefined`. Once a
 * property is set, additional values of the same property are ignored.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * _.defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
 * // => { 'user': 'barney', 'age': 36 }
 */
var defaults = createDefaults(assign, assignDefaults);

module.exports = defaults;

},{"../internal/assignDefaults":158,"../internal/createDefaults":187,"./assign":222}],224:[function(require,module,exports){
var baseGet = require('../internal/baseGet'),
    baseSlice = require('../internal/baseSlice'),
    isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('../internal/isIndex'),
    isKey = require('../internal/isKey'),
    isLength = require('../internal/isLength'),
    last = require('../array/last'),
    toPath = require('../internal/toPath');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if `path` is a direct property.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` is a direct property, else `false`.
 * @example
 *
 * var object = { 'a': { 'b': { 'c': 3 } } };
 *
 * _.has(object, 'a');
 * // => true
 *
 * _.has(object, 'a.b.c');
 * // => true
 *
 * _.has(object, ['a', 'b', 'c']);
 * // => true
 */
function has(object, path) {
  if (object == null) {
    return false;
  }
  var result = hasOwnProperty.call(object, path);
  if (!result && !isKey(path)) {
    path = toPath(path);
    object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
    if (object == null) {
      return false;
    }
    path = last(path);
    result = hasOwnProperty.call(object, path);
  }
  return result || (isLength(object.length) && isIndex(path, object.length) &&
    (isArray(object) || isArguments(object)));
}

module.exports = has;

},{"../array/last":149,"../internal/baseGet":168,"../internal/baseSlice":179,"../internal/isIndex":199,"../internal/isKey":201,"../internal/isLength":202,"../internal/toPath":207,"../lang/isArguments":209,"../lang/isArray":210}],225:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isArrayLike = require('../internal/isArrayLike'),
    isObject = require('../lang/isObject'),
    shimKeys = require('../internal/shimKeys');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"../internal/getNative":194,"../internal/isArrayLike":198,"../internal/shimKeys":205,"../lang/isObject":216}],226:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('../internal/isIndex'),
    isLength = require('../internal/isLength'),
    isObject = require('../lang/isObject');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"../internal/isIndex":199,"../internal/isLength":202,"../lang/isArguments":209,"../lang/isArray":210,"../lang/isObject":216}],227:[function(require,module,exports){
var baseMerge = require('../internal/baseMerge'),
    createAssigner = require('../internal/createAssigner');

/**
 * Recursively merges own enumerable properties of the source object(s), that
 * don't resolve to `undefined` into the destination object. Subsequent sources
 * overwrite property assignments of previous sources. If `customizer` is
 * provided it's invoked to produce the merged values of the destination and
 * source properties. If `customizer` returns `undefined` merging is handled
 * by the method instead. The `customizer` is bound to `thisArg` and invoked
 * with five arguments: (objectValue, sourceValue, key, object, source).
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var users = {
 *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
 * };
 *
 * var ages = {
 *   'data': [{ 'age': 36 }, { 'age': 40 }]
 * };
 *
 * _.merge(users, ages);
 * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
 *
 * // using a customizer callback
 * var object = {
 *   'fruits': ['apple'],
 *   'vegetables': ['beet']
 * };
 *
 * var other = {
 *   'fruits': ['banana'],
 *   'vegetables': ['carrot']
 * };
 *
 * _.merge(object, other, function(a, b) {
 *   if (_.isArray(a)) {
 *     return a.concat(b);
 *   }
 * });
 * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
 */
var merge = createAssigner(baseMerge);

module.exports = merge;

},{"../internal/baseMerge":174,"../internal/createAssigner":184}],228:[function(require,module,exports){
var keys = require('./keys'),
    toObject = require('../internal/toObject');

/**
 * Creates a two dimensional array of the key-value pairs for `object`,
 * e.g. `[[key1, value1], [key2, value2]]`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the new array of key-value pairs.
 * @example
 *
 * _.pairs({ 'barney': 36, 'fred': 40 });
 * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
 */
function pairs(object) {
  object = toObject(object);

  var index = -1,
      props = keys(object),
      length = props.length,
      result = Array(length);

  while (++index < length) {
    var key = props[index];
    result[index] = [key, object[key]];
  }
  return result;
}

module.exports = pairs;

},{"../internal/toObject":206,"./keys":225}],229:[function(require,module,exports){
var baseGet = require('../internal/baseGet'),
    baseSlice = require('../internal/baseSlice'),
    isFunction = require('../lang/isFunction'),
    isKey = require('../internal/isKey'),
    last = require('../array/last'),
    toPath = require('../internal/toPath');

/**
 * This method is like `_.get` except that if the resolved value is a function
 * it's invoked with the `this` binding of its parent object and its result
 * is returned.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to resolve.
 * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
 *
 * _.result(object, 'a[0].b.c1');
 * // => 3
 *
 * _.result(object, 'a[0].b.c2');
 * // => 4
 *
 * _.result(object, 'a.b.c', 'default');
 * // => 'default'
 *
 * _.result(object, 'a.b.c', _.constant('default'));
 * // => 'default'
 */
function result(object, path, defaultValue) {
  var result = object == null ? undefined : object[path];
  if (result === undefined) {
    if (object != null && !isKey(path, object)) {
      path = toPath(path);
      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
      result = object == null ? undefined : object[last(path)];
    }
    result = result === undefined ? defaultValue : result;
  }
  return isFunction(result) ? result.call(object) : result;
}

module.exports = result;

},{"../array/last":149,"../internal/baseGet":168,"../internal/baseSlice":179,"../internal/isKey":201,"../internal/toPath":207,"../lang/isFunction":213}],230:[function(require,module,exports){
/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],231:[function(require,module,exports){
var baseProperty = require('../internal/baseProperty'),
    basePropertyDeep = require('../internal/basePropertyDeep'),
    isKey = require('../internal/isKey');

/**
 * Creates a function that returns the property value at `path` on a
 * given object.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': { 'c': 2 } } },
 *   { 'a': { 'b': { 'c': 1 } } }
 * ];
 *
 * _.map(objects, _.property('a.b.c'));
 * // => [2, 1]
 *
 * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
}

module.exports = property;

},{"../internal/baseProperty":176,"../internal/basePropertyDeep":177,"../internal/isKey":201}],232:[function(require,module,exports){
/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/
(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports && typeof require === 'function') {
        module.exports = definition();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(definition);
    } else {
        root.log = definition();
    }
}(this, function () {
    "use strict";
    var noop = function() {};
    var undefinedType = "undefined";

    function realMethod(methodName) {
        if (typeof console === undefinedType) {
            return false; // We can't build a real method without a console to log to
        } else if (console[methodName] !== undefined) {
            return bindMethod(console, methodName);
        } else if (console.log !== undefined) {
            return bindMethod(console, 'log');
        } else {
            return noop;
        }
    }

    function bindMethod(obj, methodName) {
        var method = obj[methodName];
        if (typeof method.bind === 'function') {
            return method.bind(obj);
        } else {
            try {
                return Function.prototype.bind.call(method, obj);
            } catch (e) {
                // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                return function() {
                    return Function.prototype.apply.apply(method, [obj, arguments]);
                };
            }
        }
    }

    // these private functions always need `this` to be set properly

    function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
        return function () {
            if (typeof console !== undefinedType) {
                replaceLoggingMethods.call(this, level, loggerName);
                this[methodName].apply(this, arguments);
            }
        };
    }

    function replaceLoggingMethods(level, loggerName) {
        /*jshint validthis:true */
        for (var i = 0; i < logMethods.length; i++) {
            var methodName = logMethods[i];
            this[methodName] = (i < level) ?
                noop :
                this.methodFactory(methodName, level, loggerName);
        }
    }

    function defaultMethodFactory(methodName, level, loggerName) {
        /*jshint validthis:true */
        return realMethod(methodName) ||
               enableLoggingWhenConsoleArrives.apply(this, arguments);
    }

    var logMethods = [
        "trace",
        "debug",
        "info",
        "warn",
        "error"
    ];

    function Logger(name, defaultLevel, factory) {
      var self = this;
      var currentLevel;
      var storageKey = "loglevel";
      if (name) {
        storageKey += ":" + name;
      }

      function persistLevelIfPossible(levelNum) {
          var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

          // Use localStorage if available
          try {
              window.localStorage[storageKey] = levelName;
              return;
          } catch (ignore) {}

          // Use session cookie as fallback
          try {
              window.document.cookie =
                encodeURIComponent(storageKey) + "=" + levelName + ";";
          } catch (ignore) {}
      }

      function getPersistedLevel() {
          var storedLevel;

          try {
              storedLevel = window.localStorage[storageKey];
          } catch (ignore) {}

          if (typeof storedLevel === undefinedType) {
              try {
                  var cookie = window.document.cookie;
                  var location = cookie.indexOf(
                      encodeURIComponent(storageKey) + "=");
                  if (location) {
                      storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
                  }
              } catch (ignore) {}
          }

          // If the stored level is not valid, treat it as if nothing was stored.
          if (self.levels[storedLevel] === undefined) {
              storedLevel = undefined;
          }

          return storedLevel;
      }

      /*
       *
       * Public API
       *
       */

      self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
          "ERROR": 4, "SILENT": 5};

      self.methodFactory = factory || defaultMethodFactory;

      self.getLevel = function () {
          return currentLevel;
      };

      self.setLevel = function (level, persist) {
          if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
              level = self.levels[level.toUpperCase()];
          }
          if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
              currentLevel = level;
              if (persist !== false) {  // defaults to true
                  persistLevelIfPossible(level);
              }
              replaceLoggingMethods.call(self, level, name);
              if (typeof console === undefinedType && level < self.levels.SILENT) {
                  return "No console available for logging";
              }
          } else {
              throw "log.setLevel() called with invalid level: " + level;
          }
      };

      self.setDefaultLevel = function (level) {
          if (!getPersistedLevel()) {
              self.setLevel(level, false);
          }
      };

      self.enableAll = function(persist) {
          self.setLevel(self.levels.TRACE, persist);
      };

      self.disableAll = function(persist) {
          self.setLevel(self.levels.SILENT, persist);
      };

      // Initialize with the right level
      var initialLevel = getPersistedLevel();
      if (initialLevel == null) {
          initialLevel = defaultLevel == null ? "WARN" : defaultLevel;
      }
      self.setLevel(initialLevel, false);
    }

    /*
     *
     * Package-level API
     *
     */

    var defaultLogger = new Logger();

    var _loggersByName = {};
    defaultLogger.getLogger = function getLogger(name) {
        if (typeof name !== "string" || name === "") {
          throw new TypeError("You must supply a name when creating a logger.");
        }

        var logger = _loggersByName[name];
        if (!logger) {
          logger = _loggersByName[name] = new Logger(
            name, defaultLogger.getLevel(), defaultLogger.methodFactory);
        }
        return logger;
    };

    // Grab the current global log variable in case of overwrite
    var _log = (typeof window !== undefinedType) ? window.log : undefined;
    defaultLogger.noConflict = function() {
        if (typeof window !== undefinedType &&
               window.log === defaultLogger) {
            window.log = _log;
        }

        return defaultLogger;
    };

    return defaultLogger;
}));

},{}],233:[function(require,module,exports){
module.exports = require('./lib');

},{"./lib":234}],234:[function(require,module,exports){
/* global define, Promise */
(function (root, factory) {
    'use strict';
    if (typeof module === 'object' && module.exports && typeof require === 'function') {
        // CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals
        root.Queue = factory();
    }
})
(this, function () {
    'use strict';

    /**
     * @return {Object}
     */
    var LocalPromise = typeof Promise !== 'undefined' ? Promise : function () {
        return {
            then: function () {
                throw new Error('Queue.configure() before use Queue');
            }
        };
    };

    var noop = function () {};

    /**
     * @param {*} value
     * @returns {LocalPromise}
     */
    var resolveWith = function (value) {
        if (value && typeof value.then === 'function') {
            return value;
        }

        return new LocalPromise(function (resolve) {
            resolve(value);
        });
    };

    /**
     * It limits concurrently executed promises
     *
     * @param {Number} [maxPendingPromises=Infinity] max number of concurrently executed promises
     * @param {Number} [maxQueuedPromises=Infinity]  max number of queued promises
     * @constructor
     *
     * @example
     *
     * var queue = new Queue(1);
     *
     * queue.add(function () {
     *     // resolve of this promise will resume next request
     *     return downloadTarballFromGithub(url, file);
     * })
     * .then(function (file) {
     *     doStuffWith(file);
     * });
     *
     * queue.add(function () {
     *     return downloadTarballFromGithub(url, file);
     * })
     * // This request will be paused
     * .then(function (file) {
     *     doStuffWith(file);
     * });
     */
    function Queue(maxPendingPromises, maxQueuedPromises) {
        this.pendingPromises = 0;
        this.maxPendingPromises = typeof maxPendingPromises !== 'undefined' ? maxPendingPromises : Infinity;
        this.maxQueuedPromises = typeof maxQueuedPromises !== 'undefined' ? maxQueuedPromises : Infinity;
        this.queue = [];
    }

    /**
     * Defines promise promiseFactory
     * @param {Function} GlobalPromise
     */
    Queue.configure = function (GlobalPromise) {
        LocalPromise = GlobalPromise;
    };

    /**
     * @param {Function} promiseGenerator
     * @return {LocalPromise}
     */
    Queue.prototype.add = function (promiseGenerator) {
        var self = this;
        return new LocalPromise(function (resolve, reject, notify) {
            // Do not queue to much promises
            if (self.queue.length >= self.maxQueuedPromises) {
                reject(new Error('Queue limit reached'));
                return;
            }

            // Add to queue
            self.queue.push({
                promiseGenerator: promiseGenerator,
                resolve: resolve,
                reject: reject,
                notify: notify || noop
            });

            self._dequeue();
        });
    };

    /**
     * Number of simultaneously running promises (which are resolving)
     *
     * @return {number}
     */
    Queue.prototype.getPendingLength = function () {
        return this.pendingPromises;
    };

    /**
     * Number of queued promises (which are waiting)
     *
     * @return {number}
     */
    Queue.prototype.getQueueLength = function () {
        return this.queue.length;
    };

    /**
     * @returns {boolean} true if first item removed from queue
     * @private
     */
    Queue.prototype._dequeue = function () {
        var self = this;

        if (this.pendingPromises >= this.maxPendingPromises) {
            return false;
        }

        // Remove from queue
        var item = this.queue.shift();
        if (!item) {
            return false;
        }

        this.pendingPromises++;
        resolveWith(item.promiseGenerator())
            // Forward all stuff
            .then(function (value) {
                // It is not pending now
                self.pendingPromises--;
                self._dequeue();
                // It should pass values
                item.resolve(value);
            }, function (err) {
                // It is not pending now
                self.pendingPromises--;
                self._dequeue();
                // It should not mask errors
                item.reject(err);
            }, function (message) {
                // It should pass notifications
                item.notify(message);
            });

        return true;
    };

    return Queue;
});

},{}],235:[function(require,module,exports){
/*
 * Sift 2.x
 *
 * Copryright 2015, Craig Condon
 * Licensed under MIT
 *
 * Filter JavaScript objects with mongodb queries
 */

(function() {

  'use strict';

  /**
   */

  function isFunction(value) {
    return typeof value === 'function';
  }

  /**
   */

  function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  }

  /**
   */

  function comparable(value) {
    if (value instanceof Date) {
      return value.getTime();
    } else if (value instanceof Array) {
      return value.map(comparable);
    } else {
      return value;
    }
  }

  /**
   */

  function or(validator) {
    return function(a, b) {
      if (!isArray(b) || !b.length) return validator(a, b);
      for (var i = 0, n = b.length; i < n; i++) if (validator(a, b[i])) return true;
      return false;
    }
  }

  /**
   */

  function and(validator) {
    return function(a, b) {
      if (!isArray(b) || !b.length) return validator(a, b);
      for (var i = 0, n = b.length; i < n; i++) if (!validator(a, b[i])) return false;
      return true;
    };
  }

  function validate(validator, b) {
    return validator.v(validator.a, b);
  }


  var operator = {

    /**
     */

    $eq: or(function(a, b) {
      return a(b);
    }),

    /**
     */

    $ne: and(function(a, b) {
      if(typeof b == 'undefined') return false;
      return !a(b);
    }),

    /**
     */

    $or: function(a, b) {
      for (var i = 0, n = a.length; i < n; i++) if (validate(a[i], b)) return true;
      return false;
    },

    /**
     */

    $gt: or(function(a, b) {
      return typeof comparable(b) === typeof a && comparable(b) > a;
    }),

    /**
     */

    $gte: or(function(a, b) {
      return typeof comparable(b) === typeof a && comparable(b) >= a;
    }),

    /**
     */

    $lt: or(function(a, b) {
      return typeof comparable(b) === typeof a && comparable(b) < a;
    }),

    /**
     */

    $lte: or(function(a, b) {
      return typeof comparable(b) === typeof a && comparable(b) <= a;
    }),

    /**
     */

    $mod: or(function(a, b) {
      return b % a[0] == a[1];
    }),

    /**
     */

    $in: function(a, b) {

      if (b instanceof Array) {
        for (var i = b.length; i--;) {
          if (~a.indexOf(comparable(b[i]))) return true;
        }
      } else {
        return !!~a.indexOf(comparable(b));
      }

      return false;
    },

    /**
     */

    $nin: function(a, b) {
      return !operator.$in(a, b);
    },

    /**
     */

    $not: function(a, b) {
      return !validate(a, b);
    },

    /**
     */

    $type: function(a, b) {
      return b != void 0 ? b instanceof a || b.constructor == a : false;
     },

    /**
     */

    $all: function(a, b) {
      if (!b) b = [];
      for (var i = a.length; i--;) {
        if (!~comparable(b).indexOf(a[i])) return false;
      }
      return true;
    },

    /**
     */

    $size: function(a, b) {
      return b ? a === b.length : false;
    },

    /**
     */

    $nor: function(a, b) {
      // todo - this suffice? return !operator.$in(a)
      for (var i = 0, n = a.length; i < n; i++) if (validate(a[i], b)) return false;
      return true;
    },

    /**
     */

    $and: function(a, b) {
      for (var i = 0, n = a.length; i < n; i++) if (!validate(a[i], b)) return false;
      return true;
    },

    /**
     */

    $regex: or(function(a, b) {
      return typeof b === 'string' && a.test(b);
    }),

    /**
     */

    $where: function(a, b) {
      return a.call(b, b);
    },

    /**
     */

    $elemMatch: function(a, b) {
      if (isArray(b)) return !!~search(b, a);
      return validate(a, b);
    },

    /**
     */

    $exists: function(a, b) {
      return (b != void 0) === a;
    }
  };

  /**
   */

  var prepare = {

    /**
     */

    $eq: function(a) {

      if (a instanceof RegExp) {
        return function(b) {
          return typeof b === 'string' && a.test(b);
        };
      } else if (a instanceof Function) {
        return a;
      } else if (isArray(a) && !a.length) {
        // Special case of a == []
        return function(b) {
          return (isArray(b) && !b.length);
        };
      }

      return function(b) {
        return a === comparable(b);
      };
    },

    /**
     */

    $ne: function(a) {
      return prepare.$eq(a);
    },

    /**
     */

    $and: function(a) {
      return a.map(parse);
    },

    /**
     */

    $or: function(a) {
      return a.map(parse);
    },

    /**
     */

    $nor: function(a) {
      return a.map(parse);
    },

    /**
     */

    $not: function(a) {
      return parse(a);
    },

    /**
     */

    $regex: function(a, query) {
      return new RegExp(a, query.$options);
    },

    /**
     */

    $where: function(a) {
      return typeof a === 'string' ? new Function('obj', 'return ' + a) : a;
    },

    /**
     */

    $elemMatch: function(a) {
      return parse(a);
    },

    /**
     */

    $exists: function(a) {
      return !!a;
    }
  };

  /**
   */

  function search(array, validator) {

    for (var i = 0; i < array.length; i++) {
      if (validate(validator, array[i])) {
        return i;
      }
    }

    return -1;
  }

  /**
   */

  function createValidator(a, validate) {
    return { a: a, v: validate };
  }

  /**
   */

  function nestedValidator(a, b) {
    var values  = [];
    findValues(b, a.k, 0, values);

    if (values.length === 1) {
      return validate(a.nv, values[0]);
    }

    return !!~search(values, a.nv);
  }

  /**
   */

  function findValues(current, keypath, index, values) {

    if (index === keypath.length || current == void 0) {
      values.push(current);
      return;
    }

    if (isArray(current)) {
      for (var i = 0, n = current.length; i < n; i++) {
        findValues(current[i], keypath, index, values);
      }
    } else {
      findValues(current[keypath[index]], keypath, index + 1, values);
    }
  }

  /**
   */

  function createNestedValidator(keypath, a) {
    return { a: { k: keypath, nv: a }, v: nestedValidator };
  }

  /**
   * flatten the query
   */

  function parse(query) {
    query = comparable(query);

    if (!query || (query.constructor.toString() !== 'Object' &&
        query.constructor.toString().replace(/\n/g,'').replace(/ /g, '') !== 'functionObject(){[nativecode]}')) { // cross browser support
      query = { $eq: query };
    }

    var validators = [];

    for (var key in query) {
      var a = query[key];

      if (key === '$options') continue;

      if (operator[key]) {
        if (prepare[key]) a = prepare[key](a, query);
        validators.push(createValidator(comparable(a), operator[key]));
      } else {
        if (key.charCodeAt(0) === 36) {
          throw new Error('Unknown operation ' + key);
        }
        validators.push(createNestedValidator(key.split('.'), parse(a)));
      }
    }

    return validators.length === 1 ? validators[0] : createValidator(validators, operator.$and);
  }

  /**
   */

  function createRootValidator(query, getter) {
    var validator = parse(query);
    if (getter) {
      validator = {
        a: validator,
        v: function(a, b) {
          return validate(a, getter(b));
        }
      };
    }
    return validator;
  }

  /**
   */

  function sift(query, array, getter) {

    if (isFunction(array)) {
      getter = array;
      array  = void 0;
    }

    var validator = createRootValidator(query, getter);

    function filter(b) {
      return validate(validator, b);
    }

    if (array) {
      return array.filter(filter);
    }

    return filter;
  }

  /**
   */

  sift.use = function(plugin) {
    if (isFunction(plugin)) return plugin(sift);
    for (var key in plugin) {
      if (key.charCodeAt(0) === 36) operator[key] = plugin[key];
    }
  };

  /**
   */

  sift.indexOf = function(query, array, getter) {
    return search(array, createRootValidator(query, getter));
  };

  /* istanbul ignore next */
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = sift;
  }

  if (typeof window !== 'undefined') {
    window.sift = sift;
  }
})();

},{}],236:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Force given parser
 * 
 * Sets the body parser no matter type.
 * 
 * @param {Function}
 * @api public
 */

Response.prototype.parse = function(fn){
  this.parser = fn;
  return this;
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = this.parser || request.parse[this.type];
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return self.callback(err, res);
    }

    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
    new_err.original = err;
    new_err.response = res;
    new_err.status = res.status;

    self.callback(new_err, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(field, file, filename);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || isHost(data)) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self.timeoutError();
      if (self.aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var contentType = this.getHeader('Content-Type');
    var serialize = request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);
  xhr.send(data);
  return this;
};

/**
 * Faux promise support
 *
 * @param {Function} fulfill
 * @param {Function} reject
 * @return {Request}
 */

Request.prototype.then = function (fulfill, reject) {
  return this.end(function(err, res) {
    err ? reject(err) : fulfill(res);
  });
}

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":237,"reduce":238}],237:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],238:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],239:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
var slice = [].slice;

(function(root, factory) {
  if (('function' === typeof define) && (define.amd != null)) {
    return define([], factory);
  } else if (typeof exports !== "undefined" && exports !== null) {
    return module.exports = factory();
  } else {
    return root.UrlPattern = factory();
  }
})(this, function() {
  var P, UrlPattern, astNodeContainsSegmentsForProvidedParams, astNodeToNames, astNodeToRegexString, baseAstNodeToRegexString, concatMap, defaultOptions, escapeForRegex, getParam, keysAndValuesToObject, newParser, regexGroupCount, stringConcatMap, stringify;
  escapeForRegex = function(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };
  concatMap = function(array, f) {
    var i, length, results;
    results = [];
    i = -1;
    length = array.length;
    while (++i < length) {
      results = results.concat(f(array[i]));
    }
    return results;
  };
  stringConcatMap = function(array, f) {
    var i, length, result;
    result = '';
    i = -1;
    length = array.length;
    while (++i < length) {
      result += f(array[i]);
    }
    return result;
  };
  regexGroupCount = function(regex) {
    return (new RegExp(regex.toString() + '|')).exec('').length - 1;
  };
  keysAndValuesToObject = function(keys, values) {
    var i, key, length, object, value;
    object = {};
    i = -1;
    length = keys.length;
    while (++i < length) {
      key = keys[i];
      value = values[i];
      if (value == null) {
        continue;
      }
      if (object[key] != null) {
        if (!Array.isArray(object[key])) {
          object[key] = [object[key]];
        }
        object[key].push(value);
      } else {
        object[key] = value;
      }
    }
    return object;
  };
  P = {};
  P.Result = function(value, rest) {
    this.value = value;
    this.rest = rest;
  };
  P.Tagged = function(tag, value) {
    this.tag = tag;
    this.value = value;
  };
  P.tag = function(tag, parser) {
    return function(input) {
      var result, tagged;
      result = parser(input);
      if (result == null) {
        return;
      }
      tagged = new P.Tagged(tag, result.value);
      return new P.Result(tagged, result.rest);
    };
  };
  P.regex = function(regex) {
    return function(input) {
      var matches, result;
      matches = regex.exec(input);
      if (matches == null) {
        return;
      }
      result = matches[0];
      return new P.Result(result, input.slice(result.length));
    };
  };
  P.sequence = function() {
    var parsers;
    parsers = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return function(input) {
      var i, length, parser, rest, result, values;
      i = -1;
      length = parsers.length;
      values = [];
      rest = input;
      while (++i < length) {
        parser = parsers[i];
        result = parser(rest);
        if (result == null) {
          return;
        }
        values.push(result.value);
        rest = result.rest;
      }
      return new P.Result(values, rest);
    };
  };
  P.pick = function() {
    var indexes, parsers;
    indexes = arguments[0], parsers = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return function(input) {
      var array, result;
      result = P.sequence.apply(P, parsers)(input);
      if (result == null) {
        return;
      }
      array = result.value;
      result.value = array[indexes];
      return result;
    };
  };
  P.string = function(string) {
    var length;
    length = string.length;
    return function(input) {
      if (input.slice(0, length) === string) {
        return new P.Result(string, input.slice(length));
      }
    };
  };
  P.lazy = function(fn) {
    var cached;
    cached = null;
    return function(input) {
      if (cached == null) {
        cached = fn();
      }
      return cached(input);
    };
  };
  P.baseMany = function(parser, end, stringResult, atLeastOneResultRequired, input) {
    var endResult, parserResult, rest, results;
    rest = input;
    results = stringResult ? '' : [];
    while (true) {
      if (end != null) {
        endResult = end(rest);
        if (endResult != null) {
          break;
        }
      }
      parserResult = parser(rest);
      if (parserResult == null) {
        break;
      }
      if (stringResult) {
        results += parserResult.value;
      } else {
        results.push(parserResult.value);
      }
      rest = parserResult.rest;
    }
    if (atLeastOneResultRequired && results.length === 0) {
      return;
    }
    return new P.Result(results, rest);
  };
  P.many1 = function(parser) {
    return function(input) {
      return P.baseMany(parser, null, false, true, input);
    };
  };
  P.concatMany1Till = function(parser, end) {
    return function(input) {
      return P.baseMany(parser, end, true, true, input);
    };
  };
  P.firstChoice = function() {
    var parsers;
    parsers = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return function(input) {
      var i, length, parser, result;
      i = -1;
      length = parsers.length;
      while (++i < length) {
        parser = parsers[i];
        result = parser(input);
        if (result != null) {
          return result;
        }
      }
    };
  };
  newParser = function(options) {
    var U;
    U = {};
    U.wildcard = P.tag('wildcard', P.string(options.wildcardChar));
    U.optional = P.tag('optional', P.pick(1, P.string(options.optionalSegmentStartChar), P.lazy(function() {
      return U.pattern;
    }), P.string(options.optionalSegmentEndChar)));
    U.name = P.regex(new RegExp("^[" + options.segmentNameCharset + "]+"));
    U.named = P.tag('named', P.pick(1, P.string(options.segmentNameStartChar), P.lazy(function() {
      return U.name;
    })));
    U.escapedChar = P.pick(1, P.string(options.escapeChar), P.regex(/^./));
    U["static"] = P.tag('static', P.concatMany1Till(P.firstChoice(P.lazy(function() {
      return U.escapedChar;
    }), P.regex(/^./)), P.firstChoice(P.string(options.segmentNameStartChar), P.string(options.optionalSegmentStartChar), P.string(options.optionalSegmentEndChar), U.wildcard)));
    U.token = P.lazy(function() {
      return P.firstChoice(U.wildcard, U.optional, U.named, U["static"]);
    });
    U.pattern = P.many1(P.lazy(function() {
      return U.token;
    }));
    return U;
  };
  defaultOptions = {
    escapeChar: '\\',
    segmentNameStartChar: ':',
    segmentValueCharset: 'a-zA-Z0-9-_~ %',
    segmentNameCharset: 'a-zA-Z0-9',
    optionalSegmentStartChar: '(',
    optionalSegmentEndChar: ')',
    wildcardChar: '*'
  };
  baseAstNodeToRegexString = function(astNode, segmentValueCharset) {
    if (Array.isArray(astNode)) {
      return stringConcatMap(astNode, function(node) {
        return baseAstNodeToRegexString(node, segmentValueCharset);
      });
    }
    switch (astNode.tag) {
      case 'wildcard':
        return '(.*?)';
      case 'named':
        return "([" + segmentValueCharset + "]+)";
      case 'static':
        return escapeForRegex(astNode.value);
      case 'optional':
        return '(?:' + baseAstNodeToRegexString(astNode.value, segmentValueCharset) + ')?';
    }
  };
  astNodeToRegexString = function(astNode, segmentValueCharset) {
    if (segmentValueCharset == null) {
      segmentValueCharset = defaultOptions.segmentValueCharset;
    }
    return '^' + baseAstNodeToRegexString(astNode, segmentValueCharset) + '$';
  };
  astNodeToNames = function(astNode) {
    if (Array.isArray(astNode)) {
      return concatMap(astNode, astNodeToNames);
    }
    switch (astNode.tag) {
      case 'wildcard':
        return ['_'];
      case 'named':
        return [astNode.value];
      case 'static':
        return [];
      case 'optional':
        return astNodeToNames(astNode.value);
    }
  };
  getParam = function(params, key, nextIndexes, sideEffects) {
    var index, maxIndex, result, value;
    if (sideEffects == null) {
      sideEffects = false;
    }
    value = params[key];
    if (value == null) {
      if (sideEffects) {
        throw new Error("no values provided for key `" + key + "`");
      } else {
        return;
      }
    }
    index = nextIndexes[key] || 0;
    maxIndex = Array.isArray(value) ? value.length - 1 : 0;
    if (index > maxIndex) {
      if (sideEffects) {
        throw new Error("too few values provided for key `" + key + "`");
      } else {
        return;
      }
    }
    result = Array.isArray(value) ? value[index] : value;
    if (sideEffects) {
      nextIndexes[key] = index + 1;
    }
    return result;
  };
  astNodeContainsSegmentsForProvidedParams = function(astNode, params, nextIndexes) {
    var i, length;
    if (Array.isArray(astNode)) {
      i = -1;
      length = astNode.length;
      while (++i < length) {
        if (astNodeContainsSegmentsForProvidedParams(astNode[i], params, nextIndexes)) {
          return true;
        }
      }
      return false;
    }
    switch (astNode.tag) {
      case 'wildcard':
        return getParam(params, '_', nextIndexes, false) != null;
      case 'named':
        return getParam(params, astNode.value, nextIndexes, false) != null;
      case 'static':
        return false;
      case 'optional':
        return astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes);
    }
  };
  stringify = function(astNode, params, nextIndexes) {
    if (Array.isArray(astNode)) {
      return stringConcatMap(astNode, function(node) {
        return stringify(node, params, nextIndexes);
      });
    }
    switch (astNode.tag) {
      case 'wildcard':
        return getParam(params, '_', nextIndexes, true);
      case 'named':
        return getParam(params, astNode.value, nextIndexes, true);
      case 'static':
        return astNode.value;
      case 'optional':
        if (astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes)) {
          return stringify(astNode.value, params, nextIndexes);
        } else {
          return '';
        }
    }
  };
  UrlPattern = function(arg1, arg2) {
    var groupCount, options, parsed, parser, withoutWhitespace;
    if (arg1 instanceof UrlPattern) {
      this.isRegex = arg1.isRegex;
      this.regex = arg1.regex;
      this.ast = arg1.ast;
      this.names = arg1.names;
      return;
    }
    this.isRegex = arg1 instanceof RegExp;
    if (!(('string' === typeof arg1) || this.isRegex)) {
      throw new TypeError('argument must be a regex or a string');
    }
    if (this.isRegex) {
      this.regex = arg1;
      if (arg2 != null) {
        if (!Array.isArray(arg2)) {
          throw new Error('if first argument is a regex the second argument may be an array of group names but you provided something else');
        }
        groupCount = regexGroupCount(this.regex);
        if (arg2.length !== groupCount) {
          throw new Error("regex contains " + groupCount + " groups but array of group names contains " + arg2.length);
        }
        this.names = arg2;
      }
      return;
    }
    if (arg1 === '') {
      throw new Error('argument must not be the empty string');
    }
    withoutWhitespace = arg1.replace(/\s+/g, '');
    if (withoutWhitespace !== arg1) {
      throw new Error('argument must not contain whitespace');
    }
    options = {
      escapeChar: (arg2 != null ? arg2.escapeChar : void 0) || defaultOptions.escapeChar,
      segmentNameStartChar: (arg2 != null ? arg2.segmentNameStartChar : void 0) || defaultOptions.segmentNameStartChar,
      segmentNameCharset: (arg2 != null ? arg2.segmentNameCharset : void 0) || defaultOptions.segmentNameCharset,
      segmentValueCharset: (arg2 != null ? arg2.segmentValueCharset : void 0) || defaultOptions.segmentValueCharset,
      optionalSegmentStartChar: (arg2 != null ? arg2.optionalSegmentStartChar : void 0) || defaultOptions.optionalSegmentStartChar,
      optionalSegmentEndChar: (arg2 != null ? arg2.optionalSegmentEndChar : void 0) || defaultOptions.optionalSegmentEndChar,
      wildcardChar: (arg2 != null ? arg2.wildcardChar : void 0) || defaultOptions.wildcardChar
    };
    parser = newParser(options);
    parsed = parser.pattern(arg1);
    if (parsed == null) {
      throw new Error("couldn't parse pattern");
    }
    if (parsed.rest !== '') {
      throw new Error("could only partially parse pattern");
    }
    this.ast = parsed.value;
    this.regex = new RegExp(astNodeToRegexString(this.ast, options.segmentValueCharset));
    this.names = astNodeToNames(this.ast);
  };
  UrlPattern.prototype.match = function(url) {
    var groups, match;
    match = this.regex.exec(url);
    if (match == null) {
      return null;
    }
    groups = match.slice(1);
    if (this.names) {
      return keysAndValuesToObject(this.names, groups);
    } else {
      return groups;
    }
  };
  UrlPattern.prototype.stringify = function(params) {
    if (params == null) {
      params = {};
    }
    if (this.isRegex) {
      throw new Error("can't stringify patterns generated from a regex");
    }
    if (params !== Object(params)) {
      throw new Error("argument must be an object or undefined");
    }
    return stringify(this.ast, params, {});
  };
  UrlPattern.escapeForRegex = escapeForRegex;
  UrlPattern.concatMap = concatMap;
  UrlPattern.stringConcatMap = stringConcatMap;
  UrlPattern.regexGroupCount = regexGroupCount;
  UrlPattern.keysAndValuesToObject = keysAndValuesToObject;
  UrlPattern.P = P;
  UrlPattern.newParser = newParser;
  UrlPattern.defaultOptions = defaultOptions;
  UrlPattern.astNodeToRegexString = astNodeToRegexString;
  UrlPattern.astNodeToNames = astNodeToNames;
  UrlPattern.getParam = getParam;
  UrlPattern.astNodeContainsSegmentsForProvidedParams = astNodeContainsSegmentsForProvidedParams;
  UrlPattern.stringify = stringify;
  return UrlPattern;
});

},{}],240:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Symbol = require('babel-runtime/core-js/symbol')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _errors = require('./errors');

var _lodashLangIsPlainObject = require('lodash/lang/isPlainObject');

var _lodashLangIsPlainObject2 = _interopRequireDefault(_lodashLangIsPlainObject);

var _lodashLangClone = require('lodash/lang/clone');

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

var privateAclSymbol = _Symbol();

var PrivateAcl = (function () {
  _createClass(PrivateAcl, [{
    key: 'creator',
    get: function get() {
      return this.acl.creator;
    }
  }, {
    key: 'readers',
    get: function get() {
      return this.acl.r || [];
    }
  }, {
    key: 'writers',
    get: function get() {
      return this.acl.w || [];
    }
  }, {
    key: 'readerGroups',
    get: function get() {
      return this.acl.groups ? this.acl.groups.r : [];
    }
  }, {
    key: 'writerGroups',
    get: function get() {
      return this.acl.groups ? this.acl.groups.w : [];
    }
  }, {
    key: 'globallyReadable',
    set: function set(gr) {
      this.acl.gr = gr || false;
    }
  }, {
    key: 'globallyWritable',
    set: function set(gw) {
      this.acl.gw = gw || false;
    }
  }]);

  function PrivateAcl() {
    var acl = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, PrivateAcl);

    if (!(0, _lodashLangIsPlainObject2['default'])(acl)) {
      throw new _errors.KinveyError('acl argument must be an object');
    }

    this.acl = acl;
  }

  _createClass(PrivateAcl, [{
    key: 'addReader',
    value: function addReader(user) {
      var r = this.acl.r || [];

      if (r.indexOf(user) === -1) {
        r.push(user);
      }

      this.acl.r = r;
      return this;
    }
  }, {
    key: 'addReaderGroup',
    value: function addReaderGroup(group) {
      var groups = this.acl.groups || {};
      var w = groups.w || [];

      if (w.indexOf(group) === -1) {
        w.push(group);
      }

      groups.w = w;
      this.acl.groups = groups;
      return this;
    }
  }, {
    key: 'addWriter',
    value: function addWriter(user) {
      var w = this.acl.w || [];

      if (w.indexOf(user) === -1) {
        w.push(user);
      }

      this.acl.w = w;
      return this;
    }
  }, {
    key: 'isGloballyReadable',
    value: function isGloballyReadable() {
      return this.acl.gr || false;
    }
  }, {
    key: 'isGloballyWritable',
    value: function isGloballyWritable() {
      return this.acl.gw || false;
    }
  }, {
    key: 'removeReader',
    value: function removeReader(user) {
      var r = this.acl.r || [];
      var pos = r.indexOf(user);

      if (pos !== -1) {
        r.splice(pos, 1);
      }

      this.acl.r = r;
      return this;
    }
  }, {
    key: 'removeReaderGroup',
    value: function removeReaderGroup(group) {
      var groups = this.acl.groups || {};
      var r = groups.r || [];
      var pos = r.indexOf(group);

      if (pos !== -1) {
        r.splice(pos, 1);
      }

      groups.r = r;
      this.acl.groups = groups;
      return this;
    }
  }, {
    key: 'removeWriter',
    value: function removeWriter(user) {
      var w = this.acl.w || [];
      var pos = w.indexOf(user);

      if (pos !== -1) {
        w.splice(pos, 1);
      }

      this.acl.w = w;
      return this;
    }
  }, {
    key: 'removeWriterGroup',
    value: function removeWriterGroup(group) {
      var groups = this.acl.groups || {};
      var w = groups.w || [];
      var pos = w.indexOf(group);

      if (pos !== -1) {
        w.splice(pos, 1);
      }

      groups.w = w;
      this.acl.groups = groups;
      return this;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return (0, _lodashLangClone2['default'])(this.acl);
    }
  }]);

  return PrivateAcl;
})();

var Acl = (function () {
  _createClass(Acl, [{
    key: 'creator',
    get: function get() {
      return this[privateAclSymbol].creator;
    }
  }, {
    key: 'readers',
    get: function get() {
      return this[privateAclSymbol].readers;
    }
  }, {
    key: 'readerGroups',
    get: function get() {
      return this[privateAclSymbol].readerGroups;
    }
  }, {
    key: 'writerGroups',
    get: function get() {
      return this[privateAclSymbol].writerGroups;
    }
  }, {
    key: 'writers',
    get: function get() {
      return this[privateAclSymbol].writers;
    }
  }, {
    key: 'globallyReadable',
    set: function set(gr) {
      this[privateAclSymbol].globallyReadable = gr;
    }
  }, {
    key: 'globallyWritable',
    set: function set(gw) {
      this[privateAclSymbol].globallyWritable = gw;
    }
  }]);

  function Acl(acl) {
    _classCallCheck(this, Acl);

    this[privateAclSymbol] = new PrivateAcl(acl);
  }

  _createClass(Acl, [{
    key: 'addReader',
    value: function addReader(user) {
      this[privateAclSymbol].addReader(user);
      return this;
    }
  }, {
    key: 'addReaderGroup',
    value: function addReaderGroup(group) {
      this[privateAclSymbol].addReaderGroup(group);
      return this;
    }
  }, {
    key: 'addWriter',
    value: function addWriter(user) {
      this[privateAclSymbol].addWriter(user);
      return this;
    }
  }, {
    key: 'isGloballyReadable',
    value: function isGloballyReadable() {
      return this[privateAclSymbol].isGloballyReadable();
    }
  }, {
    key: 'isGloballyWritable',
    value: function isGloballyWritable() {
      return this[privateAclSymbol].isGloballyWritable();
    }
  }, {
    key: 'removeReader',
    value: function removeReader(user) {
      this[privateAclSymbol].removeReader(user);
      return this;
    }
  }, {
    key: 'removeReaderGroup',
    value: function removeReaderGroup(group) {
      this[privateAclSymbol].removeReaderGroup(group);
      return this;
    }
  }, {
    key: 'removeWriter',
    value: function removeWriter(user) {
      this[privateAclSymbol].removeWriter(user);
      return this;
    }
  }, {
    key: 'removeWriterGroup',
    value: function removeWriterGroup(group) {
      this[privateAclSymbol].removeWriterGroup(group);
      return this;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this[privateAclSymbol].toJSON();
    }
  }]);

  return Acl;
})();

exports['default'] = Acl;
module.exports = exports['default'];

},{"./errors":259,"babel-runtime/core-js/symbol":8,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"lodash/lang/clone":208,"lodash/lang/isPlainObject":217}],241:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Symbol = require('babel-runtime/core-js/symbol')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _errors = require('./errors');

var _query3 = require('./query');

var _query4 = _interopRequireDefault(_query3);

var _lodashLangClone = require('lodash/lang/clone');

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

var _lodashLangIsObject = require('lodash/lang/isObject');

var _lodashLangIsObject2 = _interopRequireDefault(_lodashLangIsObject);

var _lodashLangIsString = require('lodash/lang/isString');

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

var _lodashLangIsFunction = require('lodash/lang/isFunction');

var _lodashLangIsFunction2 = _interopRequireDefault(_lodashLangIsFunction);

var privateAggregationSymbol = _Symbol();

var PrivateAggregation = (function () {
  function PrivateAggregation() {
    _classCallCheck(this, PrivateAggregation);

    this._query = null;
    this._initial = {};
    this._key = {};
    this._reduce = (function () {}).toString();
  }

  _createClass(PrivateAggregation, [{
    key: 'by',
    value: function by(field) {
      this._key[field] = true;
      return this;
    }
  }, {
    key: 'initial',
    value: function initial(objectOrKey, value) {
      if (!value && !(0, _lodashLangIsObject2['default'])(objectOrKey)) {
        throw new _errors.KinveyError('objectOrKey argument must be an Object.');
      }

      if ((0, _lodashLangIsObject2['default'])(objectOrKey)) {
        this._initial = objectOrKey;
      } else {
        this._initial[objectOrKey] = value;
      }

      return this;
    }
  }, {
    key: 'process',
    value: function process(response) {
      if (!this._query) {
        return response;
      }

      return this._query.process(response);
    }
  }, {
    key: 'query',
    value: function query(_query) {
      if (!(_query instanceof _query4['default'])) {
        throw new _errors.KinveyError('query argument must be of type Kinvey.Query.');
      }

      this._query = _query;
      return this;
    }
  }, {
    key: 'reduce',
    value: function reduce(fn) {
      if ((0, _lodashLangIsFunction2['default'])(fn)) {
        fn = fn.toString();
      }

      if (!(0, _lodashLangIsString2['default'])(fn)) {
        throw new _errors.KinveyError('fn argument must be of type function or string.');
      }

      this._reduce = fn;
      return this;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = {
        key: this._key,
        initial: this._initial,
        reduce: this._reduce,
        condition: this._query ? this._query.toJSON().filter : {}
      };

      return (0, _lodashLangClone2['default'])(json);
    }
  }]);

  return PrivateAggregation;
})();

var Aggregation = (function () {
  function Aggregation() {
    _classCallCheck(this, Aggregation);

    this[privateAggregationSymbol] = new PrivateAggregation();
  }

  _createClass(Aggregation, [{
    key: 'by',
    value: function by(field) {
      this[privateAggregationSymbol].by(field);
      return this;
    }
  }, {
    key: 'initial',
    value: function initial(objectOrKey, value) {
      this[privateAggregationSymbol].initial(objectOrKey, value);
      return this;
    }
  }, {
    key: 'process',
    value: function process(response) {
      return this[privateAggregationSymbol].process(response);
    }
  }, {
    key: 'query',
    value: function query(_query2) {
      this[privateAggregationSymbol].query(_query2);
      return this;
    }
  }, {
    key: 'reduce',
    value: function reduce(fn) {
      this[privateAggregationSymbol].reduce(fn);
      return this;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this[privateAggregationSymbol].toJSON();
    }
  }]);

  return Aggregation;
})();

exports['default'] = Aggregation;
module.exports = exports['default'];

},{"./errors":259,"./query":264,"babel-runtime/core-js/symbol":8,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"lodash/lang/clone":208,"lodash/lang/isFunction":213,"lodash/lang/isObject":216,"lodash/lang/isString":219}],242:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _utilsUser = require('../utils/user');

var Auth = (function () {
  function Auth() {
    _classCallCheck(this, Auth);
  }

  _createClass(Auth, null, [{
    key: 'all',
    value: function all(client) {
      return Auth.session(client)['catch'](function () {
        return Auth.basic(client);
      });
    }
  }, {
    key: 'app',
    value: function app(client) {
      if (!client.appId || !client.appSecret) {
        var error = new Error('Missing client credentials');
        return _Promise.reject(error);
      }

      var promise = _Promise.resolve({
        scheme: 'Basic',
        username: client.appId,
        password: client.appSecret
      });

      return promise;
    }
  }, {
    key: 'basic',
    value: function basic(client) {
      return Auth.master(client)['catch'](function () {
        return Auth.app(client);
      });
    }
  }, {
    key: 'default',
    value: function _default(client) {
      return Auth.session(client)['catch'](function (err) {
        return Auth.master(client)['catch'](function () {
          return _Promise.reject(err);
        });
      });
    }
  }, {
    key: 'master',
    value: function master(client) {
      if (!client.appId || !client.masterSecret) {
        var error = new Error('Missing client credentials');
        return _Promise.reject(error);
      }

      var promise = _Promise.resolve({
        scheme: 'Basic',
        username: client.appId,
        password: client.masterSecret
      });

      return promise;
    }
  }, {
    key: 'none',
    value: function none() {
      return _Promise.resolve(null);
    }
  }, {
    key: 'session',
    value: function session() {
      return (0, _utilsUser.getActiveUser)().then(function (user) {
        if (!user) {
          throw new Error('There is not an active user.');
        }

        return {
          scheme: 'Kinvey',
          credentials: user._kmd.authtoken
        };
      });
    }
  }]);

  return Auth;
})();

exports['default'] = Auth;
module.exports = exports['default'];

},{"../utils/user":284,"babel-runtime/core-js/promise":7,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10}],243:[function(require,module,exports){
(function (global){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _errors = require('../../errors');

var _query = require('../../query');

var _query2 = _interopRequireDefault(_query);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var inTransaction = false;
var indexedDB = require('fake-indexeddb');

if ('node' !== 'node') {
  global.shimIndexedDB.__useShim();
  indexedDB = global.shimIndexedDB || global.indexedDB || global.mozIndexedDB || global.webkitIndexedDB || global.OIndexedDB || global.msIndexedDB;
}

var IndexedDBAdapter = (function () {
  function IndexedDBAdapter(dbInfo) {
    _classCallCheck(this, IndexedDBAdapter);

    this.dbInfo = dbInfo;
    this.queue = [];
  }

  _createClass(IndexedDBAdapter, [{
    key: 'transaction',
    value: function transaction(write, success, error) {
      if (write === undefined) write = false;

      var _this = this;

      var force = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

      var name = this.dbInfo.name;
      var collection = this.dbInfo.collection;

      if (this.db && (force || !inTransaction)) {
        if (this.db.objectStoreNames.indexOf(collection) !== -1) {
          var mode = write ? 'readwrite' : 'readonly';

          try {
            var txn = this.db.transaction([collection], mode);

            if (txn) {
              var store = txn.objectStore(collection);
              return success(store);
            }

            return error(new _errors.KinveyError('Unable to open a transaction for the database. Please try this database transaction again.'));
          } catch (err) {
            return error(err);
          }
        } else if (!write) {
          return error(new _errors.KinveyError('The collection ' + collection + ' was not found in the database.'));
        }
      }

      if (force !== true && inTransaction) {
        return this.queue.push(function () {
          return _this.transaction(write, success, error);
        });
      }

      inTransaction = true;
      var request = undefined;

      if (this.db) {
        var version = this.db.version + 1;
        this.db.close();
        request = indexedDB.open(name, version);
      } else {
        request = indexedDB.open(name);
      }

      request.onupgradeneeded = function () {
        if (write) {
          request.result.createObjectStore(collection, { keyPath: '_id' });
        }
      };

      request.onsuccess = function () {
        _this.db = request.result;

        _this.db.onversionchange = function () {
          if (_this.db) {
            _this.db.close();
            _this.db = null;
          }
        };

        var wrap = function wrap(cb) {
          return function (arg) {
            cb(arg);
            inTransaction = false;

            if (_this.queue.length > 0) {
              var queue = _this.queue;
              _this.queue = [];
              queue.forEach(function (fn) {
                return fn();
              });
            }
          };
        };

        _this.transaction(write, wrap(success), wrap(error), true);
      };

      request.onerror = function (e) {
        error(e);
      };
    }
  }, {
    key: 'find',
    value: function find(query) {
      var _this2 = this;

      var promise = new _bluebird2['default'](function (resolve, reject) {
        _this2.transaction(false, function (store) {
          var request = store.openCursor();
          var response = [];

          request.onsuccess = function () {
            var cursor = request.result;

            if (cursor) {
              response.push(cursor.value);
              cursor['continue']();
            } else {
              resolve(response);
            }
          };

          request.onerror = function (e) {
            reject(e);
          };
        }, reject);
      }).then(function (docs) {
        if (query) {
          return query.process(docs);
        }

        return docs;
      })['catch'](function () {
        return [];
      });

      return promise;
    }
  }, {
    key: 'count',
    value: function count(query) {
      var promise = this.find(query).then(function (docs) {
        return docs.length;
      });

      return promise;
    }
  }, {
    key: 'findAndModify',
    value: function findAndModify(id, fn) {
      var _this3 = this;

      var promise = new _bluebird2['default'](function (resolve, reject) {
        _this3.transaction(true, function (store) {
          var txn = store.transaction;
          var request = store.get(id);
          var doc = undefined;

          request.onsuccess = function () {
            doc = fn(request.result || null);
            store.put(doc);
          };

          txn.oncomplete = function () {
            resolve(doc);
          };

          txn.onerror = function (e) {
            reject(e);
          };
        }, reject);
      });

      return promise;
    }
  }, {
    key: 'group',
    value: function group(aggregation) {
      var query = new _query2['default']({ filter: aggregation.condition });

      var promise = this.find(query).then(function (docs) {
        var groups = {};

        docs.forEach(function (doc) {
          var group = {};

          for (var _name in aggregation.key) {
            if (aggregation.key.hasOwnProperty(_name)) {
              group[_name] = doc[_name];
            }
          }

          var key = JSON.stringify(group);
          if (!groups[key]) {
            groups[key] = group;

            for (var attr in aggregation.initial) {
              if (aggregation.initial.hasOwnProperty(attr)) {
                groups[key][attr] = aggregation.initial[attr];
              }
            }
          }

          aggregation.reduce(doc, groups[key]);
        });

        var response = [];
        for (var segment in groups) {
          if (groups.hasOwnProperty(segment)) {
            response.push(groups[segment]);
          }
        }

        return response;
      });

      return promise;
    }
  }, {
    key: 'get',
    value: function get(id) {
      var _this4 = this;

      var promise = new _bluebird2['default'](function (resolve, reject) {
        _this4.transaction(false, function (store) {
          var request = store.get(id);

          request.onsuccess = function () {
            if (request.result) {
              return resolve(request.result);
            }

            reject(new _errors.KinveyError('Entity not found in the collection.'));
          };

          request.onerror = function (e) {
            reject(e);
          };
        }, reject);
      });

      return promise;
    }
  }, {
    key: 'save',
    value: function save(doc) {
      var _this5 = this;

      var promise = new _bluebird2['default'](function (resolve, reject) {
        _this5.transaction(true, function (store) {
          var request = store.put(doc);

          request.onsuccess = function () {
            resolve(doc);
          };

          request.onerror = function (e) {
            reject(e);
          };
        }, reject);
      });

      return promise;
    }
  }, {
    key: 'batch',
    value: function batch(docs) {
      var _this6 = this;

      var promise = new _bluebird2['default'](function (resolve, reject) {
        _this6.transaction(true, function (store) {
          var txn = store.transaction;

          docs.forEach(function (doc) {
            store.put(doc);
          });

          txn.oncomplete = function () {
            resolve(docs);
          };

          txn.onerror = function (e) {
            reject(e);
          };
        }, reject);
      });

      return promise;
    }
  }, {
    key: 'delete',
    value: function _delete(id) {
      var _this7 = this;

      var promise = new _bluebird2['default'](function (resolve, reject) {
        _this7.transaction(true, function (store) {
          var txn = store.transaction;
          var request = store.get(id);
          store['delete'](id);

          txn.oncomplete = function () {
            if (!request.result) {
              return reject(new _errors.KinveyError('This entity was not found in the collection.'));
            }

            resolve({
              count: 1,
              documents: [request.result]
            });
          };

          txn.onerror = function (e) {
            reject(e);
          };
        }, reject);
      });

      return promise;
    }
  }, {
    key: 'clean',
    value: function clean(query) {
      var _this8 = this;

      var promise = this.find(query).then(function (docs) {
        if (docs.length === 0) {
          return { count: 0, documents: [] };
        }

        return new _bluebird2['default'](function (resolve, reject) {
          _this8.transaction(true, function (store) {
            var txn = store.transaction;

            docs.forEach(function (doc) {
              store['delete'](doc._id);
            });

            txn.oncomplete = function () {
              resolve({
                count: docs.length,
                documents: docs
              });
            };

            txn.onerror = function (e) {
              reject(e);
            };
          }, reject);
        });
      });

      return promise;
    }
  }, {
    key: 'clear',
    value: function clear() {
      var _this9 = this;

      var promise = new _bluebird2['default'](function (resolve, reject) {
        if (_this9.db) {
          _this9.db.close();
          _this9.db = null;
        }

        var request = indexedDB.deleteDatabase(_this9.dbInfo.name);

        request.onsuccess = function () {
          resolve(null);
        };

        request.onerror = function (e) {
          reject(e);
        };
      });

      return promise;
    }
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      return indexedDB ? true : false;
    }
  }]);

  return IndexedDBAdapter;
})();

exports['default'] = IndexedDBAdapter;
module.exports = exports['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../errors":259,"../../query":264,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"bluebird":86,"fake-indexeddb":100}],244:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _serializer = require('./serializer');

var _serializer2 = _interopRequireDefault(_serializer);

var _errors = require('../../errors');

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _humbleLocalstorage = require('humble-localstorage');

var _humbleLocalstorage2 = _interopRequireDefault(_humbleLocalstorage);

var LocalStorageAdapter = (function () {
  function LocalStorageAdapter() {
    var dbInfo = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, LocalStorageAdapter);

    dbInfo = (0, _lodashObjectAssign2['default'])({
      name: 'kinvey',
      collection: 'data'
    }, dbInfo);

    this.keyPrefix = dbInfo.name + '.' + dbInfo.collection;
  }

  _createClass(LocalStorageAdapter, [{
    key: 'serializeKey',
    value: function serializeKey(key) {
      return this.keyPrefix + '.' + key;
    }
  }, {
    key: 'deserializeKey',
    value: function deserializeKey(key) {
      return key.replace(this.keyPrefix + '.', '');
    }
  }, {
    key: 'find',
    value: function find(query) {
      var promises = [];

      for (var i = 0, len = _humbleLocalstorage2['default'].length; i < len; i++) {
        var key = _humbleLocalstorage2['default'].key(i);

        if (key.indexOf(this.keyPrefix) === 0) {
          promises.push(this.get(this.deserializeKey(key)));
        }
      }

      return _bluebird2['default'].all(promises).then(function (docs) {
        if (query) {
          return query.process(docs);
        }

        return docs;
      });
    }
  }, {
    key: 'count',
    value: function count(query) {
      var promise = this.find(query).then(function (docs) {
        return docs.length;
      });

      return promise;
    }
  }, {
    key: 'findAndModify',
    value: function findAndModify(key, fn) {
      var _this = this;

      var promise = this.get(key).then(function (doc) {
        doc = fn(doc || null);
        return _this.save(doc);
      });

      return promise;
    }
  }, {
    key: 'group',
    value: function group(aggregation) {
      var query = new Query({ filter: aggregation.condition });

      var promise = this.find(query).then(function (docs) {
        var groups = {};

        docs.forEach(function (doc) {
          var group = {};

          for (var _name in aggregation.key) {
            if (aggregation.key.hasOwnProperty(_name)) {
              group[_name] = doc[_name];
            }
          }

          var key = JSON.stringify(group);
          if (!groups[key]) {
            groups[key] = group;

            for (var attr in aggregation.initial) {
              if (aggregation.initial.hasOwnProperty(attr)) {
                groups[key][attr] = aggregation.initial[attr];
              }
            }
          }

          aggregation.reduce(doc, groups[key]);
        });

        var response = [];
        for (var segment in groups) {
          if (groups.hasOwnProperty(segment)) {
            response.push(groups[segment]);
          }
        }

        return response;
      });

      return promise;
    }
  }, {
    key: 'get',
    value: function get(key) {
      var value = _humbleLocalstorage2['default'].getItem(this.serializeKey(key));
      var serializer = new _serializer2['default']();
      var promise = serializer.deserialize(value);
      return promise;
    }
  }, {
    key: 'save',
    value: function save(doc) {
      var _this2 = this;

      if (!doc) {
        return _bluebird2['default'].resolve(null);
      }

      var serializer = new _serializer2['default']();
      var promise = serializer.serialize(doc).then(function (value) {
        try {
          _humbleLocalstorage2['default'].setItem(_this2.serializeKey(doc._id), value);
          return doc;
        } catch (err) {
          if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            throw err;
          }

          throw err;
        }
      });

      return promise;
    }
  }, {
    key: 'batch',
    value: function batch(docs) {
      var _this3 = this;

      var promises = [];

      docs.forEach(function (doc) {
        promises.push(_this3.save(doc));
      });

      return _bluebird2['default'].all(promises);
    }
  }, {
    key: 'delete',
    value: function _delete(key) {
      _humbleLocalstorage2['default'].removeItem(this.serializeKey(key));
      return _bluebird2['default'].resolve();
    }
  }, {
    key: 'clean',
    value: function clean() {
      return _bluebird2['default'].reject(new _errors.KinveyError('LocalStorageAdapter.clean() method is unsupported.'));
    }
  }, {
    key: 'clear',
    value: function clear() {
      _humbleLocalstorage2['default'].clear();
      return _bluebird2['default'].resolve();
    }
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      var kinvey = 'kinvey';

      try {
        _humbleLocalstorage2['default'].setItem(kinvey, kinvey);
        _humbleLocalstorage2['default'].removeItem(kinvey);
        return true;
      } catch (err) {
        return false;
      }
    }
  }]);

  return LocalStorageAdapter;
})();

exports['default'] = LocalStorageAdapter;
module.exports = exports['default'];

},{"../../errors":259,"./serializer":245,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"bluebird":86,"humble-localstorage":142,"lodash/object/assign":222}],245:[function(require,module,exports){
(function (global){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var BASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var BLOB_TYPE_PREFIX = '~~kinvey_type~';
var BLOB_TYPE_PREFIX_REGEX = /^~~kinvey_type~([^~]+)~/;
var SERIALIZED_MARKER = '__ksc__:';
var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;

var TYPE_ARRAYBUFFER = 'arbf';
var TYPE_BLOB = 'blob';
var TYPE_INT8ARRAY = 'si08';
var TYPE_UINT8ARRAY = 'ui08';
var TYPE_UINT8CLAMPEDARRAY = 'uic8';
var TYPE_INT16ARRAY = 'si16';
var TYPE_INT32ARRAY = 'si32';
var TYPE_UINT16ARRAY = 'ur16';
var TYPE_UINT32ARRAY = 'ui32';
var TYPE_FLOAT32ARRAY = 'fl32';
var TYPE_FLOAT64ARRAY = 'fl64';
var TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;

var Serializer = (function () {
  function Serializer() {
    _classCallCheck(this, Serializer);
  }

  _createClass(Serializer, [{
    key: 'serialize',
    value: function serialize(value) {
      var promise = new _bluebird2['default'](function (resolve, reject) {
        var valueString = '';

        if (value) {
          valueString = value.toString();
        }

        if (value && (value.toString() === '[object ArrayBuffer]' || value.buffer && value.buffer.toString() === '[object ArrayBuffer]')) {
          var buffer = undefined;
          var marker = SERIALIZED_MARKER;

          if (value instanceof ArrayBuffer) {
            buffer = value;
            marker += TYPE_ARRAYBUFFER;
          } else {
            buffer = value.buffer;

            if (valueString === '[object Int8Array]') {
              marker += TYPE_INT8ARRAY;
            } else if (valueString === '[object Uint8Array]') {
              marker += TYPE_UINT8ARRAY;
            } else if (valueString === '[object Uint8ClampedArray]') {
              marker += TYPE_UINT8CLAMPEDARRAY;
            } else if (valueString === '[object Int16Array]') {
              marker += TYPE_INT16ARRAY;
            } else if (valueString === '[object Uint16Array]') {
              marker += TYPE_UINT16ARRAY;
            } else if (valueString === '[object Int32Array]') {
              marker += TYPE_INT32ARRAY;
            } else if (valueString === '[object Uint32Array]') {
              marker += TYPE_UINT32ARRAY;
            } else if (valueString === '[object Float32Array]') {
              marker += TYPE_FLOAT32ARRAY;
            } else if (valueString === '[object Float64Array]') {
              marker += TYPE_FLOAT64ARRAY;
            } else {
              reject(new Error('Failed to get type for BinaryArray'));
            }
          }

          resolve(marker + this.bufferToString(buffer));
        } else if (valueString === '[object Blob]') {
          var fileReader = new FileReader();

          fileReader.onload = function () {
            var str = BLOB_TYPE_PREFIX + value.type + '~' + this.bufferToString(this.result);
            resolve(SERIALIZED_MARKER + TYPE_BLOB + str);
          };

          fileReader.readAsArrayBuffer(value);
        } else {
          try {
            resolve(JSON.stringify(value));
          } catch (err) {
            reject(err);
          }
        }
      });

      return promise;
    }
  }, {
    key: 'deserialize',
    value: function deserialize(value) {
      var promise = new _bluebird2['default'](function (resolve, reject) {
        if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
          resolve(JSON.parse(value));
        }

        var serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
        var type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);
        var blobType = undefined;

        if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
          var matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
          blobType = matcher[1];
          serializedString = serializedString.substring(matcher[0].length);
        }

        var buffer = this.stringToBuffer(serializedString);

        switch (type) {
          case TYPE_ARRAYBUFFER:
            return resolve(buffer);
          case TYPE_BLOB:
            return resolve(this._createBlob([buffer], { type: blobType }));
          case TYPE_INT8ARRAY:
            return resolve(new Int8Array(buffer));
          case TYPE_UINT8ARRAY:
            return resolve(new Uint8Array(buffer));
          case TYPE_UINT8CLAMPEDARRAY:
            return resolve(new Uint8ClampedArray(buffer));
          case TYPE_INT16ARRAY:
            return resolve(new Int16Array(buffer));
          case TYPE_UINT16ARRAY:
            return resolve(new Uint16Array(buffer));
          case TYPE_INT32ARRAY:
            return resolve(new Int32Array(buffer));
          case TYPE_UINT32ARRAY:
            return resolve(new Uint32Array(buffer));
          case TYPE_FLOAT32ARRAY:
            return resolve(new Float32Array(buffer));
          case TYPE_FLOAT64ARRAY:
            return resolve(new Float64Array(buffer));
          default:
            return reject(new Error('Unkown type: ' + type));
        }
      });

      return promise;
    }
  }, {
    key: 'stringToBuffer',
    value: function stringToBuffer(serializedString) {
      var bufferLength = serializedString.length * 0.75;
      var len = serializedString.length;
      var i = undefined;
      var p = 0;
      var encoded1 = undefined;
      var encoded2 = undefined;
      var encoded3 = undefined;
      var encoded4 = undefined;

      if (serializedString[serializedString.length - 1] === '=') {
        bufferLength--;

        if (serializedString[serializedString.length - 2] === '=') {
          bufferLength--;
        }
      }

      var buffer = new ArrayBuffer(bufferLength);
      var bytes = new Uint8Array(buffer);

      for (i = 0; i < len; i += 4) {
        encoded1 = BASE_CHARS.indexOf(serializedString[i]);
        encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
        encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
        encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);

        bytes[p++] = encoded1 << 2 | encoded2 >> 4;
        bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
        bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
      }

      return buffer;
    }
  }, {
    key: 'bufferToString',
    value: function bufferToString(buffer) {
      var bytes = new Uint8Array(buffer);
      var base64String = '';

      for (var i = 0, len = bytes.length; i < len; i += 3) {
        base64String += BASE_CHARS[bytes[i] >> 2];
        base64String += BASE_CHARS[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
        base64String += BASE_CHARS[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
        base64String += BASE_CHARS[bytes[i + 2] & 63];
      }

      if (bytes.length % 3 === 2) {
        base64String = base64String.substring(0, base64String.length - 1) + '=';
      } else if (bytes.length % 3 === 1) {
        base64String = base64String.substring(0, base64String.length - 2) + '==';
      }

      return base64String;
    }
  }, {
    key: '_createBlob',
    value: function _createBlob(parts, properties) {
      parts = parts || [];
      properties = properties || {};

      try {
        return new Blob(parts, properties);
      } catch (err) {
        if (err.name !== 'TypeError') {
          throw err;
        }

        var BlobBuilder = global.BlobBuilder || global.MSBlobBuilder || global.MozBlobBuilder || global.WebKitBlobBuilder;
        var builder = new BlobBuilder();

        for (var i = 0, len = parts.length; i < len; i += 1) {
          builder.append(parts[i]);
        }

        return builder.getBlob(properties.type);
      }
    }
  }]);

  return Serializer;
})();

exports['default'] = Serializer;
module.exports = exports['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"bluebird":86}],246:[function(require,module,exports){
(function (global){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _errors = require('../../errors');

var _promiseQueue = require('promise-queue');

var _promiseQueue2 = _interopRequireDefault(_promiseQueue);

var _query = require('../../query');

var _query2 = _interopRequireDefault(_query);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodashLangIsArray = require('lodash/lang/isArray');

var _lodashLangIsArray2 = _interopRequireDefault(_lodashLangIsArray);

var _lodashLangIsFunction = require('lodash/lang/isFunction');

var _lodashLangIsFunction2 = _interopRequireDefault(_lodashLangIsFunction);

var _lodashLangIsString = require('lodash/lang/isString');

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

_promiseQueue2['default'].configure(_bluebird2['default']);

var WebSQLAdapter = (function () {
  function WebSQLAdapter(dbInfo) {
    _classCallCheck(this, WebSQLAdapter);

    this.dbInfo = dbInfo;
    this.queue = new _promiseQueue2['default'](1, Infinity);
  }

  _createClass(WebSQLAdapter, [{
    key: 'transaction',
    value: function transaction(sql, parameters) {
      var _this = this;

      var write = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      var name = this.dbInfo.name;
      var collection = this.dbInfo.collection;
      var escapedCollection = '"' + collection + '"';
      var isMaster = collection === 'sqlite_master';
      var isMulti = (0, _lodashLangIsArray2['default'])(sql);
      sql = isMulti ? sql : [[sql, parameters]];

      if (!this.db) {
        this.db = global.openDatabase(name, 1, '', 5 * 1024 * 1024);
      }

      var promise = new _bluebird2['default'](function (resolve, reject) {
        var writeTxn = write || !(0, _lodashLangIsFunction2['default'])(_this.db.readTransaction);
        _this.db[writeTxn ? 'transaction' : 'readTransaction'](function (txn) {
          if (write && !isMaster) {
            txn.executeSQL('CREATE TABLE IF NOT EXISTS ' + escapedCollection + ' (key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)');
          }

          var pending = _this.sql.length;
          var responses = [];

          sql.forEach(function (parts) {
            var sql = parts[0].replace('#{collection}', escapedCollection);

            txn.executeSQL(sql, parts[1], function (_, resultSet) {
              var response = { rowCount: resultSet.rowsAffected, result: [] };

              if (resultSet.rows.length) {
                for (var i = 0, len = resultSet.rows.length; i < len; i++) {
                  var value = resultSet.rows.item(i).value;
                  var doc = isMaster ? value : JSON.parse(value);
                  response.result.push(doc);
                }
              }

              responses.push(response);
              pending -= 1;

              if (pending === 0) {
                resolve(isMulti ? responses : responses.shift());
              }
            });
          });
        }, function (err) {
          err = (0, _lodashLangIsString2['default'])(err) ? err : err.message;

          if (err && err.indexOf('no such table') !== -1) {
            return reject(new _errors.KinveyError('The collection was not found for this app backend.', collection));
          }

          var sql = 'SELECT name AS value from #{collection} WHERE type = ? and name = ?';
          var parameters = ['table', collection];
          var adapter = new WebSQLAdapter({
            name: name,
            collection: 'sqlite_master'
          });

          return adapter.transaction(sql, parameters, false).then(function (response) {
            if (response.result.length === 0) {
              err = new _errors.KinveyError('The collection was not found for this app backend.', collection);
            } else {
              err = new _errors.KinveyError('Database Error', err);
            }

            reject(err);
          });
        });
      });

      return promise;
    }
  }, {
    key: 'find',
    value: function find(query) {
      var sql = 'SELECT value FROM #{collection}';
      var promise = this.transaction(sql, []['false']).then(function (response) {
        var docs = response.result;

        if (query) {
          return query.process(docs);
        }

        return docs;
      });

      return promise;
    }
  }, {
    key: 'count',
    value: function count(query) {
      var promise = this.find(query).then(function (docs) {
        return { count: docs.length };
      });
      return promise;
    }
  }, {
    key: 'findAndModify',
    value: function findAndModify(id, fn) {
      var _this2 = this;

      var promise = this.queue.add(function () {
        return _this2.get(id).then(null, function (err) {
          if (err.name === 'Entity Not Found') {
            return null;
          }

          throw err;
        }).then(function (doc) {
          doc = fn(doc);
          return _this2.save(doc);
        });
      });

      return promise;
    }
  }, {
    key: 'group',
    value: function group(aggregation) {
      var query = new _query2['default']({ filter: aggregation.condition });

      var promise = this.find(query).then(function (docs) {
        var groups = {};

        docs.forEach(function (doc) {
          var group = {};

          for (var _name in aggregation.key) {
            if (aggregation.key.hasOwnProperty(_name)) {
              group[_name] = doc[_name];
            }
          }

          var key = JSON.stringify(group);
          if (!groups[key]) {
            groups[key] = group;

            for (var attr in aggregation.initial) {
              if (aggregation.initial.hasOwnProperty(attr)) {
                groups[key][attr] = aggregation.initial[attr];
              }
            }
          }

          aggregation.reduce(doc, groups[key]);
        });

        var response = [];
        for (var segment in groups) {
          if (groups.hasOwnProperty(segment)) {
            response.push(groups[segment]);
          }
        }

        return response;
      });

      return promise;
    }
  }, {
    key: 'get',
    value: function get(id) {
      var sql = 'SELECT value FROM #{collection} WHERE key = ?';
      var promise = this.transaction(sql, [id], false).then(function (response) {
        var docs = response.result;

        if (docs.length === 0) {
          throw new _errors.KinveyError('The entity was not found in the collection.');
        }

        return docs[0];
      });

      return promise;
    }
  }, {
    key: 'save',
    value: function save(doc) {
      var sql = 'REPLACE INTO #{collection} (key, value) VALUES (?, ?)';
      var parameters = [doc._id, JSON.stringify(doc)];
      var promise = this.transaction(sql, parameters, true).then(function () {
        return doc;
      });
      return promise;
    }
  }, {
    key: 'batch',
    value: function batch(docs) {
      var sql = [];

      docs = docs.map(function (doc) {
        sql.push(['REPLACE INTO #{collection} (key, value) VALUES (?, ?)', [doc._id, JSON.stringify(doc)]]);

        return doc;
      });

      var promise = this.transaction(sql, null, true).then(function () {
        return docs;
      });

      return promise;
    }
  }, {
    key: 'delete',
    value: function _delete(id) {
      var _this3 = this;

      var sql = [['SELECT value FROM #{collection} WHERE key = ?', [id]], ['DELETE FROM #{collection} WHERE key = ?', [id]]];

      var promise = this.transaction(sql, null, true).then(function (response) {
        var docs = response[0].result;
        var count = response[1].rowCount;

        count = count ? count : docs.length;

        if (count === 0) {
          throw new _errors.KinveyError('The entity not found in the collection.', { collection: _this3.dbInfo.collection, id: id });
        }

        return { count: count, documents: docs };
      });

      return promise;
    }
  }, {
    key: 'clean',
    value: function clean(query) {
      var _this4 = this;

      var promise = this.queue.add(function () {
        return _this4.find(query).then(function (docs) {
          if (docs.length === 0) {
            return { count: 0, documents: [] };
          }

          var infix = [];
          var parameters = docs.map(function (doc) {
            infix.push('?');
            return doc._id;
          });

          var sql = 'DELETE FROM #{collection} WHERE key IN(' + infix.join(',') + ')';
          return _this4.transaction(sql, parameters, true).then(function (response) {
            var count = response.rowCount ? response.rowCount : docs.length;
            return { count: count, documents: docs };
          });
        });
      });

      return promise;
    }
  }, {
    key: 'clear',
    value: function clear() {
      var _this5 = this;

      var promise = this.queue.add(function () {
        var sql = 'SELECT name AS value FROM #{collection} WHERE type = ?';
        var parameters = ['table'];
        var adapter = new WebSQLAdapter({
          name: _this5.dbInfo.name,
          collection: 'sqlite_master'
        });

        return adapter.transaction(sql, parameters, false).then(function (response) {
          var tables = response.result;

          if (tables.length === 0) {
            return null;
          }

          var tableFilterRegex = /^[a-zA-Z0-9\-]{1,128}/;
          var sql2 = tables.filter(function (table) {
            return tableFilterRegex.text(table);
          }).map(function (table) {
            return ['DROP TABLE IF EXISTS \'' + table + '\''];
          });

          return adapter.transaction(sql2, null, true);
        }).then(function () {
          return null;
        });
      });

      return promise;
    }
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      return global.openDatabase ? true : false;
    }
  }]);

  return WebSQLAdapter;
})();

exports['default'] = WebSQLAdapter;
module.exports = exports['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../errors":259,"../../query":264,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"bluebird":86,"lodash/lang/isArray":210,"lodash/lang/isFunction":213,"lodash/lang/isString":219,"promise-queue":233}],247:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _enumsStoreAdapter = require('../enums/storeAdapter');

var _enumsStoreAdapter2 = _interopRequireDefault(_enumsStoreAdapter);

var _errors = require('../errors');

var _query = require('../query');

var _query2 = _interopRequireDefault(_query);

var _aggregation = require('../aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _adaptersIndexeddb = require('./adapters/indexeddb');

var _adaptersIndexeddb2 = _interopRequireDefault(_adaptersIndexeddb);

var _adaptersLocalstorage = require('./adapters/localstorage');

var _adaptersLocalstorage2 = _interopRequireDefault(_adaptersLocalstorage);

var _adaptersWebsql = require('./adapters/websql');

var _adaptersWebsql2 = _interopRequireDefault(_adaptersWebsql);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _lodashObjectResult = require('lodash/object/result');

var _lodashObjectResult2 = _interopRequireDefault(_lodashObjectResult);

var _lodashLangIsString = require('lodash/lang/isString');

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

var _lodashLangIsArray = require('lodash/lang/isArray');

var _lodashLangIsArray2 = _interopRequireDefault(_lodashLangIsArray);

var _lodashLangIsArray3 = _interopRequireDefault(_lodashLangIsArray);

var validCollectionRegex = /^[a-zA-Z0-9\-]{1,128}/;

var Store = (function () {
  function Store(Adapters, dbInfo) {
    if (Adapters === undefined) Adapters = [_enumsStoreAdapter2['default'].IndexedDB];

    _classCallCheck(this, Store);

    dbInfo = (0, _lodashObjectAssign2['default'])({
      name: 'kinvey',
      collection: 'data'
    }, dbInfo);

    if (!(0, _lodashLangIsString2['default'])(dbInfo.name) || !validCollectionRegex.test(dbInfo.name)) {
      throw new _errors.KinveyError('The database name has an invalid format.', 'The database name must be a string containing only alphanumeric characters and dashes.');
    }

    if (!(0, _lodashLangIsString2['default'])(dbInfo.collection) || !validCollectionRegex.test(dbInfo.collection)) {
      throw new _errors.KinveyError('The collection name has an invalid format.', 'The collection name must be a string containing only alphanumeric characters and dashes.');
    }

    if (!(0, _lodashLangIsArray2['default'])(Adapters)) {
      Adapters = [Adapters];
    }

    for (var i = 0, len = Adapters.length; i < len; i++) {
      var Adapter = Adapters[i];

      if ((0, _lodashLangIsString2['default'])(Adapter)) {
        switch (Adapter) {
          case _enumsStoreAdapter2['default'].IndexedDB:
            Adapter = _adaptersIndexeddb2['default'];
            break;
          case _enumsStoreAdapter2['default'].LocalStorage:
            Adapter = _adaptersLocalstorage2['default'];
            break;
          case _enumsStoreAdapter2['default'].WebSQL:
            Adapter = _adaptersWebsql2['default'];
            break;
          default:
            continue;
        }
      }

      if (Adapter.isSupported()) {
        this.adapter = new Adapter(dbInfo);
        break;
      }
    }

    if (!this.adapter) {
      throw new _errors.KinveyError('Please provide a supported storage adapter.');
    }
  }

  _createClass(Store, [{
    key: 'generateObjectId',
    value: function generateObjectId() {
      var length = arguments.length <= 0 || arguments[0] === undefined ? 24 : arguments[0];

      var chars = 'abcdef0123456789';
      var result = '';

      for (var i = 0, j = chars.length; i < length; i += 1) {
        var pos = Math.floor(Math.random() * j);
        result += chars.substring(pos, pos + 1);
      }

      return '' + this.objectIdPrefix + result;
    }
  }, {
    key: 'find',
    value: function find(query) {
      if (query && !(query instanceof _query2['default'])) {
        query = new _query2['default']((0, _lodashObjectResult2['default'])(query, 'toJSON', query));
      }

      return this.adapter.find(query);
    }
  }, {
    key: 'count',
    value: function count(query) {
      if (query && !(query instanceof _query2['default'])) {
        query = new _query2['default']((0, _lodashObjectResult2['default'])(query, 'toJSON', query));
      }

      if (query) {
        query.sort(null).limit(null).skip(0);
      }

      return this.adapter.count(query);
    }
  }, {
    key: 'findAndModify',
    value: function findAndModify(id, fn) {
      if (!(0, _lodashLangIsString2['default'])(id)) {
        _loglevel2['default'].warn(id + ' is not a string. Casting to a string value.', id);
        id = String(id);
      }

      if (!(0, _lodashLangIsArray3['default'])(fn)) {
        return _bluebird2['default'].reject(new _errors.KinveyError('fn argument must be a function'));
      }

      return this.adapter.findAndModify(id, fn);
    }
  }, {
    key: 'group',
    value: function group(aggregation) {
      if (!(aggregation instanceof _aggregation2['default'])) {
        aggregation = new _aggregation2['default'](aggregation);
      }

      return this.adapter.group(aggregation);
    }
  }, {
    key: 'get',
    value: function get(id) {
      if (!(0, _lodashLangIsString2['default'])(id)) {
        _loglevel2['default'].warn(id + ' is not a string. Casting to a string value.', id);
        id = String(id);
      }

      return this.adapter.get(id);
    }
  }, {
    key: 'save',
    value: function save(doc) {
      if ((0, _lodashLangIsArray2['default'])(doc)) {
        return this.batch(doc);
      }

      if (!doc) {
        return _bluebird2['default'].resolve(null);
      }

      doc._id = doc._id || this.generateObjectId();
      return this.adapter.save(doc);
    }
  }, {
    key: 'batch',
    value: function batch(docs) {
      if (!(0, _lodashLangIsArray2['default'])(docs)) {
        docs = [docs];
      }

      return this.adapter.batch(docs);
    }
  }, {
    key: 'delete',
    value: function _delete(id) {
      if (!(0, _lodashLangIsString2['default'])(id)) {
        _loglevel2['default'].warn(id + ' is not a string. Casting to a string value.', id);
        id = String(id);
      }

      return this.adapter['delete'](id);
    }
  }, {
    key: 'clean',
    value: function clean(query) {
      if (query && !(query instanceof _query2['default'])) {
        query = new _query2['default']((0, _lodashObjectResult2['default'])(query, 'toJSON', query));
      }

      if (query) {
        query.sort(null).limit(null).skip(0);
      }

      return this.adapter.clean(query);
    }
  }, {
    key: 'clear',
    value: function clear() {
      return this.adapter.clear();
    }
  }, {
    key: 'objectIdPrefix',
    get: function get() {
      return 'local_';
    }
  }]);

  return Store;
})();

exports['default'] = Store;
module.exports = exports['default'];

},{"../aggregation":241,"../enums/storeAdapter":258,"../errors":259,"../query":264,"./adapters/indexeddb":243,"./adapters/localstorage":244,"./adapters/websql":246,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"bluebird":86,"lodash/lang/isArray":210,"lodash/lang/isString":219,"lodash/object/assign":222,"lodash/object/result":229,"loglevel":232}],248:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Symbol = require('babel-runtime/core-js/symbol')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _errors = require('./errors');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _lodashLangClone = require('lodash/lang/clone');

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

var sharedInstanceSymbol = _Symbol();

var Client = (function () {
  function Client() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Client);

    var apiProtocol = 'https' || 'https';
    var apiHost = 'baas.kinvey.com' || 'baas.kinvey.com';
    var apiUrl = undefined;
    var apiUrlComponents = undefined;

    if (!options.appId && !options.appKey) {
      throw new _errors.KinveyError('No App Id was provided. Unable to create a new Client without an App Id.');
    }

    if (!options.appSecret && !options.masterSecret) {
      throw new _errors.KinveyError('No App Secret or Master Secret was provided. Unable to create a new Client without an App Key.');
    }

    apiUrl = options.apiUrl || apiProtocol + '://' + apiHost;
    apiUrlComponents = _url2['default'].parse(apiUrl);

    if (apiUrlComponents.protocol.indexOf(apiProtocol) !== 0 && options.allowHttp === false) {
      apiUrlComponents.protocol = apiProtocol;
    }

    this.apiProtocol = apiUrlComponents.protocol;

    this.apiHost = apiUrlComponents.host;

    this.appId = options.appId || options.appKey;

    this.appSecret = options.appSecret || void 0;

    this.masterSecret = options.masterSecret || void 0;

    this.encryptionKey = options.encryptionKey || void 0;
  }

  _createClass(Client, [{
    key: 'toJSON',
    value: function toJSON() {
      var json = {
        apiProtocol: this.apiProtocol,
        apiHost: this.apiHost,
        appId: this.appId,
        appSecret: this.appSecret,
        masterSecret: this.masterSecret,
        encryptionKey: this.encryptionKey
      };

      return (0, _lodashLangClone2['default'])(json);
    }
  }, {
    key: 'apiUrl',
    get: function get() {
      return _url2['default'].format({
        protocol: this.apiProtocol,
        host: this.apiHost
      });
    }
  }], [{
    key: 'init',
    value: function init(options) {
      var client = new Client(options);
      Client[sharedInstanceSymbol] = client;
      return client;
    }
  }, {
    key: 'sharedInstance',
    value: function sharedInstance() {
      var client = Client[sharedInstanceSymbol];

      if (!client) {
        throw new _errors.KinveyError('You have not initialized the library. Please call Kinvey.init() to initialize the library.');
      }

      return client;
    }
  }]);

  return Client;
})();

exports['default'] = Client;
module.exports = exports['default'];

},{"./errors":259,"babel-runtime/core-js/symbol":8,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"lodash/lang/clone":208,"url":97}],249:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _aggregation = require('../aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _request = require('../request');

var _enumsHttpMethod = require('../enums/httpMethod');

var _enumsHttpMethod2 = _interopRequireDefault(_enumsHttpMethod);

var _enumsDataPolicy = require('../enums/DataPolicy');

var _enumsDataPolicy2 = _interopRequireDefault(_enumsDataPolicy);

var _client = require('../client');

var _client2 = _interopRequireDefault(_client);

var _query = require('../query');

var _query2 = _interopRequireDefault(_query);

var _auth = require('../auth');

var _auth2 = _interopRequireDefault(_auth);

var _modelsModel = require('../models/model');

var _modelsModel2 = _interopRequireDefault(_modelsModel);

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _lodashObjectResult = require('lodash/object/result');

var _lodashObjectResult2 = _interopRequireDefault(_lodashObjectResult);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _lodashLangIsArray = require('lodash/lang/isArray');

var _lodashLangIsArray2 = _interopRequireDefault(_lodashLangIsArray);

var datastoreNamespace = 'appdata';

var Datastore = (function () {
  function Datastore(collection) {
    var client = arguments.length <= 1 || arguments[1] === undefined ? _client2['default'].sharedInstance() : arguments[1];
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, Datastore);

    options = (0, _lodashObjectAssign2['default'])({
      model: _modelsModel2['default']
    }, options);

    this.collection = collection;

    this.client = client;

    this.model = options.model;
  }

  _createClass(Datastore, [{
    key: 'find',
    value: function find(query) {
      var _this = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _loglevel2['default'].debug('Retrieving the models in the ' + this.collection + ' collection.', query);

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudOnly,
        auth: _auth2['default']['default']
      }, options);

      if (query && !(query instanceof _query2['default'])) {
        query = new _query2['default']((0, _lodashObjectResult2['default'])(query, 'toJSON', query));
      }

      var request = new _request.Request(_enumsHttpMethod2['default'].GET, this.path, query, null, options);
      var promise = request.execute().then(function (response) {
        var data = response.data;
        var models = [];

        if (!(0, _lodashLangIsArray2['default'])(data)) {
          data = [data];
        }

        data.forEach(function (doc) {
          models.push(new _this.model(doc, options));
        });

        return models;
      });

      promise.then(function (response) {
        _loglevel2['default'].info('Retrieved the models in the ' + _this.collection + ' collection.', response);
      })['catch'](function (err) {
        _loglevel2['default'].error('Failed to retrieve the models in the ' + _this.collection + ' collection.', err);
      });

      return promise;
    }
  }, {
    key: 'get',
    value: function get(id) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _loglevel2['default'].debug('Retrieving a model in the ' + this.collection + ' collection with id = ' + id + '.');

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudOnly,
        auth: _auth2['default']['default']
      }, options);

      var request = new _request.Request(_enumsHttpMethod2['default'].GET, this.path + '/id', null, null, options);
      var promise = request.execute().then(function (response) {
        return new _this2.model(response.data, options);
      });

      promise.then(function (response) {
        _loglevel2['default'].info('Retrieved the model in the ' + _this2.collection + ' collection with id = ' + id + '.', response);
      })['catch'](function (err) {
        _loglevel2['default'].error('Failed to retrieve the model in the ' + _this2.collection + ' collection with id = ' + id + '.', err);
      });

      return promise;
    }
  }, {
    key: 'save',
    value: function save(model) {
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _loglevel2['default'].debug('Saving the model to the ' + this.collection + ' collection.', model);

      if (model.id) {
        _loglevel2['default'].debug('The model has an id = ' + model.id + ', updating the model instead.');
        return this.update(model, options);
      }

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudOnly,
        auth: _auth2['default']['default']
      }, options);

      var request = new _request.Request(_enumsHttpMethod2['default'].POST, this.path, null, (0, _lodashObjectResult2['default'])(model, 'toJSON', model), options);
      var promise = request.execute().then(function (response) {
        return new this.model(response.data, options);
      });

      promise.then(function (response) {
        _loglevel2['default'].info('Saved the model to the ' + _this3.collection + ' collection.', response);
      })['catch'](function (err) {
        _loglevel2['default'].error('Failed to save the model to the ' + _this3.collection + ' collection.', err);
      });

      return promise;
    }
  }, {
    key: 'update',
    value: function update(model) {
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _loglevel2['default'].debug('Update the model to the ' + this.collection + ' collection.', model);

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudOnly,
        auth: _auth2['default']['default']
      }, options);

      var request = new _request.Request(_enumsHttpMethod2['default'].PUT, this.path + '/' + model.id, null, (0, _lodashObjectResult2['default'])(model, 'toJSON', model), options);
      var promise = request.execute().then(function () {
        return model;
      });

      promise.then(function (response) {
        _loglevel2['default'].info('Updated the model to the ' + _this4.collection + ' collection.', response);
      })['catch'](function (err) {
        _loglevel2['default'].error('Failed to update the model to the ' + _this4.collection + ' collection.', err);
      });

      return promise;
    }
  }, {
    key: 'clean',
    value: function clean() {
      var _this5 = this;

      var query = arguments.length <= 0 || arguments[0] === undefined ? new _query2['default']() : arguments[0];
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _loglevel2['default'].debug('Deleting the models in the ' + this.collection + ' collection by query.', query);

      if (query && !(query instanceof _query2['default'])) {
        query = new _query2['default']((0, _lodashObjectResult2['default'])(query, 'toJSON', query));
      }

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudOnly,
        auth: _auth2['default']['default']
      }, options);

      var request = new _request.Request(_enumsHttpMethod2['default'].DELETE, this.path, query, null, options);
      var promise = request.execute().then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _loglevel2['default'].info('Deleted the models in the ' + _this5.collection + ' collection.', response);
      })['catch'](function (err) {
        _loglevel2['default'].error('Failed to delete the models in the ' + _this5.collection + ' collection.', err);
      });

      return promise;
    }
  }, {
    key: 'destroy',
    value: function destroy(id) {
      var _this6 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _loglevel2['default'].debug('Deleting a model in the ' + this.collection + ' collection with id = ' + id + '.');

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudOnly,
        auth: _auth2['default']['default']
      }, options);

      var request = new _request.Request(_enumsHttpMethod2['default'].DELETE, this.path + '/' + id, null, null, options);
      var promise = request.execute().then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _loglevel2['default'].info('Deleted the model in the ' + _this6.collection + ' collection with id = ' + id + '.', response);
      })['catch'](function (err) {
        _loglevel2['default'].error('Failed to delete the model in the ' + _this6.collection + ' collection with id = ' + id + '.', err);
      });

      return promise;
    }
  }, {
    key: 'count',
    value: function count(query) {
      var _this7 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _loglevel2['default'].debug('Counting the number of models in the ' + this.collection + ' collection.', query);

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudOnly,
        auth: _auth2['default']['default']
      }, options);

      if (query && !(query instanceof _query2['default'])) {
        query = new _query2['default']((0, _lodashObjectResult2['default'])(query, 'toJSON', query));
      }

      var request = new _request.Request(_enumsHttpMethod2['default'].GET, this.path + '/_count', query, null, options);
      var promise = request.execute().then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _loglevel2['default'].info('Counted the number of models in the ' + _this7.collection + ' collection.', response);
      })['catch'](function (err) {
        _loglevel2['default'].error('Failed to count the number of models in the ' + _this7.collection + ' collection.', err);
      });

      return promise;
    }
  }, {
    key: 'group',
    value: function group(aggregation) {
      var _this8 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _loglevel2['default'].debug('Grouping the models in the ' + this.collection + ' collection.', aggregation, options);

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudOnly,
        auth: _auth2['default']['default']
      }, options);

      if (aggregation && !(aggregation instanceof _aggregation2['default'])) {
        aggregation = new _aggregation2['default']((0, _lodashObjectResult2['default'])(aggregation, 'toJSON', aggregation));
      }

      var request = new _request.Request(_enumsHttpMethod2['default'].POST, this.path + '/_group', null, aggregation.toJSON(), options);
      var promise = request.execute().then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _loglevel2['default'].info('Grouped the models in the ' + _this8.collection + ' collection.', response);
      })['catch'](function (err) {
        _loglevel2['default'].error('Failed to group the models in the ' + _this8.collection + ' collection.', err);
      });

      return promise;
    }
  }, {
    key: 'path',
    get: function get() {
      var path = '/' + datastoreNamespace + '/' + this.client.appId;

      if (this.collection) {
        path = path + '/' + this.collection;
      }

      return path;
    }
  }]);

  return Datastore;
})();

exports['default'] = Datastore;
module.exports = exports['default'];

},{"../aggregation":241,"../auth":242,"../client":248,"../enums/DataPolicy":251,"../enums/httpMethod":253,"../models/model":262,"../query":264,"../request":265,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"lodash/lang/isArray":210,"lodash/object/assign":222,"lodash/object/result":229,"loglevel":232}],250:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _client = require('../client');

var _client2 = _interopRequireDefault(_client);

var _auth = require('../auth');

var _auth2 = _interopRequireDefault(_auth);

var _enumsDataPolicy = require('../enums/dataPolicy');

var _enumsDataPolicy2 = _interopRequireDefault(_enumsDataPolicy);

var _request = require('../request');

var _enumsHttpMethod = require('../enums/httpMethod');

var _enumsHttpMethod2 = _interopRequireDefault(_enumsHttpMethod);

var _datastore = require('./datastore');

var _datastore2 = _interopRequireDefault(_datastore);

var _errors = require('../errors');

var _query = require('../query');

var _query2 = _interopRequireDefault(_query);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _lodashLangIsObject = require('lodash/lang/isObject');

var _lodashLangIsObject2 = _interopRequireDefault(_lodashLangIsObject);

var _lodashLangIsArray = require('lodash/lang/isArray');

var _lodashLangIsArray2 = _interopRequireDefault(_lodashLangIsArray);

var usersNamespace = 'user';
var rpcNamespace = 'rpc';

var Users = (function (_Datastore) {
  _inherits(Users, _Datastore);

  function Users() {
    var client = arguments.length <= 0 || arguments[0] === undefined ? _client2['default'].sharedInstance() : arguments[0];

    _classCallCheck(this, Users);

    _get(Object.getPrototypeOf(Users.prototype), 'constructor', this).call(this, null, client);
  }

  _createClass(Users, [{
    key: 'login',
    value: function login(usernameOrData, password) {
      var _this = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      options.dataPolicy = _enumsDataPolicy2['default'].CloudOnly;
      options.auth = _auth2['default'].app;

      if (!(0, _lodashLangIsObject2['default'])(usernameOrData)) {
        usernameOrData = {
          username: usernameOrData,
          password: password
        };
      }

      if ((!usernameOrData.username || !usernameOrData.password) && !usernameOrData._socialIdentity) {
        return _bluebird2['default'].reject(new _errors.KinveyError('Username and/or password missing. Please provide both a username and password to login.'));
      }

      var request = new _request.Request(_enumsHttpMethod2['default'].POST, this.path + '/login', null, usernameOrData, options);
      var promise = request.execute().then(function (response) {
        return new _this.model(response.data, options);
      });

      return promise;
    }
  }, {
    key: 'logout',
    value: function logout() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options.dataPolicy = _enumsDataPolicy2['default'].CloudOnly;
      options.auth = _auth2['default'].session;

      var request = new _request.Request(_enumsHttpMethod2['default'].POST, this.path + '/_logout', null, null, options);
      var promise = request.execute().then(function () {
        return null;
      });

      return promise;
    }
  }, {
    key: 'find',
    value: function find(query) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = undefined;

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudFirst,
        auth: _auth2['default']['default']
      }, options);

      if (query && !(query instanceof _query2['default'])) {
        query = new _query2['default'](result(query, 'toJSON', query));
      }

      if (options.discover) {
        var request = new _request.Request(_enumsHttpMethod2['default'].POST, this.path + '/_lookup', null, query, options);
        promise = request.execute().then(function (response) {
          var data = response.data;
          var models = [];

          if (!(0, _lodashLangIsArray2['default'])(data)) {
            data = [data];
          }

          data.forEach(function (doc) {
            models.push(new _this2.model(doc, options));
          });

          return models;
        });
      } else {
        promise = _get(Object.getPrototypeOf(Users.prototype), 'find', this).call(this, query, options);
      }

      return promise;
    }
  }, {
    key: 'verifyEmail',
    value: function verifyEmail(username) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudFirst,
        auth: _auth2['default'].app
      }, options);

      var request = new _request.Request(_enumsHttpMethod2['default'].POST, this.rpcPath + '/' + username + '/user-email-verification-initiate', null, null, options);
      var promise = request.execute().then(function () {
        return null;
      });

      return promise;
    }
  }, {
    key: 'forgotUsername',
    value: function forgotUsername(email) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudFirst,
        auth: _auth2['default'].app
      }, options);

      var request = new _request.Request(_enumsHttpMethod2['default'].POST, this.rpcPath + '/user-forgot-username', { email: email }, null, options);
      var promise = request.execute().then(function () {
        return null;
      });

      return promise;
    }
  }, {
    key: 'resetPassword',
    value: function resetPassword(username) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudFirst,
        auth: _auth2['default'].app
      }, options);

      var request = new _request.Request(_enumsHttpMethod2['default'].POST, this.rpcPath + '/' + username + '/user-password-reset-initiate', null, null, options);
      var promise = request.execute().then(function () {
        return null;
      });

      return promise;
    }
  }, {
    key: 'exists',
    value: function exists(username) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudFirst,
        auth: _auth2['default'].app
      }, options);

      var request = new _request.Request(_enumsHttpMethod2['default'].POST, this.rpcPath + '/check-username-exists', { username: username }, null, options);
      var promise = request.execute().then(function () {
        var data = response.data;

        if (data) {
          return data.usernameExists;
        }

        return false;
      });

      return promise;
    }
  }, {
    key: 'restore',
    value: function restore(id) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudFirst,
        auth: _auth2['default'].master
      }, options);

      var request = new _request.Request(_enumsHttpMethod2['default'].POST, this.path + '/' + id + '/_restore', null, null, options);
      var promise = request.execute().then(function () {
        return null;
      });

      return promise;
    }
  }, {
    key: 'path',
    get: function get() {
      return '/' + usersNamespace + '/' + this.client.appId;
    }
  }, {
    key: 'rpcPath',
    get: function get() {
      return '/' + rpcNamespace + '/' + this.client.appId;
    }
  }]);

  return Users;
})(_datastore2['default']);

exports['default'] = Users;
module.exports = exports['default'];

},{"../auth":242,"../client":248,"../enums/dataPolicy":252,"../enums/httpMethod":253,"../errors":259,"../query":264,"../request":265,"./datastore":249,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13,"bluebird":86,"lodash/lang/isArray":210,"lodash/lang/isObject":216,"lodash/object/assign":222}],251:[function(require,module,exports){
var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var DataPolicy = {
  LocalFirst: 'LocalFist',
  LocalOnly: 'LocalOnly',
  CloudFirst: 'CloudFirst',
  CloudOnly: 'CloudOnly'
};
_Object$freeze(DataPolicy);
exports['default'] = DataPolicy;
module.exports = exports['default'];

},{"babel-runtime/core-js/object/freeze":3}],252:[function(require,module,exports){
var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var DataPolicy = {
  LocalFirst: 'LocalFist',
  LocalOnly: 'LocalOnly',
  CloudFirst: 'CloudFirst',
  CloudOnly: 'CloudOnly'
};
_Object$freeze(DataPolicy);
exports['default'] = DataPolicy;
module.exports = exports['default'];

},{"babel-runtime/core-js/object/freeze":3}],253:[function(require,module,exports){
var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
_Object$freeze(HttpMethod);
exports['default'] = HttpMethod;
module.exports = exports['default'];

},{"babel-runtime/core-js/object/freeze":3}],254:[function(require,module,exports){
var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var RackType = {
  Network: 'Network',
  Storage: 'Storage'
};
_Object$freeze(RackType);
exports['default'] = RackType;
module.exports = exports['default'];

},{"babel-runtime/core-js/object/freeze":3}],255:[function(require,module,exports){
var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var ResponseType = {
  Blob: 'blob',
  Document: 'document',
  DOMString: 'domstring',
  JSON: 'json',
  Text: 'text'
};
_Object$freeze(ResponseType);
exports['default'] = ResponseType;
module.exports = exports['default'];

},{"babel-runtime/core-js/object/freeze":3}],256:[function(require,module,exports){
var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var SocialAdapter = {
  Facebook: 'Facebook',
  Google: 'Google',
  LinkedIn: 'LinkedIn',
  Twitter: 'Twitter'
};
_Object$freeze(SocialAdapter);
exports['default'] = SocialAdapter;
module.exports = exports['default'];

},{"babel-runtime/core-js/object/freeze":3}],257:[function(require,module,exports){
var _Object$freeze = require("babel-runtime/core-js/object/freeze")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
var StatusCode = {
  OK: 200,
  Created: 201,
  RedirectTemporarily: 301,
  RedirectPermanetly: 302,
  NotFound: 404,
  ServerError: 500
};
_Object$freeze(StatusCode);
exports["default"] = StatusCode;
module.exports = exports["default"];

},{"babel-runtime/core-js/object/freeze":3}],258:[function(require,module,exports){
var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var StoreAdapter = {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  WebSQL: 'WebSQL'
};
_Object$freeze(StoreAdapter);
exports['default'] = StoreAdapter;
module.exports = exports['default'];

},{"babel-runtime/core-js/object/freeze":3}],259:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var KinveyError = (function (_Error) {
  _inherits(KinveyError, _Error);

  function KinveyError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? 'An error occurred.' : arguments[0];
    var debug = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

    _classCallCheck(this, KinveyError);

    _get(Object.getPrototypeOf(KinveyError.prototype), 'constructor', this).call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.debug = debug;
  }

  return KinveyError;
})(Error);

exports.KinveyError = KinveyError;

var ActiveUserError = (function (_KinveyError) {
  _inherits(ActiveUserError, _KinveyError);

  function ActiveUserError(message, debug) {
    if (message === undefined) message = 'An active user already exists.';

    _classCallCheck(this, ActiveUserError);

    _get(Object.getPrototypeOf(ActiveUserError.prototype), 'constructor', this).call(this, message, debug);
  }

  return ActiveUserError;
})(KinveyError);

exports.ActiveUserError = ActiveUserError;

var NotFoundError = (function (_KinveyError2) {
  _inherits(NotFoundError, _KinveyError2);

  function NotFoundError(message, debug) {
    if (message === undefined) message = 'The item was not found.';

    _classCallCheck(this, NotFoundError);

    _get(Object.getPrototypeOf(NotFoundError.prototype), 'constructor', this).call(this, message, debug);
  }

  return NotFoundError;
})(KinveyError);

exports.NotFoundError = NotFoundError;

},{"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12}],260:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Symbol = require('babel-runtime/core-js/symbol')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _lodashLangClone = require('lodash/lang/clone');

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

var _lodashLangIsPlainObject = require('lodash/lang/isPlainObject');

var _lodashLangIsPlainObject2 = _interopRequireDefault(_lodashLangIsPlainObject);

var _utilsIsDefined = require('../utils/isDefined');

var _utilsIsDefined2 = _interopRequireDefault(_utilsIsDefined);

var privateMetadataSymbol = _Symbol();

var PrivateMetadata = (function () {
  function PrivateMetadata() {
    var kmd = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, PrivateMetadata);

    if (!(0, _lodashLangIsPlainObject2['default'])(kmd)) {
      throw new Error('kmd argument must be an object');
    }

    this.kmd = kmd;
  }

  _createClass(PrivateMetadata, [{
    key: 'toJSON',
    value: function toJSON() {
      return (0, _lodashLangClone2['default'])(this.kmd);
    }
  }, {
    key: 'createdAt',
    get: function get() {
      if ((0, _utilsIsDefined2['default'])(this.kmd.ect)) {
        return Date.parse(this.kmd.ect);
      }

      return void 0;
    }
  }, {
    key: 'emailVerification',
    get: function get() {
      return this.kmd.emailVerification;
    }
  }, {
    key: 'lastModified',
    get: function get() {
      if ((0, _utilsIsDefined2['default'])(this.kmd.lmt)) {
        return Date.parse(this.kmd.lmt);
      }

      return void 0;
    }
  }, {
    key: 'authtoken',
    get: function get() {
      return this.kmd.authtoken;
    }
  }]);

  return PrivateMetadata;
})();

var Metadata = (function () {
  function Metadata(kmd) {
    _classCallCheck(this, Metadata);

    this[privateMetadataSymbol] = new PrivateMetadata(kmd);
  }

  _createClass(Metadata, [{
    key: 'toJSON',
    value: function toJSON() {
      return this[privateMetadataSymbol].toJSON();
    }
  }, {
    key: 'createdAt',
    get: function get() {
      return this[privateMetadataSymbol].createdAt;
    }
  }, {
    key: 'emailVerification',
    get: function get() {
      return this[privateMetadataSymbol].emailVerification;
    }
  }, {
    key: 'lastModified',
    get: function get() {
      return this[privateMetadataSymbol].lastModified;
    }
  }, {
    key: 'authtoken',
    get: function get() {
      return this[privateMetadataSymbol].authtoken;
    }
  }]);

  return Metadata;
})();

exports['default'] = Metadata;
module.exports = exports['default'];

},{"../utils/isDefined":280,"babel-runtime/core-js/symbol":8,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"lodash/lang/clone":208,"lodash/lang/isPlainObject":217}],261:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _auth = require('../auth');

var _auth2 = _interopRequireDefault(_auth);

var _enumsDataPolicy = require('../enums/dataPolicy');

var _enumsDataPolicy2 = _interopRequireDefault(_enumsDataPolicy);

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var _query = require('../query');

var _query2 = _interopRequireDefault(_query);

var _errors = require('../errors');

var _enumsHttpMethod = require('../enums/httpMethod');

var _enumsHttpMethod2 = _interopRequireDefault(_enumsHttpMethod);

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var filesNamespace = 'blob';

var File = (function (_Model) {
  _inherits(File, _Model);

  function File() {
    _classCallCheck(this, File);

    _get(Object.getPrototypeOf(File.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(File, [{
    key: 'find',
    value: function find(query) {
      var _this = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (query && !(query instanceof _query2['default'])) {
        return _Promise.reject(new _errors.KinveyError('query argument must be an instance of Kinvey.Query'));
      }

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudFirst,
        auth: _auth2['default']['default']
      }, options);

      options.flags = {};
      if (options.tls !== false) {
        options.flags.tls = true;
      }

      if (options.ttl) {
        options.flags.ttl_in_seconds = options.ttl;
      }

      var path = '/' + filesNamespace + '/' + this.client.appId;

      var request = new Request(_enumsHttpMethod2['default'].GET, path, query, null, options);
      var promise = request.execute().then(function (response) {
        if (options.download) {
          var promises = response.map(function (file) {
            return _this.downloadByUrl(file, options);
          });
          return _Promise.all(promises);
        }

        return response;
      });

      return promise;
    }
  }, {
    key: 'download',
    value: function download(name) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudFirst,
        auth: _auth2['default']['default']
      }, options);

      options.flags = {};
      if (options.tls !== false) {
        options.flags.tls = true;
      }

      if (options.ttl) {
        options.flags.ttl_in_seconds = options.ttl;
      }

      var path = '/' + filesNamespace + '/' + this.client.appId + '/' + name;

      var request = new Request(_enumsHttpMethod2['default'].GET, path, null, null, options);
      var promise = request.execute().then(function (response) {
        if (options.stream) {
          return response;
        }

        return _this2.downloadByUrl(response, options);
      });

      return promise;
    }
  }, {
    key: 'downloadByUrl',
    value: function downloadByUrl() {}
  }, {
    key: 'stream',
    value: function stream(name) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.stream = true;
      return this.download(name, options);
    }
  }, {
    key: 'upload',
    value: function upload() {}
  }, {
    key: 'destroy',
    value: function destroy(name) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _lodashObjectAssign2['default'])({
        dataPolicy: _enumsDataPolicy2['default'].CloudFirst,
        auth: _auth2['default']['default']
      }, options);

      var path = '/' + filesNamespace + '/' + this.client.appId + '/' + name;

      var request = new Request(_enumsHttpMethod2['default'].DELETE, path, null, null, options);
      var promise = request.execute()['catch'](function (err) {
        if (options.silent && err.name === 'BLOB_NOT_FOUND') {
          return { count: 0 };
        }

        return _Promise.reject(err);
      });

      return promise;
    }
  }]);

  return File;
})(_model2['default']);

exports['default'] = File;
module.exports = exports['default'];

},{"../auth":242,"../enums/dataPolicy":252,"../enums/httpMethod":253,"../errors":259,"../query":264,"./model":262,"babel-runtime/core-js/promise":7,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13,"lodash/object/assign":222}],262:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _acl = require('../acl');

var _acl2 = _interopRequireDefault(_acl);

var _metadata = require('../metadata');

var _metadata2 = _interopRequireDefault(_metadata);

var _lodashObjectDefaults = require('lodash/object/defaults');

var _lodashObjectDefaults2 = _interopRequireDefault(_lodashObjectDefaults);

var _lodashObjectResult = require('lodash/object/result');

var _lodashObjectResult2 = _interopRequireDefault(_lodashObjectResult);

var _lodashLangClone = require('lodash/lang/clone');

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _lodashObjectHas = require('lodash/object/has');

var _lodashObjectHas2 = _interopRequireDefault(_lodashObjectHas);

var _lodashCollectionSize = require('lodash/collection/size');

var _lodashCollectionSize2 = _interopRequireDefault(_lodashCollectionSize);

var _lodashLangIsEqual = require('lodash/lang/isEqual');

var _lodashLangIsEqual2 = _interopRequireDefault(_lodashLangIsEqual);

var _lodashLangIsEmpty = require('lodash/lang/isEmpty');

var _lodashLangIsEmpty2 = _interopRequireDefault(_lodashLangIsEmpty);

var idAttribute = '_id';
var aclAttribute = '_acl';
var kmdAttribute = '_kmd';

var Model = (function () {
  function Model() {
    var attributes = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Model);

    this.attributes = {};
    this.changed = {};
    this.validationError = null;

    var attrs = attributes;
    if (options.parse) {
      attrs = this.parse(attrs, options) || {};
    }

    attrs = (0, _lodashObjectDefaults2['default'])({}, attrs, (0, _lodashObjectResult2['default'])(this, 'defaults', {}));
    this.set(attrs, options);
  }

  _createClass(Model, [{
    key: 'generateObjectId',
    value: function generateObjectId() {
      var length = arguments.length <= 0 || arguments[0] === undefined ? 24 : arguments[0];

      var chars = 'abcdef0123456789';
      var result = '';

      for (var i = 0, j = chars.length; i < length; i += 1) {
        var pos = Math.floor(Math.random() * j);
        result += chars.substring(pos, pos + 1);
      }

      return '' + this.objectIdPrefix + result;
    }
  }, {
    key: 'get',
    value: function get(attr) {
      return this.attributes[attr];
    }
  }, {
    key: 'has',
    value: function has(attr) {
      return this.get(attr) ? true : false;
    }
  }, {
    key: 'set',
    value: function set(key, val) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (!key) {
        return this;
      }

      var attrs = undefined;
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      if (!this._validate(attrs, options)) {
        return false;
      }

      var unset = options.unset;
      var changes = [];
      var changing = this._changing;
      this._changing = true;

      if (!changing) {
        this._previousAttributes = (0, _lodashLangClone2['default'])(this.attributes, true);
        this.changed = {};
      }

      var currentAttributes = this.attributes;
      var changed = this.changed;
      var previousAttributes = this._previousAttributes;

      for (var attr in attrs) {
        if (attrs.hasOwnProperty(attr)) {
          val = attrs[attr];

          if (!(0, _lodashLangIsEqual2['default'])(currentAttributes[attr], val)) {
            changes.push(attr);
          }

          if (!(0, _lodashLangIsEqual2['default'])(previousAttributes[attr], val)) {
            changed[attr] = val;
          } else {
            delete changed[attr];
          }

          if (unset) {
            delete currentAttributes[attr];
          } else {
            currentAttributes[attr] = val;
          }
        }
      }

      this._changing = false;
      return this;
    }
  }, {
    key: 'unset',
    value: function unset(attr) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.set(attr, void 0, (0, _lodashObjectAssign2['default'])({}, options, { unset: true }));
    }
  }, {
    key: 'hasChanged',
    value: function hasChanged(attr) {
      if (!attr) {
        return !(0, _lodashLangIsEmpty2['default'])(this.changed);
      }

      return (0, _lodashObjectHas2['default'])(this.changed, attr);
    }
  }, {
    key: 'changedAttributes',
    value: function changedAttributes(diff) {
      if (!diff) {
        return this.hasChanged() ? (0, _lodashLangClone2['default'])(this.changed, true) : false;
      }

      var old = this._changing ? this._previousAttributes : this.attributes;
      var changed = {};

      for (var attr in diff) {
        if (diff.hasOwnProperty(attr)) {
          var val = diff[attr];

          if ((0, _lodashLangIsEqual2['default'])(old[attr], val)) {
            continue;
          }

          changed[attr] = val;
        }
      }

      return (0, _lodashCollectionSize2['default'])(changed) ? changed : false;
    }
  }, {
    key: 'previousAttribute',
    value: function previousAttribute(attr) {
      if (!attr || !this._previousAttributes) {
        return null;
      }

      return this._previousAttributes[attr];
    }
  }, {
    key: 'parse',
    value: function parse(data) {
      return data;
    }
  }, {
    key: 'isNew',
    value: function isNew() {
      var id = this.id;
      return !this.has(idAttribute) || id.indexOf(this.objectIdPrefix) === 0;
    }
  }, {
    key: 'isValid',
    value: function isValid() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this._validate({}, (0, _lodashObjectDefaults2['default'])({ validate: true }, options));
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return (0, _lodashLangClone2['default'])(this.attributes, true);
    }
  }, {
    key: '_validate',
    value: function _validate(attrs) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!options.validate || !this.validate) {
        return true;
      }

      attrs = (0, _lodashObjectAssign2['default'])({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;

      if (error) {
        return false;
      }

      return true;
    }
  }, {
    key: 'id',
    get: function get() {
      return this.get(idAttribute);
    }
  }, {
    key: 'acl',
    get: function get() {
      return new _acl2['default'](this.get(aclAttribute));
    }
  }, {
    key: 'metadata',
    get: function get() {
      return new _metadata2['default'](this.get(kmdAttribute));
    }
  }, {
    key: 'defaults',
    get: function get() {
      var defaults = {};
      defaults[idAttribute] = this.generateObjectId();
      defaults[aclAttribute] = {};
      defaults[kmdAttribute] = {};
      return defaults;
    }
  }, {
    key: 'objectIdPrefix',
    get: function get() {
      return 'local_';
    }
  }]);

  return Model;
})();

exports['default'] = Model;
module.exports = exports['default'];

},{"../acl":240,"../metadata":260,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"lodash/collection/size":152,"lodash/lang/clone":208,"lodash/lang/isEmpty":211,"lodash/lang/isEqual":212,"lodash/object/assign":222,"lodash/object/defaults":223,"lodash/object/has":224,"lodash/object/result":229}],263:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Symbol = require('babel-runtime/core-js/symbol')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _errors = require('../errors');

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var _datastoresUsers = require('../datastores/users');

var _datastoresUsers2 = _interopRequireDefault(_datastoresUsers);

var _enumsSocialAdapter = require('../enums/socialAdapter');

var _enumsSocialAdapter2 = _interopRequireDefault(_enumsSocialAdapter);

var _socialFacebook = require('../social/facebook');

var _socialFacebook2 = _interopRequireDefault(_socialFacebook);

var _socialGoogle = require('../social/google');

var _socialGoogle2 = _interopRequireDefault(_socialGoogle);

var _socialLinkedIn = require('../social/linkedIn');

var _socialLinkedIn2 = _interopRequireDefault(_socialLinkedIn);

var _socialTwitter = require('../social/twitter');

var _socialTwitter2 = _interopRequireDefault(_socialTwitter);

var _utilsUser = require('../../utils/user');

var _lodashLangIsFunction = require('lodash/lang/isFunction');

var _lodashLangIsFunction2 = _interopRequireDefault(_lodashLangIsFunction);

var _lodashLangIsString = require('lodash/lang/isString');

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var activeUserSymbol = _Symbol();

var User = (function (_Model) {
  _inherits(User, _Model);

  function User() {
    _classCallCheck(this, User);

    _get(Object.getPrototypeOf(User.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(User, [{
    key: 'isActive',
    value: function isActive() {
      var _this = this;

      return User.getActive().then(function (user) {
        if (user) {
          return _this.id === user.id;
        }

        return false;
      });
    }
  }, {
    key: 'logout',
    value: function logout() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var promise = this.isActive().then(function (active) {
        if (!active) {
          return null;
        }

        var collection = new _datastoresUsers2['default']();
        return collection.logout(options);
      }).then(function () {
        return User.setActive(null);
      });

      return promise;
    }
  }, {
    key: 'authtoken',
    get: function get() {
      return this.metadata.authtoken;
    }
  }], [{
    key: 'getActive',
    value: function getActive() {
      var user = User[activeUserSymbol];

      if (!user) {
        return _bluebird2['default'].resolve(user);
      }

      return (0, _utilsUser.getActiveUser)().then(function (user) {
        if (user) {
          user = new User(user);
          User[activeUserSymbol] = user;
          return user;
        }

        return null;
      });
    }
  }, {
    key: 'setActive',
    value: function setActive(user) {
      if (user && !(user instanceof User)) {
        user = new User(result(user, 'toJSON', user));
      }

      return (0, _utilsUser.setActiveUser)(user ? user.toJSON() : user).then(function () {
        if (user) {
          User[activeUserSymbol] = user;
          return user;
        }

        return null;
      });
    }
  }, {
    key: 'login',
    value: function login(usernameOrData, password) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var promise = User.getActive().then(function (user) {
        if (user) {
          throw new _errors.ActiveUserError('A user is already logged in.');
        }

        var collection = new _datastoresUsers2['default']();
        return collection.login(usernameOrData, password, options);
      }).then(function (data) {
        var user = new User(data);
        return User.setActive(user).then(function () {
          return user;
        });
      });

      return promise;
    }
  }, {
    key: 'loginWithProvider',
    value: function loginWithProvider(provider, token, options) {
      if (token === undefined) token = {};

      if (!(0, _lodashLangIsString2['default'])(provider)) {
        provider = String(provider);
      }

      if (!token.access_token || !token.expires_in) {
        return _bluebird2['default'].reject(new _errors.KinveyError('token argument must contain both an access_token and expires_in property.', token));
      }

      var data = { _socialIdentity: {} };
      data._socialIdentity[provider] = token;
      return User.login(data, options);
    }
  }, {
    key: 'connect',
    value: function connect(Adapter, options) {
      if (Adapter === undefined) Adapter = _enumsSocialAdapter2['default'].Facebook;

      var adapter = Adapter;
      var promise = undefined;

      if ((0, _lodashLangIsString2['default'])(Adapter)) {
        switch (Adapter) {
          case _enumsSocialAdapter2['default'].Google:
            Adapter = _socialGoogle2['default'];
            break;
          case _enumsSocialAdapter2['default'].LinkedIn:
            Adapter = _socialLinkedIn2['default'];
            break;
          case _enumsSocialAdapter2['default'].Twitter:
            Adapter = _socialTwitter2['default'];
            break;
          default:
            Adapter = _socialFacebook2['default'];
        }
      }

      if ((0, _lodashLangIsFunction2['default'])(Adapter)) {
        adapter = new Adapter();
      }

      if (!(0, _lodashLangIsFunction2['default'])(adapter.connect)) {
        return _bluebird2['default'].reject(new _errors.KinveyError('Unable to connect with the social adapter.', 'Please provide a connect function for the adapter.'));
      }

      promise = adapter.connect(options).then(function (token) {
        return User.loginWithProvider(adapter.name, token, options);
      });

      return promise;
    }
  }]);

  return User;
})(_model2['default']);

exports['default'] = User;
module.exports = exports['default'];

},{"../../utils/user":284,"../datastores/users":250,"../enums/socialAdapter":256,"../errors":259,"../social/facebook":268,"../social/google":269,"../social/linkedIn":270,"../social/twitter":272,"./model":262,"babel-runtime/core-js/symbol":8,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13,"bluebird":86,"lodash/lang/isFunction":213,"lodash/lang/isString":219}],264:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Symbol = require('babel-runtime/core-js/symbol')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _utilsNested = require('../utils/nested');

var _utilsNested2 = _interopRequireDefault(_utilsNested);

var _sift = require('sift');

var _sift2 = _interopRequireDefault(_sift);

var _lodashLangClone = require('lodash/lang/clone');

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

var _lodashLangIsArray = require('lodash/lang/isArray');

var _lodashLangIsArray2 = _interopRequireDefault(_lodashLangIsArray);

var _lodashLangIsNumber = require('lodash/lang/isNumber');

var _lodashLangIsNumber2 = _interopRequireDefault(_lodashLangIsNumber);

var _lodashLangIsString = require('lodash/lang/isString');

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

var _lodashLangIsObject = require('lodash/lang/isObject');

var _lodashLangIsObject2 = _interopRequireDefault(_lodashLangIsObject);

var _lodashLangIsRegExp = require('lodash/lang/isRegExp');

var _lodashLangIsRegExp2 = _interopRequireDefault(_lodashLangIsRegExp);

var privateQuerySymbol = _Symbol();

var PrivateQuery = (function () {
  function PrivateQuery() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, PrivateQuery);

    this._fields = options.fields;

    this._filter = options.filter || {};

    this._sort = options.sort || {};

    this._limit = options.limit || null;

    this._skip = options.skip || 0;

    this.parent = null;
  }

  _createClass(PrivateQuery, [{
    key: 'equalTo',
    value: function equalTo(field, value) {
      this._filter[field] = value;
      return this;
    }
  }, {
    key: 'contains',
    value: function contains(field, values) {
      if (!(0, _lodashLangIsArray2['default'])(values)) {
        values = [values];
      }

      return this.addFilter(field, '$in', values);
    }
  }, {
    key: 'containsAll',
    value: function containsAll(field, values) {
      if (!(0, _lodashLangIsArray2['default'])(values)) {
        values = [values];
      }

      return this.addFilter(field, '$all', values);
    }
  }, {
    key: 'greaterThan',
    value: function greaterThan(field, value) {
      if (!(0, _lodashLangIsNumber2['default'])(value) || !(0, _lodashLangIsString2['default'])(value)) {
        throw new Error('You must supply a number or string.');
      }

      return this.addFilter(field, '$gt', value);
    }
  }, {
    key: 'greaterThanOrEqualTo',
    value: function greaterThanOrEqualTo(field, value) {
      if (!(0, _lodashLangIsNumber2['default'])(value) || !(0, _lodashLangIsString2['default'])(value)) {
        throw new Error('You must supply a number or string.');
      }

      return this.addFilter(field, '$gte', value);
    }
  }, {
    key: 'lessThan',
    value: function lessThan(field, value) {
      if (!(0, _lodashLangIsNumber2['default'])(value) || !(0, _lodashLangIsString2['default'])(value)) {
        throw new Error('You must supply a number or string.');
      }

      return this.addFilter(field, '$lt', value);
    }
  }, {
    key: 'lessThanOrEqualTo',
    value: function lessThanOrEqualTo(field, value) {
      if (!(0, _lodashLangIsNumber2['default'])(value) || !(0, _lodashLangIsString2['default'])(value)) {
        throw new Error('You must supply a number or string.');
      }

      return this.addFilter(field, '$lte', value);
    }
  }, {
    key: 'notEqualTo',
    value: function notEqualTo(field, value) {
      return this.addFilter(field, '$ne', value);
    }
  }, {
    key: 'notContainedIn',
    value: function notContainedIn(field, values) {
      if (!(0, _lodashLangIsArray2['default'])(values)) {
        values = [values];
      }

      return this.addFilter(field, '$nin', values);
    }
  }, {
    key: 'and',
    value: function and() {
      return this.join('$and', Array.prototype.slice.call(arguments));
    }
  }, {
    key: 'nor',
    value: function nor() {
      if (this.parent && this.parent.filter.$and) {
        return this.parent.nor.apply(this.parent, arguments);
      }

      return this.join('$nor', Array.prototype.slice.call(arguments));
    }
  }, {
    key: 'or',
    value: function or() {
      if (this.parent) {
        return this.parent.or.apply(this.parent, arguments);
      }

      return this.join('$or', Array.prototype.slice.call(arguments));
    }
  }, {
    key: 'exists',
    value: function exists(field, flag) {
      flag = typeof flag === 'undefined' ? true : flag || false;
      return this.addFilter(field, '$exists', flag);
    }
  }, {
    key: 'mod',
    value: function mod(field, divisor) {
      var remainder = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      if ((0, _lodashLangIsString2['default'])(divisor)) {
        divisor = parseFloat(divisor);
      }

      if ((0, _lodashLangIsString2['default'])(remainder)) {
        remainder = parseFloat(remainder);
      }

      if (!(0, _lodashLangIsNumber2['default'])(divisor)) {
        throw new Error('Divisor must be a number.');
      }

      if (!(0, _lodashLangIsNumber2['default'])(remainder)) {
        throw new Error('Remainder must be a number.');
      }

      return this.addFilter(field, '$mod', [divisor, remainder]);
    }
  }, {
    key: 'matches',
    value: function matches(field, regExp) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (!(0, _lodashLangIsRegExp2['default'])(regExp)) {
        regExp = new RegExp(regExp);
      }

      if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
        throw new Error('ignoreCase glag is not supported.');
      }

      if (regExp.source.indexOf('^') !== 0) {
        throw new Error('regExp must have `^` at the beginning of the expression to make it an anchored expression.');
      }

      var flags = [];

      if ((regExp.multiline || options.multiline) && options.multiline !== false) {
        flags.push('m');
      }

      if (options.extended) {
        flags.push('x');
      }

      if (options.dotMatchesAll) {
        flags.push('s');
      }

      var result = this.addFilter(field, '$regex', regExp.source);

      if (flags.length) {
        this.addFilter(field, '$options', flags.join(''));
      }

      return result;
    }
  }, {
    key: 'near',
    value: function near(field, coord, maxDistance) {
      if (!(0, _lodashLangIsArray2['default'])(coord) || !coord[0] || !coord[1]) {
        throw new Error('coord argument must be of type: [number, number]');
      }

      coord[0] = parseFloat(coord[0]);
      coord[1] = parseFloat(coord[1]);

      var result = this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);

      if (maxDistance) {
        this.addFilter(field, '$maxDistance', maxDistance);
      }

      return result;
    }
  }, {
    key: 'withinBox',
    value: function withinBox(field, bottomLeftCoord, upperRightCoord) {
      if (!(0, _lodashLangIsArray2['default'])(bottomLeftCoord) || !bottomLeftCoord[0] || !bottomLeftCoord[1]) {
        throw new Error('bottomLeftCoord argument must be of type: [number, number]');
      }

      if (!(0, _lodashLangIsArray2['default'])(upperRightCoord) || !upperRightCoord[0] || !upperRightCoord[1]) {
        throw new Error('upperRightCoord argument must be of type: [number, number]');
      }

      bottomLeftCoord[0] = parseFloat(bottomLeftCoord[0]);
      bottomLeftCoord[1] = parseFloat(bottomLeftCoord[1]);
      upperRightCoord[0] = parseFloat(upperRightCoord[0]);
      upperRightCoord[1] = parseFloat(upperRightCoord[1]);

      var coords = [[bottomLeftCoord[0], bottomLeftCoord[1]], [upperRightCoord[0], upperRightCoord[1]]];
      return this.addFilter(field, '$within', { $box: coords });
    }
  }, {
    key: 'withinPolygon',
    value: function withinPolygon(field, coords) {
      if (!(0, _lodashLangIsArray2['default'])(coords) || coords.length > 3) {
        throw new Error('coords argument must be of type: [[number, number]]');
      }

      coords = coords.map(function (coord) {
        if (!coord[0] || !coord[1]) {
          throw new Error('coords argument must be of type: [number, number]');
        }

        return [parseFloat(coord[0]), parseFloat(coord[1])];
      });

      return this.addFilter(field, '$within', { $polygon: coords });
    }
  }, {
    key: 'size',
    value: function size(field, _size) {
      if ((0, _lodashLangIsString2['default'])(_size)) {
        _size = parseFloat(_size);
      }

      if (!(0, _lodashLangIsNumber2['default'])(_size)) {
        throw new Error('size argument must be of type: number');
      }

      return this.addFilter(field, '$size', _size);
    }
  }, {
    key: 'fields',
    value: function fields() {
      var _fields = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      if (!(0, _lodashLangIsArray2['default'])(_fields)) {
        throw new Error('fields argument must be of type: Array.');
      }

      if (this.parent) {
        this.parent.fields(_fields);
      } else {
        this._fields = _fields;
      }

      return this;
    }
  }, {
    key: 'limit',
    value: function limit(_limit) {
      if ((0, _lodashLangIsString2['default'])(_limit)) {
        _limit = parseFloat(_limit);
      }

      if (_limit && !(0, _lodashLangIsNumber2['default'])(_limit)) {
        throw new Error('limit argument must be of type: number.');
      }

      if (this._parent) {
        this.parent.limit(_limit);
      } else {
        this._limit = _limit;
      }

      return this;
    }
  }, {
    key: 'skip',
    value: function skip(_skip) {
      if ((0, _lodashLangIsString2['default'])(_skip)) {
        _skip = parseFloat(_skip);
      }

      if (!(0, _lodashLangIsNumber2['default'])(_skip)) {
        throw new Error('skip argument must be of type: number.');
      }

      if (this.parent) {
        this.parent.skip(_skip);
      } else {
        this._skip = _skip;
      }

      return this;
    }
  }, {
    key: 'ascending',
    value: function ascending(field) {
      if (this.parent) {
        this.parent.ascending(field);
      } else {
        this._sort[field] = 1;
      }

      return this;
    }
  }, {
    key: 'descending',
    value: function descending(field) {
      if (this.parent) {
        this.parent.descending(field);
      } else {
        this._sort[field] = -1;
      }

      return this;
    }
  }, {
    key: 'sort',
    value: function sort(_sort) {
      if (_sort && !(0, _lodashLangIsObject2['default'])(_sort)) {
        throw new Error('sort argument must be of type: Object.');
      }

      if (this.parent) {
        this.parent.sort(_sort);
      } else {
        this._sort = _sort || {};
      }

      return this;
    }
  }, {
    key: 'addFilter',
    value: function addFilter(field, condition, values) {
      if (!(0, _lodashLangIsObject2['default'])(this._filter[field])) {
        this._filter[field] = {};
      }

      this._filter[field][condition] = values;
      return this;
    }
  }, {
    key: 'join',
    value: function join(operator, queries) {
      var _this = this;
      var currentQuery = {};

      queries = queries.map(function (query) {
        if (!(query instanceof PrivateQuery)) {
          if ((0, _lodashLangIsObject2['default'])(query)) {
            query = new PrivateQuery(query);
          } else {
            throw new Error('query argument must be of type: Kinvey.Query[] or Object[].');
          }
        }

        return query.toJSON().filter;
      });

      if (queries.length === 0) {
        _this = new PrivateQuery();
        queries = [_this.toJSON().filter];
        _this.parent = this;
      }

      for (var member in this._filter) {
        if (this._filter.hasOwnProperty(member)) {
          currentQuery[member] = this._filter[member];
          delete this._filter[member];
        }
      }

      this._filter[operator] = [currentQuery].concat(queries);

      return _this;
    }
  }, {
    key: 'process',
    value: function process(response) {
      var _this2 = this;

      if (response) {
        if (!(0, _lodashLangIsArray2['default'])(response)) {
          throw new Error('response argument must be of type: Array.');
        }

        var json = this.toJSON();
        response = (0, _sift2['default'])(json.filter, response);

        if (this._fields) {
          response = response.map(function (item) {
            for (var key in item) {
              if (item.hasOwnProperty(key) && _this2._fields.indexOf(key) === -1) {
                delete item[key];
              }
            }

            return item;
          });
        }

        response = response.sort(function (a, b) {
          for (var field in _this2._sort) {
            if (_this2._sort.hasOwnProperty(field)) {
              var aField = (0, _utilsNested2['default'])(a, field);
              var bField = (0, _utilsNested2['default'])(b, field);

              if (aField && !bField) {
                return -1;
              }

              if (bField && !aField) {
                return 1;
              }

              if (aField !== bField) {
                var modifier = _this2._sort[field];
                return (aField < bField ? -1 : 1) * modifier;
              }
            }
          }

          return 0;
        });

        if (this._limit) {
          return response.slice(this._skip, this._skip + this._limit);
        }

        return response.slice(this._skip);
      }

      return response;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      if (this.parent) {
        return this.parent.toJSON();
      }

      var json = {
        fields: this._fields,
        filter: this._filter,
        sort: this._sort,
        skip: this._skip,
        limit: this._limit
      };

      return (0, _lodashLangClone2['default'])(json, true);
    }
  }]);

  return PrivateQuery;
})();

var Query = (function () {
  function Query() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Query);

    this[privateQuerySymbol] = new PrivateQuery(options);
  }

  _createClass(Query, [{
    key: 'equalTo',
    value: function equalTo(field, value) {
      this[privateQuerySymbol].equalTo(field, value);
      return this;
    }
  }, {
    key: 'contains',
    value: function contains(field, values) {
      this[privateQuerySymbol].contains(field, values);
      return this;
    }
  }, {
    key: 'containsAll',
    value: function containsAll(field, values) {
      this[privateQuerySymbol].containsAll(field, values);
      return this;
    }
  }, {
    key: 'greaterThan',
    value: function greaterThan(field, value) {
      this[privateQuerySymbol].greaterThan(field, value);
      return this;
    }
  }, {
    key: 'greaterThanOrEqualTo',
    value: function greaterThanOrEqualTo(field, value) {
      this[privateQuerySymbol].greaterThanOrEqualToe(field, value);
      return this;
    }
  }, {
    key: 'lessThan',
    value: function lessThan(field, value) {
      this[privateQuerySymbol].lessThan(field, value);
      return this;
    }
  }, {
    key: 'lessThanOrEqualTo',
    value: function lessThanOrEqualTo(field, value) {
      this[privateQuerySymbol].lessThanOrEqualTo(field, value);
      return this;
    }
  }, {
    key: 'notEqualTo',
    value: function notEqualTo(field, value) {
      this[privateQuerySymbol].notEqualTo(field, value);
      return this;
    }
  }, {
    key: 'notContainedIn',
    value: function notContainedIn(field, values) {
      this[privateQuerySymbol].notContainedIn(field, values);
      return this;
    }
  }, {
    key: 'and',
    value: function and() {
      this[privateQuerySymbol].and.apply(this[privateQuerySymbol], arguments);
      return this;
    }
  }, {
    key: 'nor',
    value: function nor() {
      this[privateQuerySymbol].nor.apply(this[privateQuerySymbol], arguments);
      return this;
    }
  }, {
    key: 'or',
    value: function or() {
      this[privateQuerySymbol].or.apply(this[privateQuerySymbol], arguments);
      return this;
    }
  }, {
    key: 'exists',
    value: function exists(field, flag) {
      this[privateQuerySymbol].exists(field, flag);
      return this;
    }
  }, {
    key: 'mod',
    value: function mod(field, divisor) {
      var remainder = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      this[privateQuerySymbol].mod(field, divisor, remainder);
      return this;
    }
  }, {
    key: 'matches',
    value: function matches(field, regExp) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      this[privateQuerySymbol].matches(field, regExp, options);
      return this;
    }
  }, {
    key: 'near',
    value: function near(field, coord, maxDistance) {
      this[privateQuerySymbol].near(field, coord, maxDistance);
      return this;
    }
  }, {
    key: 'withinBox',
    value: function withinBox(field, bottomLeftCoord, upperRightCoord) {
      this[privateQuerySymbol].withinBox(field, bottomLeftCoord, upperRightCoord);
      return this;
    }
  }, {
    key: 'withinPolygon',
    value: function withinPolygon(field, coords) {
      this[privateQuerySymbol].withinPolygon(field, coords);
      return this;
    }
  }, {
    key: 'size',
    value: function size(field, _size2) {
      this[privateQuerySymbol].size(field, _size2);
      return this;
    }
  }, {
    key: 'fields',
    value: function fields() {
      var _fields2 = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      this[privateQuerySymbol].fields(_fields2);
      return this;
    }
  }, {
    key: 'limit',
    value: function limit(_limit2) {
      this[privateQuerySymbol].limit(_limit2);
      return this;
    }
  }, {
    key: 'skip',
    value: function skip(_skip2) {
      this[privateQuerySymbol].skip(_skip2);
      return this;
    }
  }, {
    key: 'ascending',
    value: function ascending(field) {
      this[privateQuerySymbol].ascending(field);
      return this;
    }
  }, {
    key: 'descending',
    value: function descending(field) {
      this[privateQuerySymbol].descending(field);
      return this;
    }
  }, {
    key: 'sort',
    value: function sort(_sort2) {
      this[privateQuerySymbol].sort(_sort2);
      return this;
    }
  }, {
    key: 'process',
    value: function process(response) {
      return this[privateQuerySymbol].process(response);
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this[privateQuerySymbol].toJSON();
    }
  }]);

  return Query;
})();

exports['default'] = Query;
module.exports = exports['default'];

},{"../utils/nested":281,"babel-runtime/core-js/symbol":8,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"lodash/lang/clone":208,"lodash/lang/isArray":210,"lodash/lang/isNumber":215,"lodash/lang/isObject":216,"lodash/lang/isRegExp":218,"lodash/lang/isString":219,"sift":235}],265:[function(require,module,exports){
(function (global,Buffer){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _utilsIsDefined = require('../utils/isDefined');

var _utilsIsDefined2 = _interopRequireDefault(_utilsIsDefined);

var _lodashLangIsFunction = require('lodash/lang/isFunction');

var _lodashLangIsFunction2 = _interopRequireDefault(_lodashLangIsFunction);

var _lodashLangIsString = require('lodash/lang/isString');

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

var _enumsHttpMethod = require('./enums/httpMethod');

var _enumsHttpMethod2 = _interopRequireDefault(_enumsHttpMethod);

var _rackRack = require('../rack/rack');

var _rackRack2 = _interopRequireDefault(_rackRack);

var _enumsResponseType = require('./enums/responseType');

var _enumsResponseType2 = _interopRequireDefault(_enumsResponseType);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _auth = require('./auth');

var _auth2 = _interopRequireDefault(_auth);

var _enumsDataPolicy = require('./enums/dataPolicy');

var _enumsDataPolicy2 = _interopRequireDefault(_enumsDataPolicy);

var _errors = require('./errors');

var _requestProperties = require('./requestProperties');

var _requestProperties2 = _interopRequireDefault(_requestProperties);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _lodashObjectMerge = require('lodash/object/merge');

var _lodashObjectMerge2 = _interopRequireDefault(_lodashObjectMerge);

var _lodashObjectResult = require('lodash/object/result');

var _lodashObjectResult2 = _interopRequireDefault(_lodashObjectResult);

var _lodashLangClone = require('lodash/lang/clone');

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

var _lodashCollectionIndexBy = require('lodash/collection/indexBy');

var _lodashCollectionIndexBy2 = _interopRequireDefault(_lodashCollectionIndexBy);

var _lodashCollectionReduce = require('lodash/collection/reduce');

var _lodashCollectionReduce2 = _interopRequireDefault(_lodashCollectionReduce);

var _utilsString = require('../utils/string');

var customRequestPropertiesMaxBytes = 2000;
var maxIdsPerRequest = 200;
var defaultTimeout = 10000;
var Request = (function () {
  function Request(method, path, query, data) {
    if (method === undefined) method = _enumsHttpMethod2['default'].GET;
    if (path === undefined) path = '';
    var options = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

    _classCallCheck(this, Request);

    options = (0, _lodashObjectAssign2['default'])({
      auth: _auth2['default'].none,
      client: _client2['default'].sharedInstance(),
      dataPolicy: _enumsDataPolicy2['default'].CloudOnly,
      responseType: _enumsResponseType2['default'].Text,
      timeout: defaultTimeout
    }, options);

    var client = options.client;

    if (!(client instanceof _client2['default'])) {
      client = new _client2['default']((0, _lodashObjectResult2['default'])(client, 'toJSON', client));
    }

    if (query && !(query instanceof _query2['default'])) {
      query = new _query2['default']((0, _lodashObjectResult2['default'])(query, 'toJSON', query));
    }

    this.method = method;
    this.headers = {};
    this.requestProperties = options.requestProperties;
    this.protocol = options.client.apiProtocol;
    this.host = options.client.apiHost;
    this.path = path;
    this.query = query;
    this.flags = options.flags;
    this.data = data;
    this.responseType = options.responseType;
    this.client = options.client;
    this.auth = options.auth;
    this.dataPolicy = options.dataPolicy;
    this.timeout = options.timeout;
    this.executing = false;

    var headers = {};
    headers.Accept = 'application/json';
    headers['X-Kinvey-Api-Version'] = '3';
    headers['X-Kinvey-Device-Information'] = {};

    if (options.contentType) {
      headers['X-Kinvey-Content-Type'] = options.contentType;
    }

    if (options.skipBL === true) {
      headers['X-Kinvey-Skip-Business-Logic'] = true;
    }

    if (options.trace === true) {
      headers['X-Kinvey-Include-Headers-In-Response'] = 'X-Kinvey-Request-Id';
      headers['X-Kinvey-ResponseWrapper'] = true;
    }

    this.addHeaders(headers);
  }

  _createClass(Request, [{
    key: 'getHeader',
    value: function getHeader(header) {
      if (!(0, _lodashLangIsString2['default'])(header)) {
        header = String(header);
      }

      var keys = _Object$keys(this.headers);

      for (var i = 0, len = keys.length; i < len; i++) {
        var key = keys[i];

        if (key.toLowerCase() === header.toLowerCase()) {
          return this.headers[key];
        }
      }

      return void 0;
    }
  }, {
    key: 'setHeader',
    value: function setHeader(header, value) {
      if (!(0, _lodashLangIsString2['default'])(header)) {
        header = String(header);
      }

      if (!(0, _lodashLangIsString2['default'])(value)) {
        value = String(value);
      }

      var headers = this.headers;
      headers[header.toLowerCase()] = value;
      this.headers = headers;
    }
  }, {
    key: 'addHeaders',
    value: function addHeaders() {
      var _this = this;

      var headers = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var keys = _Object$keys(headers);

      keys.forEach(function (header) {
        var value = headers[header];
        _this.setHeader(header, value);
      });
    }
  }, {
    key: 'removeHeader',
    value: function removeHeader(header) {
      delete this.headers[header.toLowerCase()];
    }
  }, {
    key: 'execute',
    value: function execute() {
      var _this2 = this;

      if (this.executing) {
        return _bluebird2['default'].reject(new _errors.KinveyError('The request is already executing.'));
      }

      var promise = undefined;
      this.executing = true;

      if (this.dataPolicy === _enumsDataPolicy2['default'].LocalOnly) {
        promise = this.executeLocal();
      } else if (this.dataPolicy === _enumsDataPolicy2['default'].LocalFirst) {
        promise = this.executeLocal().then(function (response) {
          if (response && response.isSuccess()) {
            if (_this2.method !== _enumsHttpMethod2['default'].GET) {
              var request = new Request(_this2.method, _this2.path, _this2.query, response.data, {
                auth: _this2.auth,
                client: _this2.client,
                dataPolicy: _enumsDataPolicy2['default'].CloudOnly
              });
              return request.execute().then(function () {
                return response;
              });
            }
          } else {
            if (_this2.method === _enumsHttpMethod2['default'].GET) {
              var request = new Request(_this2.method, _this2.path, _this2.query, response.data, {
                auth: _this2.auth,
                client: _this2.client,
                dataPolicy: _enumsDataPolicy2['default'].CloudFirst
              });
              return request.execute();
            }
          }

          return response;
        });
      } else if (this.dataPolicy === _enumsDataPolicy2['default'].CloudOnly) {
        promise = this.executeCloud();
      } else if (this.dataPolicy === _enumsDataPolicy2['default'].CloudFirst) {
        promise = this.executeCloud().then(function (response) {
          if (response && response.isSuccess()) {
            var request = new Request(_this2.method, _this2.path, _this2.query, response.data, {
              auth: _this2.auth,
              client: _this2.client,
              dataPolicy: _enumsDataPolicy2['default'].LocalOnly
            });

            if (_this2.method === _enumsHttpMethod2['default'].GET) {
              request.method = _enumsHttpMethod2['default'].PUT;
            }

            return request.execute().then(function () {
              return response;
            });
          } else if (_this2.method === _enumsHttpMethod2['default'].GET) {
            var request = new Request(_this2.method, _this2.path, _this2.query, response.data, {
              auth: _this2.auth,
              client: _this2.client,
              dataPolicy: _enumsDataPolicy2['default'].LocalOnly
            });
            return request.execute();
          }

          return response;
        });
      }

      return promise.then(function (response) {
        _this2.response = response;
        return response;
      })['finally'](function () {
        _this2.executing = false;
      });
    }
  }, {
    key: 'executeLocal',
    value: function executeLocal() {
      var rack = _rackRack2['default'].cacheRack;
      return rack.execute(this);
    }
  }, {
    key: 'executeCloud',
    value: function executeCloud() {
      var _this3 = this;

      var auth = this.auth;
      var rack = _rackRack2['default'].networkRack;
      var promise = _bluebird2['default'].resolve();

      return promise.then(function () {
        if ((0, _utilsIsDefined2['default'])(auth)) {
          promise = (0, _lodashLangIsFunction2['default'])(auth) ? auth(_this3.client) : _bluebird2['default'].resolve(auth);

          return promise.then(function (authInfo) {
            if (authInfo !== null) {
              var credentials = authInfo.credentials;
              if ((0, _utilsIsDefined2['default'])(authInfo.username)) {
                credentials = new Buffer(authInfo.username + ':' + authInfo.password).toString('base64');
              }

              _this3.setHeader('Authorization', authInfo.scheme + ' ' + credentials);
            }
          });
        }
      }).then(function () {
        return rack.execute(_this3);
      });
    }
  }, {
    key: 'abort',
    value: function abort() {
      throw new _errors.KinveyError('Method not supported');
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = {
        method: this.method,
        headers: this.headers,
        requestProperties: (0, _lodashObjectResult2['default'])(this.requestProperties, 'toJSON', null),
        url: this.url,
        path: this.path,
        query: (0, _lodashObjectResult2['default'])(this.query, 'toJSON', null),
        flags: this.flags,
        data: this.data,
        responseType: this.responseType,
        dataPolicy: this.dataPolicy,
        client: (0, _lodashObjectResult2['default'])(this.client, 'toJSON', null),
        timeout: this.timeout
      };

      return (0, _lodashLangClone2['default'])(json, true);
    }
  }, {
    key: 'method',
    get: function get() {
      return this._method;
    },
    set: function set(method) {
      if (!(0, _lodashLangIsString2['default'])(method)) {
        method = String(method);
      }

      method = method.toUpperCase();

      switch (method) {
        case _enumsHttpMethod2['default'].GET:
        case _enumsHttpMethod2['default'].POST:
        case _enumsHttpMethod2['default'].PATCH:
        case _enumsHttpMethod2['default'].PUT:
        case _enumsHttpMethod2['default'].DELETE:
          this._method = method;
          break;
        default:
          throw new _errors.KinveyError('Invalid Http Method. GET, POST, PATCH, PUT, and DELETE are allowed.');
      }
    }
  }, {
    key: 'requestProperties',
    get: function get() {
      return this._requestProperties;
    },
    set: function set(requestProperties) {
      if (!(requestProperties instanceof _requestProperties2['default'])) {
        requestProperties = new _requestProperties2['default']((0, _lodashObjectResult2['default'])(requestProperties, 'toJSON', requestProperties));
      }

      var appVersion = requestProperties.appVersion;

      if (appVersion) {
        this.setHeader('X-Kinvey-Client-App-Version', appVersion);
      } else {
        this.removeHeader('X-Kinvey-Client-App-Version');
      }

      var customRequestProperties = (0, _lodashObjectResult2['default'])(requestProperties, 'toJSON', {});
      delete customRequestProperties.appVersion;
      var customRequestPropertiesHeader = JSON.stringify(requestProperties.toJSON());
      var customRequestPropertiesByteCount = (0, _utilsString.byteCount)(customRequestPropertiesHeader);

      if (customRequestPropertiesByteCount >= customRequestPropertiesMaxBytes) {
        throw new _errors.KinveyError('The custom request properties are ' + customRequestPropertiesByteCount + '. It must be less then ' + customRequestPropertiesMaxBytes + ' bytes.', 'Please remove some custom request properties.');
      }

      this.setHeader('X-Kinvey-Custom-Request-Properties', customRequestPropertiesHeader);
      this._requestProperties = requestProperties;
    }
  }, {
    key: 'url',
    get: function get() {
      return _url2['default'].format({
        protocol: this.protocol,
        host: this.host,
        pathname: this.path,
        query: (0, _lodashObjectMerge2['default'])({}, this.flags, (0, _lodashObjectResult2['default'])(this.query, 'toJSON', {})),
        hash: this.hash
      });
    }
  }, {
    key: 'body',
    get: function get() {
      return this._data;
    },
    set: function set(body) {
      if (body) {
        var contentTypeHeader = this.getHeader('Content-Type');

        if (!contentTypeHeader) {
          this.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
      } else {
        this.removeHeader('Content-Type');
      }

      this._data = body;
    }
  }, {
    key: 'data',
    get: function get() {
      return this._data;
    },
    set: function set(data) {
      if (data) {
        var contentTypeHeader = this.getHeader('Content-Type');

        if (!contentTypeHeader) {
          this.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
      } else {
        this.removeHeader('Content-Type');
      }

      this._data = data;
    }
  }, {
    key: 'responseType',
    get: function get() {
      return this._responseType;
    },
    set: function set(type) {
      type = type || _enumsResponseType2['default'].DOMString;
      var responseType = undefined;

      switch (type) {
        case _enumsResponseType2['default'].Blob:
          try {
            responseType = new global.Blob() && 'blob';
          } catch (e) {
            responseType = 'arraybuffer';
          }

          break;
        case _enumsResponseType2['default'].Document:
          responseType = 'document';
          break;
        case _enumsResponseType2['default'].JSON:
          responseType = 'json';
          break;
        default:
          responseType = '';
      }

      this._responseType = responseType;
    }
  }]);

  return Request;
})();

exports.Request = Request;

var DeltaSetRequest = (function (_Request) {
  _inherits(DeltaSetRequest, _Request);

  function DeltaSetRequest() {
    _classCallCheck(this, DeltaSetRequest);

    _get(Object.getPrototypeOf(DeltaSetRequest.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(DeltaSetRequest, [{
    key: 'execute',
    value: function execute() {
      var _this4 = this;

      if (this.executing) {
        return _bluebird2['default'].reject(new _errors.KinveyError('The request is already executing.'));
      }

      if (this.dataPolicy === _enumsDataPolicy2['default'].CloudFirst && this.method === _enumsHttpMethod2['default'].GET) {
        var _ret = (function () {
          var origQuery = _this4.query;
          _this4.query = new _query2['default']();
          _this4.query.fields(['_id', '_kmd']);
          _this4.executing = true;

          return {
            v: _this4.executeLocal().then(function (localResponse) {
              if (localResponse && localResponse.isSuccess()) {
                var _ret2 = (function () {
                  var localEntities = (0, _lodashCollectionIndexBy2['default'])(localResponse.data, '_id');

                  return {
                    v: _this4.executeCloud().then(function (cloudResponse) {
                      if (cloudResponse && cloudResponse.isSuccess()) {
                        var cloudEntities = (0, _lodashCollectionIndexBy2['default'])(cloudResponse.data, '_id');

                        for (var id in cloudEntities) {
                          if (cloudEntities.hasOwnProperty(id)) {
                            var cloudEntity = cloudEntities[id];
                            var localEntity = localEntities[id];

                            if (cloudEntity && !localEntity) {
                              continue;
                            } else if (cloudEntity && localEntity) {
                              if (cloudEntity._kmd && localEntity._kmd && cloudEntity._kmd.lmt > localEntity._kmd.lmt) {
                                continue;
                              }
                            }

                            delete cloudEntities[id];
                          }
                        }

                        var ids = _Object$keys(cloudEntities);
                        var promises = [];
                        var i = 0;

                        while (i < ids.length) {
                          var query = new _query2['default'](origQuery.toJSON());
                          query.contains('_id', ids.slice(i, ids.length > maxIdsPerRequest + i ? maxIdsPerRequest : ids.length));
                          var request = new Request(_this4.method, _this4.path, query, null, {
                            auth: _this4.auth,
                            client: _this4.client,
                            dataPolicy: _this4.dataPolicy
                          });
                          promises.push(request.execute());

                          i += maxIdsPerRequest;
                        }

                        return _bluebird2['default'].all(promises).then(function (responses) {
                          var initialResponse = new Response(null, null, []);
                          return (0, _lodashCollectionReduce2['default'])(responses, function (result, response) {
                            result.addHeaders(response.headers);
                            result.data.concat(response.data);
                            return result;
                          }, initialResponse);
                        })['finally'](function () {
                          _this4.executing = false;
                        });
                      }

                      return _get(Object.getPrototypeOf(DeltaSetRequest.prototype), 'execute', _this4).call(_this4);
                    })
                  };
                })();

                if (typeof _ret2 === 'object') return _ret2.v;
              }

              return _get(Object.getPrototypeOf(DeltaSetRequest.prototype), 'execute', _this4).call(_this4);
            })
          };
        })();

        if (typeof _ret === 'object') return _ret.v;
      }

      return _get(Object.getPrototypeOf(DeltaSetRequest.prototype), 'execute', this).call(this);
    }
  }]);

  return DeltaSetRequest;
})(Request);

exports.DeltaSetRequest = DeltaSetRequest;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"../rack/rack":279,"../utils/isDefined":280,"../utils/string":283,"./auth":242,"./client":248,"./enums/dataPolicy":252,"./enums/httpMethod":253,"./enums/responseType":255,"./errors":259,"./query":264,"./requestProperties":266,"babel-runtime/core-js/object/keys":5,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13,"bluebird":86,"buffer":87,"lodash/collection/indexBy":150,"lodash/collection/reduce":151,"lodash/lang/clone":208,"lodash/lang/isFunction":213,"lodash/lang/isString":219,"lodash/object/assign":222,"lodash/object/merge":227,"lodash/object/result":229,"url":97}],266:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Symbol = require('babel-runtime/core-js/symbol')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _lodashLangClone = require('lodash/lang/clone');

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

var privateRequestPropertiesSymbol = _Symbol();
var appVersionKey = 'appVersion';

var PrivateRequestProperties = (function () {
  function PrivateRequestProperties() {
    var properties = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, PrivateRequestProperties);

    this.properties = properties;
  }

  _createClass(PrivateRequestProperties, [{
    key: 'addProperties',
    value: function addProperties() {
      var _this = this;

      var properties = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _Object$keys(properties).forEach(function (key) {
        var value = properties[key];

        if (value) {
          _this.properties[key] = value;
        } else {
          delete _this.properties[key];
        }
      });
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.properties = {};
    }
  }, {
    key: 'clearProperty',
    value: function clearProperty(key) {
      var properties = this.properties;

      if (key && properties.hasOwnProperty(key)) {
        delete properties[key];
      }
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return (0, _lodashLangClone2['default'])(this.properties, true);
    }
  }, {
    key: 'properties',
    get: function get() {
      return this._properties;
    },
    set: function set(properties) {
      this._properties = (0, _lodashLangClone2['default'])(properties, true);
    }
  }]);

  return PrivateRequestProperties;
})();

var RequestProperties = (function () {
  function RequestProperties() {
    var properties = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, RequestProperties);

    this[privateRequestPropertiesSymbol] = new PrivateRequestProperties(properties);
  }

  _createClass(RequestProperties, [{
    key: 'getProperty',
    value: function getProperty(key) {
      var properties = this.toJSON();

      if (key && properties.hasOwnProperty(key)) {
        return properties[key];
      }

      return void 0;
    }
  }, {
    key: 'setProperty',
    value: function setProperty(key, value) {
      var properties = {};
      properties[key] = value;
      this.addProperties(properties);
    }
  }, {
    key: 'addProperties',
    value: function addProperties() {
      var properties = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var privateRequestProperties = this[privateRequestPropertiesSymbol];
      privateRequestProperties.addProperties(properties);
    }
  }, {
    key: 'clear',
    value: function clear() {
      var privateRequestProperties = this[privateRequestPropertiesSymbol];
      privateRequestProperties.clear();
    }
  }, {
    key: 'clearProperty',
    value: function clearProperty(key) {
      var privateRequestProperties = this[privateRequestPropertiesSymbol];
      privateRequestProperties.clearProperty(key);
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var privateRequestProperties = this[privateRequestPropertiesSymbol];
      return privateRequestProperties.toJSON();
    }
  }, {
    key: 'properties',
    set: function set(properties) {
      var privateRequestProperties = this[privateRequestPropertiesSymbol];
      privateRequestProperties.properties = properties;
    }
  }, {
    key: 'appVersion',
    get: function get() {
      return this.getProperty(appVersionKey);
    },
    set: function set(version) {
      version = Array.prototype.slice.call(arguments, 1);
      var major = version[0];
      var minor = version[1];
      var patch = version[2];
      var appVersion = '';

      if (major) {
        appVersion = (major + '').trim();
      }

      if (minor) {
        appVersion = ('.' + minor).trim();
      }

      if (patch) {
        appVersion = ('.' + patch).trim();
      }

      this.setProperty(appVersionKey, appVersion);
    }
  }]);

  return RequestProperties;
})();

exports['default'] = RequestProperties;
module.exports = exports['default'];

},{"babel-runtime/core-js/object/keys":5,"babel-runtime/core-js/symbol":8,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"lodash/lang/clone":208}],267:[function(require,module,exports){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _lodashLangIsString = require('lodash/lang/isString');

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

var _enumsStatusCode = require('./enums/statusCode');

var _enumsStatusCode2 = _interopRequireDefault(_enumsStatusCode);

var Response = (function () {
  function Response() {
    var statusCode = arguments.length <= 0 || arguments[0] === undefined ? _enumsStatusCode2['default'].OK : arguments[0];
    var headers = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var data = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, Response);

    this.statusCode = statusCode;
    this.addHeaders(headers);
    this.data = data;
  }

  _createClass(Response, [{
    key: 'getHeader',
    value: function getHeader(header) {
      if (!(0, _lodashLangIsString2['default'])(header)) {
        header = String(header);
      }

      var keys = _Object$keys(this.headers);

      for (var i = 0, len = keys.length; i < len; i++) {
        var key = keys[i];

        if (key.toLowerCase() === header.toLowerCase()) {
          return this.headers[key];
        }
      }

      return void 0;
    }
  }, {
    key: 'setHeader',
    value: function setHeader(header, value) {
      if (!(0, _lodashLangIsString2['default'])(header)) {
        header = String(header);
      }

      if (!(0, _lodashLangIsString2['default'])(value)) {
        value = String(value);
      }

      var headers = this.headers;
      headers[header.toLowerCase()] = value;
      this.headers = headers;
    }
  }, {
    key: 'addHeaders',
    value: function addHeaders() {
      var _this = this;

      var headers = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var keys = _Object$keys(headers);

      keys.forEach(function (header) {
        var value = headers[header];
        _this.setHeader(header, value);
      });
    }
  }, {
    key: 'isSuccess',
    value: function isSuccess() {
      return this.statusCode >= 200 && this.statusCode < 300;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = {
        statusCode: this.statusCode,
        headers: this.headers,
        data: this.data
      };

      return json;
    }
  }]);

  return Response;
})();

exports['default'] = Response;
module.exports = exports['default'];

},{"./enums/statusCode":257,"babel-runtime/core-js/object/keys":5,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"lodash/lang/isString":219}],268:[function(require,module,exports){
(function (global){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _social = require('./social');

var _social2 = _interopRequireDefault(_social);

var _errors = require('../errors');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var FB = global.FB;

var Facebook = (function (_Social) {
  _inherits(Facebook, _Social);

  function Facebook() {
    _classCallCheck(this, Facebook);

    _get(Object.getPrototypeOf(Facebook.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Facebook, [{
    key: 'connect',
    value: function connect() {
      var promise = new _bluebird2['default'](function (resolve, reject) {
        if (typeof FB === 'undefined') {
          return reject(new _errors.KinveyError('Facebook SDK not found.', 'Please load the Facebook SDK by following the guide at https://developers.facebook.com/docs/javascript/quickstart/v2.4.'));
        }

        FB.getLoginStatus(function (response) {
          if (response.status === 'connected') {
            return resolve(response.authResponse);
          }

          FB.login(function (response) {
            if (response.status === 'connected') {
              var authResponse = response.authResponse;
              var token = {
                access_token: authResponse.accessToken,
                expires_in: authResponse.expiresIn
              };
              return resolve(token);
            } else if (response.status === 'not_authorized') {
              return reject(new _errors.KinveyError('The user did not authorize the application to connect to Facebook.'));
            }

            reject('Unable to connect to Facebook.');
          });
        });
      });

      return promise;
    }
  }, {
    key: 'name',
    get: function get() {
      return 'facebook';
    }
  }]);

  return Facebook;
})(_social2['default']);

exports['default'] = Facebook;
module.exports = exports['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../errors":259,"./social":271,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13,"bluebird":86}],269:[function(require,module,exports){

},{}],270:[function(require,module,exports){

},{}],271:[function(require,module,exports){
(function (global){
var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _errors = require('../errors');

var _client = require('../client');

var _client2 = _interopRequireDefault(_client);

var _request = require('../request');

var _enumsHttpMethod = require('../enums/httpMethod');

var _enumsHttpMethod2 = _interopRequireDefault(_enumsHttpMethod);

var _auth = require('../auth');

var _auth2 = _interopRequireDefault(_auth);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _utilsPlatform = require('../../utils/platform');

var usersNamespace = 'user';

var Social = (function () {
  function Social() {
    _classCallCheck(this, Social);
  }

  _createClass(Social, [{
    key: 'requestToken',
    value: function requestToken() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options = (0, _lodashObjectAssign2['default'])(options, {
        state: Math.random().toString(36).substr(2),
        flags: {
          provider: this.name,
          step: 'requestToken'
        }
      });

      var redirectUri = options.redirect || global.location.toString();
      var client = _client2['default'].sharedInstance();
      var path = '/' + usersNamespace + '/' + client.appId;
      var data = {
        redirect: redirectUri,
        state: options.state
      };
      var request = new _request.Request(_enumsHttpMethod2['default'].POST, path, null, data, options);
      request.auth = _auth2['default'].app;

      var promise = request.execute().then(function (data) {
        var popupUrl = data.url;

        return new _bluebird2['default'](function (resolve, reject) {
          var interval = 100;
          var elapsed = 0;
          var tiWebView = undefined;
          var tiCloseButton = undefined;
          var popup = undefined;
          var timer = undefined;

          var popupRedirected = function popupRedirected(event) {
            var params = _url2['default'].parse(event.url).query;
            resolve(params.code);
          };

          var loadHandler = function loadHandler(event) {
            var redirected = false;

            try {
              redirected = event.url.indexOf(redirectUri) === 0;
            } catch (err) {}

            if (redirected) {
              popupRedirected(event.url);
            }
          };

          var clickHandler = function clickHandler() {
            popup.close();
          };

          var closePopup = function closePopup() {
            if ((0, _utilsPlatform.isPhoneGap)()) {
              popup.removeEventListener('loadstart', loadHandler);
              popup.removeEventListener('exit', closePopup);
            } else if ((0, _utilsPlatform.isTitanium)()) {
              tiWebView.removeEventListener('load', loadHandler);
              tiWebView.removeEventListener('error', loadHandler);
              popup.removeEventListener('close', closePopup);

              if (Titanium.Platform.name === 'iPhone OS') {
                tiCloseButton.removeEventListener('click', clickHandler);
              } else if (Titanium.Platform.name === 'Android') {
                popup.removeEventListener('androidback', closePopup);
              }
            }

            setTimeout(function () {
              popup.close();
            }, 200);

            clearTimeout(timer);
            popup.closed = true;
          };

          if ((0, _utilsPlatform.isPhoneGap)()) {
            popup = global.open(popupUrl, '_blank', 'location=yes');
            popup.addEventListener('loadstart', loadHandler);
            popup.addEventListener('exit', closeHandler);
          } else if ((0, _utilsPlatform.isTitanium)()) {
            tiWebView = Titanium.UI.createWebView({
              width: '100%',
              height: '100%',
              url: popupUrl
            });

            popup = Titanium.UI.createWindow({
              backgroundColor: 'white',
              barColor: '#000',
              title: 'Kinvey - OAuth',
              modal: true
            });

            popup.add(tiWebView);

            if (Titanium.Platform.name === 'iPhone OS') {
              var win = Titanium.UI.createWindow({
                backgroundColor: 'white',
                barColor: '#e3e3e3',
                title: 'Kinvey - OAuth'
              });

              win.add(tiWebView);

              tiCloseButton = Titanium.UI.createButton({
                title: 'Close',
                style: Titanium.UI.iPhone.SystemButtonStyle.DONE
              });
              win.setLeftNavButton(tiCloseButton);

              tiCloseButton.addEventListener('click', clickHandler);

              popup = Titanium.UI.iOS.createNavigationWindow({
                backgroundColor: 'white',
                window: win,
                modal: true
              });
            } else if (Titanium.Platform.name === 'Android') {
              popup.addEventListener('androidback', closePopup);
            }

            tiWebView.addEventListener('load', loadHandler);
            tiWebView.addEventListener('error', loadHandler);
            popup.addEventListener('close', closePopup);

            popup.open();
          } else {
            popup = global.open(popupUrl, '_blank', 'toolbar=no,location=no');
          }

          if (!popup) {
            closePopup();
            return reject(new _errors.KinveyError('The popup was blocked.'));
          }

          timer = setInterval(function () {
            var redirected = false;

            if (popup.closed) {
              clearTimeout(timer);
              return reject(new _errors.KinveyError('The popup was closed without authorizing the user.'));
            } else if (options.timeout && elapsed > options.timeout) {
              closePopup();
              return reject(new _errors.KinveyError('The authorization request timed out.'));
            }

            if (popup.location) {
              try {
                redirected = popup.location.href.indexOf(redirectUri) === 0;
              } catch (err) {}

              if (redirected) {
                return popupRedirected({ url: popup.location });
              }
            }

            elapsed += interval;
          }, interval);
        });
      });

      return promise;
    }
  }, {
    key: 'verifyToken',
    value: function verifyToken(token) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _lodashObjectAssign2['default'])(options, {
        flags: {
          provider: this.name,
          step: 'verifyToken'
        }
      });

      var client = _client2['default'].sharedInstance();
      var path = '/' + usersNamespace + '/' + client.appId;
      var request = new _request.Request(_enumsHttpMethod2['default'].POST, path, null, token, options);
      request.auth = _auth2['default'].app;
      var promise = request.execute();
      return promise;
    }
  }]);

  return Social;
})();

exports['default'] = Social;
module.exports = exports['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../utils/platform":282,"../auth":242,"../client":248,"../enums/httpMethod":253,"../errors":259,"../request":265,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/interop-require-default":13,"bluebird":86,"lodash/object/assign":222,"url":97}],272:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _social = require('./social');

var _social2 = _interopRequireDefault(_social);

var _errors = require('../errors');

var Twitter = (function (_Social) {
  _inherits(Twitter, _Social);

  function Twitter() {
    _classCallCheck(this, Twitter);

    _get(Object.getPrototypeOf(Twitter.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Twitter, [{
    key: 'connect',
    value: function connect(options) {
      var _this = this;

      return this.requestToken(options).then(function (token) {
        return _this.verifyToken(token, options);
      });
    }
  }, {
    key: 'requestToken',
    value: function requestToken(options) {
      return _get(Object.getPrototypeOf(Twitter.prototype), 'requestToken', this).call(this, options).then(function (token) {
        if (token.error || token.denied) {
          throw new _errors.KinveyError('Error connecting with twitter.', token);
        }

        return {
          oauth_token: token.oauth_token,
          oauth_token_secret: token.oauth_token_secret,
          oauth_verifier: token.oauth_verifier
        };
      });
    }
  }, {
    key: 'name',
    get: function get() {
      return 'twitter';
    }
  }]);

  return Twitter;
})(_social2['default']);

exports['default'] = Twitter;
module.exports = exports['default'];

},{"../errors":259,"./social":271,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13}],273:[function(require,module,exports){
var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _coreClient = require('./core/client');

var _coreClient2 = _interopRequireDefault(_coreClient);

var Kinvey = {};

Kinvey.Acl = require('./core/acl');
Kinvey.Aggregation = require('./core/aggregation');
Kinvey.Client = _coreClient2['default'];
Kinvey.Datastore = require('./core/datastores/datastore');
Kinvey.File = require('./core/models/file');
Kinvey.Group = require('./core/aggregation');
Kinvey.Metadata = require('./core/metadata');
Kinvey.Model = require('./core/models/model');
Kinvey.Query = require('./core/query');
Kinvey.User = require('./core/models/user');

Kinvey.DataPolicy = require('./core/enums/dataPolicy');
Kinvey.HttpMethod = require('./core/enums/httpMethod');
Kinvey.RackType = require('./core/enums/rackType');
Kinvey.ResponseType = require('./core/enums/responseType');
Kinvey.SocialAdapter = require('./core/enums/socialAdapter');
Kinvey.StatusCode = require('./core/enums/statusCode');
Kinvey.StoreAdapter = require('./core/enums/storeAdapter');

Kinvey.Error = require('./core/errors').KinveyError;
Kinvey.ActiveUserError = require('./core/errors').ActiveUserError;
Kinvey.NotFoundError = require('./core/errors').NotFoundError;

Kinvey.Middleware = require('./rack/middleware/middleware');
Kinvey.Middleware.Cache = require('./rack/middleware/cache');
Kinvey.Middleware.Http = require('./rack/middleware/http');
Kinvey.Middleware.Parser = require('./rack/middleware/parser');
Kinvey.Middleware.Serializer = require('./rack/middleware/serializer');

Kinvey.Rack = require('./rack/rack');

Kinvey.init = function () {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var client = _coreClient2['default'].init(options);
  return client;
};

exports['default'] = Kinvey;
module.exports = exports['default'];

},{"./core/acl":240,"./core/aggregation":241,"./core/client":248,"./core/datastores/datastore":249,"./core/enums/dataPolicy":252,"./core/enums/httpMethod":253,"./core/enums/rackType":254,"./core/enums/responseType":255,"./core/enums/socialAdapter":256,"./core/enums/statusCode":257,"./core/enums/storeAdapter":258,"./core/errors":259,"./core/metadata":260,"./core/models/file":261,"./core/models/model":262,"./core/models/user":263,"./core/query":264,"./rack/middleware/cache":274,"./rack/middleware/http":275,"./rack/middleware/middleware":276,"./rack/middleware/parser":277,"./rack/middleware/serializer":278,"./rack/rack":279,"babel-runtime/helpers/interop-require-default":13}],274:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var _coreCacheStore = require('../../core/cache/store');

var _coreCacheStore2 = _interopRequireDefault(_coreCacheStore);

var _coreEnumsHttpMethod = require('../../core/enums/httpMethod');

var _coreEnumsHttpMethod2 = _interopRequireDefault(_coreEnumsHttpMethod);

var _coreEnumsStatusCode = require('../../core/enums/statusCode');

var _coreEnumsStatusCode2 = _interopRequireDefault(_coreEnumsStatusCode);

var _coreEnumsStoreAdapter = require('../../core/enums/storeAdapter');

var _coreEnumsStoreAdapter2 = _interopRequireDefault(_coreEnumsStoreAdapter);

var CacheMiddleware = (function (_Middleware) {
  _inherits(CacheMiddleware, _Middleware);

  function CacheMiddleware() {
    _classCallCheck(this, CacheMiddleware);

    _get(Object.getPrototypeOf(CacheMiddleware.prototype), 'constructor', this).call(this, 'Kinvey Cache Middleware');
  }

  _createClass(CacheMiddleware, [{
    key: 'handle',
    value: function handle(request) {
      return _get(Object.getPrototypeOf(CacheMiddleware.prototype), 'handle', this).call(this, request).then(function (matches) {
        var method = request.method;
        var query = request.query;
        var id = matches.id;
        var store = new _coreCacheStore2['default']([_coreEnumsStoreAdapter2['default'].IndexedDB, _coreEnumsStoreAdapter2['default'].WebSQL, _coreEnumsStoreAdapter2['default'].LocalStorage], {
          name: matches.appId,
          collection: matches.collection
        });
        var promise = undefined;

        if (method === _coreEnumsHttpMethod2['default'].GET) {
          if (id) {
            promise = store.get(id);
          } else {
            promise = store.find(query);
          }
        } else if (method === _coreEnumsHttpMethod2['default'].POST || method === _coreEnumsHttpMethod2['default'].PUT) {
          promise = store.save(request.body);
        } else if (method === _coreEnumsHttpMethod2['default'].DELETE) {
          promise = store.destroy(id);
        }

        return promise.then(function (result) {
          var statusCode = _coreEnumsStatusCode2['default'].OK;

          if (method === _coreEnumsHttpMethod2['default'].POST) {
            statusCode = _coreEnumsStatusCode2['default'].Created;
          }

          request.response = {
            statusCode: statusCode,
            headers: {},
            data: result
          };

          return request;
        })['catch'](function (err) {
          request.response = {
            statusCode: _coreEnumsStatusCode2['default'].ServerError,
            headers: {},
            data: err
          };

          return request;
        });
      });
    }
  }]);

  return CacheMiddleware;
})(_middleware2['default']);

exports['default'] = CacheMiddleware;
module.exports = exports['default'];

},{"../../core/cache/store":247,"../../core/enums/httpMethod":253,"../../core/enums/statusCode":257,"../../core/enums/storeAdapter":258,"./middleware":276,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13}],275:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _coreEnumsHttpMethod = require('../../core/enums/httpMethod');

var _coreEnumsHttpMethod2 = _interopRequireDefault(_coreEnumsHttpMethod);

var _coreErrors = require('../../core/errors');

var _coreErrors2 = _interopRequireDefault(_coreErrors);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var HttpMiddleware = (function (_Middleware) {
  _inherits(HttpMiddleware, _Middleware);

  function HttpMiddleware() {
    _classCallCheck(this, HttpMiddleware);

    _get(Object.getPrototypeOf(HttpMiddleware.prototype), 'constructor', this).call(this, 'Kinvey Http Middleware');
  }

  _createClass(HttpMiddleware, [{
    key: 'handle',
    value: function handle(req) {
      return new _bluebird2['default'](function (resolve, reject) {
        var method = req.method;
        var path = req.path;
        var data = req.data;
        var httpRequest = undefined;

        switch (method) {
          case _coreEnumsHttpMethod2['default'].GET:
            httpRequest = _superagent2['default'].get(path);
            break;
          case _coreEnumsHttpMethod2['default'].POST:
            httpRequest = _superagent2['default'].post(path).send(data);
            break;
          case _coreEnumsHttpMethod2['default'].PUT:
            httpRequest = _superagent2['default'].put(path).send(data);
            break;
          case _coreEnumsHttpMethod2['default'].DELETE:
            httpRequest = _superagent2['default'].del(path);
            break;
          default:
            return rejct(new _coreErrors2['default']('Invalid Http Method. GET, POST, PUT, and DELETE are allowed.'));
        }

        httpRequest.set(req.headers);
        httpRequest.query(req.query);
        httpRequest.query(req.flags);
        httpRequest.timeout(req.timeout);

        httpRequest.end(function (err, res) {
          if (err) {
            return reject(err);
          }

          console.log(res);
          req.response = res;
          resolve(req);
        });
      });
    }
  }]);

  return HttpMiddleware;
})(_middleware2['default']);

exports['default'] = HttpMiddleware;
module.exports = exports['default'];

},{"../../core/enums/httpMethod":253,"../../core/errors":259,"./middleware":276,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13,"bluebird":86,"superagent":236}],276:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Symbol = require('babel-runtime/core-js/symbol')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _kinveyRack = require('kinvey-rack');

var _kinveyRack2 = _interopRequireDefault(_kinveyRack);

var _urlPattern = require('url-pattern');

var _urlPattern2 = _interopRequireDefault(_urlPattern);

var urlPartsSymbol = _Symbol();

var Middleware = (function (_Rack$Middleware) {
  _inherits(Middleware, _Rack$Middleware);

  _createClass(Middleware, [{
    key: 'protocol',
    get: function get() {
      return this[urlPartsSymbol].protocol;
    }
  }]);

  function Middleware() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Kinvey Middleware' : arguments[0];

    _classCallCheck(this, Middleware);

    _get(Object.getPrototypeOf(Middleware.prototype), 'constructor', this).call(this, name);
  }

  _createClass(Middleware, [{
    key: 'handle',
    value: function handle(request) {
      return new _Promise(function (resolve, reject) {
        if (request) {
          var pattern = new _urlPattern2['default']('/:namespace/:appId/:collection(/)(:id)(/)');
          var matches = pattern.match(request.path);
          return resolve(matches);
        }

        reject();
      });
    }
  }]);

  return Middleware;
})(_kinveyRack2['default'].Middleware);

exports['default'] = Middleware;
module.exports = exports['default'];

},{"babel-runtime/core-js/promise":7,"babel-runtime/core-js/symbol":8,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13,"kinvey-rack":146,"url-pattern":239}],277:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var ParserMiddleware = (function (_Middleware) {
  _inherits(ParserMiddleware, _Middleware);

  function ParserMiddleware() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Kinvey Parser Middleware' : arguments[0];

    _classCallCheck(this, ParserMiddleware);

    _get(Object.getPrototypeOf(ParserMiddleware.prototype), 'constructor', this).call(this, name);
  }

  _createClass(ParserMiddleware, [{
    key: 'handle',
    value: function handle(request) {
      var response = request.response;

      if (response && response.data) {
        var contentType = request.headers['content-type'] || request.headers['Content-Type'];

        if (contentType.indexOf('application/json') === 0) {
          try {
            response.data = JSON.parse(response.data);
          } catch (err) {
            response.data = response.data;
          }

          request.response = response;
        }
      }

      return _Promise.resolve(request);
    }
  }]);

  return ParserMiddleware;
})(_middleware2['default']);

exports['default'] = ParserMiddleware;
module.exports = exports['default'];

},{"./middleware":276,"babel-runtime/core-js/promise":7,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13}],278:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

var SerializerMiddleware = (function (_Middleware) {
  _inherits(SerializerMiddleware, _Middleware);

  function SerializerMiddleware() {
    _classCallCheck(this, SerializerMiddleware);

    _get(Object.getPrototypeOf(SerializerMiddleware.prototype), 'constructor', this).call(this, 'Kinvey Serializer Middleware');
  }

  _createClass(SerializerMiddleware, [{
    key: 'handle',
    value: function handle(request) {
      if (request && request.body) {
        var contentType = request.headers['content-type'] || request.headers['Content-Type'];

        if (contentType.indexOf('application/json') === 0) {
          request.body = JSON.stringify(request.body);
        }
      }

      return _Promise.resolve(request);
    }
  }]);

  return SerializerMiddleware;
})(_middleware2['default']);

exports['default'] = SerializerMiddleware;
module.exports = exports['default'];

},{"./middleware":276,"babel-runtime/core-js/promise":7,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13}],279:[function(require,module,exports){
var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Symbol = require('babel-runtime/core-js/symbol')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _lodashLangClone = require('lodash/lang/clone');

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

var _coreResponse = require('../core/response');

var _coreResponse2 = _interopRequireDefault(_coreResponse);

var _kinveyRack = require('kinvey-rack');

var _kinveyRack2 = _interopRequireDefault(_kinveyRack);

var _middlewareSerializer = require('./middleware/serializer');

var _middlewareSerializer2 = _interopRequireDefault(_middlewareSerializer);

var _middlewareHttp = require('./middleware/http');

var _middlewareHttp2 = _interopRequireDefault(_middlewareHttp);

var _middlewareParser = require('./middleware/parser');

var _middlewareParser2 = _interopRequireDefault(_middlewareParser);

var _middlewareCache = require('./middleware/cache');

var _middlewareCache2 = _interopRequireDefault(_middlewareCache);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var networkRackSymbol = _Symbol();
var cacheRackSymbol = _Symbol();

var Rack = (function (_KinveyRack) {
  _inherits(Rack, _KinveyRack);

  function Rack() {
    _classCallCheck(this, Rack);

    _get(Object.getPrototypeOf(Rack.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Rack, [{
    key: 'execute',
    value: function execute(request) {
      var requestClone = (0, _lodashLangClone2['default'])(result(request, 'toJSON', request), true);
      var promise = _get(Object.getPrototypeOf(Rack.prototype), 'execute', this).call(this, requestClone).then(function (request) {
        var response = request.response;

        if (response) {
          return new _coreResponse2['default'](response.statusCode, response.headers, response.data);
        }

        return response;
      });
      return _bluebird2['default'].resolve(promise);
    }
  }], [{
    key: 'networkRack',
    get: function get() {
      if (!Rack[networkRackSymbol]) {
        var rack = new Rack('Kinvey Network Rack');
        rack.use(new _middlewareSerializer2['default']());
        rack.use(new _middlewareHttp2['default']());
        rack.use(new _middlewareParser2['default']());
        Rack[networkRackSymbol] = rack;
      }

      return Rack[networkRackSymbol];
    },
    set: function set(rack) {
      Rack[networkRackSymbol] = rack;
    }
  }, {
    key: 'cacheRack',
    get: function get() {
      if (!Rack[cacheRackSymbol]) {
        var rack = new Rack('Kinvey Cache Rack');
        rack.use(new _middlewareCache2['default']());
        Rack[cacheRackSymbol] = rack;
      }

      return Rack[cacheRackSymbol];
    },
    set: function set(rack) {
      Rack[cacheRackSymbol] = rack;
    }
  }]);

  return Rack;
})(_kinveyRack2['default']);

exports['default'] = Rack;
module.exports = exports['default'];

},{"../core/response":267,"./middleware/cache":274,"./middleware/http":275,"./middleware/parser":277,"./middleware/serializer":278,"babel-runtime/core-js/symbol":8,"babel-runtime/helpers/class-call-check":9,"babel-runtime/helpers/create-class":10,"babel-runtime/helpers/get":11,"babel-runtime/helpers/inherits":12,"babel-runtime/helpers/interop-require-default":13,"bluebird":86,"kinvey-rack":146,"lodash/lang/clone":208}],280:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = isDefined;

function isDefined(obj) {
  return obj !== void 0 && obj !== null;
}

module.exports = exports["default"];

},{}],281:[function(require,module,exports){
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = nested;

function nested(document, dotProperty, value) {
  if (!dotProperty) {
    document = typeof value === 'undefined' ? document : value;
    return document;
  }

  var obj = document;
  var parts = dotProperty.split('.');

  var current = parts.shift();
  while (current && obj && obj.hasOwnProperty(current)) {
    if (parts.length === 0) {
      obj[current] = typeof value === 'undefined' ? obj[current] : value;
      return obj[current];
    }

    obj = obj[current];
    current = parts.shift();
  }

  return null;
}

module.exports = exports['default'];

},{}],282:[function(require,module,exports){
(function (global){
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.isPhoneGap = isPhoneGap;
exports.isTitanium = isTitanium;

function isPhoneGap() {
  return typeof global.cordova !== 'undefined';
}

function isTitanium() {
  return typeof Titanium !== 'undefined';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],283:[function(require,module,exports){
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.byteCount = byteCount;

function byteCount(str) {
  var count = 0;
  var stringLength = str.length;
  str = String(str || '');

  for (var i = 0; i < stringLength; i++) {
    var partCount = encodeURI(str[i]).split('%').length;
    count += partCount === 1 ? 1 : partCount - 1;
  }

  return count;
}

},{}],284:[function(require,module,exports){
var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getActiveUser = getActiveUser;
exports.setActiveUser = setActiveUser;

var _coreEnumsStoreAdapter = require('../core/enums/storeAdapter');

var _coreEnumsStoreAdapter2 = _interopRequireDefault(_coreEnumsStoreAdapter);

var _coreCacheStore = require('../core/cache/store');

var _coreCacheStore2 = _interopRequireDefault(_coreCacheStore);

var _coreClient = require('../core/client');

var _coreClient2 = _interopRequireDefault(_coreClient);

var activeUserCollection = 'activeUser';

function getActiveUser() {
  var client = _coreClient2['default'].sharedInstance();
  var store = new _coreCacheStore2['default'](_coreEnumsStoreAdapter2['default'].LocalStorage, {
    name: client.appId,
    collection: activeUserCollection
  });

  return store.find().then(function (users) {
    if (users.length === 0) {
      return null;
    }

    return users[0];
  });
}

function setActiveUser(user) {
  var client = _coreClient2['default'].sharedInstance();
  var store = new _coreCacheStore2['default'](_coreEnumsStoreAdapter2['default'].LocalStorage, {
    name: client.appId,
    collection: activeUserCollection
  });

  var promise = getActiveUser().then(function (activeUser) {
    if (activeUser) {
      return store['delete'](activeUser._id);
    }
  }).then(function () {
    if (user) {
      return store.save(user);
    }
  });

  return promise;
}

},{"../core/cache/store":247,"../core/client":248,"../core/enums/storeAdapter":258,"babel-runtime/helpers/interop-require-default":13}]},{},[273])(273)
});
//# sourceMappingURL=kinvey.js.map
