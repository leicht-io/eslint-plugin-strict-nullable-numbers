"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.NullThrowsReasons = exports.nullThrows = exports.getParserServices = exports.isObjectNotArray = exports.deepMerge = exports.applyDefault = void 0;
var utils_1 = require("@typescript-eslint/utils");
__exportStar(require("./astUtils"), exports);
__exportStar(require("./collectUnusedVariables"), exports);
__exportStar(require("./createRule"), exports);
__exportStar(require("./getFunctionHeadLoc"), exports);
__exportStar(require("./getOperatorPrecedence"), exports);
__exportStar(require("./getThisExpression"), exports);
__exportStar(require("./getWrappingFixer"), exports);
__exportStar(require("./misc"), exports);
__exportStar(require("./objectIterators"), exports);
// this is done for convenience - saves migrating all of the old rules
__exportStar(require("@typescript-eslint/type-utils"), exports);
var applyDefault = utils_1.ESLintUtils.applyDefault, deepMerge = utils_1.ESLintUtils.deepMerge, isObjectNotArray = utils_1.ESLintUtils.isObjectNotArray, getParserServices = utils_1.ESLintUtils.getParserServices, nullThrows = utils_1.ESLintUtils.nullThrows, NullThrowsReasons = utils_1.ESLintUtils.NullThrowsReasons;
exports.applyDefault = applyDefault;
exports.deepMerge = deepMerge;
exports.isObjectNotArray = isObjectNotArray;
exports.getParserServices = getParserServices;
exports.nullThrows = nullThrows;
exports.NullThrowsReasons = NullThrowsReasons;
