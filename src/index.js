import parseFile from "./parsers.js";
import buildDiff from "./diffTree.js";
import formatDiff from "./formatters/index.js";

const assertTopLevelObject = (data, filepath) => {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`Top-level data in '${filepath}' is not an object`);
  }
};

const genDiff = (filepath1, filepath2, format = "stylish") => {
  const data1 = parseFile(filepath1);
  const data2 = parseFile(filepath2);
  assertTopLevelObject(data1, filepath1);
  assertTopLevelObject(data2, filepath2);

  return formatDiff(buildDiff(data1, data2), format);
};

export default genDiff;
