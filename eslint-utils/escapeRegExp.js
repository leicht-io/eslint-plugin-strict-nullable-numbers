"use strict";
exports.__esModule = true;
exports.escapeRegExp = void 0;
/**
 * Lodash <https://lodash.com/>
 * Released under MIT license <https://lodash.com/license>
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reHasRegExpChar = RegExp(reRegExpChar.source);
function escapeRegExp(string) {
    if (string === void 0) { string = ''; }
    return string && reHasRegExpChar.test(string)
        ? string.replace(reRegExpChar, '\\$&')
        : string;
}
exports.escapeRegExp = escapeRegExp;
