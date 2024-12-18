var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/path-to-regexp/dist/index.js
var require_dist = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.pathToRegexp = exports.tokensToRegexp = exports.regexpToFunction = exports.match = exports.tokensToFunction = exports.compile = exports.parse = undefined;
  function lexer(str) {
    var tokens = [];
    var i = 0;
    while (i < str.length) {
      var char = str[i];
      if (char === "*" || char === "+" || char === "?") {
        tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
        continue;
      }
      if (char === "\\") {
        tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
        continue;
      }
      if (char === "{") {
        tokens.push({ type: "OPEN", index: i, value: str[i++] });
        continue;
      }
      if (char === "}") {
        tokens.push({ type: "CLOSE", index: i, value: str[i++] });
        continue;
      }
      if (char === ":") {
        var name = "";
        var j = i + 1;
        while (j < str.length) {
          var code = str.charCodeAt(j);
          if (code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 95) {
            name += str[j++];
            continue;
          }
          break;
        }
        if (!name)
          throw new TypeError("Missing parameter name at ".concat(i));
        tokens.push({ type: "NAME", index: i, value: name });
        i = j;
        continue;
      }
      if (char === "(") {
        var count = 1;
        var pattern = "";
        var j = i + 1;
        if (str[j] === "?") {
          throw new TypeError('Pattern cannot start with "?" at '.concat(j));
        }
        while (j < str.length) {
          if (str[j] === "\\") {
            pattern += str[j++] + str[j++];
            continue;
          }
          if (str[j] === ")") {
            count--;
            if (count === 0) {
              j++;
              break;
            }
          } else if (str[j] === "(") {
            count++;
            if (str[j + 1] !== "?") {
              throw new TypeError("Capturing groups are not allowed at ".concat(j));
            }
          }
          pattern += str[j++];
        }
        if (count)
          throw new TypeError("Unbalanced pattern at ".concat(i));
        if (!pattern)
          throw new TypeError("Missing pattern at ".concat(i));
        tokens.push({ type: "PATTERN", index: i, value: pattern });
        i = j;
        continue;
      }
      tokens.push({ type: "CHAR", index: i, value: str[i++] });
    }
    tokens.push({ type: "END", index: i, value: "" });
    return tokens;
  }
  function parse(str, options) {
    if (options === undefined) {
      options = {};
    }
    var tokens = lexer(str);
    var _a = options.prefixes, prefixes = _a === undefined ? "./" : _a, _b = options.delimiter, delimiter = _b === undefined ? "/#?" : _b;
    var result = [];
    var key = 0;
    var i = 0;
    var path = "";
    var tryConsume = function(type) {
      if (i < tokens.length && tokens[i].type === type)
        return tokens[i++].value;
    };
    var mustConsume = function(type) {
      var value2 = tryConsume(type);
      if (value2 !== undefined)
        return value2;
      var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
      throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
    };
    var consumeText = function() {
      var result2 = "";
      var value2;
      while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
        result2 += value2;
      }
      return result2;
    };
    var isSafe = function(value2) {
      for (var _i = 0, delimiter_1 = delimiter;_i < delimiter_1.length; _i++) {
        var char2 = delimiter_1[_i];
        if (value2.indexOf(char2) > -1)
          return true;
      }
      return false;
    };
    var safePattern = function(prefix2) {
      var prev = result[result.length - 1];
      var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
      if (prev && !prevText) {
        throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
      }
      if (!prevText || isSafe(prevText))
        return "[^".concat(escapeString(delimiter), "]+?");
      return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
    };
    while (i < tokens.length) {
      var char = tryConsume("CHAR");
      var name = tryConsume("NAME");
      var pattern = tryConsume("PATTERN");
      if (name || pattern) {
        var prefix = char || "";
        if (prefixes.indexOf(prefix) === -1) {
          path += prefix;
          prefix = "";
        }
        if (path) {
          result.push(path);
          path = "";
        }
        result.push({
          name: name || key++,
          prefix,
          suffix: "",
          pattern: pattern || safePattern(prefix),
          modifier: tryConsume("MODIFIER") || ""
        });
        continue;
      }
      var value = char || tryConsume("ESCAPED_CHAR");
      if (value) {
        path += value;
        continue;
      }
      if (path) {
        result.push(path);
        path = "";
      }
      var open = tryConsume("OPEN");
      if (open) {
        var prefix = consumeText();
        var name_1 = tryConsume("NAME") || "";
        var pattern_1 = tryConsume("PATTERN") || "";
        var suffix = consumeText();
        mustConsume("CLOSE");
        result.push({
          name: name_1 || (pattern_1 ? key++ : ""),
          pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
          prefix,
          suffix,
          modifier: tryConsume("MODIFIER") || ""
        });
        continue;
      }
      mustConsume("END");
    }
    return result;
  }
  exports.parse = parse;
  function compile(str, options) {
    return tokensToFunction(parse(str, options), options);
  }
  exports.compile = compile;
  function tokensToFunction(tokens, options) {
    if (options === undefined) {
      options = {};
    }
    var reFlags = flags(options);
    var _a = options.encode, encode = _a === undefined ? function(x) {
      return x;
    } : _a, _b = options.validate, validate = _b === undefined ? true : _b;
    var matches = tokens.map(function(token) {
      if (typeof token === "object") {
        return new RegExp("^(?:".concat(token.pattern, ")$"), reFlags);
      }
    });
    return function(data) {
      var path = "";
      for (var i = 0;i < tokens.length; i++) {
        var token = tokens[i];
        if (typeof token === "string") {
          path += token;
          continue;
        }
        var value = data ? data[token.name] : undefined;
        var optional = token.modifier === "?" || token.modifier === "*";
        var repeat = token.modifier === "*" || token.modifier === "+";
        if (Array.isArray(value)) {
          if (!repeat) {
            throw new TypeError('Expected "'.concat(token.name, '" to not repeat, but got an array'));
          }
          if (value.length === 0) {
            if (optional)
              continue;
            throw new TypeError('Expected "'.concat(token.name, '" to not be empty'));
          }
          for (var j = 0;j < value.length; j++) {
            var segment = encode(value[j], token);
            if (validate && !matches[i].test(segment)) {
              throw new TypeError('Expected all "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
            }
            path += token.prefix + segment + token.suffix;
          }
          continue;
        }
        if (typeof value === "string" || typeof value === "number") {
          var segment = encode(String(value), token);
          if (validate && !matches[i].test(segment)) {
            throw new TypeError('Expected "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
          }
          path += token.prefix + segment + token.suffix;
          continue;
        }
        if (optional)
          continue;
        var typeOfMessage = repeat ? "an array" : "a string";
        throw new TypeError('Expected "'.concat(token.name, '" to be ').concat(typeOfMessage));
      }
      return path;
    };
  }
  exports.tokensToFunction = tokensToFunction;
  function match(str, options) {
    var keys = [];
    var re = pathToRegexp(str, keys, options);
    return regexpToFunction(re, keys, options);
  }
  exports.match = match;
  function regexpToFunction(re, keys, options) {
    if (options === undefined) {
      options = {};
    }
    var _a = options.decode, decode = _a === undefined ? function(x) {
      return x;
    } : _a;
    return function(pathname) {
      var m = re.exec(pathname);
      if (!m)
        return false;
      var path = m[0], index = m.index;
      var params = Object.create(null);
      var _loop_1 = function(i2) {
        if (m[i2] === undefined)
          return "continue";
        var key = keys[i2 - 1];
        if (key.modifier === "*" || key.modifier === "+") {
          params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
            return decode(value, key);
          });
        } else {
          params[key.name] = decode(m[i2], key);
        }
      };
      for (var i = 1;i < m.length; i++) {
        _loop_1(i);
      }
      return { path, index, params };
    };
  }
  exports.regexpToFunction = regexpToFunction;
  function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
  }
  function flags(options) {
    return options && options.sensitive ? "" : "i";
  }
  function regexpToRegexp(path, keys) {
    if (!keys)
      return path;
    var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
    var index = 0;
    var execResult = groupsRegex.exec(path.source);
    while (execResult) {
      keys.push({
        name: execResult[1] || index++,
        prefix: "",
        suffix: "",
        modifier: "",
        pattern: ""
      });
      execResult = groupsRegex.exec(path.source);
    }
    return path;
  }
  function arrayToRegexp(paths, keys, options) {
    var parts = paths.map(function(path) {
      return pathToRegexp(path, keys, options).source;
    });
    return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
  }
  function stringToRegexp(path, keys, options) {
    return tokensToRegexp(parse(path, options), keys, options);
  }
  function tokensToRegexp(tokens, keys, options) {
    if (options === undefined) {
      options = {};
    }
    var _a = options.strict, strict = _a === undefined ? false : _a, _b = options.start, start = _b === undefined ? true : _b, _c = options.end, end = _c === undefined ? true : _c, _d = options.encode, encode = _d === undefined ? function(x) {
      return x;
    } : _d, _e = options.delimiter, delimiter = _e === undefined ? "/#?" : _e, _f = options.endsWith, endsWith = _f === undefined ? "" : _f;
    var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
    var delimiterRe = "[".concat(escapeString(delimiter), "]");
    var route = start ? "^" : "";
    for (var _i = 0, tokens_1 = tokens;_i < tokens_1.length; _i++) {
      var token = tokens_1[_i];
      if (typeof token === "string") {
        route += escapeString(encode(token));
      } else {
        var prefix = escapeString(encode(token.prefix));
        var suffix = escapeString(encode(token.suffix));
        if (token.pattern) {
          if (keys)
            keys.push(token);
          if (prefix || suffix) {
            if (token.modifier === "+" || token.modifier === "*") {
              var mod = token.modifier === "*" ? "?" : "";
              route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
            } else {
              route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
            }
          } else {
            if (token.modifier === "+" || token.modifier === "*") {
              throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
            }
            route += "(".concat(token.pattern, ")").concat(token.modifier);
          }
        } else {
          route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
        }
      }
    }
    if (end) {
      if (!strict)
        route += "".concat(delimiterRe, "?");
      route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
    } else {
      var endToken = tokens[tokens.length - 1];
      var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === undefined;
      if (!strict) {
        route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
      }
      if (!isEndDelimited) {
        route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
      }
    }
    return new RegExp(route, flags(options));
  }
  exports.tokensToRegexp = tokensToRegexp;
  function pathToRegexp(path, keys, options) {
    if (path instanceof RegExp)
      return regexpToRegexp(path, keys);
    if (Array.isArray(path))
      return arrayToRegexp(path, keys, options);
    return stringToRegexp(path, keys, options);
  }
  exports.pathToRegexp = pathToRegexp;
});

// node_modules/cookie/dist/index.js
var require_dist2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parse = parse;
  exports.serialize = serialize;
  var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
  var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
  var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
  var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
  var __toString = Object.prototype.toString;
  var NullObject = /* @__PURE__ */ (() => {
    const C = function() {
    };
    C.prototype = Object.create(null);
    return C;
  })();
  function parse(str, options) {
    const obj = new NullObject;
    const len = str.length;
    if (len < 2)
      return obj;
    const dec = options?.decode || decode;
    let index = 0;
    do {
      const eqIdx = str.indexOf("=", index);
      if (eqIdx === -1)
        break;
      const colonIdx = str.indexOf(";", index);
      const endIdx = colonIdx === -1 ? len : colonIdx;
      if (eqIdx > endIdx) {
        index = str.lastIndexOf(";", eqIdx - 1) + 1;
        continue;
      }
      const keyStartIdx = startIndex(str, index, eqIdx);
      const keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
      const key = str.slice(keyStartIdx, keyEndIdx);
      if (obj[key] === undefined) {
        let valStartIdx = startIndex(str, eqIdx + 1, endIdx);
        let valEndIdx = endIndex(str, endIdx, valStartIdx);
        const value = dec(str.slice(valStartIdx, valEndIdx));
        obj[key] = value;
      }
      index = endIdx + 1;
    } while (index < len);
    return obj;
  }
  function startIndex(str, index, max) {
    do {
      const code = str.charCodeAt(index);
      if (code !== 32 && code !== 9)
        return index;
    } while (++index < max);
    return max;
  }
  function endIndex(str, index, min) {
    while (index > min) {
      const code = str.charCodeAt(--index);
      if (code !== 32 && code !== 9)
        return index + 1;
    }
    return min;
  }
  function serialize(name, val, options) {
    const enc = options?.encode || encodeURIComponent;
    if (!cookieNameRegExp.test(name)) {
      throw new TypeError(`argument name is invalid: ${name}`);
    }
    const value = enc(val);
    if (!cookieValueRegExp.test(value)) {
      throw new TypeError(`argument val is invalid: ${val}`);
    }
    let str = name + "=" + value;
    if (!options)
      return str;
    if (options.maxAge !== undefined) {
      if (!Number.isInteger(options.maxAge)) {
        throw new TypeError(`option maxAge is invalid: ${options.maxAge}`);
      }
      str += "; Max-Age=" + options.maxAge;
    }
    if (options.domain) {
      if (!domainValueRegExp.test(options.domain)) {
        throw new TypeError(`option domain is invalid: ${options.domain}`);
      }
      str += "; Domain=" + options.domain;
    }
    if (options.path) {
      if (!pathValueRegExp.test(options.path)) {
        throw new TypeError(`option path is invalid: ${options.path}`);
      }
      str += "; Path=" + options.path;
    }
    if (options.expires) {
      if (!isDate(options.expires) || !Number.isFinite(options.expires.valueOf())) {
        throw new TypeError(`option expires is invalid: ${options.expires}`);
      }
      str += "; Expires=" + options.expires.toUTCString();
    }
    if (options.httpOnly) {
      str += "; HttpOnly";
    }
    if (options.secure) {
      str += "; Secure";
    }
    if (options.partitioned) {
      str += "; Partitioned";
    }
    if (options.priority) {
      const priority = typeof options.priority === "string" ? options.priority.toLowerCase() : undefined;
      switch (priority) {
        case "low":
          str += "; Priority=Low";
          break;
        case "medium":
          str += "; Priority=Medium";
          break;
        case "high":
          str += "; Priority=High";
          break;
        default:
          throw new TypeError(`option priority is invalid: ${options.priority}`);
      }
    }
    if (options.sameSite) {
      const sameSite = typeof options.sameSite === "string" ? options.sameSite.toLowerCase() : options.sameSite;
      switch (sameSite) {
        case true:
        case "strict":
          str += "; SameSite=Strict";
          break;
        case "lax":
          str += "; SameSite=Lax";
          break;
        case "none":
          str += "; SameSite=None";
          break;
        default:
          throw new TypeError(`option sameSite is invalid: ${options.sameSite}`);
      }
    }
    return str;
  }
  function decode(str) {
    if (str.indexOf("%") === -1)
      return str;
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }
  function isDate(val) {
    return __toString.call(val) === "[object Date]";
  }
});

// src/extension.ts
import assert from "node:assert";

// src/parser.ts
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// src/utils/toRegExp.ts
function toRegExp(pattern, flags = "g") {
  if (pattern.startsWith("(?i)")) {
    pattern = pattern.substring(4);
    flags += "i";
  }
  return new RegExp(pattern, flags);
}

// src/utils/toPathRegexp.ts
var import_path_to_regexp = __toESM(require_dist(), 1);
function toPathRegexp(path) {
  if (path) {
    try {
      return import_path_to_regexp.pathToRegexp(path);
    } catch (e) {
      console.log(">> Invalid route pattern", path);
      throw e;
    }
  } else {
    return /^.*$/;
  }
}

// src/conditionals.ts
var CONDITIONALS = {
  EQUALS_EXPRESS: "==",
  EQUALS: "===",
  AND: "and",
  OR: "or",
  NOT_EQUALS_EXPRESS: "!=",
  NOT_EQUALS: "!==",
  MATCHES: "=~",
  NOT_MATCHES: "!~",
  GREATER_THAN: ">",
  GREATER_THAN_OR_EQUALS: ">=",
  LESS_THAN: "<",
  LESS_THAN_OR_EQUALS: "<=",
  IN: "in",
  NOT_IN: "not_in"
};
var OPERATIONS = {
  [CONDITIONALS.EQUALS]: (l, r) => l === r,
  [CONDITIONALS.NOT_EQUALS]: (l, r) => l !== r,
  [CONDITIONALS.EQUALS_EXPRESS]: (l, r) => toPathRegexp(r).test(l?.toString() ?? ""),
  [CONDITIONALS.NOT_EQUALS_EXPRESS]: (l, r) => !toPathRegexp(r).test(l?.toString() ?? ""),
  [CONDITIONALS.LESS_THAN]: (l, r) => Number(l) < Number(r),
  [CONDITIONALS.LESS_THAN_OR_EQUALS]: (l, r) => Number(l) <= Number(r),
  [CONDITIONALS.GREATER_THAN]: (l, r) => Number(l) > Number(r),
  [CONDITIONALS.GREATER_THAN_OR_EQUALS]: (l, r) => Number(l) >= Number(r),
  [CONDITIONALS.MATCHES]: (l, r) => toRegExp(r).test(l?.toString() ?? ""),
  [CONDITIONALS.NOT_MATCHES]: (l, r) => !toRegExp(r).test(l?.toString() ?? ""),
  [CONDITIONALS.IN]: (l, r) => r?.some((item) => l?.toString() === item?.toString()),
  [CONDITIONALS.NOT_IN]: (l, r) => !r?.some((item) => l?.toString() === item?.toString()),
  [CONDITIONALS.AND]: (ary, requestContext) => ary.every((c) => c.evaluate(requestContext)),
  [CONDITIONALS.OR]: (ary, requestContext) => ary.some((c) => c.evaluate(requestContext))
};
var CONDITIONAL_OPERANDS = new Set(Object.values(CONDITIONALS));

class ConditionalBase {
}

class ConditionalMatch extends ConditionalBase {
  key;
  value;
  static tag = "";
  constructor(obj) {
    super();
    this.key = obj[0];
    this.value = obj[1];
  }
  evaluate(requestContext) {
    const left = requestContext.resolveKey(this.key);
    const right = this.value;
    const result = OPERATIONS[this.constructor.tag](left, right);
    return result;
  }
}

class ConditionalGroup extends ConditionalBase {
  values;
  constructor(obj) {
    super();
    this.values = obj.flatMap((e) => Object.values(e));
  }
  evaluate(requestContext) {
    return OPERATIONS[this.constructor.tag](this.values, requestContext);
  }
}

class ConditionalEqualsExpress extends ConditionalMatch {
  static tag = CONDITIONALS.EQUALS_EXPRESS;
}

class ConditionalEquals extends ConditionalMatch {
  static tag = CONDITIONALS.EQUALS;
}

class ConditionalAnd extends ConditionalGroup {
  static tag = CONDITIONALS.AND;
}

class ConditionalOr extends ConditionalGroup {
  static tag = CONDITIONALS.OR;
}

class ConditionalNotEqualsExpress extends ConditionalMatch {
  static tag = CONDITIONALS.NOT_EQUALS_EXPRESS;
}

class ConditionalNotEquals extends ConditionalMatch {
  static tag = CONDITIONALS.NOT_EQUALS;
}

class ConditionalMatches extends ConditionalMatch {
  static tag = CONDITIONALS.MATCHES;
}

class ConditionalNotMatches extends ConditionalMatch {
  static tag = CONDITIONALS.NOT_MATCHES;
}

class ConditionalGreaterThan extends ConditionalMatch {
  static tag = CONDITIONALS.GREATER_THAN;
}

class ConditionalGreaterThanOrEquals extends ConditionalMatch {
  static tag = CONDITIONALS.GREATER_THAN_OR_EQUALS;
}

class ConditionalLessThan extends ConditionalMatch {
  static tag = CONDITIONALS.LESS_THAN;
}

class ConditionalLessThanOrEquals extends ConditionalMatch {
  static tag = CONDITIONALS.LESS_THAN_OR_EQUALS;
}

class ConditionalIn extends ConditionalMatch {
  static tag = CONDITIONALS.IN;
}

class ConditionalNotIn extends ConditionalMatch {
  static tag = CONDITIONALS.NOT_IN;
}
var ConditionalLookup = {
  [CONDITIONALS.EQUALS_EXPRESS]: ConditionalEqualsExpress,
  [CONDITIONALS.EQUALS]: ConditionalEquals,
  [CONDITIONALS.AND]: ConditionalAnd,
  [CONDITIONALS.OR]: ConditionalOr,
  [CONDITIONALS.NOT_EQUALS_EXPRESS]: ConditionalNotEqualsExpress,
  [CONDITIONALS.NOT_EQUALS]: ConditionalNotEquals,
  [CONDITIONALS.MATCHES]: ConditionalMatches,
  [CONDITIONALS.NOT_MATCHES]: ConditionalNotMatches,
  [CONDITIONALS.GREATER_THAN]: ConditionalGreaterThan,
  [CONDITIONALS.GREATER_THAN_OR_EQUALS]: ConditionalGreaterThanOrEquals,
  [CONDITIONALS.LESS_THAN]: ConditionalLessThan,
  [CONDITIONALS.LESS_THAN_OR_EQUALS]: ConditionalLessThanOrEquals,
  [CONDITIONALS.IN]: ConditionalIn,
  [CONDITIONALS.NOT_IN]: ConditionalNotIn
};

class ConditionalHelper {
  static isKeyConditional(key) {
    return CONDITIONAL_OPERANDS.has(key);
  }
  static instanceByOperator(operator, value) {
    return new ConditionalLookup[operator](value);
  }
}

// src/rules.ts
class Rule {
  _conditions;
  _features;
  constructor(conditions, features) {
    this._conditions = conditions;
    this._features = features;
  }
  evaluate(requestContext) {
    return Object.values(this._conditions).map((c) => c.evaluate(requestContext)).every(Boolean);
  }
  get features() {
    return this._features;
  }
}

class AlwaysRule extends Rule {
  constructor(features) {
    super(null, features);
  }
  evaluate(requestContext) {
    return true;
  }
}

class RuleHelper {
  static revive(value, context) {
    let [condition, features] = value;
    return new Rule(condition, features);
  }
}

// src/parser.ts
class EdgeControlParser {
  _path;
  constructor(path) {
    this._path = resolve(path);
    if (!existsSync(this._path)) {
      throw new Error(`File not found: ${this._path}`);
    }
  }
  async parse() {
    const text = readFileSync(this._path, "utf-8");
    const { rules } = JSON.parse(text, EdgeControlParser.JSONReviver);
    return {
      rules: rules.map((r) => {
        return r instanceof Rule ? r : new AlwaysRule(r);
      })
    };
  }
  static reviveConditional(key, value, context) {
    return ConditionalHelper.instanceByOperator(key, value);
  }
  static reviveRule(value, context) {
    return RuleHelper.revive(value, context);
  }
  static JSONReviver(key, value, context) {
    if (ConditionalHelper.isKeyConditional(key))
      return EdgeControlParser.reviveConditional(key, value, context);
    if (key === "if")
      return EdgeControlParser.reviveRule(value, context);
    if (value["if"] instanceof Rule)
      return value["if"];
    if (typeof value === "string") {
      if (/^true$/.test(value))
        return true;
      if (/^false$/.test(value))
        return false;
      if (/^\d+$/.test(value)) {
        return parseInt(value);
      }
    }
    return value;
  }
}

// src/request.ts
var import_cookie = __toESM(require_dist2(), 1);

class RequestContext {
  obj;
  request;
  constructor(obj) {
    this.obj = obj;
    this.request = {
      get(value) {
        return obj[value];
      },
      cookie: {
        get(value) {
          return obj.cookies.get(value);
        }
      },
      header: {
        get(value) {
          return obj.headers.get(value);
        }
      },
      origin_query: {
        get(value) {
          return new URLSearchParams(obj.path).get(value);
        }
      }
    };
  }
  static fromRequest(request) {
    const { protocol: scheme, method, pathname: path, headers } = request;
    const cookies = new Map(Object.entries(import_cookie.parse(headers.get("cookie") || "")));
    return new RequestContext({
      scheme,
      path,
      method,
      headers,
      cookies
    });
  }
  resolveKey(key) {
    let resolved;
    Object.entries(key).forEach(([name, value]) => {
      resolved = name.split(".").reduce((a, b) => a[b], this).get(value);
    });
    return resolved;
  }
}

// src/utils/deepMerge.ts
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}
function deepMerge(target, ...sources) {
  if (!sources.length)
    return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key])
          Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return deepMerge(target, ...sources);
}

// src/handlers.ts
import { spawnSync } from "child_process";
import path from "node:path";
import { tmpdir } from "os";
import fs from "fs/promises";
var handlerBuildCache = new Map;

class ProxyHandlerImpl {
  static HINT = "proxy";
  handlerName;
  handler;
  constructor(handlerName, handlerPath) {
    this.handlerName = handlerName;
    this.handler = buildAndImportHandler(handlerPath).then((handler) => {
      logger.info(`Handler '${handlerName}' built successfully.`);
      return handler;
    });
  }
  get transformRequest() {
    return async (request) => {
      const handlerModule = await this.handler;
      return handlerModule.transformRequest(request);
    };
  }
  get transformResponse() {
    return async (rawBody, response, request) => {
      const handlerModule = await this.handler;
      return handlerModule.transformResponse(rawBody, response, request);
    };
  }
  async handleRequest(request, response) {
  }
}

class ComputeHandlerImpl {
  static HINT = "compute";
  async handleRequest(request, response) {
    console.log("ComputeHandler handling request.");
  }
}

class Handler {
  _handler;
  constructor(handler) {
    this._handler = handler;
  }
  static validateHandlers(rules, config) {
    const handlerTypes = [ProxyHandlerImpl, ComputeHandlerImpl];
    return rules.reduce((acc, rule) => {
      const handlerName = rule.features?.headers?.set_request_headers?.["+x-cloud-functions-hint"];
      if (!handlerName)
        return acc;
      const [handlerType, handlerId] = handlerName.split(":");
      if (!handlerType || !handlerId)
        return acc;
      const MatchedHandler = handlerTypes.find((handler) => handler.HINT === handlerType);
      if (MatchedHandler) {
        const configHandler = config?.[handlerName];
        if (!configHandler) {
          logger.warn(`Missing handler '${handlerName}' in config.yaml.`);
          return acc;
        }
        acc[handlerName] = new MatchedHandler(handlerName, configHandler);
      }
      return acc;
    }, {});
  }
}
async function buildAndImportHandler(handlerPath) {
  if (handlerBuildCache.has(handlerPath)) {
    return handlerBuildCache.get(handlerPath);
  }
  const buildPromise = (async () => {
    const tmpOutputPath = path.join(tmpdir(), `handler_${Date.now()}.mjs`);
    handlerPath = path.resolve(handlerPath);
    const buildResult = spawnSync("bun", ["build", handlerPath, "--target", "node", "--format", "esm", "--outfile", tmpOutputPath], {
      encoding: "utf-8"
    });
    if (buildResult.error || buildResult.status !== 0) {
      throw new Error(`Bun build failed: ${buildResult.stderr || buildResult.error?.message}`);
    }
    const module = await import(`file://${tmpOutputPath}`);
    await fs.unlink(tmpOutputPath).catch(() => {
    });
    return module.default || module;
  })();
  handlerBuildCache.set(handlerPath, buildPromise);
  try {
    const result = await buildPromise;
    return result;
  } catch (err) {
    handlerBuildCache.delete(handlerPath);
    throw err;
  }
}

// src/globals.ts
var extensionPrefix = "[edge-control-parser]";
global.logInfo = (message) => {
  logger.info(`${extensionPrefix} ${message}`);
};
global.logDebug = (message) => {
  logger.debug(`${extensionPrefix} ${message}`);
};
global.logError = (message) => {
  logger.error(`${extensionPrefix} ${message}`);
};
global.logWarn = (message) => {
  logger.warn(`${extensionPrefix} ${message}`);
};

// src/extension.ts
function assertType(name, option, expectedType) {
  if (option) {
    const found = typeof option;
    assert.strictEqual(found, expectedType, `${name} must be type ${expectedType}. Received: ${found}`);
  }
}
function resolveConfig(options) {
  assertType("edgeControlPath", options.edgeControlPath, "string");
  assertType("handlers", options.handlers, "object");
  if (options.handlers) {
    Object.entries(options.handlers).forEach(([key, value]) => {
      assertType(key, value, "string");
    });
  }
  return {
    edgeControlPath: options.edgeControlPath,
    handlers: options.handlers
  };
}
function startOnMainThread(options) {
  const config = resolveConfig(options);
  return {
    async setupDirectory(_, componentPath) {
      return true;
    }
  };
}
function start(options) {
  const config = resolveConfig(options);
  logInfo(`Starting extension...`);
  return {
    async handleDirectory(_, componentPath) {
      const parser = new EdgeControlParser(config.edgeControlPath);
      const { rules } = await parser.parse();
      const handlers = await Handler.validateHandlers(rules, config.handlers);
      console.log(handlers);
      options.server.http(async (request, nextHandler) => {
        const { _nodeRequest: req, _nodeResponse: res } = request;
        request.edgio = { ...request.edgio, ...{ proxyHandler: null } };
        const context = RequestContext.fromRequest(request);
        const applicableRules = rules.filter((r) => {
          return r.evaluate(context);
        }).map((r) => r.features);
        const mergedRules = applicableRules.reduce((acc, value) => deepMerge(acc, value), {});
        logDebug(`>> Applicable rules: ${JSON.stringify(mergedRules, null, 2)}`);
        if (mergedRules.headers?.set_request_headers?.["+x-cloud-functions-hint"]) {
          const handlerName = mergedRules.headers?.set_request_headers?.["+x-cloud-functions-hint"];
          const handler = handlers[handlerName];
          request.edgio.proxyHandler = handler;
        }
        nextHandler(request);
      });
      return true;
    }
  };
}
export {
  startOnMainThread,
  start
};
