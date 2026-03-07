import { CommanderError } from 'commander';
import { createProgram } from '../src/cli/index.js';
import { TckError } from '../src/domain/errors.js';

async function main(): Promise<void> {
  const program = createProgram();
  program.exitOverride();

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof TckError) {
      console.error(error.message);
      process.exitCode = error.exitCode;
      return;
    }

    if (error instanceof CommanderError) {
      if (error.code === 'commander.helpDisplayed') {
        process.exitCode = 0;
        return;
      }

      console.error(error.message);
      process.exitCode = 2;
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

await main();
