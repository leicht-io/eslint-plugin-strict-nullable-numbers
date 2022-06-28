"use strict";

const tsutils = require('tsutils');
const ts = require('typescript');
const utils = require("@typescript-eslint/utils");
const util = require("./eslint-utils");

function isLogicalNegationExpression(node) {
    return node.type === utils.AST_NODE_TYPES.UnaryExpression && node.operator === '!';
}

function isArrayLengthExpression(node, typeChecker, parserServices) {
    if (node.type !== utils.AST_NODE_TYPES.MemberExpression) {
        return false;
    }
    if (node.computed) {
        return false;
    }
    if (node.property.name !== 'length') {
        return false;
    }
  const objectTsNode = parserServices.esTreeNodeToTSNodeMap.get(node.object);
  const objectType = util.getConstrainedTypeAtLocation(typeChecker, objectTsNode);

  return util.isTypeArrayTypeOrUnionOfArrayTypes(objectType, typeChecker);
}

module.exports = {
    rules: {
        "strict-nullable-numbers": {
            meta: {
                type: 'suggestion',
                fixable: 'code',
                hasSuggestions: true,
                docs: {
                    description: 'Disallow certain types in boolean expressions',
                    recommended: false,
                    requiresTypeChecking: true
                },
                schema: [
                    {
                        type: 'object',
                        properties: {
                            allowNumber: {type: 'boolean'},
                            allowNullableNumber: {type: 'boolean'}
                        }
                    },
                ],
                messages: {
                    conditionErrorNullish: 'Unexpected nullish value in conditional. ' +
                        'The condition is always false.',
                    conditionErrorNumber: 'Unexpected number value in conditional. ' +
                        'An explicit zero/NaN check is required.',
                    conditionErrorNullableNumber: 'Unexpected nullable number value in conditional. ' +
                        'Please handle the nullish/zero/NaN cases explicitly.',
                    conditionFixDefaultZero: 'Explicitly treat nullish value the same as 0 (`value ?? 0`)',
                    conditionFixCompareNullish: 'Change condition to check for null/undefined (`value != null`)',
                    conditionFixCastBoolean: 'Explicitly cast value to a boolean (`Boolean(value)`)',
                    conditionFixCompareZero: 'Change condition to check for 0 (`value !== 0`)',
                    conditionFixCompareNaN: 'Change condition to check for NaN (`!Number.isNaN(value)`)'
                }
            },
            create: function (context) {
              const options = {
                "allowNumber": false,
                "allowNullableNumber": false,
              };
              const parserServices = util.getParserServices(context);
              const typeChecker = parserServices.program.getTypeChecker();
              const sourceCode = context.getSourceCode();
              // @ts-ignore
              const checkedNodes = new Set();

              return {
                    ConditionalExpression: checkTestExpression,
                    DoWhileStatement: checkTestExpression,
                    ForStatement: checkTestExpression,
                    IfStatement: checkTestExpression,
                    WhileStatement: checkTestExpression,
                    'LogicalExpression[operator!="??"]': checkNode,
                    'UnaryExpression[operator="!"]': checkUnaryLogicalExpression
                };

                function checkTestExpression(node) {
                    if (node.test == null) {
                        return;
                    }
                    checkNode(node.test, true);
                }

                function checkUnaryLogicalExpression(node) {
                    checkNode(node.argument, true);
                }

                /**
                 * This function analyzes the type of a node and checks if it is allowed in a boolean context.
                 * It can recurse when checking nested logical operators, so that only the outermost operands are reported.
                 * The right operand of a logical expression is ignored unless it's a part of a test expression (if/while/ternary/etc).
                 * @param node The AST node to check.
                 * @param isTestExpr Whether the node is a descendant of a test expression.
                 */
                function checkNode(node, isTestExpr) {
                    if (isTestExpr === void 0) {
                        isTestExpr = false;
                    }
                    // prevent checking the same node multiple times
                    if (checkedNodes.has(node)) {
                        return;
                    }
                    checkedNodes.add(node);
                    // for logical operator, we check its operands
                    if (node.type === utils.AST_NODE_TYPES.LogicalExpression &&
                        node.operator !== '??') {
                        checkNode(node.left, isTestExpr);
                        // we ignore the right operand when not in a context of a test expression
                        if (isTestExpr) {
                            checkNode(node.right, isTestExpr);
                        }
                        return;
                    }
                  const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                  const type = util.getConstrainedTypeAtLocation(typeChecker, tsNode);
                  const types = inspectVariantTypes(tsutils.unionTypeParts(type));
                  const is = function () {
                    const wantedTypes = [];
                    for (let _i = 0; _i < arguments.length; _i++) {
                      wantedTypes[_i] = arguments[_i];
                    }
                    return types.size === wantedTypes.length &&
                        wantedTypes.every(function (type) {
                          return types.has(type);
                        });
                  };
                  // boolean
                    if (is('boolean') || is('truthy boolean')) {
                        // boolean is always okay
                        return;
                    }
                    // never
                    if (is('never')) {
                        // never is always okay
                        return;
                    }
                    // nullish
                    if (is('nullish')) {
                        // condition is always false
                        context.report({node: node, messageId: 'conditionErrorNullish'});
                        return;
                    }
                    // Known edge case: boolean `true` and nullish values are always valid boolean expressions
                    if (is('nullish', 'truthy boolean')) {
                        return;
                    }
                    // Known edge case: truthy primitives and nullish values are always valid boolean expressions
                    if ((options.allowNumber && is('nullish', 'truthy number'))) {
                        return;
                    }
                    // number
                    if (is('number') || is('truthy number')) {
                        if (!options.allowNumber) {
                            if (isArrayLengthExpression(node, typeChecker, parserServices)) {
                                if (isLogicalNegationExpression(node.parent)) {
                                    // if (!array.length)
                                    context.report({
                                        node: node,
                                        messageId: 'conditionErrorNumber',
                                        fix: util.getWrappingFixer({
                                            sourceCode: sourceCode,
                                            node: node.parent,
                                            innerNode: node,
                                            wrap: function (code) {
                                                return "".concat(code, " === 0");
                                            }
                                        })
                                    });
                                } else {
                                    // if (array.length)
                                    context.report({
                                        node: node,
                                        messageId: 'conditionErrorNumber',
                                        fix: util.getWrappingFixer({
                                            sourceCode: sourceCode,
                                            node: node,
                                            wrap: function (code) {
                                                return "".concat(code, " > 0");
                                            }
                                        })
                                    });
                                }
                            } else if (isLogicalNegationExpression(node.parent)) {
                                // if (!number)
                                context.report({
                                    node: node,
                                    messageId: 'conditionErrorNumber',
                                    suggest: [
                                        {
                                            messageId: 'conditionFixCompareZero',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node.parent,
                                                innerNode: node,
                                                // TODO: we have to compare to 0n if the type is bigint
                                                wrap: function (code) {
                                                    return "".concat(code, " === 0");
                                                }
                                            })
                                        },
                                        {
                                            // TODO: don't suggest this for bigint because it can't be NaN
                                            messageId: 'conditionFixCompareNaN',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node.parent,
                                                innerNode: node,
                                                wrap: function (code) {
                                                    return "Number.isNaN(".concat(code, ")");
                                                }
                                            })
                                        },
                                        {
                                            messageId: 'conditionFixCastBoolean',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node.parent,
                                                innerNode: node,
                                                wrap: function (code) {
                                                    return "!Boolean(".concat(code, ")");
                                                }
                                            })
                                        },
                                    ]
                                });
                            } else {
                                // if (number)
                                context.report({
                                    node: node,
                                    messageId: 'conditionErrorNumber',
                                    suggest: [
                                        {
                                            messageId: 'conditionFixCompareZero',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node,
                                                wrap: function (code) {
                                                    return "".concat(code, " !== 0");
                                                }
                                            })
                                        },
                                        {
                                            messageId: 'conditionFixCompareNaN',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node,
                                                wrap: function (code) {
                                                    return "!Number.isNaN(".concat(code, ")");
                                                }
                                            })
                                        },
                                        {
                                            messageId: 'conditionFixCastBoolean',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node,
                                                wrap: function (code) {
                                                    return "Boolean(".concat(code, ")");
                                                }
                                            })
                                        },
                                    ]
                                });
                            }
                        }
                        return;
                    }
                    // nullable number
                    if (is('nullish', 'number')) {
                        if (!options.allowNullableNumber) {
                            if (isLogicalNegationExpression(node.parent)) {
                                // if (!nullableNumber)
                                context.report({
                                    node: node,
                                    messageId: 'conditionErrorNullableNumber',
                                    suggest: [
                                        {
                                            messageId: 'conditionFixCompareNullish',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node.parent,
                                                innerNode: node,
                                                wrap: function (code) {
                                                    return "".concat(code, " == null");
                                                }
                                            })
                                        },
                                        {
                                            messageId: 'conditionFixDefaultZero',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node,
                                                wrap: function (code) {
                                                    return "".concat(code, " ?? 0");
                                                }
                                            })
                                        },
                                        {
                                            messageId: 'conditionFixCastBoolean',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node.parent,
                                                innerNode: node,
                                                wrap: function (code) {
                                                    return "!Boolean(".concat(code, ")");
                                                }
                                            })
                                        },
                                    ]
                                });
                            } else {
                                // if (nullableNumber)
                                context.report({
                                    node: node,
                                    messageId: 'conditionErrorNullableNumber',
                                    suggest: [
                                        {
                                            messageId: 'conditionFixCompareNullish',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node,
                                                wrap: function (code) {
                                                    return "".concat(code, " != null");
                                                }
                                            })
                                        },
                                        {
                                            messageId: 'conditionFixDefaultZero',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node,
                                                wrap: function (code) {
                                                    return "".concat(code, " ?? 0");
                                                }
                                            })
                                        },
                                        {
                                            messageId: 'conditionFixCastBoolean',
                                            fix: util.getWrappingFixer({
                                                sourceCode: sourceCode,
                                                node: node,
                                                wrap: function (code) {
                                                    return "Boolean(".concat(code, ")");
                                                }
                                            })
                                        },
                                    ]
                                });
                            }
                        }
                        return;
                    }
                }

                /**
                 * Check union variants for the types we care about
                 */
                // @ts-ignore
                function inspectVariantTypes(types) {
                    // @ts-ignore
                  const variantTypes = new Set();
                  if (types.some(function (type) {
                        return tsutils.isTypeFlagSet(type, ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.VoidLike);
                    })) {
                        variantTypes.add('nullish');
                    }
                  const booleans = types.filter(function (type) {
                    return tsutils.isTypeFlagSet(type, ts.TypeFlags.BooleanLike);
                  });
                  // If incoming type is either "true" or "false", there will be one type
                    // object with intrinsicName set accordingly
                    // If incoming type is boolean, there will be two type objects with
                    // intrinsicName set "true" and "false" each because of tsutils.unionTypeParts()
                    if (booleans.length === 1) {
                        tsutils.isBooleanLiteralType(booleans[0], true)
                            ? variantTypes.add('truthy boolean')
                            : variantTypes.add('boolean');
                    } else if (booleans.length === 2) {
                        variantTypes.add('boolean');
                    }
                  const strings = types.filter(function (type) {
                    return tsutils.isTypeFlagSet(type, ts.TypeFlags.StringLike);
                  });
                  if (strings.length) {
                        if (strings.some(function (type) {
                            return type.isStringLiteral() && type.value !== '';
                        })) {
                            variantTypes.add('truthy string');
                        } else {
                            variantTypes.add('string');
                        }
                    }
                  const numbers = types.filter(function (type) {
                    return tsutils.isTypeFlagSet(type, ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike);
                  });
                  if (numbers.length) {
                        if (numbers.some(function (type) {
                            return type.isNumberLiteral() && type.value !== 0;
                        })) {
                            variantTypes.add('truthy number');
                        } else {
                            variantTypes.add('number');
                        }
                    }
                    if (types.some(function (type) {
                        return !tsutils.isTypeFlagSet(type, ts.TypeFlags.Null |
                            ts.TypeFlags.Undefined |
                            ts.TypeFlags.VoidLike |
                            ts.TypeFlags.BooleanLike |
                            ts.TypeFlags.StringLike |
                            ts.TypeFlags.NumberLike |
                            ts.TypeFlags.BigIntLike |
                            ts.TypeFlags.TypeParameter |
                            ts.TypeFlags.Any |
                            ts.TypeFlags.Unknown |
                            ts.TypeFlags.Never);
                    })) {
                        variantTypes.add('object');
                    }
                    if (types.some(function (type) {
                        return util.isTypeFlagSet(type, ts.TypeFlags.TypeParameter |
                            ts.TypeFlags.Any |
                            ts.TypeFlags.Unknown);
                    })) {
                        variantTypes.add('any');
                    }
                    if (types.some(function (type) {
                        return tsutils.isTypeFlagSet(type, ts.TypeFlags.Never);
                    })) {
                        variantTypes.add('never');
                    }
                    return variantTypes;
                }
            }
        }
    }
};
