import { Command } from "commander";
import genDiff from "./index.js";

const VERSION = "1.0.0";

const buildProgram = () => {
  const program = new Command();

  program
    .name("gendiff")
    .description("Compares two configuration files and shows a difference.")
    .version(VERSION)
    .argument("<filepath1>")
    .argument("<filepath2>")
    .option("-f, --format [type]", "output format", "stylish")
    .action((filepath1, filepath2, { format }) => {
      const outputFormat = format === true ? "stylish" : format;
      try {
        console.log(genDiff(filepath1, filepath2, outputFormat));
      } catch (error) {
        program.error(error.message);
      }
    });

  return program;
};

export default buildProgram;
export { VERSION };
