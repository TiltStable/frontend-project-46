import { describe, test, expect } from "vitest";
import format from "./stylish.js";

describe("stylish formatter", () => {
  test("returns an empty body for an empty diff tree", () => {
    expect(format([])).toBe("{\n}");
  });

  test("renders a changed node as two signed lines", () => {
    expect(format([{ key: "a", type: "changed", oldValue: 1, newValue: 2 }])).toBe(
      "{\n  - a: 1\n  + a: 2\n}",
    );
  });

  test("renders an added object value as a block without signs inside", () => {
    expect(format([{ key: "g", type: "added", value: { a: 1, deep: { id: 2 } } }])).toBe(
      [
        "{",
        "  + g: {",
        "        a: 1",
        "        deep: {",
        "            id: 2",
        "        }",
        "    }",
        "}",
      ].join("\n"),
    );
  });

  test("renders nested nodes with unsigned opening and closing", () => {
    expect(
      format([{ key: "g", type: "nested", children: [{ key: "a", type: "added", value: 1 }] }]),
    ).toBe(["{", "    g: {", "      + a: 1", "    }", "}"].join("\n"));
  });

  test("renders changed primitive to object and back", () => {
    const toObject = format([
      { key: "id", type: "changed", oldValue: 45, newValue: { number: 45 } },
    ]);

    expect(toObject).toBe(
      ["{", "  - id: 45", "  + id: {", "        number: 45", "    }", "}"].join("\n"),
    );

    const fromObject = format([
      { key: "id", type: "changed", oldValue: { number: 45 }, newValue: 45 },
    ]);

    expect(fromObject).toBe(
      ["{", "  - id: {", "        number: 45", "    }", "  + id: 45", "}"].join("\n"),
    );
  });

  test("renders null and an empty string as-is", () => {
    expect(
      format([
        { key: "a", type: "changed", oldValue: true, newValue: null },
        { key: "b", type: "unchanged", value: "" },
      ]),
    ).toBe(["{", "  - a: true", "  + a: null", "    b: ", "}"].join("\n"));
  });

  test("renders multiline strings as a single quoted line", () => {
    expect(format([{ key: "a", type: "removed", value: "line one\nline two" }])).toBe(
      '{\n  - a: "line one\\nline two"\n}',
    );
  });

  test("escapes control characters inside string values", () => {
    expect(format([{ key: "a", type: "removed", value: "a\rb" }])).toBe('{\n  - a: "a\\rb"\n}');
  });

  test("escapes keys containing control characters", () => {
    expect(format([{ key: "a\nb", type: "removed", value: 1 }])).toBe('{\n  - "a\\nb": 1\n}');
  });

  test("renders an empty object value as a block by the general formula", () => {
    expect(format([{ key: "a", type: "added", value: {} }])).toBe(
      ["{", "  + a: {", "    }", "}"].join("\n"),
    );
  });

  test("fails loudly for unknown node types", () => {
    expect(() => format([{ key: "a", type: "weird" }])).toThrow("Unknown diff node type");
  });

  test("names the nearest key when a nested value cannot be rendered", () => {
    expect(() =>
      format([{ key: "outer", type: "changed", oldValue: 1, newValue: { timeout: NaN } }]),
    ).toThrow("Value is not representable in diff output: NaN (at key 'outer')");
  });
});
