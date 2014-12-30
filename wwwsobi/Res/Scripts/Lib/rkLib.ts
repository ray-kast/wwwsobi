//Begin definitions of missing TypeScript definitions
declare var EventTarget: EventTarget;

interface Element extends rk.Selectable { }

interface Event {
  constructor(name: string)
}
//End re-definitions

module rkLib {

  var cache = {};

  //Used for Is.
  export interface TypeDescriptor { }

  //String type descriptor (used for the typeof and custom parts of Is).
  export interface StringTypeDescriptor extends TypeDescriptor, String { }

  //Function type descriptor (used for the instanceof part of Is).
  export interface FunctionTypeDescriptor extends TypeDescriptor, Function { }

  //Converts an arraylike object into an Array.
  export function ToArray<T>(obj: any, start?: number, end?: number): T[] {
    return Array.prototype.slice.call(obj, start, end);
  }

  //Checks an object against a type.  Includes primitives, constructors, and a couple custom types.
  export function Is(obj: TypeDescriptor, type: any): boolean {
    switch (typeof type) {
      case "string":
        switch (type) {
          case "any":
            return true;
          case "array":
            return Array.isArray(obj);
          case "object":
            return "object" === typeof obj && null != obj;
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

  //Checks an array of objects against either a single type (same type per object) or an array of types (one type per object).
  export function Are(obj: any[], type: any): boolean {
    if (Is(type, Array)) return obj.every((el, idx) => {
      return Is(el, type[idx]);
    });
    return obj.every((el) => {
      return Is(el, type);
    });
  }

  //Taking two objects, merges the second into the first.
  export function Extend(obj: any, ext: any, deep: boolean = false, own: boolean = true): any {
    var getVal = deep ? o => {
      if (Is(o, "array")) return Extend([], o, true, false);
      else if (Is(o, "object")) return Extend({}, o, true, false);
      return o;
    } : o => o;

    if (Are([obj, ext], Array)) {
      var oarr = <any[]>obj,
        earr = <any[]>ext;
      for (var i = 0; i < earr.length; i++) {
        oarr.push(getVal(earr[i]));
      }
    }

    if (own) {
      var keys = Object.keys(ext);
      for (var i = 0; i < keys.length; i++)
        obj[keys[i]] = getVal(ext[keys[i]]);
    }
    else {
      for (var key in ext)
        obj[key] = getVal(ext[key]);
    }

    return obj;
  }

  //Dummy div used for various functions
  var dummyDiv = document.createElement("div");

  //Check whether a given string is a valid CSS selector.
  export function IsValidSelector(sel: string) {
    try {
      dummyDiv.querySelector(sel);
      return true;
    }
    catch (e) {
      if (Is(e, DOMException) && (<DOMException>e).code == DOMException.SYNTAX_ERR) return false;
      else throw e;
    }
  }

  export var Matches: (el: Element, sel: string) => boolean;

  if (dummyDiv.matches) Matches = (el: Element, sel: string) => {
    return el.matches(sel);
  }
  else Matches = (el: Element, sel: string) => {
    return el.msMatches(sel);
  }

  //Remove duplicate elements from an array.
  export function MakeUnique(arr: any[]): void {
    var prims = { "string": {}, "number": {}, "boolean": {} }, objs = [];

    arr.filter((el: any, idx: number, arr: any[]) => {
      var t = typeof el;
      if (t === "object") {
        if (objs.indexOf(el) === -1) {
          objs.push(el);
          return true;
        }
        else return false;
      }
      else {
        if (prims[t].hasOwnProperty(el)) return false;
        else return prims[t][el] = true;
      }
    });
  }

  //Converts raw HTML in string format to an Element.
  export function FromHTMLString(html: string) {
    var div = document.createElement("div");
    div.innerHTML = html;
    return div.firstElementChild;
  }

  //Anything that has querySelector() and querySelectorAll().
  export interface Queryable {
    querySelector: (selectors: string) => Element;
    querySelectorAll: (selectors: string) => NodeList;
  }

  //Anything that matches Queryable and also has matches().
  export interface Selectable extends Queryable {
    matches: (selectors: string) => boolean;
    msMatches: (selectors: string) => boolean;
  }

  export class KeyValuePair<TKey, TValue> {
    private key: TKey;

    private value: TValue;

    public get Key(): TKey { return this.key; }

    public get Value(): TValue { return this.value; }

    constructor(key: TKey, value: TValue) {
      this.key = key;
      this.value = value;
    }
  }

  //A dictionary for using any kind of object as a key.
  export class Dictionary<TKey, TValue> {
    private entries: KeyValuePair<TKey, TValue>[] = [];

    public get Entries() {
      return this.entries.slice();
    }

    public get Keys() {
      return this.entries.map(entry => entry.Key);
    }

    public get Values() {
      return this.entries.map(pair => pair.Value);
    }

    public constructor() { }

    public HasKey(key: TKey): boolean {
      return this.entries.some(pair => pair.Key === key);
    }

    public GetValue(key: TKey): TValue {
      var lookup = this.entries.filter(pair => pair.Key === key);
      return lookup.length ? lookup[0].Value : null;
    }

    public Add(key: TKey, value: TValue): boolean {
      if (this.HasKey(key)) return false;
      else this.entries.push(new KeyValuePair<TKey, TValue>(key, value));
    }
  }

  export class DataCacheEntry {
    public pubCache: any;
    public privCache: any;
  }

  export interface GetDataCacheEntryPublic {
    (item: Node): DataCacheEntry;
    (item: Object): DataCacheEntry;
  }

  export class DataCache {
    private entries = new Dictionary<Node, DataCacheEntry>();

    public GetEntryPublic: GetDataCacheEntryPublic;

    constructor() {
      this.GetEntryPublic = this.GetEntry.bind(this, false);
    }

    public GetEntry(doGetPrivate: boolean, item: Node);
    public GetEntry(doGetPrivate: boolean, item: Object);

    public GetEntry(doGetPrivate: boolean, item: any) {
      if (Is(item, Node)) {
        if (this.entries.HasKey(item)) return this.entries.GetValue(item);
      }
    }
  }

  var Cache = new DataCache();

  //A wrapper for a set of one or more elements or objects.
  export class Query {
    private last: Query;

    private els: any[];

    public get Els(): any[] {
      return this.els;
    }

    constructor(sel: string, ctx?: Queryable);
    constructor(el: any);
    constructor(els: any[]);
    constructor(els: NodeList);

    constructor(els: any, ctx: Queryable = document) {
      if (Is(els, "string")) {
        if (IsValidSelector(els)) els = ctx.querySelectorAll(els);
        else els = FromHTMLString(els);
      }
      if (Is(els, Element)) this.els.push(els);
      else if (Is(els, NodeList)) this.els.push.call(this.els, <any[]>els);
    }

    //Base array functions

    public Each(func: (value: Queryable, index: number, array: Queryable[]) => void) {
      this.els.forEach(func);
      return this;
    }

    public Every(func: (value: Queryable, index: number, array: Queryable[]) => boolean) {
      return this.els.every(func);
    }

    public Some(func: (value: Queryable, index: number, array: Queryable[]) => boolean) {
      return this.els.some(func);
    }

    private EachOfType<T>(type: TypeDescriptor, fn: (el: T, idx: Number, arr: T[]) => void) {
      this.Each((el, idx, arr) => {
        if (Is(el, type)) fn(<T><any>el, idx, <T[]><any[]>arr);
      });
    }

    //Traversal

    private ClearDuplicates() {
      MakeUnique(this.els);
    }

    private Reconstruct(next: Query) {
      next.last = this;
      return next;
    }

    public Add(sel: string, ctx?: Queryable);
    public Add(el: Element);
    public Add(els: Node[]);
    public Add(els: NodeList);
    public Add(els: Query);

    public Add(els: any, ctx: Queryable = document) {
      var query: Query;
      if (Is(els, Query)) query = els;
      else query = new Query(els, ctx);
      return this.Reconstruct(query).ClearDuplicates();
    }

    public AddBack() {
      return this.Add(this.last);
    }

    private IterateChildren<T extends Node>(el: Node, type: TypeDescriptor, fn: (el: T) => void) {
      var child: Node = el.firstChild;
      if (child) do {
        fn(<T>child);
      } while(child = child.nextSibling)
    }

    public Children(selector?: string) {
      var els = [];
      this.EachOfType(Element, (el: Element) => {
        if (!selector || el.matches(selector)) els.push(el);
      });
      return this.Reconstruct(new Query(els));
    }

    //Modification

    public AddClass(classes: string);
    public AddClass(getClasses: (index: number, classes: string) => string);

    public AddClass(classes: any) {
      var fn;
      if (Is(classes, "string")) this.EachOfType(HTMLElement, (el: HTMLElement, idx, arr) => el.classList.add(classes));
      else if (Is(classes, "function")) this.EachOfType(HTMLElement, (el: HTMLElement, idx, arr) => el.classList.add(classes.call(el, idx, el.className)));
      return this;
    }

    private InsertAdjacent(position: string, item: string, extra?: any[]);
    private InsertAdjacent(position: string, item: Element, extra?: any[]);
    private InsertAdjacent(position: string, item: Element[], extra?: any[]);
    private InsertAdjacent(position: string, item: Query, extra?: any[]);
    private InsertAdjacent(position: string, item: (idx: number, html: string) => any, gethtml: (HTMLElement) => string);

    private InsertAdjacent(position: string, item: any, extra: any = []) {
      if (Is(item, "function")) {
        this.EachOfType(Element, (el: HTMLElement, idx, arr) => {
          var itm = item(el, idx, el.outerHTML);
          if (Is(itm, "string")) el.insertAdjacentHTML(position, itm);
          else if (Is(itm, Element)) el.insertAdjacentElement(position, itm);
          else if (Is(itm, Query)) itm = itm.els;
          if (Is(itm, "array")) itm.forEach(l => el.insertAdjacentElement(position, l));
        });
      }
      else if (Is(item, "string")) this.EachOfType(Element, (el: HTMLElement, idx, arr) => el.insertAdjacentHTML(position, item));
      else if (Is(item, Element)) {
        var doClone = false;
        this.EachOfType(Element, (el: HTMLElement, idx, arr) => el.insertAdjacentElement(position, doClone ? item.cloneNode(true) : doClone = true && item));
      }
      else if (Is(item, Query)) item = item.els;
      if (Is(item, "array")) {
        var doClone = false;
        item.forEach(el => this.InsertAdjacent(position, doClone ? el.cloneNode(true) : doClone = true && item));
      }
      if (extra.length) {
        if (Is(extra[0], "function")) while (Is(extra.shift(), "function"));
        this.InsertAdjacent(position, extra.shift(), extra);
      }
    }

    private InsertAdjacentTo(position: string, target: string);
    private InsertAdjacentTo(position: string, target: Element);
    private InsertAdjacentTo(position: string, target: Element[]);
    private InsertAdjacentTo(position: string, target: Query);

    private InsertAdjacentTo(position: string, target: any) {
      new Query(target).InsertAdjacent(position, <Element[]>this.els);
    }

    public After(item: string, ...extra: any[]);
    public After(item: Element, ...extra: any[]);
    public After(item: Element[], ...extra: any[]);
    public After(item: Query, ...extra: any[]);
    public After(func: (idx: number, html: string) => any);

    public After(item: any, ...extra: any[]) {
      if (Is(item, "function")) this.InsertAdjacent("afterend", item, el => el.outerHTML);
      else this.InsertAdjacent("afterend", item, extra);
      return this;
    }

    public Append(item: string, ...extra: any[]);
    public Append(item: Element, ...extra: any[]);
    public Append(item: Element[], ...extra: any[]);
    public Append(item: Query, ...extra: any[]);
    public Append(func: (idx: number, html: string) => any);

    public Append(item: any, ...extra: any[]) {
      if (Is(item, "function")) this.InsertAdjacent("beforeend", item, el => el.innerHTML);
      else this.InsertAdjacent("beforeend", item, extra);
      return this;
    }

    public AppendTo(target: string);
    public AppendTo(target: Element);
    public AppendTo(target: Element[]);
    public AppendTo(target: Query);

    public AppendTo(target: any) {
      this.InsertAdjacentTo("beforeend", target);
      return this;
    }

    public Attr(name: string);
    public Attr(name: string, value: string);
    public Attr(attrs: { [name: string]: string });
    public Attr(name: string, func: (el: Element, idx: number, val: string) => any);

    public Attr(name: any, value?: any) {
      if (Is(name, "string")) {
        if (Is(value, null)) {
          if (this.els.length) return (<Element>this.els[0]).getAttribute(name);
        }
        else if (Is(value, "string")) this.EachOfType(Element, (el: Element, idx, arr) => el.setAttribute(name, value));
        else if (Is(value, "function")) this.EachOfType(Element, (el: Element, idx, arr) => el.setAttribute(name, value(el, idx, el.getAttribute(name))));
      }
      else if (Is(name, "object")) {
        var keys = Object.keys(name);
        for (var i = 0; i < keys.length; i++) {
          this.Attr(keys[i], name[keys[i]]);
        }
      }
    }

    public Before(item: string, ...extra: any[]);
    public Before(item: Element, ...extra: any[]);
    public Before(item: Element[], ...extra: any[]);
    public Before(item: Query, ...extra: any[]);
    public Before(func: (idx: number, html: string) => any);

    public Before(item: any, ...extra: any[]) {
      if (Is(item, "function")) this.InsertAdjacent("beforestart", item, el => el.outerHTML);
      else this.InsertAdjacent("beforestart", item, extra);
      return this;
    }

    public Clone(doCloneData: boolean = false, doDeepCloneData?: boolean) {
      var els = [];
      this.EachOfType(Node, (el: Node, idx, arr) => {
        var cloned;
        els.push(cloned = el.cloneNode(true));

      });
      return this.Reconstruct(new Query(els));
    }

    //Events

    private AddEventListener(events: string, func: (evt: Event) => any, doCapture?: boolean);
    private AddEventListener(events: string, handler: EventListener, doCapture?: boolean);

    private AddEventListener(events: string, func: any, doCapture: boolean = false) {
      var eventList = events.split(" ");
      for (var i = 0; i < eventList.length; i++) {
        this.EachOfType(EventTarget, (el: EventTarget, idx, arr) => el.addEventListener(eventList[i], func, doCapture));
      }
    }

    private DispatchEvent(event: string) {
      this.EachOfType(EventTarget, (el: EventTarget, idx, arr) => el.dispatchEvent(new Event()));
    }

    public Bind(events: string, func: (evt: Event) => any, doCapture?: boolean);
    public Bind(events: string, handler: EventListener, doCapture?: boolean);

    public Bind(events: string, func: any, doCapture: boolean = false) {
      this.AddEventListener(events, func, doCapture);
      return this;
    }

    public Blur(func: (evt: Event) => any, doCapture?: boolean);
    public Blur(handler: EventListener, doCapture?: boolean);
    public Blur();

    public Blur(func?: any, doCapture: boolean = false) {
      if (func) this.AddEventListener("blur", func, doCapture);
      else this.EachOfType(HTMLElement, (el: HTMLElement) => el.click());
      return this;
    }

    public Change(func: (evt: Event) => any, doCapture?: boolean);
    public Change(handler: EventListener, doCapture?: boolean);

    public Change(func: any, doCapture: boolean = false) {
      this.AddEventListener("change", func, doCapture);
      return this;
    }

    public Click(func: (evt: Event) => any, doCapture?: boolean);
    public Click(handler: EventListener, doCapture?: boolean);

    public Click(func: any, doCapture: boolean = false) {
      this.AddEventListener("click", func, doCapture);
      return this;
    }
  }
}

import rk = rkLib;

var $ = rkLib;