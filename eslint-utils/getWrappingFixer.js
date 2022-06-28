"use strict";
exports.__esModule = true;
exports.getWrappingFixer = void 0;
var utils_1 = require("@typescript-eslint/utils");
/**
 * Wraps node with some code. Adds parenthesis as necessary.
 * @returns Fixer which adds the specified code and parens if necessary.
 */
function getWrappingFixer(params) {
    var sourceCode = params.sourceCode, node = params.node, _a = params.innerNode, innerNode = _a === void 0 ? node : _a, wrap = params.wrap;
    var innerNodes = Array.isArray(innerNode) ? innerNode : [innerNode];
    return function (fixer) {
        var innerCodes = innerNodes.map(function (innerNode) {
            var code = sourceCode.getText(innerNode);
            // check the inner expression's precedence
            if (!isStrongPrecedenceNode(innerNode)) {
                // the code we are adding might have stronger precedence than our wrapped node
                // let's wrap our node in parens in case it has a weaker precedence than the code we are wrapping it in
                code = "(".concat(code, ")");
            }
            return code;
        });
        // do the wrapping
        var code = wrap.apply(void 0, innerCodes);
        // check the outer expression's precedence
        if (isWeakPrecedenceParent(node)) {
            // we wrapped the node in some expression which very likely has a different precedence than original wrapped node
            // let's wrap the whole expression in parens just in case
            if (!utils_1.ASTUtils.isParenthesized(node, sourceCode)) {
                code = "(".concat(code, ")");
            }
        }
        // check if we need to insert semicolon
        if (/^[`([]/.exec(code) && isMissingSemicolonBefore(node, sourceCode)) {
            code = ";".concat(code);
        }
        return fixer.replaceText(node, code);
    };
}
exports.getWrappingFixer = getWrappingFixer;
/**
 * Check if a node will always have the same precedence if it's parent changes.
 */
function isStrongPrecedenceNode(innerNode) {
    return (innerNode.type === utils_1.AST_NODE_TYPES.Literal ||
        innerNode.type === utils_1.AST_NODE_TYPES.Identifier ||
        innerNode.type === utils_1.AST_NODE_TYPES.ArrayExpression ||
        innerNode.type === utils_1.AST_NODE_TYPES.ObjectExpression ||
        innerNode.type === utils_1.AST_NODE_TYPES.MemberExpression ||
        innerNode.type === utils_1.AST_NODE_TYPES.CallExpression ||
        innerNode.type === utils_1.AST_NODE_TYPES.NewExpression ||
        innerNode.type === utils_1.AST_NODE_TYPES.TaggedTemplateExpression);
}
/**
 * Check if a node's parent could have different precedence if the node changes.
 */
function isWeakPrecedenceParent(node) {
    var parent = node.parent;
    if (parent.type === utils_1.AST_NODE_TYPES.UpdateExpression ||
        parent.type === utils_1.AST_NODE_TYPES.UnaryExpression ||
        parent.type === utils_1.AST_NODE_TYPES.BinaryExpression ||
        parent.type === utils_1.AST_NODE_TYPES.LogicalExpression ||
        parent.type === utils_1.AST_NODE_TYPES.ConditionalExpression ||
        parent.type === utils_1.AST_NODE_TYPES.AwaitExpression) {
        return true;
    }
    if (parent.type === utils_1.AST_NODE_TYPES.MemberExpression &&
        parent.object === node) {
        return true;
    }
    if ((parent.type === utils_1.AST_NODE_TYPES.CallExpression ||
        parent.type === utils_1.AST_NODE_TYPES.NewExpression) &&
        parent.callee === node) {
        return true;
    }
    if (parent.type === utils_1.AST_NODE_TYPES.TaggedTemplateExpression &&
        parent.tag === node) {
        return true;
    }
    return false;
}
/**
 * Returns true if a node is at the beginning of expression statement and the statement above doesn't end with semicolon.
 * Doesn't check if the node begins with `(`, `[` or `` ` ``.
 */
function isMissingSemicolonBefore(node, sourceCode) {
    for (;;) {
        var parent_1 = node.parent;
        if (parent_1.type === utils_1.AST_NODE_TYPES.ExpressionStatement) {
            var block = parent_1.parent;
            if (block.type === utils_1.AST_NODE_TYPES.Program ||
                block.type === utils_1.AST_NODE_TYPES.BlockStatement) {
                // parent is an expression statement in a block
                var statementIndex = block.body.indexOf(parent_1);
                var previousStatement = block.body[statementIndex - 1];
                if (statementIndex > 0 &&
                    sourceCode.getLastToken(previousStatement).value !== ';') {
                    return true;
                }
            }
        }
        if (!isLeftHandSide(node)) {
            return false;
        }
        node = parent_1;
    }
}
/**
 * Checks if a node is LHS of an operator.
 */
function isLeftHandSide(node) {
    var parent = node.parent;
    // a++
    if (parent.type === utils_1.AST_NODE_TYPES.UpdateExpression) {
        return true;
    }
    // a + b
    if ((parent.type === utils_1.AST_NODE_TYPES.BinaryExpression ||
        parent.type === utils_1.AST_NODE_TYPES.LogicalExpression ||
        parent.type === utils_1.AST_NODE_TYPES.AssignmentExpression) &&
        node === parent.left) {
        return true;
    }
    // a ? b : c
    if (parent.type === utils_1.AST_NODE_TYPES.ConditionalExpression &&
        node === parent.test) {
        return true;
    }
    // a(b)
    if (parent.type === utils_1.AST_NODE_TYPES.CallExpression && node === parent.callee) {
        return true;
    }
    // a`b`
    if (parent.type === utils_1.AST_NODE_TYPES.TaggedTemplateExpression &&
        node === parent.tag) {
        return true;
    }
    return false;
}
