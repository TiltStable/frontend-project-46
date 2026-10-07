import { readFileSync } from "node:fs";
import path from "node:path";
import { load as loadYaml } from "js-yaml";

const parseYaml = (content) => {
  try {
    return loadYaml(content);
  } catch (error) {
    throw new SyntaxError(error.message, { cause: error });
  }
};

const parsers = {
  json: JSON.parse,
  yml: parseYaml,
  yaml: parseYaml,
};

const getFormat = (filepath) => path.extname(filepath).slice(1).toLowerCase();

const parseData = (content, format) => {
  if (!Object.hasOwn(parsers, format)) {
    throw new Error(`Unsupported file format: '${format}'`);
  }
  return parsers[format](content);
};

const parseFile = (filepath) => {
  const absolutePath = path.resolve(filepath);

  let content;
  try {
    content = readFileSync(absolutePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: '${filepath}'`);
    }
    throw new Error(`Cannot read file '${filepath}': ${error.message}`, { cause: error });
  }

  const format = getFormat(absolutePath);
  if (!Object.hasOwn(parsers, format)) {
    throw new Error(`Unsupported file format: '${format}' (file '${filepath}')`);
  }

  try {
    return parseData(content, format);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Cannot parse file '${filepath}' (${format}): ${error.message}`, {
        cause: error,
      });
    }
    throw error;
  }
};

export default parseFile;
export { getFormat, parseData };
