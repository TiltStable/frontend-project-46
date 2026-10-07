import { describe, test, expect } from "vitest";
import buildDiff, { isPlainObject } from "./diffTree.js";

describe("buildDiff", () => {
  test("marks keys present only in the first object as removed", () => {
    expect(buildDiff({ a: 1 }, {})).toEqual([{ key: "a", type: "removed", value: 1 }]);
  });

  test("marks keys present only in the second object as added", () => {
    expect(buildDiff({}, { a: 1 })).toEqual([{ key: "a", type: "added", value: 1 }]);
  });

  test("marks equal primitives as unchanged", () => {
    expect(buildDiff({ a: 1 }, { a: 1 })).toEqual([{ key: "a", type: "unchanged", value: 1 }]);
  });

  test("marks different primitives as a single changed node, not a pair", () => {
    expect(buildDiff({ a: 1 }, { a: 2 })).toEqual([
      { key: "a", type: "changed", oldValue: 1, newValue: 2 },
    ]);
  });

  test("builds nested children only when both values are plain objects", () => {
    expect(buildDiff({ a: { b: 1 } }, { a: { b: 2 } })).toEqual([
      {
        key: "a",
        type: "nested",
        children: [{ key: "b", type: "changed", oldValue: 1, newValue: 2 }],
      },
    ]);
  });

  test("treats object vs primitive as changed, not nested", () => {
    expect(buildDiff({ a: { b: 1 } }, { a: "str" })).toEqual([
      { key: "a", type: "changed", oldValue: { b: 1 }, newValue: "str" },
    ]);
  });

  test("compares arrays by reference as plain values", () => {
    expect(buildDiff({ a: [1] }, { a: [1] })).toEqual([
      { key: "a", type: "changed", oldValue: [1], newValue: [1] },
    ]);
  });

  test("treats NaN as equal to itself", () => {
    expect(buildDiff({ a: NaN }, { a: NaN })).toEqual([
      { key: "a", type: "unchanged", value: NaN },
    ]);
  });

  test("sorts keys at every level", () => {
    const nested = buildDiff({ x: { b: 1, a: 2 } }, { x: { b: 1, a: 2 } });

    expect(nested[0].children.map((node) => node.key)).toEqual(["a", "b"]);
    expect(buildDiff({ b: 1, a: 2 }, { b: 1, a: 2 }).map((node) => node.key)).toEqual(["a", "b"]);
  });

  test("treats keys shadowing Object.prototype as own keys", () => {
    expect(buildDiff({ toString: 1 }, {})).toEqual([
      { key: "toString", type: "removed", value: 1 },
    ]);
  });

  test("isPlainObject rejects null, arrays and primitives", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([1])).toBe(false);
    expect(isPlainObject("str")).toBe(false);
  });
});
