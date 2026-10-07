import { describe, test, expect } from "vitest";
import format from "./plain.js";

describe("plain formatter", () => {
  test("returns an empty string for an empty diff tree", () => {
    expect(format([])).toBe("");
  });

  test("renders a removed property", () => {
    expect(format([{ key: "a", type: "removed", value: 1 }])).toBe("Property 'a' was removed");
  });

  test("renders an added primitive with its value as-is", () => {
    const tree = [
      { key: "num", type: "added", value: 200 },
      { key: "flag", type: "added", value: false },
      { key: "nothing", type: "added", value: null },
    ];

    expect(format(tree)).toBe(
      [
        "Property 'num' was added with value: 200",
        "Property 'flag' was added with value: false",
        "Property 'nothing' was added with value: null",
      ].join("\n"),
    );
  });

  test("renders added strings in single quotes", () => {
    expect(format([{ key: "a", type: "added", value: "blah blah" }])).toBe(
      "Property 'a' was added with value: 'blah blah'",
    );
  });

  test("renders compound values as [complex value]", () => {
    const tree = [
      { key: "obj", type: "added", value: { a: 1 } },
      { key: "arr", type: "added", value: [1, 2] },
    ];

    expect(format(tree)).toBe(
      [
        "Property 'obj' was added with value: [complex value]",
        "Property 'arr' was added with value: [complex value]",
      ].join("\n"),
    );
  });

  test("renders updated properties with From/To on both sides", () => {
    const tree = [
      { key: "a", type: "changed", oldValue: true, newValue: null },
      { key: "b", type: "changed", oldValue: "bas", newValue: "bars" },
      { key: "c", type: "changed", oldValue: { deep: 1 }, newValue: "str" },
    ];

    expect(format(tree)).toBe(
      [
        "Property 'a' was updated. From true to null",
        "Property 'b' was updated. From 'bas' to 'bars'",
        "Property 'c' was updated. From [complex value] to 'str'",
      ].join("\n"),
    );
  });

  test("skips unchanged nodes and builds full paths through nested nodes", () => {
    const tree = [
      {
        key: "common",
        type: "nested",
        children: [
          { key: "keep", type: "unchanged", value: 1 },
          {
            key: "inner",
            type: "nested",
            children: [{ key: "ops", type: "added", value: "vops" }],
          },
        ],
      },
    ];

    expect(format(tree)).toBe("Property 'common.inner.ops' was added with value: 'vops'");
  });

  test("escapes control characters in keys and string values", () => {
    const tree = [
      { key: "a\nb", type: "removed", value: 1 },
      { key: "c", type: "added", value: "x\r\ny" },
    ];

    expect(format(tree)).toBe(
      [
        "Property '\"a\\nb\"' was removed",
        "Property 'c' was added with value: '\"x\\r\\ny\"'",
      ].join("\n"),
    );
  });

  test("escapes unicode line separators inside strings", () => {
    expect(format([{ key: "a", type: "added", value: "x\u2028y" }])).toBe(
      "Property 'a' was added with value: '\"x\\u2028y\"'",
    );
  });

  test("names the property when a value cannot be rendered", () => {
    expect(() => format([{ key: "a", type: "changed", oldValue: 1, newValue: NaN }])).toThrow(
      "Property 'a': Value is not representable in diff output: NaN",
    );
  });

  test("fails loudly for unknown node types", () => {
    expect(() => format([{ key: "a", type: "weird" }])).toThrow("Unknown diff node type");
  });
});
