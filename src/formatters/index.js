import stylish from "./stylish.js";
import plain from "./plain.js";
import json from "./json.js";

const formatters = { stylish, plain, json };

const format = (diffTree, formatName = "stylish") => {
  if (!Object.hasOwn(formatters, formatName)) {
    throw new Error(`Output format '${formatName}' is not implemented yet`);
  }
  return formatters[formatName](diffTree);
};

export default format;
