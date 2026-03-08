import * as readline from 'node:readline';

import { CommanderError } from 'commander';
import { Marked, type RendererObject } from 'marked';
import TerminalRenderer from 'marked-terminal';

import { TckError } from '../../domain/errors.js';
import { createCliContext } from '../context.js';
import { createProgram } from '../index.js';
import { getTranslator } from './shared.js';

/**
 * TerminalRenderer の prototype メソッドのみを抽出して marked に渡す。
 * コンストラクタが設定するインスタンスプロパティ（`o`, `tab` 等）は
 * marked v15 の renderer バリデーションを通過できないため除外する。
 */
function createTerminalMarked(): Marked {
  const renderer = new TerminalRenderer();
  const rendererObj: Record<string, unknown> = {};

  for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(renderer))) {
    if (key === 'constructor' || key === 'textLength') continue;
    const fn = (renderer as unknown as Record<string, unknown>)[key];
    if (typeof fn === 'function') {
      rendererObj[key] = (fn as (...args: unknown[]) => unknown).bind(renderer);
    }
  }

  const instance = new Marked();
  instance.use({ renderer: rendererObj as RendererObject });
  return instance;
}

const SLASH_COMMANDS = [
  '/create',
  '/list',
  '/view',
  '/update',
  '/delete',
  '/edit',
  '/status',
  '/log',
  '/mix',
  '/project',
  '/config',
  '/rebuild',
  '/help',
  '/exit',
];

function completer(line: string): [string[], string] {
  const hits = SLASH_COMMANDS.filter((c) => c.startsWith(line));
  return [hits.length ? hits : SLASH_COMMANDS, line];
}

export async function interactiveHandler(): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const markedInstance = createTerminalMarked();

  // ウェルカムバナーをマークダウンレンダリングして表示
  process.stdout.write(markedInstance.parse(t('interactiveWelcome')) as string);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'tck> ',
    completer,
  });

  rl.prompt();

  rl.on('line', (rawLine) => {
    void (async () => {
      const line = rawLine.trim();

      if (!line) {
        rl.prompt();
        return;
      }

      // 終了
      if (line === '/exit' || line === 'exit') {
        console.log(t('interactiveExit'));
        rl.close();
        return;
      }

      // ヘルプ
      if (line === '/help' || line === 'help') {
        process.stdout.write(markedInstance.parse(t('interactiveHelp')) as string);
        rl.prompt();
        return;
      }

      // スラッシュを除去してコマンドトークンに分割
      const input = line.startsWith('/') ? line.slice(1) : line;
      const args = splitArgs(input);

      if (args.length === 0) {
        rl.prompt();
        return;
      }

      try {
        // 各コマンドごとに新鮮なプログラムインスタンスを生成して実行
        // これにより Commander の状態汚染を防ぎ、既存ハンドラーをゼロ変更で再利用する
        const prog = createProgram();
        await prog.parseAsync(['node', 'tck', ...args]);
      } catch (err) {
        if (err instanceof TckError) {
          // NotFoundError / ValidationError / ConfigError → メッセージ表示してループ継続
          console.error(err.message);
        } else if (err instanceof CommanderError) {
          // --help 表示は正常終了（helpDisplayed）、それ以外はエラーとして表示
          if (err.code !== 'commander.helpDisplayed') {
            console.error(err.message);
          }
        } else {
          // 予期しないエラーはループを終了して上位に投げる
          rl.close();
          throw err;
        }
      }

      rl.prompt();
    })();
  });

  rl.on('close', () => {
    // Ctrl+D または rl.close() からの終了
    process.stdout.write('\n');
    process.exit(0);
  });
}

/** シングル/ダブルクォートを考慮した引数分割 */
function splitArgs(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const ch of input) {
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
    } else if (ch === ' ') {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }

  if (current) args.push(current);
  return args;
}
