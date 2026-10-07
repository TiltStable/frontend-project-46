import { describe, test, expect } from "vitest";
import format from "./json.js";

describe("json formatter", () => {
  test("formats records as a pretty-printed array", () => {
    expect(format([{ key: "a", type: "added", value: 1 }])).toBe(
      ["[", "  {", '    "type": "added",', '    "key": "a",', '    "value": 1', "  }", "]"].join(
        "\n",
      ),
    );
  });

  test("returns an empty array for an empty diff tree", () => {
    expect(format([])).toBe("[]");
  });

  test("keeps changed sides in oldValue/newValue fields", () => {
    const records = JSON.parse(
      format([{ key: "a", type: "changed", oldValue: true, newValue: null }]),
    );

    expect(records).toEqual([{ type: "changed", key: "a", oldValue: true, newValue: null }]);
  });

  test("flattens nested nodes into dotted paths and skips unchanged", () => {
    const tree = [
      {
        key: "common",
        type: "nested",
        children: [
          { key: "keep", type: "unchanged", value: 1 },
          { key: "ops", type: "added", value: "vops" },
        ],
      },
    ];

    expect(JSON.parse(format(tree))).toEqual([{ type: "added", key: "common.ops", value: "vops" }]);
  });

  test("keeps object and array values raw", () => {
    const records = JSON.parse(
      format([
        { key: "obj", type: "added", value: { key5: "value5" } },
        { key: "arr", type: "removed", value: [1, 2] },
      ]),
    );

    expect(records).toEqual([
      { type: "added", key: "obj", value: { key5: "value5" } },
      { type: "removed", key: "arr", value: [1, 2] },
    ]);
  });

  test("fails loudly for non-finite values and names the key", () => {
    expect(() => format([{ key: "a", type: "added", value: NaN }])).toThrow(
      "Value is not representable in diff output: NaN (at key 'a')",
    );
  });

  test("fails loudly on circular values", () => {
    const circular = { self: null };
    circular.self = circular;

    expect(() => format([{ key: "a", type: "removed", value: circular }])).toThrow(
      "Circular reference detected in the compared data",
    );
  });

  test("fails loudly for unknown node types", () => {
    expect(() => format([{ key: "a", type: "weird" }])).toThrow("Unknown diff node type");
  });
});
