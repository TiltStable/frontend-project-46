import { describe, test, expect } from "vitest";
import format from "./index.js";
import stylish from "./stylish.js";
import plain from "./plain.js";
import json from "./json.js";

describe("format dispatcher", () => {
  test("uses stylish by default and by name", () => {
    const tree = [{ key: "a", type: "unchanged", value: 1 }];

    expect(format(tree)).toBe(stylish(tree));
    expect(format(tree, "stylish")).toBe(stylish(tree));
  });

  test("dispatches plain to the plain formatter", () => {
    const tree = [{ key: "a", type: "removed", value: 1 }];

    expect(format(tree, "plain")).toBe(plain(tree));
  });

  test("dispatches json to the json formatter", () => {
    const tree = [{ key: "a", type: "removed", value: 1 }];

    expect(format(tree, "json")).toBe(json(tree));
  });

  test("fails loudly for formats that are not implemented yet", () => {
    expect(() => format([], "xml")).toThrow("Output format 'xml' is not implemented yet");
    expect(() => format([], "constructor")).toThrow(
      "Output format 'constructor' is not implemented yet",
    );
  });
});
