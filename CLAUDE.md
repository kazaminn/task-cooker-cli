# CLAUDE.md

このファイルはClaude Code/Codex共通のプロジェクトガイドです。

## プロジェクト概要

TaskCooker CLI (`tck`) - タスクとミックス（スレッド型ディスカッション）をコマンドラインで管理するNode.js CLIツール。テキストファイルベースで永続化し、将来的にFirestoreへ移行する想定。

## 技術スタック

- Node.js >= 20 / TypeScript / ESM (`"type": "module"`)
- CLI: Commander.js
- テスト: Vitest
- ビルド: tsc (`tsconfig.build.json`)
- パッケージマネージャ: pnpm

## コマンド

```sh
pnpm build          # tsc + shebang挿入
pnpm test           # vitest run
pnpm test:watch     # vitest
pnpm lint           # eslint src/
pnpm lint:fix       # eslint src/ --fix
pnpm typecheck      # tsc --noEmit
pnpm ci             # typecheck → lint → format:check → test
```

## ドキュメント

- `docs/tck-cli-spec-v6.md` - 仕様書（コマンド定義、データ形式、ステータス、ID採番ルール等）
- `docs/tck-cli-architecture-v4.md` - 実装設計書（レイヤー構成、型定義、パーサー設計、実装順序等）

実装前に必ず両ドキュメントを参照すること。

## アーキテクチャ

```
bin/tck.ts           エントリポイント
cli/commands/        コマンド定義（宣言のみ）
cli/handlers/        コマンドハンドラー（入力処理・出力フォーマット）
cli/options/         共通オプション（Option オブジェクト再利用）
service/             ビジネスロジック
repository/          ファイル I/O
parser/              テキスト ↔ オブジェクト変換
domain/              型・定数・エラー
util/                ユーティリティ
```

依存は一方向: commands → handlers → service → repository → parser → domain

## 設計原則（厳守）

1. **パーサーは純粋関数** - ファイルシステムに一切触れない。`string → object` と `object → string` のみ
2. **リポジトリは1リソース1責務** - task.repo はタスクファイルだけ、counter.repo はカウンタだけ
3. **サービスは console 出力しない** - データを返すだけ。表示はハンドラーの責務
4. **コマンドファイルは宣言だけ** - `.action(handler)` の紐づけのみ。ロジックはハンドラーに分離
5. **`process.cwd()` を直接使わない** - プロジェクトルート解決は `util/path.ts` に集約
6. **全ファイル書き込みは atomic write** - 一時ファイル → rename
7. **CLIは `master.todo` に一切触れない** - 人間用ダッシュボードはCLI管理対象外

## データ構造（ユーザーのプロジェクトルート）

```
my-projects/
  .tck/                   # 機械用
    counter.json          # ID採番カウンタ（atomic write必須）
    index.json            # tck list のデータソース
    activity.log          # JSONL形式の操作履歴
  projects/               # ユーザーが直接触るファイル
    project-1/
      project.md
      task-1.md
      mix-1.md
  master.todo             # 人間用（CLI管理対象外）
  tck.config.json         # 設定
```

- プロジェクトルートは `tck.config.json` または `.tck/` の存在で判定（親ディレクトリ探索）
- `projects/` と `tck.config.json` は `.tck` の外側
- `.tck/` には機械生成ファイルのみ

## ソースオブトゥルース

- `task-*.md` / `mix-*.md` が実データ（source of truth）
- `index.json` は CLIが生成・更新する機械用インデックス
- 衝突時はイシューファイルが正
- `tck rebuild` でイシューファイルから `index.json` を再構築

## コーディング規約

- 日本語対応必須（ヘルプ・エラーメッセージ、`util/i18n.ts` で `ja` / `en` 切替）
- チェックボックスは `[ ]` / `[x]` 形式
- ミックスコメントの区切りは `<!-- comment @author timestamp -->` 形式
- IDは単調増加、削除しても再利用しない
- `--body` と `--body-file` は排他（同時指定はエラー）
- `tck delete` は `--force` 必須
- 終了コード: 0（正常）、1（エラー）、2（バリデーションエラー）
- `$EDITOR` は `child_process.spawn` で実行（`exec` ではない）
- イシューファイルの最初の `---` のみをメタデータと本文の区切りとして認識

## エラー処理

カスタムエラークラスを使用:

- `TckError` (基底)
- `NotFoundError` (exit 1)
- `ValidationError` (exit 2)
- `ConfigError` (exit 1)

`throw new Error` ではなく上記を使うこと。

## テスト

- パーサーのテストが最重要（双方向変換の正確性）
- リポジトリのテストは `fs.mkdtemp` で一時ディレクトリを使用
- サービスのテストはリポジトリをモック
- `tests/` ディレクトリに配置

## コミットメッセージ

```
<emoji> <type>(<scope>): <subject>
```

スコープ例: `parser`, `cli`, `repo`, `service`, `domain`, `util`
