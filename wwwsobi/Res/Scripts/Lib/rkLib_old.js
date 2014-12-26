//TODO: Add pretty much everything useful and inspect EventEmitter.

(function(window, undefined) {
  'use strict';

  var arr = [],
    slice = [].slice;

  var tUndef = typeof undefined,

      $ = function rkLib() {
        return $.fn.apply(null, arguments);
      };

  $.is = function(obj, type) {
    switch (typeof type) {
      case "string":
        switch (type) {
          case "any":
            return true;
          case "array":
            return Array.isArray(obj);
          case "def":
            return typeof obj !== tUndef;
          case "undef":
            return typeof obj === tUndef;
          default:
            return typeof obj === type;
        }
      case "function":
        return obj instanceof type;
      default:
        throw new TypeError("Expected valid type, got " + typeof type + " " + type + " of constructor " + Object(type).constructor.name);
    }
  }

  $.toArray = function(obj, start, end) {
    return slice.call(obj, start, end);
  }

  $.each = function(obj, func, mustHaveOwn) {
    var data = {};
    if ($.is(obj, Array)) obj.forEach(func, data);

    else if (mustHaveOwn !== false) {
      $.each(Object.getOwnPropertyNames(obj), function(el) {
        func.call(data, obj[el], el, obj);
      });
    }
    else for (var key in obj) {
      func.call(data, obj[key], key, obj);
    }
  }

  $.are = function(objs, types) {
    if ($.is(types, "array"))
      for (var i = 0; i < types.length; i++) {
        if (!$.is(objs[i], types[i])) return false;
      }
    else for (var i = 0; i < objs.length; i++) {
      if (!$.is(objs[i], types)) return false;
    }
    return true;
  }

  $.overload = function(args, types, func) {
    if ($.are(args, types) && args.length == types.length) {
      return { match: true, val: func.apply(null, args) };
    }
    return { match: false, val: null };
  }

  $.overload.params = function(args, types, func) {
    if (!$.is(args, "array")) args = $.toArray(args);
    var vt = types.pop(),
      va = $.toArray(args, types.length - 1);
    args = args.slice(0, types.length - 2);
    if ($.are(args, types) && args.length == types.length && $.are(va, vt)) {
      return { match: true, val: func.apply(null, args) };
    }
    return { match: false, val: null };
  }

  $.overload.multi = function(args, ols) {
    var ret;
    for (var i in ols) {
      if (ols.hasOwnProperty(i)) {
        if (ols[i][1].params === true) ret = $.overload.params(args, ols[i][0], ols[i][2]);
        else ret = $.overload(args, ols[i][0], ols[i][1]);
        if (ret.match) return ret;
      }
    }
    return { match: false, val: null };
  }

  $.extend = function(obj, ext, deep) {
    if ($.are([obj, ext], Array)) $.each(ext, function(el) {
      Array.prototype.push.call(obj, el);
    });
    else $.each(ext, function(val, key) {
      if (deep) switch (typeof (val)) {
        case "object":
          obj[key] = $.extend({}, val, true);
          return;
        case "array":
          obj[key] = $.extend([], val, true);
          return;
      }
      obj[key] = val;
    }, false);
    return obj;
  };

  $.fn = function(sel, ctx) {
    var ret = $.overload.multi(arguments, [
       [
         ["function"],
         function(func) {
           document.addEventListener("DOMContentLoaded", func.bind(null, $))
         }
       ],
       [
         ["string", "function"],
         function(ns, func) {
           $.ns(ns, func);
         }
       ]
    ]);

    if (ret.match) return ret.val;

    return $.query(sel, ctx);
  }

  $.ns = $.extend(function(str, a, b) {
    $.ns.init($.ns.mk(str), a, b);
  }, {
    root: window,
    iter: function(a, fn) {
      var arr = typeof (a) == "string" ? a.split(".") : a,
          last = $.ns.root;
      for (var i = 0; i < arr.length; i++)
        last = fn(last, arr[i]);
      return last;
    },
    mk: function(a) {
      return $.ns.iter(a, function(el, i) { return el[i] || (el[i] = {}); });
    },
    get: function(a) {
      return $.ns.iter(a, function(el, i) { return el[i]; });
    },
    init: function(ns, a, b) {
      if (typeof (a) == "function") {
        if (b) $.extend(ns, b);
        $.extend(ns, a.call(ns, ns, $))
      }
      else {
        $.extend(ns, a);
        if (b) $.extend(ns, b.call(ns, ns, $));
      }
    },
    ex: function(str, obj, a, b) {
      var arr = str.split("."), lname = arr.pop(),
          ns = $.ns.mk(arr);
      if (ns[lname] != undefined) return false;
      ns = ns[lname] = obj;
      $.ns.init(ns, a, b);
      return true;
    }
  });

  $.dashToCamel = function(str, isUpper) {
    return str.replace(/-(.)/g, function(m, s, o) { return o || isUpper ? s.toUpperCase() : s; });
  }

  $.query = function rkQuery(sel, ctx) {
    if (!$.is(this, rkQuery)) return new rkQuery(sel, ctx);
    if (!arguments.length) return;

    if ($.is(sel, "array")) {
      $.extend(this, $.toArray(sel));
    }
    else if ($.is(sel, Node) || $.is(sel, EventTarget)) {
      this.push(sel);
    }
    else if ($.is(sel, "string")) {
      var els = $.query.sel(sel, ctx);
      if (!els) els = $.query.create(sel);
      $.extend(this, els);
    }
  };

  $.query.sel = function(sel, ctx) {
    if (!$.is(ctx, Element)) ctx = document;
    try {
      return ctx.querySelectorAll(sel);
    }
    catch (e) {
      if ($.is(e, DOMException) && e.code == DOMException.SYNTAX_ERR) return;
      throw e;
    }
  }

  $.query.create = function(sel) {
    var div = document.createElement("div");
    div.innerHTML = sel;
    return div.childNodes;
  }

  $.query.prototype = $.extend(new Array(), {
    each: function(func) {
      $.each(this, func);
      return this;
    },
    html: function(value) {
      if (arguments.length == 0) return this[0].innerHTML;
      this.each(function(el) { el.innerHTML = value; });
      return this;
    },
    text: function(value) {
      if (arguments.length == 0) return this[0].innerText;
      this.each(function(el) { el.innerText = value; });
      return this;
    },
    prop: function(name, value) {
      if (arguments.length == 1) return this[0][name];
      this.each(function(el) { el[name] = value; });
      return this;
    },
    css: function(name, value) {
      name = $.dashToCamel(name);
      if ($.is(value, "number")) value += "px";
      if (arguments.length == 1) return this[0][name];
      this.each(function(el) { el.style[name] = value; });
      return this;
    },
    attr: function(name, value) {
      if (arguments.length == 1) return this[0].attributes[name];
      this.each(function(el) { el.setAttribute(name, value); });
      return this;
    },
    append: function(el) {
      if ($.is(el, Array)) {
        var self = this;
        $.each(el, function(el) { self.append(el); });
      }
      else if ($.is(el, Node)) {
        this.each(function(tEl, i) { tEl.appendChild(i ? el.cloneNode() : el); });
      }
      return this;
    },
    remove: function() {
      this.each(function(el) { el.remove(); });
      return this;
    },
    on: function(evts, handler) {
      var self = this;
      $.each(evts.split(" "), function(evt) {
        self.each(function(el) {
          el.addEventListener(evt, handler);
        });
      })
      return this;
    },
    off: function(evt, handler) {
      this.each(function(el) {
        el.removeEventListener(evt, handler);
      });
      return this;
    }
  });

  var _$ = window.$,
      _rkLib = window.rkLib;

  $.noConflict = function(full) {
    if (_$ !== window.$) window.$ = _$;
    if (full && _rkLib !== window.rkLib) window.rkLib = _rkLib;
  }

  window.$ = window.rkLib = $;

}(window))