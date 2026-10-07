import { describe, test, expect } from "vitest";
import { fileURLToPath } from "node:url";
import parseFile, { getFormat, parseData } from "./parsers.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const INVALID_FIXTURE = fileURLToPath(new URL("../__fixtures__/invalid.json", import.meta.url));
const INVALID_YAML_FIXTURE = fileURLToPath(new URL("../__fixtures__/invalid.yml", import.meta.url));

const catchError = (fn) => {
  try {
    return fn();
  } catch (error) {
    return error;
  }
};

describe("getFormat", () => {
  test("extracts extension without the dot", () => {
    expect(getFormat("config.json")).toBe("json");
    expect(getFormat("data.yaml")).toBe("yaml");
  });

  test("is case-insensitive", () => {
    expect(getFormat("CONFIG.JSON")).toBe("json");
  });

  test("returns empty string when there is no extension", () => {
    expect(getFormat("Dockerfile")).toBe("");
  });

  test("maps the .yml extension to the yml format", () => {
    expect(getFormat("config.yml")).toBe("yml");
  });
});

describe("parseData", () => {
  test("parses json content into an object", () => {
    expect(parseData('{"a": 1}', "json")).toEqual({ a: 1 });
  });

  test("rejects unknown formats loudly", () => {
    expect(() => parseData("whatever", "txt")).toThrow("Unsupported file format: 'txt'");
  });
});

describe("parseFile", () => {
  test("reads and parses a json file by relative path", () => {
    expect(parseFile("__fixtures__/flat1.json")).toEqual({
      host: "hexlet.io",
      timeout: 50,
      proxy: "123.234.53.22",
      follow: false,
    });
  });

  test("reads and parses a json file by absolute path", () => {
    expect(parseFile(`${ROOT}__fixtures__/flat2.json`)).toEqual({
      timeout: 20,
      verbose: true,
      host: "hexlet.io",
    });
  });

  test("reads the nested root fixture", () => {
    expect(parseFile("file1.json")).toEqual({
      common: {
        setting1: "Value 1",
        setting2: 200,
        setting3: true,
        setting6: { key: "value", doge: { wow: "" } },
      },
      group1: {
        baz: "bas",
        foo: "bar",
        nest: { key: "value" },
      },
      group2: { abc: 12345, deep: { id: 45 } },
    });
  });

  test("fails loudly when the file does not exist", () => {
    expect(() => parseFile("definitely-missing-file.json")).toThrow(
      "File not found: 'definitely-missing-file.json'",
    );
  });

  test("fails loudly when content is not valid json", () => {
    expect(() => parseFile(INVALID_FIXTURE)).toThrow("Cannot parse file");
  });

  test("unsupported format message names the file", () => {
    const noExtension = fileURLToPath(new URL("../__fixtures__/noextension", import.meta.url));

    expect(() => parseFile(noExtension)).toThrow(
      `Unsupported file format: '' (file '${noExtension}')`,
    );
  });

  test("read errors other than missing file also name the file", () => {
    const directory = fileURLToPath(new URL("../__fixtures__", import.meta.url));

    expect(() => parseFile(directory)).toThrow(`Cannot read file '${directory}':`);
  });

  test("parses yaml content for both yml and yaml keys", () => {
    expect(parseData("host: hexlet.io\n", "yml")).toEqual({ host: "hexlet.io" });
    expect(parseData("host: hexlet.io\n", "yaml")).toEqual({ host: "hexlet.io" });
  });

  test("reads and parses a yaml file by relative path", () => {
    expect(parseFile("file1.yml")).toEqual({
      host: "hexlet.io",
      timeout: 50,
      proxy: "123.234.53.22",
      follow: false,
    });
  });

  test("fails loudly when yaml content is not valid", () => {
    expect(() => parseFile(INVALID_YAML_FIXTURE)).toThrow("Cannot parse file");
  });

  test("preserves the original parser error as cause", () => {
    const error = catchError(() => parseFile(INVALID_YAML_FIXTURE));

    expect(error).toBeInstanceOf(Error);
    expect(error.cause).toBeDefined();
  });

  test("does not treat inherited dictionary keys as parsers", () => {
    const payload = fileURLToPath(new URL("../__fixtures__/payload..constructor", import.meta.url));

    expect(() => parseFile(payload)).toThrow("Unsupported file format: 'constructor'");
  });

  test("parseData rejects inherited dictionary keys directly", () => {
    expect(() => parseData("whatever", "constructor")).toThrow(
      "Unsupported file format: 'constructor'",
    );
  });
});
