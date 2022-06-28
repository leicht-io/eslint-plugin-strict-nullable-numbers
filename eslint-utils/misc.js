"use strict";
/**
 * @fileoverview Really small utility functions that didn't deserve their own files
 */
exports.__esModule = true;
exports.upperCaseFirst = exports.MemberNameType = exports.isDefinitionFile = exports.getNameFromMember = exports.getNameFromIndexSignature = exports.getEnumNames = exports.formatWordList = exports.findFirstResult = exports.arraysAreEqual = exports.arrayGroupByToMap = void 0;
var utils_1 = require("@typescript-eslint/utils");
var type_utils_1 = require("@typescript-eslint/type-utils");
var ts = require("typescript");
var DEFINITION_EXTENSIONS = [
    ts.Extension.Dts,
    ts.Extension.Dcts,
    ts.Extension.Dmts,
];
/**
 * Check if the context file name is *.d.ts or *.d.tsx
 */
function isDefinitionFile(fileName) {
    var lowerFileName = fileName.toLowerCase();
    for (var _i = 0, DEFINITION_EXTENSIONS_1 = DEFINITION_EXTENSIONS; _i < DEFINITION_EXTENSIONS_1.length; _i++) {
        var definitionExt = DEFINITION_EXTENSIONS_1[_i];
        if (lowerFileName.endsWith(definitionExt)) {
            return true;
        }
    }
    return false;
}
exports.isDefinitionFile = isDefinitionFile;
/**
 * Upper cases the first character or the string
 */
function upperCaseFirst(str) {
    return str[0].toUpperCase() + str.slice(1);
}
exports.upperCaseFirst = upperCaseFirst;
function arrayGroupByToMap(array, getKey) {
    var groups = new Map();
    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var item = array_1[_i];
        var key = getKey(item);
        var existing = groups.get(key);
        if (existing) {
            existing.push(item);
        }
        else {
            groups.set(key, [item]);
        }
    }
    return groups;
}
exports.arrayGroupByToMap = arrayGroupByToMap;
function arraysAreEqual(a, b, eq) {
    return (a === b ||
        (a !== undefined &&
            b !== undefined &&
            a.length === b.length &&
            a.every(function (x, idx) { return eq(x, b[idx]); })));
}
exports.arraysAreEqual = arraysAreEqual;
/** Returns the first non-`undefined` result. */
function findFirstResult(inputs, getResult) {
    for (var _i = 0, inputs_1 = inputs; _i < inputs_1.length; _i++) {
        var element = inputs_1[_i];
        var result = getResult(element);
        if (result !== undefined) {
            return result;
        }
    }
    return undefined;
}
exports.findFirstResult = findFirstResult;
/**
 * Gets a string representation of the name of the index signature.
 */
function getNameFromIndexSignature(node) {
    var propName = node.parameters.find(function (parameter) {
        return parameter.type === utils_1.AST_NODE_TYPES.Identifier;
    });
    return propName ? propName.name : '(index signature)';
}
exports.getNameFromIndexSignature = getNameFromIndexSignature;
var MemberNameType;
(function (MemberNameType) {
    MemberNameType[MemberNameType["Private"] = 1] = "Private";
    MemberNameType[MemberNameType["Quoted"] = 2] = "Quoted";
    MemberNameType[MemberNameType["Normal"] = 3] = "Normal";
    MemberNameType[MemberNameType["Expression"] = 4] = "Expression";
})(MemberNameType || (MemberNameType = {}));
exports.MemberNameType = MemberNameType;
/**
 * Gets a string name representation of the name of the given MethodDefinition
 * or PropertyDefinition node, with handling for computed property names.
 */
function getNameFromMember(member, sourceCode) {
    var _a;
    if (member.key.type === utils_1.AST_NODE_TYPES.Identifier) {
        return {
            type: MemberNameType.Normal,
            name: member.key.name
        };
    }
    if (member.key.type === utils_1.AST_NODE_TYPES.PrivateIdentifier) {
        return {
            type: MemberNameType.Private,
            name: "#".concat(member.key.name)
        };
    }
    if (member.key.type === utils_1.AST_NODE_TYPES.Literal) {
        var name_1 = "".concat(member.key.value);
        if ((0, type_utils_1.requiresQuoting)(name_1)) {
            return {
                type: MemberNameType.Quoted,
                name: "\"".concat(name_1, "\"")
            };
        }
        else {
            return {
                type: MemberNameType.Normal,
                name: name_1
            };
        }
    }
    return {
        type: MemberNameType.Expression,
        name: (_a = sourceCode.text).slice.apply(_a, member.key.range)
    };
}
exports.getNameFromMember = getNameFromMember;
function getEnumNames(myEnum) {
    return Object.keys(myEnum).filter(function (x) { return isNaN(parseInt(x)); });
}
exports.getEnumNames = getEnumNames;
/**
 * Given an array of words, returns an English-friendly concatenation, separated with commas, with
 * the `and` clause inserted before the last item.
 *
 * Example: ['foo', 'bar', 'baz' ] returns the string "foo, bar, and baz".
 */
function formatWordList(words) {
    if (!(words === null || words === void 0 ? void 0 : words.length)) {
        return '';
    }
    if (words.length === 1) {
        return words[0];
    }
    return [words.slice(0, -1).join(', '), words.slice(-1)[0]].join(' and ');
}
exports.formatWordList = formatWordList;
