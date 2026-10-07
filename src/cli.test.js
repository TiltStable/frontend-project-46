import { afterEach, describe, test, expect, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { CommanderError } from "commander";
import buildProgram, { VERSION } from "./cli.js";

const BIN_PATH = fileURLToPath(new URL("../bin/gendiff.js", import.meta.url));
const FILE1 = fileURLToPath(new URL("../__fixtures__/flat1.json", import.meta.url));
const FILE2 = fileURLToPath(new URL("../__fixtures__/flat2.json", import.meta.url));

const catchError = (fn) => {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
};

const runBin = (args, options = {}) =>
  execFileSync(process.execPath, [BIN_PATH, ...args], {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });

describe("gendiff CLI help", () => {
  test("generated help contains required lines from the assignment", () => {
    const help = buildProgram().helpInformation();

    expect(help).toContain("Usage: gendiff [options] <filepath1> <filepath2>");
    expect(help).toContain("Compares two configuration files and shows a difference.");
    expect(help).toContain("-V, --version");
    expect(help).toContain("output the version number");
    expect(help).toContain("-f, --format [type]");
    expect(help).toContain("output format");
    expect(help).toContain('(default: "stylish")');
    expect(help).toContain("-h, --help");
    expect(help).toContain("display help for command");
  });

  test("-h triggers help flow and exits with code 0", () => {
    const program = buildProgram();
    program.exitOverride();

    const error = catchError(() => program.parse(["node", "gendiff", "-h"]));

    expect(error).not.toBeNull();
    expect(error).toBeInstanceOf(CommanderError);
    expect(error.exitCode).toBe(0);
  });

  test("bin -h prints help to stdout", () => {
    const output = runBin(["-h"]);

    expect(output).toContain("Usage: gendiff [options] <filepath1> <filepath2>");
    expect(output).toContain("-f, --format [type]");
    expect(output).toContain("-V, --version");
    expect(output).toContain("-h, --help");
  });

  test("bin -V prints version", () => {
    const output = runBin(["-V"]);

    expect(output.trim()).toBe(VERSION);
  });
});

describe("gendiff CLI arguments and options", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("-f with a not-yet-implemented format fails loudly", () => {
    const program = buildProgram();
    program.exitOverride();

    const error = catchError(() => program.parse(["node", "gendiff", FILE1, FILE2, "-f", "xml"]));

    expect(error).not.toBeNull();
    expect(error.message).toContain("xml");
    expect(error.message).toContain("not implemented");
  });

  test("-f json prints machine-readable records", () => {
    const output = runBin(["file1.json", "file2.json", "-f", "json"]);
    const records = JSON.parse(output);

    expect(records).toHaveLength(11);
    expect(records[0]).toEqual({ type: "added", key: "common.follow", value: false });
    expect(records.at(-1)).toEqual({
      type: "added",
      key: "group3",
      value: { deep: { id: { number: 45 } }, fee: 100500 },
    });
  });

  test("-f plain prints text descriptions of the changes", () => {
    const program = buildProgram();
    program.exitOverride();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const error = catchError(() =>
      program.parse(["node", "gendiff", "file1.json", "file2.json", "-f", "plain"]),
    );

    expect(error).toBeNull();
    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Property 'common.follow' was added with value: false");
    expect(output).toContain("Property 'group2' was removed");
  });

  test("bare -f without a value falls back to stylish and prints the diff", () => {
    const program = buildProgram();
    program.exitOverride();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const error = catchError(() => program.parse(["node", "gendiff", FILE1, FILE2, "-f"]));

    expect(error).toBeNull();
    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("  + verbose: true");
    expect(output).toContain("  - timeout: 50");
  });

  test("format defaults to stylish when -f is omitted", () => {
    const program = buildProgram();
    program.exitOverride();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const error = catchError(() => program.parse(["node", "gendiff", FILE1, FILE2]));

    expect(error).toBeNull();
    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("    host: hexlet.io");
    expect(output).toContain("  + timeout: 20");
  });

  test("accepts yaml input files and prints the diff", () => {
    const program = buildProgram();
    program.exitOverride();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const error = catchError(() => program.parse(["node", "gendiff", "file1.yml", "file2.yml"]));

    expect(error).toBeNull();
    const output = logSpy.mock.calls.flat().join("\n");
    expect(output).toContain("  - follow: false");
    expect(output).toContain("  + verbose: true");
  });

  test("missing file fails with a friendly message", () => {
    const program = buildProgram();
    program.exitOverride();

    const error = catchError(() =>
      program.parse(["node", "gendiff", "missing.json", "file2.json"]),
    );

    expect(error).not.toBeNull();
    expect(error.exitCode).toBe(1);
    expect(error.message).toContain("File not found: 'missing.json'");
  });
});

describe("gendiff CLI end-to-end", () => {
  test("bin prints the diff for two existing files", () => {
    const output = runBin([FILE1, FILE2]);

    expect(output).toContain("  - follow: false");
    expect(output).toContain("    host: hexlet.io");
    expect(output).toContain("  - timeout: 50");
    expect(output).toContain("  + timeout: 20");
    expect(output).toContain("  + verbose: true");
  });

  test("bin prints the nested diff in stylish format", () => {
    const output = runBin(["file1.json", "file2.json"]);

    expect(output).toContain("    common: {");
    expect(output).toContain("      + follow: false");
    expect(output).toContain("  - group2: {");
    expect(output).toContain("  + group3: {");
  });

  test("bin works with absolute paths from any working directory", () => {
    const output = runBin([FILE1, FILE2], { cwd: tmpdir() });

    expect(output).toContain("    host: hexlet.io");
    expect(output).toContain("  + verbose: true");
  });

  test("bin reports a missing file without a stack trace", () => {
    const error = catchError(() => runBin(["missing.json", "file2.json"]));

    expect(error).not.toBeNull();
    expect(error.status).toBe(1);
    expect(error.stderr).toContain("File not found: 'missing.json'");
    expect(error.stderr).not.toContain("    at ");
  });
});
