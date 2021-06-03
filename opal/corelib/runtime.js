(function(global_object) {
  "use strict";

  // @note
  //   A few conventions for the documentation of this file:
  //   1. Always use "//" (in contrast with "/**/")
  //   2. The syntax used is Yardoc (yardoc.org), which is intended for Ruby (se below)
  //   3. `@param` and `@return` types should be preceded by `JS.` when referring to
  //      JavaScript constructors (e.g. `JS.Function`) otherwise Ruby is assumed.
  //   4. `nil` and `null` being unambiguous refer to the respective
  //      objects/values in Ruby and JavaScript
  //   5. This is still WIP :) so please give feedback and suggestions on how
  //      to improve or for alternative solutions
  //
  //   The way the code is digested before going through Yardoc is a secret kept
  //   in the docs repo (https://github.com/opal/docs/tree/master).

  var console;

  // Detect the global object
  if (typeof(globalThis) !== 'undefined') { global_object = globalThis; }
  else if (typeof(global) !== 'undefined') { global_object = global; }
  else if (typeof(window) !== 'undefined') { global_object = window; }

  // Setup a dummy console object if missing
  if (typeof(global_object.console) === 'object') {
    console = global_object.console;
  } else if (global_object.console == null) {
    console = global_object.console = {};
  } else {
    console = {};
  }

  if (!('log' in console)) { console.log = function () {}; }
  if (!('warn' in console)) { console.warn = console.log; }

  if (typeof(global_object.Opal) !== 'undefined') {
    console.warn('Opal already loaded. Loading twice can cause troubles, please fix your setup.');
    return global_object.Opal;
  }

  var nil;

  // The actual class for BasicObject
  var BasicObject;

  // The actual Object class.
  // The leading underscore is to avoid confusion with window.Object()
  var _Object;

  // The actual Module class
  var Module;

  // The actual Class class
  var Class;

  // The Opal object that is exposed globally
  var Opal = global_object.Opal = {};

  // This is a useful reference to global object inside ruby files
  Opal.global = global_object;
  global_object.Opal = Opal;

  // Configure runtime behavior with regards to require and unsupported features
  Opal.config = {
    missing_require_severity: 'error',        // error, warning, ignore
    unsupported_features_severity: 'warning', // error, warning, ignore
    enable_stack_trace: true                  // true, false
  };

  //  Define properties as Symbol (#2145)
  if (typeof Symbol !== "undefined") {
    Opal.s = function(name) {
      if (typeof Opal.s[name] !== 'undefined') return Opal.s[name];
      return Opal.s[name] = Symbol(name);
    };
  }
  else {
    Opal.s = function(name) {
      if (typeof Opal.s[name] !== 'undefined') return Opal.s[name];
      return Opal.s[name] = name;
    };
  }

  Opal.s('$$alias_name');
  Opal.s('$$alias_of');
  Opal.s('$$ancestors');
  Opal.s('$$ancestors_cache_version');
  Opal.s('$$arity');
  Opal.s('$$autoload');
  Opal.s('$$base_module');
  Opal.s('$$bridge');
  Opal.s('$$cast');
  Opal.s('$$class');
  Opal.s('$$const');
  Opal.s('$$const_cache');
  Opal.s('$$constructor');
  Opal.s('$$cvars');
  Opal.s('$$def');
  Opal.s('$$define_meth');
  Opal.s('$$define_methods_on');
  Opal.s('$$dummy');
  Opal.s('$$eval');
  Opal.s('$$has_top_level_mlhs_arg');
  Opal.s('$$has_trailing_comma_in_args');
  Opal.s('$$iclass');
  Opal.s('$$iclasses');
  Opal.s('$$id');
  Opal.s('$$included');
  Opal.s('$$is_a_module');
  Opal.s('$$is_array');
  Opal.s('$$is_boolean');
  Opal.s('$$is_class');
  Opal.s('$$is_enumerator');
  Opal.s('$$is_hash');
  Opal.s('$$is_integer_class');
  Opal.s('$$is_lambda');
  Opal.s('$$is_module');
  Opal.s('$$is_number');
  Opal.s('$$is_number_class');
  Opal.s('$$is_proc');
  Opal.s('$$is_range');
  Opal.s('$$is_regexp');
  Opal.s('$$is_singleton');
  Opal.s('$$is_string');
  Opal.s('$$jsid');
  Opal.s('$$keys');
  Opal.s('$$map');
  Opal.s('$$meta');
  Opal.s('$$module');
  Opal.s('$$module_function');
  Opal.s('$$name');
  Opal.s('$$owner');
  Opal.s('$$own_included_modules');
  Opal.s('$$own_prepended_modules');
  Opal.s('$$p');
  Opal.s('$$parameters');
  Opal.s('$$prepended');
  Opal.s('$$pristine');
  Opal.s('$$prototype');
  Opal.s('$$root');
  Opal.s('$$singleton_of');
  Opal.s('$$smap');
  Opal.s('$$source_location');
  Opal.s('$$stub');
  Opal.s('$$super');

  Opal.s('$bridge');
  Opal.s('$const_missing');
  Opal.s('$inspect');
  Opal.s('$inherited');
  Opal.s('$method_added');
  Opal.s('$method_removed');
  Opal.s('$method_undefined');
  Opal.s('$singleton_method_added');
  Opal.s('$singleton_method_removed');
  Opal.s('$singleton_method_undefined');
  Opal.s('$pristine');
  Opal.s('$require');
  Opal.s('$to_a');
  Opal.s('$to_ary');
  Opal.s('$to_hash');
  Opal.s('$v');
  Opal.s('$$respond_to?');
  Opal.s('$$respond_to_missing?');

  // Minify common function calls
  var $has_own   = Object.hasOwnProperty;
  var $bind      = Function.prototype.bind;
  var $set_proto = Object.setPrototypeOf;
  var $slice     = Array.prototype.slice;
  var $splice    = Array.prototype.splice;

  // Nil object id is always 4
  var nil_id = 4;

  // Generates even sequential numbers greater than 4
  // (nil_id) to serve as unique ids for ruby objects
  var unique_id = nil_id;

  // Return next unique id
  Opal.uid = function() {
    unique_id += 2;
    return unique_id;
  };

  // Retrieve or assign the id of an object
  Opal.id = function(obj) {
    if (obj[Opal.s.$$is_number]) return (obj * 2)+1;
    if (obj[Opal.s.$$id] != null) {
      return obj[Opal.s.$$id];
    }
    $defineProperty(obj, Opal.s.$$id, Opal.uid());
    return obj[Opal.s.$$id];
  };

  // Globals table
  Opal.gvars = {};

  // Exit function, this should be replaced by platform specific implementation
  // (See nodejs and chrome for examples)
  Opal.exit = function(status) { if (Opal.gvars.DEBUG) console.log('Exited with status '+status); };

  // keeps track of exceptions for $!
  Opal.exceptions = [];

  // @private
  // Pops an exception from the stack and updates `$!`.
  Opal.pop_exception = function() {
    Opal.gvars["!"] = Opal.exceptions.pop() || nil;
  };

  // Inspect any kind of object, including non Ruby ones
  Opal.inspect = function(obj) {
    if (obj === undefined) {
      return "undefined";
    }
    else if (obj === null) {
      return "null";
    }
    else if (!obj[Opal.s.$$class]) {
      return obj.toString();
    }
    else {
      return obj[Opal.s.$inspect]();
    }
  };

  //
  // String -> Symbol transition helpers
  //

  var __trace_last_id = 0;
  var __trace_msg_count = 0;
  try {
    var __trace_show = !!(process.env.TRACE || "");
  }
  catch(e) {
    __trace_show = false;
  }

  try {
    var __trace_stop = (process.env.BREAKAT || "").split(/,\s*/);
  }
  catch(e) {
    __trace_stop = [];
  }

  function dumpStackFrame() {
    var i;
    var e = {};

    Error.captureStackTrace(e, dumpStackFrame);
    
    e = e.stack.split('\n');
    for(i = 2; i < e.length; ++i) {
      console.error(e[i]);
    }
    console.error("\n");
  }

  function trace(object, property) {
    var e = {};
    var target = "undefined";
    var msgid = (__trace_msg_count++).toString();

    if (__trace_show) {
      if (object && (target = object.__trace_id) === undefined) {
        target = (object.__trace_id = __trace_last_id++).toString();
      }

      if (property !== undefined) { 
        console.error(msgid+":" , property.toString(), "of", target);
      }
      else {
        console.error(msgid+":", "property is undefined");
        debugger;
      }
     
      dumpStackFrame();
    }

    if (__trace_stop.indexOf(msgid) >= 0) {
      debugger;
    }
  }

  // Ensure `id` is a valid identifier. That is a String not starting by "$" or
  // a Symbol starting by "$"
  function expectIdentifier(id) {
    var msg;

    if (typeof id === "string") {
      if (id.startsWith("$")) {
        msg = `${id} should be a symbol, not a string`;
        console.error(msg); dumpStackFrame(); debugger; throw new Opal.TypeError(msg);
      }
    }
    else if (typeof id === "symbol") {
      if (!id.description.startsWith("$")) {
        msg = `${id.toString()} should be a string, not a symbol`;
        console.error(msg); dumpStackFrame(); debugger; throw new Opal.TypeError(msg);
      }
    }
    else {
      msg = `${id.toString()} should be a symbol or a string`;
      console.error(msg); dumpStackFrame(); debugger; throw new Opal.TypeError(msg);
    }
  }

  function expectSymbol(id) {
    var msg;

    if (typeof id !== "symbol") {
      debugger;
      msg = `${id.toString()} should be a symbol`;
      console.error(msg); dumpStackFrame(); debugger; throw new Opal.TypeError(msg);
    }
  }

  function expectString(id) {
    var msg;

    if (typeof id !== "string") {
      debugger;
      msg = `${id.toString()} should be a string`;
      console.error(msg); dumpStackFrame(); debugger; throw new Opal.TypeError(msg);
    }
  }

  //
  // iEnd of String -> Symbol transition helpers
  //

  function $defineProperty(object, name, initialValue) {
    trace(object, name);

    if (typeof(name) === "undefined") {
      throw new Opal.TypeError("'undefined' is not a valid property name");
    }

    if (typeof(object) === "string") {
      // Special case for:
      //   s = "string"
      //   def s.m; end
      // String class is the only class that:
      // + compiles to JS primitive
      // + allows method definition directly on instances
      // numbers, true, false and null do not support it.
      object[name] = initialValue;
    } else {
      Object.defineProperty(object, name, {
        value: initialValue,
        enumerable: false,
        configurable: true,
        writable: true
      });
    }
  }

  Opal.defineProperty = $defineProperty;

  Opal.slice = $slice;


  // Helpers
  // -----

  Opal.truthy = function(val) {
    return (val !== nil && val != null && (!val[Opal.s.$$is_boolean] || val == true));
  };

  Opal.falsy = function(val) {
    return (val === nil || val == null || (val[Opal.s.$$is_boolean] && val == false))
  };

  Opal.type_error = function(object, type, method, coerced) {
    object = object[Opal.s.$$class];

    if (coerced && method) {
      coerced = coerced[Opal.s.$$class];
      return Opal.TypeError.$new(
        "can't convert " + object + " into " + type +
        " (" + object + "#" + method + " gives " + coerced + ")"
      )
    } else {
      return Opal.TypeError.$new(
        "no implicit conversion of " + object + " into " + type
      )
    }
  };

  Opal.coerce_to = function(object, type, method, args) {
    if (type['$==='](object)) return object;

    if (!object[Opal.s['$respond_to?']](method)) {
      throw Opal.type_error(object, type);
    }

    if (args == null) args = [];
    return Opal.send(object, method, args);
  }

  Opal.respond_to = function(obj, jsid, include_all) {
    expectSymbol(jsid);

    if (obj == null || !obj[Opal.s.$$class]) return false;
    include_all = !!include_all;
    var body = obj[jsid];

    if (obj[Opal.s['$respond_to?']][Opal.s.$$pristine]) {
      if (obj[Opal.s['$respond_to_missing?']][Opal.s.$$pristine]) {
        return typeof(body) === "function" && !body[Opal.s.$$stub];
      } else {
        return Opal.send(obj, obj[Opal.s['$respond_to_missing?']], [jsid.description.substr(1), include_all]);
      }
    } else {
      return Opal.send(obj, obj[Opal.s['$respond_to?']], [jsid.description.substr(1), include_all]);
    }
  }


  // Constants
  // ---------
  //
  // For future reference:
  // - The Rails autoloading guide (http://guides.rubyonrails.org/v5.0/autoloading_and_reloading_constants.html)
  // - @ConradIrwin's 2012 post on “Everything you ever wanted to know about constant lookup in Ruby” (http://cirw.in/blog/constant-lookup.html)
  //
  // Legend of MRI concepts/names:
  // - constant reference (cref): the module/class that acts as a namespace
  // - nesting: the namespaces wrapping the current scope, e.g. nesting inside
  //            `module A; module B::C; end; end` is `[B::C, A]`

  // Get the constant in the scope of the current cref
  function const_get_name(cref, name) {
    trace(cref, name);

    if (cref) return cref[Opal.s.$$const][name];
  }

  // Walk up the nesting array looking for the constant
  function const_lookup_nesting(nesting, name) {
    var i, ii, constant;

    if (nesting.length === 0) return;

    // If the nesting is not empty the constant is looked up in its elements
    // and in order. The ancestors of those elements are ignored.
    for (i = 0, ii = nesting.length; i < ii; i++) {
      constant = nesting[i][Opal.s.$$const][name];
      if (constant != null) return constant;
    }
  }

  // Walk up the ancestors chain looking for the constant
  function const_lookup_ancestors(cref, name) {
    var i, ii, ancestors;

    if (cref == null) return;

    ancestors = Opal.ancestors(cref);

    for (i = 0, ii = ancestors.length; i < ii; i++) {
      if (ancestors[i][Opal.s.$$const] && $has_own.call(ancestors[i][Opal.s.$$const], name)) {
        return ancestors[i][Opal.s.$$const][name];
      }
    }
  }

  // Walk up Object's ancestors chain looking for the constant,
  // but only if cref is missing or a module.
  function const_lookup_Object(cref, name) {
    if (cref == null || cref[Opal.s.$$is_module]) {
      return const_lookup_ancestors(_Object, name);
    }
  }

  // Call const_missing if nothing else worked
  function const_missing(cref, name, skip_missing) {
    if (!skip_missing) {
      return (cref || _Object)[Opal.s.$const_missing](name);
    }
  }

  // Look for the constant just in the current cref or call `#const_missing`
  Opal.const_get_local = function(cref, name, skip_missing) {
    var result;

    if (cref == null) return;

    if (cref === '::') cref = _Object;

    if (!cref[Opal.s.$$is_module] && !cref[Opal.s.$$is_class]) {
      throw new Opal.TypeError(cref.toString() + " is not a class/module");
    }

    result = const_get_name(cref, name);              if (result != null) return result;
    result = const_missing(cref, name, skip_missing); if (result != null) return result;
  };

  // Look for the constant relative to a cref or call `#const_missing` (when the
  // constant is prefixed by `::`).
  Opal.const_get_qualified = function(cref, name, skip_missing) {
    var result, cache, cached, current_version = Opal.const_cache_version;

    if (cref == null) return;

    if (cref === '::') cref = _Object;

    if (!cref[Opal.s.$$is_module] && !cref[Opal.s.$$is_class]) {
      throw new Opal.TypeError(cref.toString() + " is not a class/module");
    }

    if ((cache = cref[Opal.s.$$const_cache]) == null) {
      $defineProperty(cref, Opal.s.$$const_cache, Object.create(null));
      cache = cref[Opal.s.$$const_cache];
    }
    cached = cache[name];

    if (cached == null || cached[0] !== current_version) {
      ((result = const_get_name(cref, name))              != null) ||
      ((result = const_lookup_ancestors(cref, name))      != null);
      cache[name] = [current_version, result];
    } else {
      result = cached[1];
    }

    return result != null ? result : const_missing(cref, name, skip_missing);
  };

  // Initialize the top level constant cache generation counter
  Opal.const_cache_version = 1;

  // Look for the constant in the open using the current nesting and the nearest
  // cref ancestors or call `#const_missing` (when the constant has no :: prefix).
  Opal.const_get_relative = function(nesting, name, skip_missing) {
    var cref = nesting[0], result, current_version = Opal.const_cache_version, cache, cached;

    if ((cache = nesting[Opal.s.$$const_cache]) == null) {
      $defineProperty(nesting, Opal.s.$$const_cache, Object.create(null));
      cache = nesting[Opal.s.$$const_cache];
    }
    cached = cache[name];

    if (cached == null || cached[0] !== current_version) {
      ((result = const_get_name(cref, name))              != null) ||
      ((result = const_lookup_nesting(nesting, name))     != null) ||
      ((result = const_lookup_ancestors(cref, name))      != null) ||
      ((result = const_lookup_Object(cref, name))         != null);

      cache[name] = [current_version, result];
    } else {
      result = cached[1];
    }

    return result != null ? result : const_missing(cref, name, skip_missing);
  };

  // Register the constant on a cref and opportunistically set the name of
  // unnamed classes/modules.
  Opal.const_set = function(cref, name, value) {
    trace(cref, name);

    if (cref == null || cref === '::') cref = _Object;

    if (value[Opal.s.$$is_a_module]) {
      if (value[Opal.s.$$name] == null || value[Opal.s.$$name] === nil) value[Opal.s.$$name] = name;
      if (value[Opal.s.$$base_module] == null) value[Opal.s.$$base_module] = cref;
    }

    cref[Opal.s.$$const] = (cref[Opal.s.$$const] || Object.create(null));
    cref[Opal.s.$$const][name] = value;

    // Add a short helper to navigate constants manually.
    // @example
    //   Opal.$$.Regexp.$$.IGNORECASE
    cref.$$ = cref[Opal.s.$$const];

    Opal.const_cache_version++;

    // Expose top level constants onto the Opal object
    if (cref === _Object) Opal[name] = value;

    // Name new class directly onto current scope (Opal.Foo.Baz = klass)
    $defineProperty(cref, name, value);

    return value;
  };

  // Get all the constants reachable from a given cref, by default will include
  // inherited constants.
  Opal.constants = function(cref, inherit) {
    if (inherit == null) inherit = true;

    var module, modules = [cref], i, ii, constants = {}, constant;

    if (inherit) modules = modules.concat(Opal.ancestors(cref));
    if (inherit && cref[Opal.s.$$is_module]) modules = modules.concat([Opal.Object]).concat(Opal.ancestors(Opal.Object));

    for (i = 0, ii = modules.length; i < ii; i++) {
      module = modules[i];

      // Do not show Objects constants unless we're querying Object itself
      if (cref !== _Object && module == _Object) break;

      for (constant in module[Opal.s.$$const]) {
        constants[constant] = true;
      }
    }

    return Object.keys(constants);
  };

  // Remove a constant from a cref.
  Opal.const_remove = function(cref, name) {
    trace(cref, name);

    Opal.const_cache_version++;

    if (cref[Opal.s.$$const][name] != null) {
      var old = cref[Opal.s.$$const][name];
      delete cref[Opal.s.$$const][name];
      return old;
    }

    if (cref[Opal.s.$$autoload] != null && cref[Opal.s.$$autoload][name] != null) {
      delete cref[Opal.s.$$autoload][name];
      return nil;
    }

    throw Opal.NameError.$new("constant "+cref+"::"+cref[Opal.s.$name]()+" not defined");
  };

  // Setup some shortcuts to reduce compiled size
  Opal.$$ = Opal.const_get_relative;
  Opal.$$$ = Opal.const_get_qualified;


  // Modules & Classes
  // -----------------

  // A `class Foo; end` expression in ruby is compiled to call this runtime
  // method which either returns an existing class of the given name, or creates
  // a new class in the given `base` scope.
  //
  // If a constant with the given name exists, then we check to make sure that
  // it is a class and also that the superclasses match. If either of these
  // fail, then we raise a `TypeError`. Note, `superclass` may be null if one
  // was not specified in the ruby code.
  //
  // We pass a constructor to this method of the form `function ClassName() {}`
  // simply so that classes show up with nicely formatted names inside debuggers
  // in the web browser (or node/sprockets).
  //
  // The `scope` is the current `self` value where the class is being created
  // from. We use this to get the scope for where the class should be created.
  // If `scope` is an object (not a class/module), we simple get its class and
  // use that as the scope instead.
  //
  // @param scope        [Object] where the class is being created
  // @param superclass  [Class,null] superclass of the new class (may be null)
  // @param id          [String] the name of the class to be created
  // @param constructor [JS.Function] function to use as constructor
  //
  // @return new [Class]  or existing ruby class
  //
  Opal.allocate_class = function(name, superclass) {
    var klass, constructor;

    if (superclass != null && superclass[Opal.s.$$bridge]) {
      // Inheritance from bridged classes requires
      // calling original JS constructors
      constructor = function() {
        var args = $slice.call(arguments),
            self = new ($bind.apply(superclass[Opal.s.$$constructor], [null].concat(args)))();

        // and replacing a __proto__ manually
        $set_proto(self, klass[Opal.s.$$prototype]);
        return self;
      }
    } else {
      constructor = function(){};
    }

    if (name) {
      $defineProperty(constructor, 'displayName', '::'+name);
    }

    klass = constructor;

    $defineProperty(klass, Opal.s.$$name, name);
    $defineProperty(klass, Opal.s.$$constructor, constructor);
    $defineProperty(klass, Opal.s.$$prototype, constructor.prototype);
    $defineProperty(klass, Opal.s.$$const, {});
    $defineProperty(klass, Opal.s.$$is_class, true);
    $defineProperty(klass, Opal.s.$$is_a_module, true);
    $defineProperty(klass, Opal.s.$$super, superclass);
    $defineProperty(klass, Opal.s.$$cvars, {});
    $defineProperty(klass, Opal.s.$$own_included_modules, []);
    $defineProperty(klass, Opal.s.$$own_prepended_modules, []);
    $defineProperty(klass, Opal.s.$$ancestors, []);
    $defineProperty(klass, Opal.s.$$ancestors_cache_version, null);

    $defineProperty(klass[Opal.s.$$prototype], Opal.s.$$class, klass);

    // By default if there are no singleton class methods
    // __proto__ is Class.prototype
    // Later singleton methods generate a singleton_class
    // and inject it into ancestors chain
    if (Opal.Class) {
      $set_proto(klass, Opal.Class.prototype);
    }

    if (superclass != null) {
      $set_proto(klass[Opal.s.$$prototype], superclass[Opal.s.$$prototype]);

      if (superclass[Opal.s.$$meta]) {
        // If superclass has metaclass then we have explicitely inherit it.
        Opal.build_class_singleton_class(klass);
      }
    }

    return klass;
  };


  function find_existing_class(scope, name) {
    // Try to find the class in the current scope
    var klass = const_get_name(scope, name);

    // If the class exists in the scope, then we must use that
    if (klass) {
      // Make sure the existing constant is a class, or raise error
      if (!klass[Opal.s.$$is_class]) {
        throw Opal.TypeError.$new(name + " is not a class");
      }

      return klass;
    }
  }

  function ensureSuperclassMatch(klass, superclass) {
    if (klass[Opal.s.$$super] !== superclass) {
      throw Opal.TypeError.$new("superclass mismatch for class " + klass[Opal.s.$$name]);
    }
  }

  Opal.klass = function(scope, superclass, name) {
    var bridged;

    if (scope == null) {
      // Global scope
      scope = _Object;
    } else if (!scope[Opal.s.$$is_class] && !scope[Opal.s.$$is_module]) {
      // Scope is an object, use its class
      scope = scope[Opal.s.$$class];
    }

    // If the superclass is not an Opal-generated class then we're bridging a native JS class
    if (superclass != null && !superclass.hasOwnProperty(Opal.s.$$is_class)) {
      bridged = superclass;
      superclass = _Object;
    }

    var klass = find_existing_class(scope, name);

    if (klass) {
      if (superclass) {
        // Make sure existing class has same superclass
        ensureSuperclassMatch(klass, superclass);
      }
      return klass;
    }

    // Class doesn't exist, create a new one with given superclass...

    // Not specifying a superclass means we can assume it to be Object
    if (superclass == null) {
      superclass = _Object;
    }

    // Create the class object (instance of Class)
    klass = Opal.allocate_class(name, superclass);
    Opal.const_set(scope, name, klass);

    // Call .inherited() hook with new class on the superclass
    if (superclass[Opal.s.$inherited]) {
      superclass[Opal.s.$inherited](klass);
    }

    if (bridged) {
      Opal.bridge(bridged, klass);
    }

    return klass;
  };

  // Define new module (or return existing module). The given `scope` is basically
  // the current `self` value the `module` statement was defined in. If this is
  // a ruby module or class, then it is used, otherwise if the scope is a ruby
  // object then that objects real ruby class is used (e.g. if the scope is the
  // main object, then the top level `Object` class is used as the scope).
  //
  // If a module of the given name is already defined in the scope, then that
  // instance is just returned.
  //
  // If there is a class of the given name in the scope, then an error is
  // generated instead (cannot have a class and module of same name in same scope).
  //
  // Otherwise, a new module is created in the scope with the given name, and that
  // new instance is returned back (to be referenced at runtime).
  //
  // @param  scope [Module, Class] class or module this definition is inside
  // @param  id   [String] the name of the new (or existing) module
  //
  // @return [Module]
  Opal.allocate_module = function(name) {
    var constructor = function(){};
    if (name) {
      $defineProperty(constructor, 'displayName', name+'[$$constructor_s]');
    }

    var module = constructor;

    if (name)
      $defineProperty(constructor, 'displayName', name+'.constructor');

    $defineProperty(module, Opal.s.$$name, name);
    $defineProperty(module, Opal.s.$$prototype, constructor.prototype);
    $defineProperty(module, Opal.s.$$const, {});
    $defineProperty(module, Opal.s.$$is_module, true);
    $defineProperty(module, Opal.s.$$is_a_module, true);
    $defineProperty(module, Opal.s.$$cvars, {});
    $defineProperty(module, Opal.s.$$iclasses, []);
    $defineProperty(module, Opal.s.$$own_included_modules, []);
    $defineProperty(module, Opal.s.$$own_prepended_modules, []);
    $defineProperty(module, Opal.s.$$ancestors, [module]);
    $defineProperty(module, Opal.s.$$ancestors_cache_version, null);

    $set_proto(module, Opal.Module.prototype);

    return module;
  };

  function find_existing_module(scope, name) {
    var module = const_get_name(scope, name);
    if (module == null && scope === _Object) module = const_lookup_ancestors(_Object, name);

    if (module) {
      if (!module[Opal.s.$$is_module] && module !== _Object) {
        throw Opal.TypeError.$new(name + " is not a module");
      }
    }

    return module;
  }

  Opal.module = function(scope, name) {
    var module;

    if (scope == null) {
      // Global scope
      scope = _Object;
    } else if (!scope[Opal.s.$$is_class] && !scope[Opal.s.$$is_module]) {
      // Scope is an object, use its class
      scope = scope[Opal.s.$$class];
    }

    module = find_existing_module(scope, name);

    if (module) {
      return module;
    }

    // Module doesnt exist, create a new one...
    module = Opal.allocate_module(name);
    Opal.const_set(scope, name, module);

    return module;
  };

  // Return the singleton class for the passed object.
  //
  // If the given object alredy has a singleton class, then it will be stored on
  // the object as the `$$meta` property. If this exists, then it is simply
  // returned back.
  //
  // Otherwise, a new singleton object for the class or object is created, set on
  // the object at `$$meta` for future use, and then returned.
  //
  // @param object [Object] the ruby object
  // @return [Class] the singleton class for object
  Opal.get_singleton_class = function(object) {
    if (object[Opal.s.$$meta]) {
      return object[Opal.s.$$meta];
    }

    if (object.hasOwnProperty(Opal.s.$$is_class)) {
      return Opal.build_class_singleton_class(object);
    } else if (object.hasOwnProperty(Opal.s.$$is_module)) {
      return Opal.build_module_singleton_class(object);
    } else {
      return Opal.build_object_singleton_class(object);
    }
  };

  // Build the singleton class for an existing class. Class object are built
  // with their singleton class already in the prototype chain and inheriting
  // from their superclass object (up to `Class` itself).
  //
  // NOTE: Actually in MRI a class' singleton class inherits from its
  // superclass' singleton class which in turn inherits from Class.
  //
  // @param klass [Class]
  // @return [Class]
  Opal.build_class_singleton_class = function(klass) {
    var superclass, meta;

    if (klass[Opal.s.$$meta]) {
      return klass[Opal.s.$$meta];
    }

    // The singleton_class superclass is the singleton_class of its superclass;
    // but BasicObject has no superclass (its `$$super` is null), thus we
    // fallback on `Class`.
    superclass = klass === BasicObject ? Class : Opal.get_singleton_class(klass[Opal.s.$$super]);

    meta = Opal.allocate_class(null, superclass, function(){});

    $defineProperty(meta, Opal.s.$$is_singleton, true);
    $defineProperty(meta, Opal.s.$$singleton_of, klass);
    $defineProperty(klass, Opal.s.$$meta, meta);
    $set_proto(klass, meta[Opal.s.$$prototype]);
    // Restoring ClassName.class
    $defineProperty(klass, Opal.s.$$class, Opal.Class);

    return meta;
  };

  Opal.build_module_singleton_class = function(mod) {
    if (mod[Opal.s.$$meta]) {
      return mod[Opal.s.$$meta];
    }

    var meta = Opal.allocate_class(null, Opal.Module, function(){});

    $defineProperty(meta, Opal.s.$$is_singleton, true);
    $defineProperty(meta, Opal.s.$$singleton_of, mod);
    $defineProperty(mod, Opal.s.$$meta, meta);
    $set_proto(mod, meta[Opal.s.$$prototype]);
    // Restoring ModuleName.class
    $defineProperty(mod, Opal.s.$$class, Opal.Module);

    return meta;
  };

  // Build the singleton class for a Ruby (non class) Object.
  //
  // @param object [Object]
  // @return [Class]
  Opal.build_object_singleton_class = function(object) {
    var superclass = object[Opal.s.$$class],
        klass = Opal.allocate_class(nil, superclass, function(){});

    $defineProperty(klass, Opal.s.$$is_singleton, true);
    $defineProperty(klass, Opal.s.$$singleton_of, object);

    delete klass[Opal.s.$$prototype][Opal.s.$$class];

    $defineProperty(object, Opal.s.$$meta, klass);

    $set_proto(object, object[Opal.s.$$meta][Opal.s.$$prototype]);

    return klass;
  };

  Opal.is_method = function(prop) {
    expectSymbol(prop);

    return (prop[0] === '$' && prop[1] !== '$');
  };

  Opal.instance_methods = function(mod) {
    var exclude = [], results = [], ancestors = Opal.ancestors(mod);

    for (var i = 0, l = ancestors.length; i < l; i++) {
      var ancestor = ancestors[i],
          proto = ancestor[Opal.s.$$prototype];

      if (proto.hasOwnProperty(Opal.s.$$dummy)) {
        proto = proto[Opal.s.$$define_methods_on];
      }

      var props = Object.getOwnPropertyNames(proto);

      for (var j = 0, ll = props.length; j < ll; j++) {
        var prop = props[j];

        if (Opal.is_method(prop)) {
          var method_name = prop.slice(1),
              method = proto[prop];

          if (method[Opal.s.$$stub] && exclude.indexOf(method_name) === -1) {
            exclude.push(method_name);
          }

          if (!method[Opal.s.$$stub] && results.indexOf(method_name) === -1 && exclude.indexOf(method_name) === -1) {
            results.push(method_name);
          }
        }
      }
    }

    return results;
  };

  Opal.own_instance_methods = function(mod) {
    var results = [],
        proto = mod[Opal.s.$$prototype];

    if (proto.hasOwnProperty(Opal.s.$$dummy)) {
      proto = proto[Opal.s.$$define_methods_on];
    }

    var props = Object.getOwnPropertyNames(proto);

    for (var i = 0, length = props.length; i < length; i++) {
      var prop = props[i];

      if (Opal.is_method(prop)) {
        var method = proto[prop];

        if (!method[Opal.s.$$stub]) {
          var method_name = prop.slice(1);
          results.push(method_name);
        }
      }
    }

    return results;
  };

  Opal.methods = function(obj) {
    return Opal.instance_methods(Opal.get_singleton_class(obj));
  };

  Opal.own_methods = function(obj) {
    return Opal.own_instance_methods(Opal.get_singleton_class(obj));
  };

  Opal.receiver_methods = function(obj) {
    var mod = Opal.get_singleton_class(obj);
    var singleton_methods = Opal.own_instance_methods(mod);
    var instance_methods = Opal.own_instance_methods(mod[Opal.s.$$super]);
    return singleton_methods.concat(instance_methods);
  };

  // Returns an object containing all pairs of names/values
  // for all class variables defined in provided +module+
  // and its ancestors.
  //
  // @param module [Module]
  // @return [Object]
  Opal.class_variables = function(module) {
    var ancestors = Opal.ancestors(module),
        i, length = ancestors.length,
        result = {};

    for (i = length - 1; i >= 0; i--) {
      var ancestor = ancestors[i];

      for (var cvar in ancestor[Opal.s.$$cvars]) {
        result[cvar] = ancestor[Opal.s.$$cvars][cvar];
      }
    }

    return result;
  };

  // Sets class variable with specified +name+ to +value+
  // in provided +module+
  //
  // @param module [Module]
  // @param name [String]
  // @param value [Object]
  Opal.class_variable_set = function(module, name, value) {
    var ancestors = Opal.ancestors(module),
        i, length = ancestors.length;

    for (i = length - 2; i >= 0; i--) {
      var ancestor = ancestors[i];

      if ($has_own.call(ancestor[Opal.s.$$cvars], name)) {
        ancestor[Opal.s.$$cvars][name] = value;
        return value;
      }
    }

    module[Opal.s.$$cvars][name] = value;

    return value;
  };

  function isRoot(proto) {
    return proto.hasOwnProperty(Opal.s.$$iclass) && proto.hasOwnProperty(Opal.s.$$root);
  }

  function own_included_modules(module) {
    var result = [], mod, proto = Object.getPrototypeOf(module[Opal.s.$$prototype]);

    while (proto) {
      if (proto.hasOwnProperty(Opal.s.$$class)) {
        // superclass
        break;
      }
      mod = protoToModule(proto);
      if (mod) {
        result.push(mod);
      }
      proto = Object.getPrototypeOf(proto);
    }

    return result;
  }

  function own_prepended_modules(module) {
    var result = [], mod, proto = Object.getPrototypeOf(module[Opal.s.$$prototype]);

    if (module[Opal.s.$$prototype].hasOwnProperty(Opal.s.$$dummy)) {
      while (proto) {
        if (proto === module[Opal.s.$$prototype][Opal.s.$$define_methods_on]) {
          break;
        }

        mod = protoToModule(proto);
        if (mod) {
          result.push(mod);
        }

        proto = Object.getPrototypeOf(proto);
      }
    }

    return result;
  }


  // The actual inclusion of a module into a class.
  //
  // ## Class `$$parent` and `iclass`
  //
  // To handle `super` calls, every class has a `$$parent`. This parent is
  // used to resolve the next class for a super call. A normal class would
  // have this point to its superclass. However, if a class includes a module
  // then this would need to take into account the module. The module would
  // also have to then point its `$$parent` to the actual superclass. We
  // cannot modify modules like this, because it might be included in more
  // then one class. To fix this, we actually insert an `iclass` as the class'
  // `$$parent` which can then point to the superclass. The `iclass` acts as
  // a proxy to the actual module, so the `super` chain can then search it for
  // the required method.
  //
  // @param module [Module] the module to include
  // @param includer [Module] the target class to include module into
  // @return [null]
  Opal.append_features = function(module, includer) {
    var module_ancestors = Opal.ancestors(module);
    var iclasses = [];

    if (module_ancestors.indexOf(includer) !== -1) {
      throw Opal.ArgumentError.$new('cyclic include detected');
    }

    for (var i = 0, length = module_ancestors.length; i < length; i++) {
      var ancestor = module_ancestors[i], iclass = create_iclass(ancestor);
      $defineProperty(iclass, Opal.s.$$included, true);
      iclasses.push(iclass);
    }
    var includer_ancestors = Opal.ancestors(includer),
        chain = chain_iclasses(iclasses),
        start_chain_after,
        end_chain_on;

    if (includer_ancestors.indexOf(module) === -1) {
      // first time include

      // includer -> chain.first -> ...chain... -> chain.last -> includer.parent
      start_chain_after = includer[Opal.s.$$prototype];
      end_chain_on = Object.getPrototypeOf(includer[Opal.s.$$prototype]);
    } else {
      // The module has been already included,
      // we don't need to put it into the ancestors chain again,
      // but this module may have new included modules.
      // If it's true we need to copy them.
      //
      // The simplest way is to replace ancestors chain from
      //          parent
      //            |
      //   `module` iclass (has a $$root flag)
      //            |
      //   ...previos chain of module.included_modules ...
      //            |
      //  "next ancestor" (has a $$root flag or is a real class)
      //
      // to
      //          parent
      //            |
      //    `module` iclass (has a $$root flag)
      //            |
      //   ...regenerated chain of module.included_modules
      //            |
      //   "next ancestor" (has a $$root flag or is a real class)
      //
      // because there are no intermediate classes between `parent` and `next ancestor`.
      // It doesn't break any prototypes of other objects as we don't change class references.

      var proto = includer[Opal.s.$$prototype], parent = proto, module_iclass = Object.getPrototypeOf(parent);

      while (module_iclass != null) {
        if (isRoot(module_iclass) && module_iclass[Opal.s.$$module] === module) {
          break;
        }

        parent = module_iclass;
        module_iclass = Object.getPrototypeOf(module_iclass);
      }

      var next_ancestor = Object.getPrototypeOf(module_iclass);

      // skip non-root iclasses (that were recursively included)
      while (next_ancestor.hasOwnProperty(Opal.s.$$iclass) && !isRoot(next_ancestor)) {
        next_ancestor = Object.getPrototypeOf(next_ancestor);
      }

      start_chain_after = parent;
      end_chain_on = next_ancestor;
    }

    $set_proto(start_chain_after, chain.first);
    $set_proto(chain.last, end_chain_on);

    // recalculate own_included_modules cache
    includer[Opal.s.$$own_included_modules] = own_included_modules(includer);

    Opal.const_cache_version++;
  };

  Opal.prepend_features = function(module, prepender) {
    // Here we change the ancestors chain from
    //
    //   prepender
    //      |
    //    parent
    //
    // to:
    //
    // dummy(prepender)
    //      |
    //  iclass(module)
    //      |
    // iclass(prepender)
    //      |
    //    parent
    var module_ancestors = Opal.ancestors(module);
    var iclasses = [];

    if (module_ancestors.indexOf(prepender) !== -1) {
      throw Opal.ArgumentError.$new('cyclic prepend detected');
    }

    for (var i = 0, length = module_ancestors.length; i < length; i++) {
      var ancestor = module_ancestors[i], iclass = create_iclass(ancestor);
      $defineProperty(iclass, Opal.s.$$prepended, true);
      iclasses.push(iclass);
    }

    var chain = chain_iclasses(iclasses),
        dummy_prepender = prepender[Opal.s.$$prototype],
        previous_parent = Object.getPrototypeOf(dummy_prepender),
        prepender_iclass,
        start_chain_after,
        end_chain_on;

    if (dummy_prepender.hasOwnProperty(Opal.s.$$dummy)) {
      // The module already has some prepended modules
      // which means that we don't need to make it "dummy"
      prepender_iclass = dummy_prepender[Opal.s.$$define_methods_on];
    } else {
      // Making the module "dummy"
      prepender_iclass = create_dummy_iclass(prepender);
      flush_methods_in(prepender);
      $defineProperty(dummy_prepender, Opal.s.$$dummy, true);
      $defineProperty(dummy_prepender, Opal.s.$$define_methods_on, prepender_iclass);

      // Converting
      //   dummy(prepender) -> previous_parent
      // to
      //   dummy(prepender) -> iclass(prepender) -> previous_parent
      $set_proto(dummy_prepender, prepender_iclass);
      $set_proto(prepender_iclass, previous_parent);
    }

    var prepender_ancestors = Opal.ancestors(prepender);

    if (prepender_ancestors.indexOf(module) === -1) {
      // first time prepend

      start_chain_after = dummy_prepender;

      // next $$root or prepender_iclass or non-$$iclass
      end_chain_on = Object.getPrototypeOf(dummy_prepender);
      while (end_chain_on != null) {
        if (
          end_chain_on.hasOwnProperty(Opal.s.$$root) ||
          end_chain_on === prepender_iclass ||
          !end_chain_on.hasOwnProperty(Opal.s.$$iclass)
        ) {
          break;
        }

        end_chain_on = Object.getPrototypeOf(end_chain_on);
      }
    } else {
      throw Opal.RuntimeError.$new("Prepending a module multiple times is not supported");
    }

    $set_proto(start_chain_after, chain.first);
    $set_proto(chain.last, end_chain_on);

    // recalculate own_prepended_modules cache
    prepender[Opal.s.$$own_prepended_modules] = own_prepended_modules(prepender);

    Opal.const_cache_version++;
  };

  function flush_methods_in(module) {
    var proto = module[Opal.s.$$prototype],
        props = Object.getOwnPropertyNames(proto);

    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      if (Opal.is_method(prop)) {
        delete proto[prop];
      }
    }
  }

  function create_iclass(module) {
    var iclass = create_dummy_iclass(module);

    if (module[Opal.s.$$is_module]) {
      module[Opal.s.$$iclasses].push(iclass);
    }

    return iclass;
  }

  // Dummy iclass doesn't receive updates when the module gets a new method.
  function create_dummy_iclass(module) {
    var iclass = {},
        proto = module[Opal.s.$$prototype];

    if (proto.hasOwnProperty(Opal.s.$$dummy)) {
      proto = proto[Opal.s.$$define_methods_on];
    }

    var props = Object.getOwnPropertyNames(proto),
        length = props.length, i;

    for (i = 0; i < length; i++) {
      var prop = props[i];
      $defineProperty(iclass, prop, proto[prop]);
    }

    $defineProperty(iclass, Opal.s.$$iclass, true);
    $defineProperty(iclass, Opal.s.$$module, module);

    return iclass;
  }

  function chain_iclasses(iclasses) {
    var length = iclasses.length, first = iclasses[0];

    $defineProperty(first, Opal.s.$$root, true);

    if (length === 1) {
      return { first: first, last: first };
    }

    var previous = first;

    for (var i = 1; i < length; i++) {
      var current = iclasses[i];
      $set_proto(previous, current);
      previous = current;
    }


    return { first: iclasses[0], last: iclasses[length - 1] };
  }

  // For performance, some core Ruby classes are toll-free bridged to their
  // native JavaScript counterparts (e.g. a Ruby Array is a JavaScript Array).
  //
  // This method is used to setup a native constructor (e.g. Array), to have
  // its prototype act like a normal Ruby class. Firstly, a new Ruby class is
  // created using the native constructor so that its prototype is set as the
  // target for the new class. Note: all bridged classes are set to inherit
  // from Object.
  //
  // Example:
  //
  //    Opal.bridge(self, Function);
  //
  // @param klass       [Class] the Ruby class to bridge
  // @param constructor [JS.Function] native JavaScript constructor to use
  // @return [Class] returns the passed Ruby class
  //
  Opal.bridge = function(native_klass, klass) {
    if (native_klass.hasOwnProperty(Opal.s.$$bridge)) {
      throw Opal.ArgumentError.$new("already bridged");
    }

    // constructor is a JS function with a prototype chain like:
    // - constructor
    //   - super
    //
    // What we need to do is to inject our class (with its prototype chain)
    // between constructor and super. For example, after injecting ::Object
    // into JS String we get:
    //
    // - constructor (window.String)
    //   - Opal.Object
    //     - Opal.Kernel
    //       - Opal.BasicObject
    //         - super (window.Object)
    //           - null
    //
    $defineProperty(native_klass, Opal.s.$$bridge, klass);
    $set_proto(native_klass.prototype, (klass[Opal.s.$$super] || Opal.Object)[Opal.s.$$prototype]);
    $defineProperty(klass, Opal.s.$$prototype, native_klass.prototype);

    $defineProperty(klass[Opal.s.$$prototype], Opal.s.$$class, klass);
    $defineProperty(klass, Opal.s.$$constructor, native_klass);
    $defineProperty(klass, Opal.s.$$bridge, true);
  };

  function protoToModule(proto) {
    if (proto.hasOwnProperty(Opal.s.$$dummy)) {
      return;
    } else if (proto.hasOwnProperty(Opal.s.$$iclass)) {
      return proto[Opal.s.$$module];
    } else if (proto.hasOwnProperty(Opal.s.$$class)) {
      return proto[Opal.s.$$class];
    }
  }

  function own_ancestors(module) {
    return module[Opal.s.$$own_prepended_modules].concat([module]).concat(module[Opal.s.$$own_included_modules]);
  }

  // The Array of ancestors for a given module/class
  Opal.ancestors = function(module) {
    if (!module) { return []; }

    if (module[Opal.s.$$ancestors_cache_version] === Opal.const_cache_version) {
      return module[Opal.s.$$ancestors];
    }

    var result = [], i, mods, length;

    for (i = 0, mods = own_ancestors(module), length = mods.length; i < length; i++) {
      result.push(mods[i]);
    }

    if (module[Opal.s.$$super]) {
      for (i = 0, mods = Opal.ancestors(module[Opal.s.$$super]), length = mods.length; i < length; i++) {
        result.push(mods[i]);
      }
    }

    module[Opal.s.$$ancestors_cache_version] = Opal.const_cache_version;
    module[Opal.s.$$ancestors] = result;

    return result;
  };

  Opal.included_modules = function(module) {
    var result = [], mod = null, proto = Object.getPrototypeOf(module[Opal.s.$$prototype]);

    for (; proto && Object.getPrototypeOf(proto); proto = Object.getPrototypeOf(proto)) {
      mod = protoToModule(proto);
      if (mod && mod[Opal.s.$$is_module] && proto[Opal.s.$$iclass] && proto[Opal.s.$$included]) {
        result.push(mod);
      }
    }

    return result;
  };


  // Method Missing
  // --------------

  // Methods stubs are used to facilitate method_missing in opal. A stub is a
  // placeholder function which just calls `method_missing` on the receiver.
  // If no method with the given name is actually defined on an object, then it
  // is obvious to say that the stub will be called instead, and then in turn
  // method_missing will be called.
  //
  // When a file in ruby gets compiled to javascript, it includes a call to
  // this function which adds stubs for every method name in the compiled file.
  // It should then be safe to assume that method_missing will work for any
  // method call detected.
  //
  // Method stubs are added to the BasicObject prototype, which every other
  // ruby object inherits, so all objects should handle method missing. A stub
  // is only added if the given property name (method name) is not already
  // defined.
  //
  // Note: all ruby methods have a `$` prefix in javascript, so all stubs will
  // have this prefix as well (to make this method more performant).
  //
  //    Opal.add_stubs(["$foo", "$bar", "$baz="]);
  //
  // All stub functions will have a private `$$stub` property set to true so
  // that other internal methods can detect if a method is just a stub or not.
  // `Kernel#respond_to?` uses this property to detect a methods presence.
  //
  // @param stubs [Array] an array of method stubs to add
  // @return [undefined]
  Opal.add_stubs = function(stubs) {
    var proto = Opal.BasicObject[Opal.s.$$prototype];

    for (var i = 0, length = stubs.length; i < length; i++) {
      var stub = stubs[i], existing_method = proto[stub];

      if (existing_method == null || existing_method[Opal.s.$$stub]) {
        Opal.add_stub_for(proto, stub);
      }
    }
  };

  // Add a method_missing stub function to the given prototype for the
  // given name.
  //
  // @param prototype [Prototype] the target prototype
  // @param stub [String] stub name to add (e.g. "$foo")
  // @return [undefined]
  Opal.add_stub_for = function(prototype, stub) {
    expectSymbol(stub);

    var method_missing_stub = Opal.stub_for(stub.description);
    $defineProperty(prototype, stub, method_missing_stub);
  };

  // Generate the method_missing stub for a given method name.
  //
  // @param method_name [String] The js-name of the method to stub (e.g. "$foo")
  // @return [undefined]
  Opal.stub_for = function(method_name) {

    function method_missing_stub() {
      /* jshint validthis: true */
      // console.error("missing stub", method_name);

      // Copy any given block onto the method_missing dispatcher
      this[Opal.s.$method_missing][Opal.s.$$p] = method_missing_stub[Opal.s.$$p];

      // Set block property to null ready for the next call (stop false-positives)
      method_missing_stub[Opal.s.$$p] = null;

      // call method missing with correct args (remove '$' prefix on method name)
      var args_ary = new Array(arguments.length);
      for(var i = 0, l = args_ary.length; i < l; i++) { args_ary[i] = arguments[i]; }

      return this[Opal.s.$method_missing].apply(this, [method_name.slice(1)].concat(args_ary));
    }

    method_missing_stub[Opal.s.$$stub] = true;

    return method_missing_stub;
  };


  // Methods
  // -------

  // Arity count error dispatcher for methods
  //
  // @param actual [Fixnum] number of arguments given to method
  // @param expected [Fixnum] expected number of arguments
  // @param object [Object] owner of the method +meth+
  // @param meth [String] method name that got wrong number of arguments
  // @raise [ArgumentError]
  Opal.ac = function(actual, expected, object, meth) {
    var inspect = '';
    if (object[Opal.s.$$is_a_module]) {
      inspect += object[Opal.s.$$name] + '.';
    }
    else {
      inspect += object[Opal.s.$$class][Opal.s.$$name] + '#';
    }
    inspect += meth;

    throw Opal.ArgumentError.$new('[' + inspect + '] wrong number of arguments(' + actual + ' for ' + expected + ')');
  };

  // Arity count error dispatcher for blocks
  //
  // @param actual [Fixnum] number of arguments given to block
  // @param expected [Fixnum] expected number of arguments
  // @param context [Object] context of the block definition
  // @raise [ArgumentError]
  Opal.block_ac = function(actual, expected, context) {
    var inspect = "`block in " + context + "'";

    throw Opal.ArgumentError.$new(inspect + ': wrong number of arguments (' + actual + ' for ' + expected + ')');
  };

  // Super dispatcher
  Opal.find_super_dispatcher = function(obj, mid, current_func, defcheck, allow_stubs) {
    expectString(mid);

    var jsid = '$' + mid, ancestors, super_method;

    if (obj.hasOwnProperty(Opal.s.$$meta)) {
      ancestors = Opal.ancestors(obj[Opal.s.$$meta]);
    } else {
      ancestors = Opal.ancestors(obj[Opal.s.$$class]);
    }

    var current_index = ancestors.indexOf(current_func[Opal.s.$$owner]);

    for (var i = current_index + 1; i < ancestors.length; i++) {
      var ancestor = ancestors[i],
          proto = ancestor[Opal.s.$$prototype];

      if (proto.hasOwnProperty(Opal.s.$$dummy)) {
        proto = proto[Opal.s.$$define_methods_on];
      }

      if (proto.hasOwnProperty(jsid)) {
        super_method = proto[jsid];
        break;
      }
    }

    if (!defcheck && super_method && super_method[Opal.s.$$stub] && obj[Opal.s.$method_missing][Opal.s.$$pristine]) {
      // method_missing hasn't been explicitly defined
      throw Opal.NoMethodError.$new('super: no superclass method `'+mid+"' for "+obj, mid);
    }

    return (super_method[Opal.s.$$stub] && !allow_stubs) ? null : super_method;
  };

  // Iter dispatcher for super in a block
  Opal.find_iter_super_dispatcher = function(obj, jsid, current_func, defcheck, implicit) {
    var call_jsid = jsid;

    if (!current_func) {
      throw Opal.RuntimeError.$new("super called outside of method");
    }

    if (implicit && current_func[Opal.s.$$define_meth]) {
      throw Opal.RuntimeError.$new("implicit argument passing of super from method defined by define_method() is not supported. Specify all arguments explicitly");
    }

    if (current_func[Opal.s.$$def]) {
      call_jsid = current_func[Opal.s.$$jsid];
    }

    return Opal.find_super_dispatcher(obj, call_jsid, current_func, defcheck);
  };

  // Used to return as an expression. Sometimes, we can't simply return from
  // a javascript function as if we were a method, as the return is used as
  // an expression, or even inside a block which must "return" to the outer
  // method. This helper simply throws an error which is then caught by the
  // method. This approach is expensive, so it is only used when absolutely
  // needed.
  //
  Opal.ret = function(val) {
    Opal.returner[Opal.s.$v] = val;
    throw Opal.returner;
  };

  // Used to break out of a block.
  Opal.brk = function(val, breaker) {
    breaker[Opal.s.$v] = val;
    throw breaker;
  };

  // Builds a new unique breaker, this is to avoid multiple nested breaks to get
  // in the way of each other.
  Opal.new_brk = function() {
    return new Error('unexpected break');
  };

  // handles yield calls for 1 yielded arg
  Opal.yield1 = function(block, arg) {
    if (typeof(block) !== "function") {
      throw Opal.LocalJumpError.$new("no block given");
    }

    var has_mlhs = block[Opal.s.$$has_top_level_mlhs_arg],
        has_trailing_comma = block[Opal.s.$$has_trailing_comma_in_args];

    if (block.length > 1 || ((has_mlhs || has_trailing_comma) && block.length === 1)) {
      arg = Opal.to_ary(arg);
    }

    if ((block.length > 1 || (has_trailing_comma && block.length === 1)) && arg[Opal.s.$$is_array]) {
      return block.apply(null, arg);
    }
    else {
      return block(arg);
    }
  };

  // handles yield for > 1 yielded arg
  Opal.yieldX = function(block, args) {
    if (typeof(block) !== "function") {
      throw Opal.LocalJumpError.$new("no block given");
    }

    if (block.length > 1 && args.length === 1) {
      if (args[0][Opal.s.$$is_array]) {
        return block.apply(null, args[0]);
      }
    }

    if (!args[Opal.s.$$is_array]) {
      var args_ary = new Array(args.length);
      for(var i = 0, l = args_ary.length; i < l; i++) { args_ary[i] = args[i]; }

      return block.apply(null, args_ary);
    }

    return block.apply(null, args);
  };

  // Finds the corresponding exception match in candidates.  Each candidate can
  // be a value, or an array of values.  Returns null if not found.
  Opal.rescue = function(exception, candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];

      if (candidate[Opal.s.$$is_array]) {
        var result = Opal.rescue(exception, candidate);

        if (result) {
          return result;
        }
      }
      else if (candidate === Opal.JS.Error) {
        return candidate;
      }
      else if (candidate['$==='](exception)) {
        return candidate;
      }
    }

    return null;
  };

  Opal.is_a = function(object, klass) {
    if (klass != null && object[Opal.s.$$meta] === klass || object[Opal.s.$$class] === klass) {
      return true;
    }

    if (object[Opal.s.$$is_number] && klass[Opal.s.$$is_number_class]) {
      return (klass[Opal.s.$$is_integer_class]) ? (object % 1) === 0 : true;
    }

    var i, length, ancestors = Opal.ancestors(object[Opal.s.$$is_class] ? Opal.get_singleton_class(object) : (object[Opal.s.$$meta] || object[Opal.s.$$class]));

    for (i = 0, length = ancestors.length; i < length; i++) {
      if (ancestors[i] === klass) {
        return true;
      }
    }

    return false;
  };

  // Helpers for extracting kwsplats
  // Used for: { **h }
  Opal.to_hash = function(value) {
    if (value[Opal.s.$$is_hash]) {
      return value;
    }
    else if (value[Opal.s['$respond_to?']]('to_hash', true)) {
      var hash = value[Opal.s.$to_hash]();
      if (hash[Opal.s.$$is_hash]) {
        return hash;
      }
      else {
        throw Opal.TypeError.$new("Can't convert " + value[Opal.s.$$class] +
          " to Hash (" + value[Opal.s.$$class] + "#to_hash gives " + hash[Opal.s.$$class] + ")");
      }
    }
    else {
      throw Opal.TypeError.$new("no implicit conversion of " + value[Opal.s.$$class] + " into Hash");
    }
  };

  // Helpers for implementing multiple assignment
  // Our code for extracting the values and assigning them only works if the
  // return value is a JS array.
  // So if we get an Array subclass, extract the wrapped JS array from it

  // Used for: a, b = something (no splat)
  Opal.to_ary = function(value) {
    if (value[Opal.s.$$is_array]) {
      return value;
    }
    else if (value[Opal.s['$respond_to?']]('to_ary', true)) {
      var ary = value[Opal.s.$to_ary]();
      if (ary === nil) {
        return [value];
      }
      else if (ary[Opal.s.$$is_array]) {
        return ary;
      }
      else {
        throw Opal.TypeError.$new("Can't convert " + value[Opal.s.$$class] +
          " to Array (" + value[Opal.s.$$class] + "#to_ary gives " + ary[Opal.s.$$class] + ")");
      }
    }
    else {
      return [value];
    }
  };

  // Used for: a, b = *something (with splat)
  Opal.to_a = function(value) {
    if (value[Opal.s.$$is_array]) {
      // A splatted array must be copied
      return value.slice();
    }
    else if (value[Opal.s['$respond_to?']]('to_a', true)) {
      var ary = value[Opal.s.$to_a]();
      if (ary === nil) {
        return [value];
      }
      else if (ary[Opal.s.$$is_array]) {
        return ary;
      }
      else {
        throw Opal.TypeError.$new("Can't convert " + value[Opal.s.$$class] +
          " to Array (" + value[Opal.s.$$class] + "#to_a gives " + ary[Opal.s.$$class] + ")");
      }
    }
    else {
      return [value];
    }
  };

  // Used for extracting keyword arguments from arguments passed to
  // JS function. If provided +arguments+ list doesn't have a Hash
  // as a last item, returns a blank Hash.
  //
  // @param parameters [Array]
  // @return [Hash]
  //
  Opal.extract_kwargs = function(parameters) {
    var kwargs = parameters[parameters.length - 1];
    if (kwargs != null && Opal.respond_to(kwargs, '$to_hash', true)) {
      $splice.call(parameters, parameters.length - 1, 1);
      return kwargs[Opal.s.$to_hash]();
    }
    else {
      return Opal.hash2([], {});
    }
  };

  // Used to get a list of rest keyword arguments. Method takes the given
  // keyword args, i.e. the hash literal passed to the method containing all
  // keyword arguemnts passed to method, as well as the used args which are
  // the names of required and optional arguments defined. This method then
  // just returns all key/value pairs which have not been used, in a new
  // hash literal.
  //
  // @param given_args [Hash] all kwargs given to method
  // @param used_args [Object<String: true>] all keys used as named kwargs
  // @return [Hash]
  //
  Opal.kwrestargs = function(given_args, used_args) {
    var keys      = [],
        map       = {},
        key           ,
        given_map = given_args[Opal.s.$$smap];

    for (key in given_map) {
      if (!used_args[key]) {
        keys.push(key);
        map[key] = given_map[key];
      }
    }

    return Opal.hash2(keys, map);
  };

  // Calls passed method on a ruby object with arguments and block:
  //
  // Can take a method or a method name.
  //
  // 1. When method name gets passed it invokes it by its name
  //    and calls 'method_missing' when object doesn't have this method.
  //    Used internally by Opal to invoke method that takes a block or a splat.
  // 2. When method (i.e. method body) gets passed, it doesn't trigger 'method_missing'
  //    because it doesn't know the name of the actual method.
  //    Used internally by Opal to invoke 'super'.
  //
  // @example
  //   var my_array = [1, 2, 3, 4]
  //   Opal.send(my_array, 'length')                    # => 4
  //   Opal.send(my_array, my_array.$length)            # => 4
  //
  //   Opal.send(my_array, 'reverse!')                  # => [4, 3, 2, 1]
  //   Opal.send(my_array, my_array['$reverse!']')      # => [4, 3, 2, 1]
  //
  // @param recv [Object] ruby object
  // @param method [Function, String] method body or name of the method
  // @param args [Array] arguments that will be passed to the method call
  // @param block [Function] ruby block
  // @return [Object] returning value of the method call
  Opal.send = function(recv, method, args, block) {
    var body;

    if (typeof(method) === 'function') {
      body = method;
      method = null;
    } else if (typeof(method) === 'string') {
      body = recv['$'+method];
    } else {
      throw Opal.NameError.$new("Passed method should be a string or a function");
    }

    return Opal.send2(recv, body, method, args, block);
  };

  Opal.send2 = function(recv, body, method, args, block) {
    if (body == null && method != null && recv[Opal.s.$method_missing]) {
      body = recv[Opal.s.$method_missing];
      args = [method].concat(args);
    }

    if (typeof block === 'function') body[Opal.s.$$p] = block;
    return body.apply(recv, args);
  };

  Opal.lambda = function(block) {
    block[Opal.s.$$is_lambda] = true;
    return block;
  };

  // Used to define methods on an object. This is a helper method, used by the
  // compiled source to define methods on special case objects when the compiler
  // can not determine the destination object, or the object is a Module
  // instance. This can get called by `Module#define_method` as well.
  //
  // ## Modules
  //
  // Any method defined on a module will come through this runtime helper.
  // The method is added to the module body, and the owner of the method is
  // set to be the module itself. This is used later when choosing which
  // method should show on a class if more than 1 included modules define
  // the same method. Finally, if the module is in `module_function` mode,
  // then the method is also defined onto the module itself.
  //
  // ## Classes
  //
  // This helper will only be called for classes when a method is being
  // defined indirectly; either through `Module#define_method`, or by a
  // literal `def` method inside an `instance_eval` or `class_eval` body. In
  // either case, the method is simply added to the class' prototype. A special
  // exception exists for `BasicObject` and `Object`. These two classes are
  // special because they are used in toll-free bridged classes. In each of
  // these two cases, extra work is required to define the methods on toll-free
  // bridged class' prototypes as well.
  //
  // ## Objects
  //
  // If a simple ruby object is the object, then the method is simply just
  // defined on the object as a singleton method. This would be the case when
  // a method is defined inside an `instance_eval` block.
  //
  // @param obj  [Object, Class] the actual obj to define method for
  // @param jsid [String] the JavaScript friendly method name (e.g. '$foo')
  // @param body [JS.Function] the literal JavaScript function used as method
  // @return [null]
  //
  Opal.def = function(obj, jsid, body) {
    trace(obj, jsid);

    // Special case for a method definition in the
    // top-level namespace
    if (obj === Opal.top) {
      Opal.defn(Opal.Object, jsid, body)
    }
    // if instance_eval is invoked on a module/class, it sets inst_eval_mod
    else if (!obj[Opal.s.$$eval] && obj[Opal.s.$$is_a_module]) {
      Opal.defn(obj, jsid, body);
    }
    else {
      Opal.defs(obj, jsid, body);
    }
  };

  // Define method on a module or class (see Opal.def).
  Opal.defn = function(module, jsid, body) {
    trace(module, jsid);

    expectSymbol(jsid);

    body.displayName = jsid;
    body[Opal.s.$$owner] = module;

    var proto = module[Opal.s.$$prototype];
    if (proto.hasOwnProperty(Opal.s.$$dummy)) {
      proto = proto[Opal.s.$$define_methods_on];
    }
    $defineProperty(proto, jsid, body);

    if (module[Opal.s.$$is_module]) {
      if (module[Opal.s.$$module_function]) {
        Opal.defs(module, jsid, body)
      }

      for (var i = 0, iclasses = module[Opal.s.$$iclasses], length = iclasses.length; i < length; i++) {
        var iclass = iclasses[i];
        $defineProperty(iclass, jsid, body);
      }
    }

    var singleton_of = module[Opal.s.$$singleton_of];
    if (module[Opal.s.$method_added] && !module[Opal.s.$method_added][Opal.s.$$stub] && !singleton_of) {
      module[Opal.s.$method_added](jsid.description.substr(1));
    }
    else if (singleton_of && singleton_of[Opal.s.$singleton_method_added] && !singleton_of[Opal.s.$singleton_method_added][Opal.s.$$stub]) {
      singleton_of[Opal.s.$singleton_method_added](jsid.description.substr(1));
    }
  };

  // Define a singleton method on the given object (see Opal.def).
  Opal.defs = function(obj, jsid, body) {
    expectSymbol(jsid);

    trace(obj, jsid);

    if (obj[Opal.s.$$is_string] || obj[Opal.s.$$is_number]) {
      throw Opal.TypeError.$new("can't define singleton");
    }
    Opal.defn(Opal.get_singleton_class(obj), jsid, body)
  };

  // Called from #remove_method.
  Opal.rdef = function(obj, jsid) {
    expectSymbol(jsid);

    trace(obj, jsid);

    if (!$has_own.call(obj[Opal.s.$$prototype], jsid)) {
      throw Opal.NameError.$new("method '" + jsid.substr(1) + "' not defined in " + obj[Opal.s.$name]());
    }

    delete obj[Opal.s.$$prototype][jsid];

    if (obj[Opal.s.$$is_singleton]) {
      if (obj[Opal.s.$$prototype][Opal.s.$singleton_method_removed] && !obj[Opal.s.$$prototype][Opal.s.$singleton_method_removed][Opal.s.$$stub]) {
        obj[Opal.s.$$prototype][Opal.s.$singleton_method_removed](jsid.description.substr(1));
      }
    }
    else {
      if (obj[Opal.s.$method_removed] && !obj[Opal.s.$method_removed][Opal.s.$$stub]) {
        obj[Opal.s.$method_removed](jsid.substr(1));
      }
    }
  };

  // Called from #undef_method.
  Opal.udef = function(obj, jsid) {
    trace(obj, jsid);

    expectSymbol(jsid);

    if (!obj[Opal.s.$$prototype][jsid] || obj[Opal.s.$$prototype][jsid][Opal.s.$$stub]) {
      throw Opal.NameError.$new("method '" + jsid.substr(1) + "' not defined in " + obj[Opal.s.$name]());
    }

    Opal.add_stub_for(obj[Opal.s.$$prototype], jsid);

    if (obj[Opal.s.$$is_singleton]) {
      if (obj[Opal.s.$$prototype][Opal.s.$singleton_method_undefined] && !obj[Opal.s.$$prototype][Opal.s.$singleton_method_undefined][Opal.s.$$stub]) {
        obj[Opal.s.$$prototype][Opal.s.$singleton_method_undefined](jsid.description.substr(1));
      }
    }
    else {
      if (obj[Opal.s.$method_undefined] && !obj[Opal.s.$method_undefined][Opal.s.$$stub]) {
        obj[Opal.s.$method_undefined](jsid.description.substr(1));
      }
    }
  };

  function is_method_body(body) {
    return (typeof(body) === "function" && !body[Opal.s.$$stub]);
  }

  Opal.alias = function(obj, name, old) {
    expectString(name);
    expectString(old);

    trace(obj, name, old);

    var id     = Opal.s('$' + name),
        old_id = Opal.s('$' + old),
        body   = obj[Opal.s.$$prototype][old_id],
        alias;

    // When running inside #instance_eval the alias refers to class methods.
    if (obj[Opal.s.$$eval]) {
      return Opal.alias(Opal.get_singleton_class(obj), name, old);
    }

    if (!is_method_body(body)) {
      var ancestor = obj[Opal.s.$$super];

      while (typeof(body) !== "function" && ancestor) {
        body     = ancestor[old_id];
        ancestor = ancestor[Opal.s.$$super];
      }

      if (!is_method_body(body) && obj[Opal.s.$$is_module]) {
        // try to look into Object
        body = Opal.Object[Opal.s.$$prototype][old_id]
      }

      if (!is_method_body(body)) {
        throw Opal.NameError.$new("undefined method `" + old + "' for class `" + obj[Opal.s.$name]() + "'")
      }
    }

    // If the body is itself an alias use the original body
    // to keep the max depth at 1.
    if (body[Opal.s.$$alias_of]) body = body[Opal.s.$$alias_of];

    // We need a wrapper because otherwise properties
    // would be overwritten on the original body.
    alias = function() {
      var block = alias[Opal.s.$$p], args, i, ii;

      args = new Array(arguments.length);
      for(i = 0, ii = arguments.length; i < ii; i++) {
        args[i] = arguments[i];
      }

      if (block != null) { alias[Opal.s.$$p] = null }

      return Opal.send(this, body, args, block);
    };

    // Assign the 'length' value with defineProperty because
    // in strict mode the property is not writable.
    // It doesn't work in older browsers (like Chrome 38), where
    // an exception is thrown breaking Opal altogether.
    try {
      Object.defineProperty(alias, 'length', { value: body.length });
    } catch (e) {}

    // Try to make the browser pick the right name
    alias.displayName       = name;

    alias[Opal.s.$$arity]           = body[Opal.s.$$arity];
    alias[Opal.s.$$parameters]      = body[Opal.s.$$parameters];
    alias[Opal.s.$$source_location] = body[Opal.s.$$source_location];
    alias[Opal.s.$$alias_of]        = body;
    alias[Opal.s.$$alias_name]      = name;

    Opal.defn(obj, id, alias);

    return obj;
  };

  Opal.alias_native = function(obj, name, native_name) {
    trace(obj, name, native_name);

    var id   = '$' + name,
        body = obj[Opal.s.$$prototype][native_name];

    if (typeof(body) !== "function" || body[Opal.s.$$stub]) {
      throw Opal.NameError.$new("undefined native method `" + native_name + "' for class `" + obj[Opal.s.$name]() + "'")
    }

    Opal.defn(obj, id, body);

    return obj;
  };


  // Hashes
  // ------

  Opal.hash_init = function(hash) {
    hash[Opal.s.$$smap] = Object.create(null);
    hash[Opal.s.$$map]  = Object.create(null);
    hash[Opal.s.$$keys] = [];
  };

  Opal.hash_clone = function(from_hash, to_hash) {
    to_hash.$$none = from_hash.$$none;
    to_hash.$$proc = from_hash.$$proc;

    for (var i = 0, keys = from_hash[Opal.s.$$keys], smap = from_hash[Opal.s.$$smap], len = keys.length, key, value; i < len; i++) {
      key = keys[i];

      if (key[Opal.s.$$is_string]) {
        value = smap[key];
      } else {
        value = key.value;
        key = key.key;
      }

      Opal.hash_put(to_hash, key, value);
    }
  };

  Opal.hash_put = function(hash, key, value) {
    if (key[Opal.s.$$is_string]) {
      if (!$has_own.call(hash[Opal.s.$$smap], key)) {
        hash[Opal.s.$$keys].push(key);
      }
      hash[Opal.s.$$smap][key] = value;
      return;
    }

    var key_hash, bucket, last_bucket;
    key_hash = hash.$$by_identity ? Opal.id(key) : key.$hash();

    if (!$has_own.call(hash[Opal.s.$$map], key_hash)) {
      bucket = {key: key, key_hash: key_hash, value: value};
      hash[Opal.s.$$keys].push(bucket);
      hash[Opal.s.$$map][key_hash] = bucket;
      return;
    }

    bucket = hash[Opal.s.$$map][key_hash];

    while (bucket) {
      if (key === bucket.key || key['$eql?'](bucket.key)) {
        last_bucket = undefined;
        bucket.value = value;
        break;
      }
      last_bucket = bucket;
      bucket = bucket.next;
    }

    if (last_bucket) {
      bucket = {key: key, key_hash: key_hash, value: value};
      hash[Opal.s.$$keys].push(bucket);
      last_bucket.next = bucket;
    }
  };

  Opal.hash_get = function(hash, key) {
    if (key[Opal.s.$$is_string]) {
      if ($has_own.call(hash[Opal.s.$$smap], key)) {
        return hash[Opal.s.$$smap][key];
      }
      return;
    }

    var key_hash, bucket;
    key_hash = hash.$$by_identity ? Opal.id(key) : key.$hash();

    if ($has_own.call(hash[Opal.s.$$map], key_hash)) {
      bucket = hash[Opal.s.$$map][key_hash];

      while (bucket) {
        if (key === bucket.key || key['$eql?'](bucket.key)) {
          return bucket.value;
        }
        bucket = bucket.next;
      }
    }
  };

  Opal.hash_delete = function(hash, key) {
    var i, keys = hash[Opal.s.$$keys], length = keys.length, value;

    if (key[Opal.s.$$is_string]) {
      if (typeof key !== "string") key = key.valueOf();

      if (!$has_own.call(hash[Opal.s.$$smap], key)) {
        return;
      }

      for (i = 0; i < length; i++) {
        if (keys[i] === key) {
          keys.splice(i, 1);
          break;
        }
      }

      value = hash[Opal.s.$$smap][key];
      delete hash[Opal.s.$$smap][key];
      return value;
    }

    var key_hash = key.$hash();

    if (!$has_own.call(hash[Opal.s.$$map], key_hash)) {
      return;
    }

    var bucket = hash[Opal.s.$$map][key_hash], last_bucket;

    while (bucket) {
      if (key === bucket.key || key['$eql?'](bucket.key)) {
        value = bucket.value;

        for (i = 0; i < length; i++) {
          if (keys[i] === bucket) {
            keys.splice(i, 1);
            break;
          }
        }

        if (last_bucket && bucket.next) {
          last_bucket.next = bucket.next;
        }
        else if (last_bucket) {
          delete last_bucket.next;
        }
        else if (bucket.next) {
          hash[Opal.s.$$map][key_hash] = bucket.next;
        }
        else {
          delete hash[Opal.s.$$map][key_hash];
        }

        return value;
      }
      last_bucket = bucket;
      bucket = bucket.next;
    }
  };

  Opal.hash_rehash = function(hash) {
    for (var i = 0, length = hash[Opal.s.$$keys].length, key_hash, bucket, last_bucket; i < length; i++) {

      if (hash[Opal.s.$$keys][i][Opal.s.$$is_string]) {
        continue;
      }

      key_hash = hash[Opal.s.$$keys][i].key.$hash();

      if (key_hash === hash[Opal.s.$$keys][i].key_hash) {
        continue;
      }

      bucket = hash[Opal.s.$$map][hash[Opal.s.$$keys][i].key_hash];
      last_bucket = undefined;

      while (bucket) {
        if (bucket === hash[Opal.s.$$keys][i]) {
          if (last_bucket && bucket.next) {
            last_bucket.next = bucket.next;
          }
          else if (last_bucket) {
            delete last_bucket.next;
          }
          else if (bucket.next) {
            hash[Opal.s.$$map][hash[Opal.s.$$keys][i].key_hash] = bucket.next;
          }
          else {
            delete hash[Opal.s.$$map][hash[Opal.s.$$keys][i].key_hash];
          }
          break;
        }
        last_bucket = bucket;
        bucket = bucket.next;
      }

      hash[Opal.s.$$keys][i].key_hash = key_hash;

      if (!$has_own.call(hash[Opal.s.$$map], key_hash)) {
        hash[Opal.s.$$map][key_hash] = hash[Opal.s.$$keys][i];
        continue;
      }

      bucket = hash[Opal.s.$$map][key_hash];
      last_bucket = undefined;

      while (bucket) {
        if (bucket === hash[Opal.s.$$keys][i]) {
          last_bucket = undefined;
          break;
        }
        last_bucket = bucket;
        bucket = bucket.next;
      }

      if (last_bucket) {
        last_bucket.next = hash[Opal.s.$$keys][i];
      }
    }
  };

  Opal.hash = function() {
    var arguments_length = arguments.length, args, hash, i, length, key, value;

    if (arguments_length === 1 && arguments[0][Opal.s.$$is_hash]) {
      return arguments[0];
    }

    hash = new Opal.Hash();
    Opal.hash_init(hash);

    if (arguments_length === 1 && arguments[0][Opal.s.$$is_array]) {
      args = arguments[0];
      length = args.length;

      for (i = 0; i < length; i++) {
        if (args[i].length !== 2) {
          throw Opal.ArgumentError.$new("value not of length 2: " + args[i][Opal.s.$inspect]());
        }

        key = args[i][0];
        value = args[i][1];

        Opal.hash_put(hash, key, value);
      }

      return hash;
    }

    if (arguments_length === 1) {
      args = arguments[0];
      for (key in args) {
        if ($has_own.call(args, key)) {
          value = args[key];

          Opal.hash_put(hash, key, value);
        }
      }

      return hash;
    }

    if (arguments_length % 2 !== 0) {
      throw Opal.ArgumentError.$new("odd number of arguments for Hash");
    }

    for (i = 0; i < arguments_length; i += 2) {
      key = arguments[i];
      value = arguments[i + 1];

      Opal.hash_put(hash, key, value);
    }

    return hash;
  };

  // A faster Hash creator for hashes that just use symbols and
  // strings as keys. The map and keys array can be constructed at
  // compile time, so they are just added here by the constructor
  // function.
  //
  Opal.hash2 = function(keys, smap) {
    var hash = new Opal.Hash();

    hash[Opal.s.$$smap] = smap;
    hash[Opal.s.$$map]  = Object.create(null);
    hash[Opal.s.$$keys] = keys;

    return hash;
  };

  // Create a new range instance with first and last values, and whether the
  // range excludes the last value.
  //
  Opal.range = function(first, last, exc) {
    var range         = new Opal.Range();
        range.begin   = first;
        range.end     = last;
        range.excl    = exc;

    return range;
  };

  // Get the ivar name for a given name.
  // Mostly adds a trailing $ to reserved names.
  //
  Opal.ivar = function(name) {
    if (
        // properties
        name === "constructor" ||
        name === "displayName" ||
        name === "__count__" ||
        name === "__noSuchMethod__" ||
        name === "__parent__" ||
        name === "__proto__" ||

        // methods
        name === "hasOwnProperty" ||
        name === "valueOf"
       )
    {
      return name + "$";
    }

    return name;
  };


  // Regexps
  // -------

  // Escape Regexp special chars letting the resulting string be used to build
  // a new Regexp.
  //
  Opal.escape_regexp = function(str) {
    return str.replace(/([-[\]\/{}()*+?.^$\\| ])/g, '\\$1')
              .replace(/[\n]/g, '\\n')
              .replace(/[\r]/g, '\\r')
              .replace(/[\f]/g, '\\f')
              .replace(/[\t]/g, '\\t');
  };

  // Create a global Regexp from a RegExp object and cache the result
  // on the object itself ($$g attribute).
  //
  Opal.global_regexp = function(pattern) {
    if (pattern.global) {
      return pattern; // RegExp already has the global flag
    }
    if (pattern.$$g == null) {
      pattern.$$g = new RegExp(pattern.source, (pattern.multiline ? 'gm' : 'g') + (pattern.ignoreCase ? 'i' : ''));
    } else {
      pattern.$$g.lastIndex = null; // reset lastIndex property
    }
    return pattern.$$g;
  };

  // Create a global multiline Regexp from a RegExp object and cache the result
  // on the object itself ($$gm or $$g attribute).
  //
  Opal.global_multiline_regexp = function(pattern) {
    var result;
    if (pattern.multiline) {
      if (pattern.global) {
        return pattern; // RegExp already has the global and multiline flag
      }
      // we are using the $$g attribute because the Regexp is already multiline
      if (pattern.$$g != null) {
        result = pattern.$$g;
      } else {
        result = pattern.$$g = new RegExp(pattern.source, 'gm' + (pattern.ignoreCase ? 'i' : ''));
      }
    } else if (pattern.$$gm != null) {
      result = pattern.$$gm;
    } else {
      result = pattern.$$gm = new RegExp(pattern.source, 'gm' + (pattern.ignoreCase ? 'i' : ''));
    }
    result.lastIndex = null; // reset lastIndex property
    return result;
  };

  // Combine multiple regexp parts together
  Opal.regexp = function(parts, flags) {
    var part;
    var ignoreCase = typeof flags !== 'undefined' && flags && flags.indexOf('i') >= 0;

    for (var i = 0, ii = parts.length; i < ii; i++) {
      part = parts[i];
      if (part instanceof RegExp) {
        if (part.ignoreCase !== ignoreCase)
          Opal.Kernel.$warn(
            "ignore case doesn't match for " + part.source[Opal.s.$inspect](),
            Opal.hash({uplevel: 1})
          )

        part = part.source;
      }
      if (part === '') part = '(?:' + part + ')';
      parts[i] = part;
    }

    if (flags) {
      return new RegExp(parts.join(''), flags);
    } else {
      return new RegExp(parts.join(''));
    }
  };

  // Require system
  // --------------

  Opal.modules         = {};
  Opal.loaded_features = ['corelib/runtime'];
  Opal.current_dir     = '.';
  Opal.require_table   = {'corelib/runtime': true};

  Opal.normalize = function(path) {
    var parts, part, new_parts = [], SEPARATOR = '/';

    if (Opal.current_dir !== '.') {
      path = Opal.current_dir.replace(/\/*$/, '/') + path;
    }

    path = path.replace(/^\.\//, '');
    path = path.replace(/\.(rb|opal|js)$/, '');
    parts = path.split(SEPARATOR);

    for (var i = 0, ii = parts.length; i < ii; i++) {
      part = parts[i];
      if (part === '') continue;
      (part === '..') ? new_parts.pop() : new_parts.push(part)
    }

    return new_parts.join(SEPARATOR);
  };

  Opal.loaded = function(paths) {
    var i, l, path;

    for (i = 0, l = paths.length; i < l; i++) {
      path = Opal.normalize(paths[i]);

      if (Opal.require_table[path]) {
        continue;
      }

      Opal.loaded_features.push(path);
      Opal.require_table[path] = true;
    }
  };

  Opal.load = function(path) {
    path = Opal.normalize(path);

    Opal.loaded([path]);

    var module = Opal.modules[path];

    if (module) {
      module(Opal);
    }
    else {
      var severity = Opal.config.missing_require_severity;
      var message  = 'cannot load such file -- ' + path;

      if (severity === "error") {
        if (Opal.LoadError) {
          throw Opal.LoadError.$new(message)
        } else {
          throw message
        }
      }
      else if (severity === "warning") {
        console.warn('WARNING: LoadError: ' + message);
      }
    }

    return true;
  };

  Opal.require = function(path) {
    path = Opal.normalize(path);

    if (Opal.require_table[path]) {
      return false;
    }

    return Opal.load(path);
  };


  // Strings
  // -------

  Opal.encodings = Object.create(null);

  // Sets the encoding on a string, will treat string literals as frozen strings
  // raising a FrozenError.
  // @param str [String] the string on which the encoding should be set.
  // @param name [String] the canonical name of the encoding
  Opal.set_encoding = function(str, name) {
    if (typeof str === 'string')
      throw Opal.FrozenError.$new("can't modify frozen String");

    var encoding = Opal.find_encoding(name);

    if (encoding === str.encoding) { return str; }

    str.encoding = encoding;

    return str;
  };

  // Fetches the encoding for the given name or raises ArgumentError.
  Opal.find_encoding = function(name) {
    var register = Opal.encodings;
    var encoding = register[name] || register[name.toUpperCase()];
    if (!encoding) throw Opal.ArgumentError.$new("unknown encoding name - " + name);
    return encoding;
  }

  // @returns a String object with the encoding set from a string literal
  Opal.enc = function(str, name) {
    var dup = new String(str);
    Opal.set_encoding(dup, name);
    dup.internal_encoding = dup.encoding;
    return dup
  }


  // Initialization
  // --------------
  function $BasicObject() {}
  function $Object() {}
  function $Module() {}
  function $Class() {}

  Opal.BasicObject = BasicObject = Opal.allocate_class('BasicObject', null, $BasicObject);
  Opal.Object      = _Object     = Opal.allocate_class('Object', Opal.BasicObject, $Object);
  Opal.Module      = Module      = Opal.allocate_class('Module', Opal.Object, $Module);
  Opal.Class       = Class       = Opal.allocate_class('Class', Opal.Module, $Class);

  $set_proto(Opal.BasicObject, Opal.Class[Opal.s.$$prototype]);
  $set_proto(Opal.Object, Opal.Class[Opal.s.$$prototype]);
  $set_proto(Opal.Module, Opal.Class[Opal.s.$$prototype]);
  $set_proto(Opal.Class, Opal.Class[Opal.s.$$prototype]);

  // BasicObject can reach itself, avoid const_set to skip the $$base_module logic
  BasicObject[Opal.s.$$const]["BasicObject"] = BasicObject;

  // Assign basic constants
  Opal.const_set(_Object, "BasicObject",  BasicObject);
  Opal.const_set(_Object, "Object",       _Object);
  Opal.const_set(_Object, "Module",       Module);
  Opal.const_set(_Object, "Class",        Class);

  // Fix booted classes to have correct .class value
  BasicObject[Opal.s.$$class] = Class;
  _Object[Opal.s.$$class]     = Class;
  Module[Opal.s.$$class]      = Class;
  Class[Opal.s.$$class]       = Class;

  // Forward .toString() to #to_s
  $defineProperty(_Object[Opal.s.$$prototype], 'toString', function() {
    var to_s = this.$to_s();
    if (to_s[Opal.s.$$is_string] && typeof(to_s) === 'object') {
      // a string created using new String('string')
      return to_s.valueOf();
    } else {
      return to_s;
    }
  });

  // Make Kernel#require immediately available as it's needed to require all the
  // other corelib files.
  $defineProperty(_Object[Opal.s.$$prototype], Opal.s.$require, Opal.require);

  // Instantiate the main object
  Opal.top = new _Object();
  Opal.top.$to_s = Opal.top[Opal.s.$inspect] = function() { return 'main' };
  Opal.top.$define_method = top_define_method;

  // Foward calls to define_method on the top object to Object
  function top_define_method() {
    var args = Opal.slice.call(arguments, 0, arguments.length);
    var block = top_define_method[Opal.s.$$p];
    top_define_method[Opal.s.$$p] = null;
    return Opal.send(_Object, 'define_method', args, block)
  };


  // Nil
  function $NilClass() {}
  Opal.NilClass = Opal.allocate_class('NilClass', Opal.Object, $NilClass);
  Opal.const_set(_Object, 'NilClass', Opal.NilClass);
  nil = Opal.nil = new Opal.NilClass();
  nil[Opal.s.$$id] = nil_id;
  nil.call = nil.apply = function() { throw Opal.LocalJumpError.$new('no block given'); };

  // Errors
  Opal.breaker  = new Error('unexpected break (old)');
  Opal.returner = new Error('unexpected return');
  TypeError[Opal.s.$$super] = Error;
}).call(this);
