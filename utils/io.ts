import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import picocolors from "picocolors";
import type { Abortable } from "node:events";

interface ReadFromConsoleInput {
  fallback?: string;
  input?: string;
  allowEmpty?: boolean;
}

// Helper function to replace remeda's piped function
const pipe = (value: string, ...fns: Array<(arg: string) => string>): string => {
  return fns.reduce((acc, fn) => fn(acc), value);
};

// Simple function to strip ANSI escape codes
const stripAnsi = (str: string): string => str.replace(/\x1B\[\d+m/g, '');

export function createConsoleReader({
  fallback,
  input = "User 👤 : ",
  allowEmpty = false,
}: ReadFromConsoleInput = {}) {
  const rl = readline.createInterface({ input: stdin, output: stdout, terminal: true, prompt: "" });
  let isActive = true;

  return {
    write(role: string, data: string) {
      rl.write(
        [role && pipe(role, picocolors.red, picocolors.bold), stripAnsi(data ?? "")]
          .filter(Boolean)
          .join(" ")
          .concat("\n"),
      );
    },

    async prompt(): Promise<string> {
      for await (const { prompt } of this) {
        return prompt;
      }
      process.exit(0);
    },

    async askSingleQuestion(queryMessage: string, options?: Abortable): Promise<string> {
      const answer = await rl.question(
        pipe(queryMessage, picocolors.cyan, picocolors.bold),
        options ?? { signal: undefined },
      );
      return stripAnsi(answer.trim());
    },

    close() {
      stdin.pause();
      rl.close();
    },

    async *[Symbol.asyncIterator]() {
      if (!isActive) {
        return;
      }

      try {
        rl.write(
          `${picocolors.dim(`Interactive session has started. To escape, input 'q' and submit.\n`)}`,
        );

        for (let iteration = 1, prompt = ""; isActive; iteration++) {
          prompt = await rl.question(pipe(input, picocolors.cyan, picocolors.bold));
          prompt = stripAnsi(prompt);

          if (prompt === "q") {
            break;
          }
          if (!prompt.trim() || prompt === "\n") {
            prompt = fallback ?? "";
          }
          if (allowEmpty !== false && !prompt.trim()) {
            rl.write("Error: Empty prompt is not allowed. Please try again.\n");
            iteration -= 1;
            continue;
          }
          yield { prompt, iteration };
        }
      } catch (e) {
        if (e.code === "ERR_USE_AFTER_CLOSE") {
          return;
        }
        throw e;
      } finally {
        isActive = false;
        rl.close();
      }
    },
  };
}
