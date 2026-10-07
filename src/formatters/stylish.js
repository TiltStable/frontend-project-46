import { isPlainObject } from "../diffTree.js";
import { escapeText, stringifyValueGuarded } from "../utils.js";

const signIndent = (depth) => " ".repeat(depth * 4 - 2);
const plainIndent = (depth) => " ".repeat(depth * 4);

const stringifyPrimitive = (value) => {
  if (typeof value === "string") {
    return escapeText(value);
  }
  return stringifyValueGuarded(value);
};

const renderValueLines = (value, depth, seen = new WeakSet()) => {
  const childDepth = depth + 1;
  return Object.keys(value)
    .sort()
    .flatMap((key) => {
      if (isPlainObject(value[key])) {
        if (seen.has(value[key])) {
          throw new Error("Circular reference detected in the compared data");
        }
        seen.add(value[key]);
        const lines = [
          `${plainIndent(childDepth)}${escapeText(key)}: {`,
          ...renderValueLines(value[key], childDepth, seen),
          `${plainIndent(childDepth)}}`,
        ];
        seen.delete(value[key]);
        return lines;
      }
      return [`${plainIndent(childDepth)}${escapeText(key)}: ${stringifyPrimitive(value[key])}`];
    });
};

const renderValue = (value, depth) => {
  if (!isPlainObject(value)) return [stringifyPrimitive(value)];
  return ["{", ...renderValueLines(value, depth), `${plainIndent(depth)}}`];
};

const renderSigned = (sign, key, value, depth) => {
  const [first, ...rest] = renderValue(value, depth);
  return [`${signIndent(depth)}${sign} ${escapeText(key)}: ${first}`, ...rest];
};

const renderNode = (node, depth) => {
  try {
    return renderNodeByType(node, depth);
  } catch (error) {
    if (error.message.startsWith("Value is not representable")) {
      error.message = `${error.message} (at key '${escapeText(node.key)}')`;
    }
    throw error;
  }
};

const renderNodeByType = (node, depth) => {
  switch (node.type) {
    case "nested":
      return [
        `${plainIndent(depth)}${escapeText(node.key)}: {`,
        ...node.children.flatMap((child) => renderNode(child, depth + 1)),
        `${plainIndent(depth)}}`,
      ];
    case "unchanged":
      return [`${plainIndent(depth)}${escapeText(node.key)}: ${stringifyPrimitive(node.value)}`];
    case "removed":
      return renderSigned("-", node.key, node.value, depth);
    case "added":
      return renderSigned("+", node.key, node.value, depth);
    case "changed":
      return [
        ...renderSigned("-", node.key, node.oldValue, depth),
        ...renderSigned("+", node.key, node.newValue, depth),
      ];
    default:
      throw new Error(`Unknown diff node type: '${node.type}'`);
  }
};

const format = (diffTree) =>
  ["{", ...diffTree.flatMap((node) => renderNode(node, 1)), "}"].join("\n");

export default format;
