import { describe, test, expect } from "vitest";
import { fileURLToPath } from "node:url";
import genDiff from "@hexlet/code";

const FIXTURES = (name) => fileURLToPath(new URL(`../__fixtures__/${name}`, import.meta.url));

const ASSIGNMENT_DIFF = [
  "{",
  "  - follow: false",
  "    host: hexlet.io",
  "  - proxy: 123.234.53.22",
  "  - timeout: 50",
  "  + timeout: 20",
  "  + verbose: true",
  "}",
].join("\n");

const MIRRORED_DIFF = [
  "{",
  "  + follow: false",
  "    host: hexlet.io",
  "  + proxy: 123.234.53.22",
  "  - timeout: 20",
  "  + timeout: 50",
  "  - verbose: true",
  "}",
].join("\n");

// Exact output from the recursion-step assignment (explanatory comments removed).
// NOTE: the "- wow: " line has a TRAILING SPACE — empty string renders as-is.
const NESTED_ASSIGNMENT_DIFF = [
  "{",
  "    common: {",
  "      + follow: false",
  "        setting1: Value 1",
  "      - setting2: 200",
  "      - setting3: true",
  "      + setting3: null",
  "      + setting4: blah blah",
  "      + setting5: {",
  "            key5: value5",
  "        }",
  "        setting6: {",
  "            doge: {",
  "              - wow: ",
  "              + wow: so much",
  "            }",
  "            key: value",
  "          + ops: vops",
  "        }",
  "    }",
  "    group1: {",
  "      - baz: bas",
  "      + baz: bars",
  "        foo: bar",
  "      - nest: {",
  "            key: value",
  "        }",
  "      + nest: str",
  "    }",
  "  - group2: {",
  "        abc: 12345",
  "        deep: {",
  "            id: 45",
  "        }",
  "    }",
  "  + group3: {",
  "        deep: {",
  "            id: {",
  "                number: 45",
  "            }",
  "        }",
  "        fee: 100500",
  "    }",
  "}",
].join("\n");

// Exact plain-format output from the assignment (11 lines, in traversal order).
const PLAIN_ASSIGNMENT_DIFF = [
  "Property 'common.follow' was added with value: false",
  "Property 'common.setting2' was removed",
  "Property 'common.setting3' was updated. From true to null",
  "Property 'common.setting4' was added with value: 'blah blah'",
  "Property 'common.setting5' was added with value: [complex value]",
  "Property 'common.setting6.doge.wow' was updated. From '' to 'so much'",
  "Property 'common.setting6.ops' was added with value: 'vops'",
  "Property 'group1.baz' was updated. From 'bas' to 'bars'",
  "Property 'group1.nest' was updated. From [complex value] to 'str'",
  "Property 'group2' was removed",
  "Property 'group3' was added with value: [complex value]",
].join("\n");

describe("genDiff", () => {
  test("is exported as default and is a function", () => {
    expect(typeof genDiff).toBe("function");
  });

  test("returns the exact diff from the assignment for flat files", () => {
    expect(genDiff(FIXTURES("flat1.json"), FIXTURES("flat2.json"))).toBe(ASSIGNMENT_DIFF);
  });

  test("mirrors signs when flat arguments are swapped", () => {
    expect(genDiff(FIXTURES("flat2.json"), FIXTURES("flat1.json"))).toBe(MIRRORED_DIFF);
  });

  test("marks all lines as unchanged for identical files", () => {
    expect(genDiff(FIXTURES("flat1.json"), FIXTURES("flat1.json"))).toBe(
      [
        "{",
        "    follow: false",
        "    host: hexlet.io",
        "    proxy: 123.234.53.22",
        "    timeout: 50",
        "}",
      ].join("\n"),
    );
  });

  test("compares parsed data, not file text", () => {
    const diff = genDiff(FIXTURES("same-data-1.json"), FIXTURES("same-data-2.json"));

    expect(diff).toBe(
      [
        "{",
        "    follow: false",
        "    host: hexlet.io",
        "    proxy: 123.234.53.22",
        "    timeout: 50",
        "}",
      ].join("\n"),
    );
  });

  test("returns an empty diff body for empty objects", () => {
    expect(genDiff(FIXTURES("empty.json"), FIXTURES("empty.json"))).toBe("{\n}");
  });

  test("fails loudly for output formats that are not implemented yet", () => {
    expect(() => genDiff("file1.json", "file2.json", "xml")).toThrow(
      "Output format 'xml' is not implemented yet",
    );
  });

  test("returns the exact diff from the assignment for yaml files", () => {
    expect(genDiff("file1.yml", "file2.yml")).toBe(ASSIGNMENT_DIFF);
  });

  test("mirrors signs when yaml arguments are swapped", () => {
    expect(genDiff("file2.yml", "file1.yml")).toBe(MIRRORED_DIFF);
  });

  test("fails loudly when a file has a non-object top-level value", () => {
    const scalar = FIXTURES("scalar.yml");
    const array = FIXTURES("top-level-array.json");
    const nullFile = FIXTURES("top-level-null.json");

    expect(() => genDiff(scalar, "file1.json")).toThrow(
      `Top-level data in '${scalar}' is not an object`,
    );
    expect(() => genDiff(array, "file1.json")).toThrow(
      `Top-level data in '${array}' is not an object`,
    );
    expect(() => genDiff(nullFile, "file1.json")).toThrow(
      `Top-level data in '${nullFile}' is not an object`,
    );
  });

  test("treats keys shadowing Object.prototype as regular own keys", () => {
    expect(genDiff(FIXTURES("proto-keys.json"), FIXTURES("empty.json"))).toBe(
      ["{", "  - key: val", "  - toString: custom", "}"].join("\n"),
    );
  });

  test("fails loudly for non-finite numbers that cannot be rendered", () => {
    const nan = FIXTURES("nan.yml");

    expect(() => genDiff(nan, nan)).toThrow("Value is not representable in diff output");
  });

  test("fails loudly for non-finite numbers nested inside object values", () => {
    const nested = FIXTURES("nested-nan.yml");

    expect(() => genDiff(nested, nested)).toThrow("Value is not representable in diff output");
  });

  test("renders multiline strings as a single quoted line", () => {
    expect(genDiff(FIXTURES("block.yml"), FIXTURES("empty.json"))).toBe(
      ["{", '  - description: "line one\\nline two\\n"', "}"].join("\n"),
    );
  });

  test("returns the exact diff from the assignment for nested files", () => {
    expect(genDiff("file1.json", "file2.json")).toBe(NESTED_ASSIGNMENT_DIFF);
  });

  test("produces identical output for nested yaml files", () => {
    expect(genDiff(FIXTURES("nested1.yml"), FIXTURES("nested2.yml"))).toBe(NESTED_ASSIGNMENT_DIFF);
  });

  test("returns the exact plain diff from the assignment for nested files", () => {
    expect(genDiff("file1.json", "file2.json", "plain")).toBe(PLAIN_ASSIGNMENT_DIFF);
  });

  test("produces identical plain output for nested yaml files", () => {
    expect(genDiff(FIXTURES("nested1.yml"), FIXTURES("nested2.yml"), "plain")).toBe(
      PLAIN_ASSIGNMENT_DIFF,
    );
  });

  test("returns machine-readable json records for nested files", () => {
    const records = JSON.parse(genDiff("file1.json", "file2.json", "json"));

    expect(records).toEqual([
      { type: "added", key: "common.follow", value: false },
      { type: "removed", key: "common.setting2", value: 200 },
      { type: "changed", key: "common.setting3", oldValue: true, newValue: null },
      { type: "added", key: "common.setting4", value: "blah blah" },
      { type: "added", key: "common.setting5", value: { key5: "value5" } },
      { type: "changed", key: "common.setting6.doge.wow", oldValue: "", newValue: "so much" },
      { type: "added", key: "common.setting6.ops", value: "vops" },
      { type: "changed", key: "group1.baz", oldValue: "bas", newValue: "bars" },
      { type: "changed", key: "group1.nest", oldValue: { key: "value" }, newValue: "str" },
      { type: "removed", key: "group2", value: { abc: 12345, deep: { id: 45 } } },
      { type: "added", key: "group3", value: { deep: { id: { number: 45 } }, fee: 100500 } },
    ]);
  });

  test("produces identical json output for nested yaml files", () => {
    expect(JSON.parse(genDiff(FIXTURES("nested1.yml"), FIXTURES("nested2.yml"), "json"))).toEqual(
      JSON.parse(genDiff("file1.json", "file2.json", "json")),
    );
  });

  test("fails loudly on circular values in json format", () => {
    expect(() => genDiff(FIXTURES("circular.yml"), FIXTURES("empty.json"), "json")).toThrow(
      "Circular reference detected in the compared data",
    );
  });

  test("names the key when a json value is not representable", () => {
    expect(() => genDiff(FIXTURES("nested-nan.yml"), FIXTURES("empty.json"), "json")).toThrow(
      "Value is not representable in diff output: NaN (at key 'outer')",
    );
  });

  test("fails loudly on circular yaml anchors when building the diff tree", () => {
    const circular = FIXTURES("circular.yml");

    expect(() => genDiff(circular, circular)).toThrow(
      "Circular reference detected in the compared data",
    );
  });

  test("fails loudly on circular yaml anchors when rendering a removed value", () => {
    const circular = FIXTURES("circular.yml");

    expect(() => genDiff(circular, FIXTURES("empty.json"))).toThrow(
      "Circular reference detected in the compared data",
    );
  });
});
