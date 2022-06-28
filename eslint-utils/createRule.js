"use strict";
exports.__esModule = true;
exports.createRule = void 0;
var utils_1 = require("@typescript-eslint/utils");
exports.createRule = utils_1.ESLintUtils.RuleCreator(function (name) { return "https://typescript-eslint.io/rules/".concat(name); });
