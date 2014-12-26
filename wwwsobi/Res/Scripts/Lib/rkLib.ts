module rkLib {
  var $ = Base;

  export interface TypeDescriptor { };

  export interface StringTypeDescriptor extends TypeDescriptor, String { };

  export interface FunctionTypeDescriptor extends TypeDescriptor, Function { };

  export class Base {
    static is(obj: TypeDescriptor, type: any): boolean {
      switch (typeof type) {
        case "string":
          switch (type) {
            case "array":
              return Array.isArray(obj);
            default:
              return type === typeof obj;
          }
        case "function":
          return obj instanceof type;
        default:
          switch (type) {
            case null:
              return null == obj;
            default:
              throw new TypeError("Type descriptor of invalid type " + typeof type);
          }
      }
    }

    static are(obj: any[], type: any): boolean {
      if ($.is(type, Array)) return obj.every((el, idx) => {
        return $.is(el, type[idx]);
      });
      return obj.every((el) => {
        return $.is(el, type);
      });
    }

    static extend(obj: any, ext: Object, deep: boolean = false, own: boolean = true): any {
      var getVal = deep ? o => {
        if ($.is(o, "array")) return $.extend([], o, true, false);
        if ($.is(o, "object")) return $.extend({}, o, true, false);
        return o;
      } : o => o;

      if (own) {
        var keys = Object.keys(ext);
        for (var i = 0; i < keys.length; i++)
          obj[keys[i]] = getVal(ext[keys[i]]);
      }
      else {
        for (var i in ext)
          obj[i] = getVal(ext[i]);
      }

      return obj;
    }
  };
}

var rklib = rkLib.Base, $ = rklib;