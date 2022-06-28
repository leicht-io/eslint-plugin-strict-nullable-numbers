"use strict";
exports.__esModule = true;
exports.objectReduceKey = exports.objectMapKey = exports.objectForEachKey = void 0;
function objectForEachKey(obj, callback) {
    var keys = Object.keys(obj);
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        callback(key);
    }
}
exports.objectForEachKey = objectForEachKey;
function objectMapKey(obj, callback) {
    var values = [];
    objectForEachKey(obj, function (key) {
        values.push(callback(key));
    });
    return values;
}
exports.objectMapKey = objectMapKey;
function objectReduceKey(obj, callback, initial) {
    var accumulator = initial;
    objectForEachKey(obj, function (key) {
        accumulator = callback(accumulator, key);
    });
    return accumulator;
}
exports.objectReduceKey = objectReduceKey;
