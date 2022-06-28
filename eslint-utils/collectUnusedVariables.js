"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
exports.__esModule = true;
exports.collectUnusedVariables = void 0;
var utils_1 = require("@typescript-eslint/utils");
var scope_manager_1 = require("@typescript-eslint/scope-manager");
var Visitor_1 = require("@typescript-eslint/scope-manager/dist/referencer/Visitor");
var UnusedVarsVisitor = /** @class */ (function (_super) {
    __extends(UnusedVarsVisitor, _super);
    // readonly #unusedVariables = new Set<TSESLint.Scope.Variable>();
    function UnusedVarsVisitor(context) {
        var _this = _super.call(this, {
            visitChildrenEvenIfSelectorExists: true
        }) || this;
        _UnusedVarsVisitor_scopeManager.set(_this, void 0);
        //#endregion HELPERS
        //#region VISITORS
        // NOTE - This is a simple visitor - meaning it does not support selectors
        _this.ClassDeclaration = _this.visitClass;
        _this.ClassExpression = _this.visitClass;
        _this.FunctionDeclaration = _this.visitFunction;
        _this.FunctionExpression = _this.visitFunction;
        _this.MethodDefinition = _this.visitSetter;
        _this.Property = _this.visitSetter;
        _this.TSCallSignatureDeclaration = _this.visitFunctionTypeSignature;
        _this.TSConstructorType = _this.visitFunctionTypeSignature;
        _this.TSConstructSignatureDeclaration = _this.visitFunctionTypeSignature;
        _this.TSDeclareFunction = _this.visitFunctionTypeSignature;
        _this.TSEmptyBodyFunctionExpression = _this.visitFunctionTypeSignature;
        _this.TSFunctionType = _this.visitFunctionTypeSignature;
        _this.TSMethodSignature = _this.visitFunctionTypeSignature;
        __classPrivateFieldSet(_this, _UnusedVarsVisitor_scopeManager, utils_1.ESLintUtils.nullThrows(context.getSourceCode().scopeManager, 'Missing required scope manager'), "f");
        return _this;
    }
    UnusedVarsVisitor.collectUnusedVariables = function (context) {
        var program = context.getSourceCode().ast;
        var cached = this.RESULTS_CACHE.get(program);
        if (cached) {
            return cached;
        }
        var visitor = new this(context);
        visitor.visit(program);
        var unusedVars = visitor.collectUnusedVariables(visitor.getScope(program));
        this.RESULTS_CACHE.set(program, unusedVars);
        return unusedVars;
    };
    UnusedVarsVisitor.prototype.collectUnusedVariables = function (scope, unusedVariables) {
        if (unusedVariables === void 0) { unusedVariables = new Set(); }
        for (var _i = 0, _a = scope.variables; _i < _a.length; _i++) {
            var variable = _a[_i];
            if (
            // skip function expression names,
            scope.functionExpressionScope ||
                // variables marked with markVariableAsUsed(),
                variable.eslintUsed ||
                // implicit lib variables (from @typescript-eslint/scope-manager),
                variable instanceof scope_manager_1.ImplicitLibVariable ||
                // basic exported variables
                isExported(variable) ||
                // variables implicitly exported via a merged declaration
                isMergableExported(variable) ||
                // used variables
                isUsedVariable(variable)) {
                continue;
            }
            unusedVariables.add(variable);
        }
        for (var _b = 0, _c = scope.childScopes; _b < _c.length; _b++) {
            var childScope = _c[_b];
            this.collectUnusedVariables(childScope, unusedVariables);
        }
        return unusedVariables;
    };
    //#region HELPERS
    UnusedVarsVisitor.prototype.getScope = function (currentNode) {
        // On Program node, get the outermost scope to avoid return Node.js special function scope or ES modules scope.
        var inner = currentNode.type !== utils_1.AST_NODE_TYPES.Program;
        var node = currentNode;
        while (node) {
            var scope = __classPrivateFieldGet(this, _UnusedVarsVisitor_scopeManager, "f").acquire(node, inner);
            if (scope) {
                if (scope.type === 'function-expression-name') {
                    return scope.childScopes[0];
                }
                return scope;
            }
            node = node.parent;
        }
        return __classPrivateFieldGet(this, _UnusedVarsVisitor_scopeManager, "f").scopes[0];
    };
    UnusedVarsVisitor.prototype.markVariableAsUsed = function (variableOrIdentifierOrName, parent) {
        if (typeof variableOrIdentifierOrName !== 'string' &&
            !('type' in variableOrIdentifierOrName)) {
            variableOrIdentifierOrName.eslintUsed = true;
            return;
        }
        var name;
        var node;
        if (typeof variableOrIdentifierOrName === 'string') {
            name = variableOrIdentifierOrName;
            node = parent;
        }
        else {
            name = variableOrIdentifierOrName.name;
            node = variableOrIdentifierOrName;
        }
        var currentScope = this.getScope(node);
        while (currentScope) {
            var variable = currentScope.variables.find(function (scopeVar) { return scopeVar.name === name; });
            if (variable) {
                variable.eslintUsed = true;
                return;
            }
            currentScope = currentScope.upper;
        }
    };
    UnusedVarsVisitor.prototype.visitClass = function (node) {
        // skip a variable of class itself name in the class scope
        var scope = this.getScope(node);
        for (var _i = 0, _a = scope.variables; _i < _a.length; _i++) {
            var variable = _a[_i];
            if (variable.identifiers[0] === scope.block.id) {
                this.markVariableAsUsed(variable);
                return;
            }
        }
    };
    UnusedVarsVisitor.prototype.visitFunction = function (node) {
        var scope = this.getScope(node);
        // skip implicit "arguments" variable
        var variable = scope.set.get('arguments');
        if ((variable === null || variable === void 0 ? void 0 : variable.defs.length) === 0) {
            this.markVariableAsUsed(variable);
        }
    };
    UnusedVarsVisitor.prototype.visitFunctionTypeSignature = function (node) {
        var _this = this;
        // function type signature params create variables because they can be referenced within the signature,
        // but they obviously aren't unused variables for the purposes of this rule.
        for (var _i = 0, _a = node.params; _i < _a.length; _i++) {
            var param = _a[_i];
            this.visitPattern(param, function (name) {
                _this.markVariableAsUsed(name);
            });
        }
    };
    UnusedVarsVisitor.prototype.visitSetter = function (node) {
        var _this = this;
        if (node.kind === 'set') {
            // ignore setter parameters because they're syntactically required to exist
            for (var _i = 0, _a = node.value.params; _i < _a.length; _i++) {
                var param = _a[_i];
                this.visitPattern(param, function (id) {
                    _this.markVariableAsUsed(id);
                });
            }
        }
    };
    UnusedVarsVisitor.prototype.ForInStatement = function (node) {
        /**
         * (Brad Zacher): I hate that this has to exist.
         * But it is required for compat with the base ESLint rule.
         *
         * In 2015, ESLint decided to add an exception for these two specific cases
         * ```
         * for (var key in object) return;
         *
         * var key;
         * for (key in object) return;
         * ```
         *
         * I disagree with it, but what are you going to do...
         *
         * https://github.com/eslint/eslint/issues/2342
         */
        var idOrVariable;
        if (node.left.type === utils_1.AST_NODE_TYPES.VariableDeclaration) {
            var variable = __classPrivateFieldGet(this, _UnusedVarsVisitor_scopeManager, "f").getDeclaredVariables(node.left)[0];
            if (!variable) {
                return;
            }
            idOrVariable = variable;
        }
        if (node.left.type === utils_1.AST_NODE_TYPES.Identifier) {
            idOrVariable = node.left;
        }
        if (idOrVariable == null) {
            return;
        }
        var body = node.body;
        if (node.body.type === utils_1.AST_NODE_TYPES.BlockStatement) {
            if (node.body.body.length !== 1) {
                return;
            }
            body = node.body.body[0];
        }
        if (body.type !== utils_1.AST_NODE_TYPES.ReturnStatement) {
            return;
        }
        this.markVariableAsUsed(idOrVariable);
    };
    UnusedVarsVisitor.prototype.Identifier = function (node) {
        var scope = this.getScope(node);
        if (scope.type === utils_1.TSESLint.Scope.ScopeType["function"] &&
            node.name === 'this') {
            // this parameters should always be considered used as they're pseudo-parameters
            if ('params' in scope.block && scope.block.params.includes(node)) {
                this.markVariableAsUsed(node);
            }
        }
    };
    UnusedVarsVisitor.prototype.TSEnumDeclaration = function (node) {
        // enum members create variables because they can be referenced within the enum,
        // but they obviously aren't unused variables for the purposes of this rule.
        var scope = this.getScope(node);
        for (var _i = 0, _a = scope.variables; _i < _a.length; _i++) {
            var variable = _a[_i];
            this.markVariableAsUsed(variable);
        }
    };
    UnusedVarsVisitor.prototype.TSMappedType = function (node) {
        // mapped types create a variable for their type name, but it's not necessary to reference it,
        // so we shouldn't consider it as unused for the purpose of this rule.
        this.markVariableAsUsed(node.typeParameter.name);
    };
    UnusedVarsVisitor.prototype.TSModuleDeclaration = function (node) {
        // -- global augmentation can be in any file, and they do not need exports
        if (node.global === true) {
            this.markVariableAsUsed('global', node.parent);
        }
    };
    UnusedVarsVisitor.prototype.TSParameterProperty = function (node) {
        var identifier = null;
        switch (node.parameter.type) {
            case utils_1.AST_NODE_TYPES.AssignmentPattern:
                if (node.parameter.left.type === utils_1.AST_NODE_TYPES.Identifier) {
                    identifier = node.parameter.left;
                }
                break;
            case utils_1.AST_NODE_TYPES.Identifier:
                identifier = node.parameter;
                break;
        }
        if (identifier) {
            this.markVariableAsUsed(identifier);
        }
    };
    var _UnusedVarsVisitor_scopeManager;
    _UnusedVarsVisitor_scopeManager = new WeakMap();
    UnusedVarsVisitor.RESULTS_CACHE = new WeakMap();
    return UnusedVarsVisitor;
}(Visitor_1.Visitor));
//#region private helpers
/**
 * Checks the position of given nodes.
 * @param inner A node which is expected as inside.
 * @param outer A node which is expected as outside.
 * @returns `true` if the `inner` node exists in the `outer` node.
 */
function isInside(inner, outer) {
    return inner.range[0] >= outer.range[0] && inner.range[1] <= outer.range[1];
}
/**
 * Determine if an identifier is referencing an enclosing name.
 * This only applies to declarations that create their own scope (modules, functions, classes)
 * @param ref The reference to check.
 * @param nodes The candidate function nodes.
 * @returns True if it's a self-reference, false if not.
 */
function isSelfReference(ref, nodes) {
    var scope = ref.from;
    while (scope) {
        if (nodes.has(scope.block)) {
            return true;
        }
        scope = scope.upper;
    }
    return false;
}
var MERGABLE_TYPES = new Set([
    utils_1.AST_NODE_TYPES.TSInterfaceDeclaration,
    utils_1.AST_NODE_TYPES.TSTypeAliasDeclaration,
    utils_1.AST_NODE_TYPES.TSModuleDeclaration,
    utils_1.AST_NODE_TYPES.ClassDeclaration,
    utils_1.AST_NODE_TYPES.FunctionDeclaration,
]);
/**
 * Determine if the variable is directly exported
 * @param variable the variable to check
 * @param target the type of node that is expected to be exported
 */
function isMergableExported(variable) {
    var _a, _b;
    // If all of the merged things are of the same type, TS will error if not all of them are exported - so we only need to find one
    for (var _i = 0, _c = variable.defs; _i < _c.length; _i++) {
        var def = _c[_i];
        // parameters can never be exported.
        // their `node` prop points to the function decl, which can be exported
        // so we need to special case them
        if (def.type === utils_1.TSESLint.Scope.DefinitionType.Parameter) {
            continue;
        }
        if ((MERGABLE_TYPES.has(def.node.type) &&
            ((_a = def.node.parent) === null || _a === void 0 ? void 0 : _a.type) === utils_1.AST_NODE_TYPES.ExportNamedDeclaration) ||
            ((_b = def.node.parent) === null || _b === void 0 ? void 0 : _b.type) === utils_1.AST_NODE_TYPES.ExportDefaultDeclaration) {
            return true;
        }
    }
    return false;
}
/**
 * Determines if a given variable is being exported from a module.
 * @param variable eslint-scope variable object.
 * @returns True if the variable is exported, false if not.
 */
function isExported(variable) {
    var definition = variable.defs[0];
    if (definition) {
        var node = definition.node;
        if (node.type === utils_1.AST_NODE_TYPES.VariableDeclarator) {
            node = node.parent;
        }
        else if (definition.type === utils_1.TSESLint.Scope.DefinitionType.Parameter) {
            return false;
        }
        return node.parent.type.indexOf('Export') === 0;
    }
    return false;
}
/**
 * Determines if the variable is used.
 * @param variable The variable to check.
 * @returns True if the variable is used
 */
function isUsedVariable(variable) {
    /**
     * Gets a list of function definitions for a specified variable.
     * @param variable eslint-scope variable object.
     * @returns Function nodes.
     */
    function getFunctionDefinitions(variable) {
        var functionDefinitions = new Set();
        variable.defs.forEach(function (def) {
            var _a, _b;
            // FunctionDeclarations
            if (def.type === utils_1.TSESLint.Scope.DefinitionType.FunctionName) {
                functionDefinitions.add(def.node);
            }
            // FunctionExpressions
            if (def.type === utils_1.TSESLint.Scope.DefinitionType.Variable &&
                (((_a = def.node.init) === null || _a === void 0 ? void 0 : _a.type) === utils_1.AST_NODE_TYPES.FunctionExpression ||
                    ((_b = def.node.init) === null || _b === void 0 ? void 0 : _b.type) === utils_1.AST_NODE_TYPES.ArrowFunctionExpression)) {
                functionDefinitions.add(def.node.init);
            }
        });
        return functionDefinitions;
    }
    function getTypeDeclarations(variable) {
        var nodes = new Set();
        variable.defs.forEach(function (def) {
            if (def.node.type === utils_1.AST_NODE_TYPES.TSInterfaceDeclaration ||
                def.node.type === utils_1.AST_NODE_TYPES.TSTypeAliasDeclaration) {
                nodes.add(def.node);
            }
        });
        return nodes;
    }
    function getModuleDeclarations(variable) {
        var nodes = new Set();
        variable.defs.forEach(function (def) {
            if (def.node.type === utils_1.AST_NODE_TYPES.TSModuleDeclaration) {
                nodes.add(def.node);
            }
        });
        return nodes;
    }
    /**
     * Checks if the ref is contained within one of the given nodes
     */
    function isInsideOneOf(ref, nodes) {
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var node = nodes_1[_i];
            if (isInside(ref.identifier, node)) {
                return true;
            }
        }
        return false;
    }
    /**
     * If a given reference is left-hand side of an assignment, this gets
     * the right-hand side node of the assignment.
     *
     * In the following cases, this returns null.
     *
     * - The reference is not the LHS of an assignment expression.
     * - The reference is inside of a loop.
     * - The reference is inside of a function scope which is different from
     *   the declaration.
     * @param ref A reference to check.
     * @param prevRhsNode The previous RHS node.
     * @returns The RHS node or null.
     */
    function getRhsNode(ref, prevRhsNode) {
        /**
         * Checks whether the given node is in a loop or not.
         * @param node The node to check.
         * @returns `true` if the node is in a loop.
         */
        function isInLoop(node) {
            var currentNode = node;
            while (currentNode) {
                if (utils_1.ASTUtils.isFunction(currentNode)) {
                    break;
                }
                if (utils_1.ASTUtils.isLoop(currentNode)) {
                    return true;
                }
                currentNode = currentNode.parent;
            }
            return false;
        }
        var id = ref.identifier;
        var parent = id.parent;
        var grandparent = parent.parent;
        var refScope = ref.from.variableScope;
        var varScope = ref.resolved.scope.variableScope;
        var canBeUsedLater = refScope !== varScope || isInLoop(id);
        /*
         * Inherits the previous node if this reference is in the node.
         * This is for `a = a + a`-like code.
         */
        if (prevRhsNode && isInside(id, prevRhsNode)) {
            return prevRhsNode;
        }
        if (parent.type === utils_1.AST_NODE_TYPES.AssignmentExpression &&
            grandparent.type === utils_1.AST_NODE_TYPES.ExpressionStatement &&
            id === parent.left &&
            !canBeUsedLater) {
            return parent.right;
        }
        return null;
    }
    /**
     * Checks whether a given reference is a read to update itself or not.
     * @param ref A reference to check.
     * @param rhsNode The RHS node of the previous assignment.
     * @returns The reference is a read to update itself.
     */
    function isReadForItself(ref, rhsNode) {
        /**
         * Checks whether a given Identifier node exists inside of a function node which can be used later.
         *
         * "can be used later" means:
         * - the function is assigned to a variable.
         * - the function is bound to a property and the object can be used later.
         * - the function is bound as an argument of a function call.
         *
         * If a reference exists in a function which can be used later, the reference is read when the function is called.
         * @param id An Identifier node to check.
         * @param rhsNode The RHS node of the previous assignment.
         * @returns `true` if the `id` node exists inside of a function node which can be used later.
         */
        function isInsideOfStorableFunction(id, rhsNode) {
            /**
             * Finds a function node from ancestors of a node.
             * @param node A start node to find.
             * @returns A found function node.
             */
            function getUpperFunction(node) {
                var currentNode = node;
                while (currentNode) {
                    if (utils_1.ASTUtils.isFunction(currentNode)) {
                        return currentNode;
                    }
                    currentNode = currentNode.parent;
                }
                return null;
            }
            /**
             * Checks whether a given function node is stored to somewhere or not.
             * If the function node is stored, the function can be used later.
             * @param funcNode A function node to check.
             * @param rhsNode The RHS node of the previous assignment.
             * @returns `true` if under the following conditions:
             *      - the funcNode is assigned to a variable.
             *      - the funcNode is bound as an argument of a function call.
             *      - the function is bound to a property and the object satisfies above conditions.
             */
            function isStorableFunction(funcNode, rhsNode) {
                var node = funcNode;
                var parent = funcNode.parent;
                while (parent && isInside(parent, rhsNode)) {
                    switch (parent.type) {
                        case utils_1.AST_NODE_TYPES.SequenceExpression:
                            if (parent.expressions[parent.expressions.length - 1] !== node) {
                                return false;
                            }
                            break;
                        case utils_1.AST_NODE_TYPES.CallExpression:
                        case utils_1.AST_NODE_TYPES.NewExpression:
                            return parent.callee !== node;
                        case utils_1.AST_NODE_TYPES.AssignmentExpression:
                        case utils_1.AST_NODE_TYPES.TaggedTemplateExpression:
                        case utils_1.AST_NODE_TYPES.YieldExpression:
                            return true;
                        default:
                            if (parent.type.endsWith('Statement') ||
                                parent.type.endsWith('Declaration')) {
                                /*
                                 * If it encountered statements, this is a complex pattern.
                                 * Since analyzing complex patterns is hard, this returns `true` to avoid false positive.
                                 */
                                return true;
                            }
                    }
                    node = parent;
                    parent = parent.parent;
                }
                return false;
            }
            var funcNode = getUpperFunction(id);
            return (!!funcNode &&
                isInside(funcNode, rhsNode) &&
                isStorableFunction(funcNode, rhsNode));
        }
        var id = ref.identifier;
        var parent = id.parent;
        var grandparent = parent.parent;
        return (ref.isRead() && // in RHS of an assignment for itself. e.g. `a = a + 1`
            // self update. e.g. `a += 1`, `a++`
            ((parent.type === utils_1.AST_NODE_TYPES.AssignmentExpression &&
                grandparent.type === utils_1.AST_NODE_TYPES.ExpressionStatement &&
                parent.left === id) ||
                (parent.type === utils_1.AST_NODE_TYPES.UpdateExpression &&
                    grandparent.type === utils_1.AST_NODE_TYPES.ExpressionStatement) ||
                (!!rhsNode &&
                    isInside(id, rhsNode) &&
                    !isInsideOfStorableFunction(id, rhsNode))));
    }
    var functionNodes = getFunctionDefinitions(variable);
    var isFunctionDefinition = functionNodes.size > 0;
    var typeDeclNodes = getTypeDeclarations(variable);
    var isTypeDecl = typeDeclNodes.size > 0;
    var moduleDeclNodes = getModuleDeclarations(variable);
    var isModuleDecl = moduleDeclNodes.size > 0;
    var rhsNode = null;
    return variable.references.some(function (ref) {
        var forItself = isReadForItself(ref, rhsNode);
        rhsNode = getRhsNode(ref, rhsNode);
        return (ref.isRead() &&
            !forItself &&
            !(isFunctionDefinition && isSelfReference(ref, functionNodes)) &&
            !(isTypeDecl && isInsideOneOf(ref, typeDeclNodes)) &&
            !(isModuleDecl && isSelfReference(ref, moduleDeclNodes)));
    });
}
//#endregion private helpers
/**
 * Collects the set of unused variables for a given context.
 *
 * Due to complexity, this does not take into consideration:
 * - variables within declaration files
 * - variables within ambient module declarations
 */
function collectUnusedVariables(context) {
    return UnusedVarsVisitor.collectUnusedVariables(context);
}
exports.collectUnusedVariables = collectUnusedVariables;
