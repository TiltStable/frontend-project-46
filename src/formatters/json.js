import { isPlainObject } from "../diffTree.js";
import { stringifyValueGuarded } from "../utils.js";

const flatten = (nodes, path) =>
  nodes.flatMap((node) => {
    const key = path ? `${path}.${node.key}` : node.key;
    switch (node.type) {
      case "nested":
        return flatten(node.children, key);
      case "unchanged":
        return [];
      case "added":
        return [{ type: "added", key, value: node.value }];
      case "removed":
        return [{ type: "removed", key, value: node.value }];
      case "changed":
        return [{ type: "changed", key, oldValue: node.oldValue, newValue: node.newValue }];
      default:
        throw new Error(`Unknown diff node type: '${node.type}'`);
    }
  });

const assertValueSerializable = (value, key, seen) => {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error(`Value is not representable in diff output: ${value} (at key '${key}')`);
  }
  if (isPlainObject(value) || Array.isArray(value)) {
    if (seen.has(value)) {
      throw new Error("Circular reference detected in the compared data");
    }
    seen.add(value);
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      assertValueSerializable(child, key, seen);
    }
    seen.delete(value);
  }
};

const assertRecordsSerializable = (records) => {
  for (const record of records) {
    const values = record.type === "changed" ? [record.oldValue, record.newValue] : [record.value];
    for (const value of values) {
      assertValueSerializable(value, record.key, new WeakSet());
    }
  }
};

const format = (diffTree) => {
  const records = flatten(diffTree, "");
  assertRecordsSerializable(records);
  return stringifyValueGuarded(records, 2);
};

export default format;
