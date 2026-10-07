import { isPlainObject } from "../diffTree.js";
import { escapeText, stringifyValueGuarded } from "../utils.js";

const stringifyValue = (value, propertyPath) => {
  try {
    if (isPlainObject(value) || Array.isArray(value)) return "[complex value]";
    if (typeof value === "string") return `'${escapeText(value)}'`;
    return stringifyValueGuarded(value);
  } catch (error) {
    error.message = `Property '${propertyPath}': ${error.message}`;
    throw error;
  }
};

const formatLines = (nodes, path) =>
  nodes.flatMap((node) => {
    const propertyPath = path ? `${path}.${escapeText(node.key)}` : escapeText(node.key);
    switch (node.type) {
      case "nested":
        return formatLines(node.children, propertyPath);
      case "unchanged":
        return [];
      case "removed":
        return [`Property '${propertyPath}' was removed`];
      case "added":
        return [
          `Property '${propertyPath}' was added with value: ${stringifyValue(node.value, propertyPath)}`,
        ];
      case "changed":
        return [
          `Property '${propertyPath}' was updated. From ${stringifyValue(node.oldValue, propertyPath)} to ${stringifyValue(node.newValue, propertyPath)}`,
        ];
      default:
        throw new Error(`Unknown diff node type: '${node.type}'`);
    }
  });

const format = (diffTree) => formatLines(diffTree, "").join("\n");

export default format;
