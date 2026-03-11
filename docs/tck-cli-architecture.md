# tck CLI 実装設計書 v4

last-updated: 2026-03-06

## 技術スタック

| 項目                 | 選定              |
| -------------------- | ----------------- |
| ランタイム           | Node.js >= 20     |
| 言語                 | TypeScript        |
| パッケージマネージャ | pnpm              |
| CLIフレームワーク    | Commander.js      |
| テスト               | Vitest            |
| ビルド               | tsc               |
| 配布                 | ローカル npm link |

---

## 設計原則

1. **パーサーは純粋関数**: ファイルシステムに一切触れない。`string → object` と `object → string` の変換のみ
2. **リポジトリは1リソース1責務**: `task.repo` はタスクファイルだけ、`counter.repo` はカウンタだけ
3. **サービスはコンソール出力しない**: データを返すだけ。表示はコマンドハンドラーの責務
4. **コマンドファイルは宣言だけ**: オプション定義と `.action(handler)` の紐づけのみ。ロジックはハンドラーに分離
5. **`process.cwd()` を直接使わない**: プロジェクトルートの解決は `util/path.ts` に集約。Git同様の親ディレクトリ探索
6. **共通オプションは `Option` オブジェクトで再利用**: コマンドごとに `.option()` を繰り返さない
7. **全ファイル書き込みは atomic write**: 一時ファイル → rename（クラッシュ対策）
8. **CLIは `master.todo` に触れない**: 人間用ダッシュボードはCLIの管理対象外

---

## ディレクトリ構造

### CLIソースコード

```
task-cooker-cli/
  package.json
  tsconfig.json
  tsconfig.build.json
  vitest.config.ts
  scripts/
    add-shebang.js
  bin/
    tck.ts                    # エントリポイント（shebang付き）
  src/
    cli/
      index.ts                # Commander プログラム定義
      commands/
        init.command.ts
        config.command.ts
        create.command.ts
        list.command.ts
        view.command.ts
        edit.command.ts
        update.command.ts
        delete.command.ts
        log.command.ts
        status.command.ts     # order/prep/cook/serve
        project.command.ts
        mix.command.ts
        rebuild.command.ts    # index.json 再構築
      handlers/
        init.handler.ts
        config.handler.ts
        create.handler.ts
        list.handler.ts
        view.handler.ts
        edit.handler.ts
        update.handler.ts
        delete.handler.ts
        log.handler.ts
        status.handler.ts
        project.handler.ts
        mix.handler.ts
        rebuild.handler.ts
      options/
        status.option.ts      # -s, --status <status>
        priority.option.ts    # -p, --priority <priority>
        project.option.ts     # --proj <slug>
        json.option.ts        # --json
        body.option.ts        # --body, --body-file
    domain/
      types.ts                # 型定義
      constants.ts            # ステータス、優先順位の定数
      errors.ts               # カスタムエラークラス
      validator.ts            # 入力値バリデーション
    parser/
      issue-file.ts           # task-*.md / t*.md / mix-*.md の読み書き
      project-file.ts         # project.md の読み書き
      tag.ts                  # @tag / @tag(value) パーサー
      checkbox.ts             # [ ] / [x] パーサー
      comment-block.ts        # <!-- comment --> パーサー
    repository/
      task.repo.ts
      mix.repo.ts
      project.repo.ts
      config.repo.ts
      counter.repo.ts
      activity.repo.ts
      index.repo.ts           # index.json の読み書き
    service/
      task.service.ts
      mix.service.ts
      project.service.ts
      index.service.ts        # イシュー → index.json 同期
      activity.service.ts
    util/
      fs.ts                   # atomic write 等
      path.ts                 # プロジェクトルート探索・パス解決
      format.ts               # テーブル出力、日付フォーマット、JSON出力
      i18n.ts                 # 日本語・英語メッセージ
  tests/
    parser/
      issue-file.test.ts
      tag.test.ts
      checkbox.test.ts
      comment-block.test.ts
    repository/
      task.repo.test.ts
      mix.repo.test.ts
      project.repo.test.ts
      index.repo.test.ts
    service/
      task.service.test.ts
      mix.service.test.ts
      index.service.test.ts
    commands/
      create.test.ts
      list.test.ts
      update.test.ts
```

### CLIが管理するデータ（ユーザーのプロジェクトルート）

```
my-projects/                    # プロジェクトルート（任意のフォルダ名）
  .tck/                         # 機械用（.gitignore対象にできる）
    counter.json
    index.json
    activity.log
  projects/                     # ユーザーが直接見る・編集するファイル
    project-1/
      project.md
      task-1.md
      task-2.md
      mix-1.md
      mix-2.md
    project-2/
      project.md
      task-3.md
  master.todo                   # 人間用ダッシュボード（CLI管理対象外）
  tck.config.json               # 設定ファイル
```

---

## レイヤー構成

```
bin/tck.ts
  ↓
cli/commands/*        コマンド定義（宣言のみ）
  ↓
cli/handlers/*        コマンドハンドラー（入力処理・出力フォーマット）
  ↓
service/*             ビジネスロジック・ワークフロー
  ↓
repository/*          ファイル I/O・データアクセス
  ↓
parser/*              テキスト ↔ オブジェクト変換（純粋関数）
  ↓
domain/*              型・定数・バリデーション・エラー
```

### 依存の方向

- `commands` → `handlers` → `service` → `repository` → `parser` → `domain`
- 上位から下位への一方向のみ
- `domain` はどこにも依存しない
- `util` は全レイヤーから参照可能
- `cli/options` は `cli/commands` からのみ参照

---

## 型定義（domain/types.ts）

```typescript
// ステータス
export type TaskStatus = 'order' | 'prep' | 'cook' | 'serve';
export type MixStatus = 'open' | 'closed';
export type ProjectStatus = 'planning' | 'cooking' | 'on_hold' | 'completed'; // 将来用

// 優先順位
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

// タスク
export interface Task {
  id: number;
  projectSlug: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
  subtasks: Subtask[];
  linkedIssueIds: number[]; // #id で紐づけた独立イシュー
}

export interface Subtask {
  title: string;
  done: boolean;
  children: Subtask[]; // ネスト対応
}

// ミックス
export interface Mix {
  id: number;
  projectSlug: string;
  title: string;
  status: MixStatus;
  comments: MixComment[];
}

export interface MixComment {
  author: string;
  timestamp: string; // ISO 8601
  body: string;
}

// プロジェクト
export interface Project {
  slug: string;
  name: string;
  overview: string;
}

// アクティビティ
export type ActivityType =
  | 'task_create'
  | 'task_update'
  | 'mix_create'
  | 'mix_post_create'
  | 'project_create'
  | 'project_update';

export interface Activity {
  time: string; // ISO 8601
  type: ActivityType;
  projectId: string;
  taskId?: number;
  mixId?: number;
  text: string;
}

// 設定
export interface TckConfig {
  user: {
    name: string;
    email: string;
  };
  defaultProject: string;
  editor: string;
  dateFormat: string;
  language: 'ja' | 'en';
}

// カウンタ
export interface Counter {
  task: number;
  mix: number;
  project: number;
}

// インデックスエントリ
export interface TaskIndexEntry {
  id: number;
  project: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due?: string;
  path: string;
}

export interface MixIndexEntry {
  id: number;
  project: string;
  title: string;
  status: MixStatus;
  path: string;
}

export interface TckIndex {
  tasks: TaskIndexEntry[];
  mixes: MixIndexEntry[];
}

// タグ
export interface Tag {
  name: string;
  value?: string; // @tag(value) の value 部分
}

// フィルタ
export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectSlug?: string;
  dueDate?: string;
  sortBy?: 'status' | 'priority' | 'due' | 'created' | 'updated';
}
```

---

## エラークラス（domain/errors.ts）

```typescript
export class TckError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = 1
  ) {
    super(message);
    this.name = 'TckError';
  }
}

export class NotFoundError extends TckError {
  constructor(resource: string, id: string | number) {
    super(`${resource}が見つかりません: ${id}`, 1);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends TckError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'ValidationError';
  }
}

export class ConfigError extends TckError {
  constructor(message: string) {
    super(message, 1);
    this.name = 'ConfigError';
  }
}
```

---

## パス解決（util/path.ts）

プロジェクトルートを `tck.config.json` または `.tck/` の存在で判定し、Git同様に親ディレクトリを探索して見つける。
CLIコード・リポジトリ・サービスから `process.cwd()` を直接使わない。

```typescript
// プロジェクトルート探索
export function findProjectRoot(startDir?: string): string | null;
export function getProjectRoot(): string; // 見つからなければ ConfigError

// .tck/ 内のファイル（機械用）
export function getTckDir(): string; // {root}/.tck
export function getCounterPath(): string; // {root}/.tck/counter.json
export function getIndexPath(): string; // {root}/.tck/index.json
export function getActivityLogPath(): string; // {root}/.tck/activity.log

// プロジェクトルート直下のファイル
export function getConfigPath(): string; // {root}/tck.config.json
export function getProjectsDir(): string; // {root}/projects

// プロジェクト内のファイル
export function getProjectDir(slug: string): string; // {root}/projects/{slug}
export function getTaskFile(slug: string, id: number): string; // {root}/projects/{slug}/task-{id}.md
export function getMixFile(slug: string, id: number): string; // {root}/projects/{slug}/mix-{id}.md
export function getProjectFile(slug: string): string; // {root}/projects/{slug}/project.md
```

---

## 共通オプション（cli/options/）

Commander の `Option` オブジェクトとして定義し、コマンド間で再利用する。

```typescript
// status.option.ts
import { Option } from 'commander';

export const statusOption = new Option(
  '-s, --status <status>',
  'ステータス'
).choices(['order', 'prep', 'cook', 'serve']);

// priority.option.ts
export const priorityOption = new Option(
  '-p, --priority <priority>',
  '優先順位'
).choices(['urgent', 'high', 'medium', 'low']);

// project.option.ts
export const projectOption = new Option('--proj <slug>', 'プロジェクト');

// json.option.ts
export const jsonOption = new Option('--json', 'JSON形式で出力');
```

### オプショングループ

```typescript
// task-options.ts
export function addTaskOptions(cmd: Command): Command {
  return cmd
    .addOption(statusOption)
    .addOption(priorityOption)
    .addOption(projectOption);
}
```

---

## コマンドとハンドラーの分離

### コマンド（宣言のみ）

```typescript
// cli/commands/create.command.ts
import { Command } from 'commander';
import { createHandler } from '../handlers/create.handler';
import { addTaskOptions } from '../options/task-options';

export function registerCreateCommand(program: Command): void {
  const cmd = program
    .command('create <title>')
    .option('--mix <id>', 'ミックスに紐づけ')
    .option('--body <text>', '本文')
    .option('--body-file <file>', '本文ファイル')
    .action(createHandler);

  addTaskOptions(cmd);
}
```

### ハンドラー（ロジック）

```typescript
// cli/handlers/create.handler.ts
export async function createHandler(
  title: string,
  options: CreateOptions
): Promise<void> {
  // 1. バリデーション（--body と --body-file の排他チェック等）
  // 2. サービス呼び出し
  // 3. index.json 更新（サービス内で実行）
  // 4. 結果のフォーマット・出力（--json 対応）
  // 5. エラー時は適切な exit code で終了
}
```

---

## パーサー設計

全パーサーは純粋関数。ファイルシステムに一切依存しない。

### tag.ts

```
入力: "@cook @high @due(2026-03-16) #3"
出力: {
  tags: [
    { name: "cook" },
    { name: "high" },
    { name: "due", value: "2026-03-16" }
  ],
  issueId: 3
}
```

### checkbox.ts

```
入力: "  [ ] 原因調査 @cook #5"
出力: {
  indent: 2,
  done: false,
  text: "原因調査",
  tags: [{ name: "cook" }],
  issueId: 5
}
```

### issue-file.ts

```
入力: task-*.md / mix-*.md ファイルの文字列全体
出力: Task | Mix
```

- ヘッダー部: `Key: Value` 形式を行ごとにパース
- `Tasks:` セクション: チェックボックスパーサーに委譲
- 最初の `---` のみを区切りとして認識
- `---` 以降: マークダウン本文としてそのまま保持

### comment-block.ts

```
入力: "<!-- comment @suzuki 2026-03-06T10:00:00+09:00 -->"
出力: { author: "suzuki", timestamp: "2026-03-06T10:00:00+09:00" }
```

---

## リポジトリ設計

各リポジトリは1リソース1責務。パーサーを内部で使用する。

### task.repo.ts

```typescript
export interface TaskRepository {
  findById(projectSlug: string, id: number): Promise<Task | null>;
  findAll(projectSlug: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
  remove(projectSlug: string, id: number): Promise<void>;
}
```

### index.repo.ts

```typescript
export interface IndexRepository {
  load(): Promise<TckIndex>;
  save(index: TckIndex): Promise<void>;
}
```

### 共通パターン

- 読み取り: ファイル読み込み → パーサーでオブジェクト化
- 書き込み: オブジェクト → パーサーでテキスト化 → atomic write

---

## サービス設計

リポジトリを組み合わせてワークフローを実現。コンソール出力は行わない。

### task.service.ts

```typescript
export interface TaskService {
  create(input: CreateTaskInput): Promise<Task>;
  update(ids: number[], input: UpdateTaskInput): Promise<Task[]>;
  changeStatus(ids: number[], status: TaskStatus): Promise<Task[]>;
  delete(projectSlug: string, id: number): Promise<void>;
  list(filter: TaskFilter): Promise<TaskIndexEntry[]>; // index.json から取得
}
```

### index.service.ts

イシューファイルの操作後に `index.json` を同期更新する。

```typescript
export interface IndexService {
  updateTask(task: Task): Promise<void>;
  updateMix(mix: Mix): Promise<void>;
  removeTask(projectSlug: string, id: number): Promise<void>;
  removeMix(projectSlug: string, id: number): Promise<void>;
  rebuild(): Promise<void>; // 全イシューから index.json を再構築（リカバリ用）
}
```

### activity.service.ts

```typescript
export interface ActivityService {
  log(activity: Omit<Activity, 'time'>): Promise<void>;
  getLog(filter?: {
    projectId?: string;
    type?: ActivityType;
  }): Promise<Activity[]>;
}
```

---

## i18n 設計

```typescript
const messages = {
  ja: {
    taskCreated: 'タスクを作成しました: #{id} {title}',
    taskUpdated: 'タスクを更新しました: #{id}',
    taskDeleted: 'タスクを削除しました: #{id}',
    errorNotFound: '{resource}が見つかりません: {id}',
    errorForceRequired: '削除には --force が必要です',
    errorBodyConflict: '--body と --body-file は同時に指定できません',
    indexRebuilt: 'インデックスを再構築しました',
  },
  en: {
    taskCreated: 'Task created: #{id} {title}',
    taskUpdated: 'Task updated: #{id}',
    taskDeleted: 'Task deleted: #{id}',
    errorNotFound: '{resource} not found: {id}',
    errorForceRequired: '--force is required for deletion',
    errorBodyConflict: '--body and --body-file cannot be used together',
    indexRebuilt: 'Index rebuilt',
  },
};
```

---

## 実装順序

### フェーズ0: プロジェクト初期化

1. `package.json` / `tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts` セットアップ
2. `util/path.ts` - プロジェクトルート探索・パス解決（最初に作る）
3. `util/fs.ts` - atomic write ユーティリティ
4. `domain/types.ts` - 型定義
5. `domain/constants.ts` - 定数
6. `domain/errors.ts` - エラークラス

### フェーズ1: パーサー（テスト駆動）

7. `parser/tag.ts` + テスト
8. `parser/checkbox.ts` + テスト
9. `parser/comment-block.ts` + テスト
10. `parser/issue-file.ts` + テスト
11. `parser/project-file.ts` + テスト

### フェーズ2: データアクセス

12. `repository/config.repo.ts`
13. `repository/counter.repo.ts`（atomic write 必須）
14. `repository/index.repo.ts` + テスト
15. `repository/task.repo.ts` + テスト
16. `repository/mix.repo.ts` + テスト
17. `repository/project.repo.ts` + テスト
18. `repository/activity.repo.ts`

### フェーズ3: ビジネスロジック

19. `service/index.service.ts` + テスト
20. `service/task.service.ts` + テスト
21. `service/mix.service.ts` + テスト
22. `service/project.service.ts`
23. `service/activity.service.ts`

### フェーズ4: CLI

24. `cli/options/*` - 共通オプション定義
25. `util/i18n.ts` - メッセージ定義
26. `util/format.ts` - テーブル表示・JSON出力
27. `cli/handlers/*` + `cli/commands/*` - 各コマンド実装
28. `cli/index.ts` - プログラム定義
29. `bin/tck.ts` - エントリポイント

### フェーズ5: 結合テスト

30. 主要シナリオの結合テスト（init → create → list → update → serve → log）

---

## テスト方針

- パーサーのテストが最重要（双方向変換の正確性）
- リポジトリのテストは `fs.mkdtemp` で一時ディレクトリを作成し、実ファイル I/O で検証
- サービスのテストはリポジトリをモック
- コマンドのテストは主要シナリオの結合テスト
- テストファイルは `tests/` ディレクトリに配置

---

## 注意事項

- `$EDITOR` は `child_process.spawn` で実行（`exec` ではなく）
- `JSON.stringify` でログ出力（インジェクション防止）
- `path.resolve` でパス検証（ディレクトリトラバーサル防止）
- 最初の `---` のみをメタデータとマークダウン本文の区切りとして認識
- CLIコード・リポジトリ・サービスから `process.cwd()` を直接使わない
- CLIは `master.todo` に一切触れない
