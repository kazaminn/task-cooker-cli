# コードベース全体レビュー

## 総評

アーキテクチャ設計書・仕様書に忠実に実装されており、全体的に高品質なコードベースです。テスト30件すべてパス、型チェック・lint共にエラーなし。以下に指摘事項をカテゴリ別にまとめます。

---

## バグ（要修正）

### 1. `ActivityType` に削除系の型が不足

`src/domain/types.ts` — `ActivityType` に `task_delete` / `mix_delete` / `project_delete` が定義されていません。

`src/cli/handlers/delete.handler.ts:27` では削除操作を `'task_update'` として記録しています:

```typescript
await context.activityService.log({
  type: 'task_update', // ← 実際は削除操作
  projectId: projectSlug,
  taskId: id,
  text: `タスクを削除: #${id}`,
});
```

`mix.handler.ts:257-274` の `mixDeleteHandler` ではそもそもアクティビティログを記録していません。`project.handler.ts` のプロジェクト削除も同様です。

**推奨**: `ActivityType` に `'task_delete' | 'mix_delete' | 'project_delete'` を追加し、各削除ハンドラーで適切な型を使用する。

### 2. `activity.repo.ts` の append がアトミックでない

`src/repository/activity.repo.ts:24-26` — 既存ログを全読み込みして全上書きしています:

```typescript
const current = await fs.readFile(logPath, 'utf-8');
await atomicWriteFile(logPath, `${current}${JSON.stringify(activity)}\n`);
```

ログファイルが大きくなると性能劣化が発生します。`fs.appendFile` を使うべきですが、アトミック性が必要なら現状のアプローチでも許容されます。ただし、並行アクセス時にデータ消失のリスクがあります。

---

## 設計上の問題

### 3. `CliContext` が具象型に依存

`src/cli/context.ts:18-31` — `CliContext` インターフェースが `FileTaskRepository` などの具象実装型を参照しています:

```typescript
export interface CliContext {
  readonly taskRepository: FileTaskRepository; // ← インターフェース型にすべき
  // ...
}
```

テスタビリティの観点から `TaskRepository`（インターフェース）にすべきです。現状ハンドラーのユニットテストが書きにくい構造になっています。

### 4. `createCliContext()` がハンドラーごとに毎回呼ばれる

各ハンドラー（`delete.handler.ts:20`, `mix.handler.ts:55-57` 等）で `createCliContext()` が複数回呼ばれるケースがあります。`mixCreateHandler` は L62 で、`resolveActorName()` は L54-58 で別のコンテキストを生成しています。毎回リポジトリやサービスが再生成されるため非効率です。

### 5. `ProjectService` の `indexService` がオプショナル

`src/service/project.service.ts:29` — `indexService?: IndexService` はオプショナルですが、`delete` で使用されます。実際には `createCliContext` で常に渡されているため、必須パラメータにすべきです。

---

## i18n の不整合

### 6. ハードコードされた日本語メッセージ

以下のファイルで `i18n.ts` を経由せず日本語文字列が直接埋め込まれています:

- `src/cli/handlers/shared.ts:53` — `IDが不正です: ${value}`
- `src/cli/handlers/shared.ts:62` — `IDを1つ以上指定してください。`
- `src/cli/handlers/shared.ts:85-86` — `task #${id} が複数プロジェクトで見つかりました...`
- `src/cli/handlers/status.handler.ts:26-28` — `複数プロジェクトの task を同時更新できません...`
- `src/cli/handlers/edit.handler.ts:22` — `エディタが異常終了しました`
- `src/cli/handlers/mix.handler.ts:232` — `コメント本文を指定してください。`
- `src/service/task.service.ts:144` — `更新対象のIDが必要です。`
- `src/cli/handlers/status.handler.ts:42` — `ステータス変更: ${task.status}`

CLAUDE.md の規約「日本語対応必須（`util/i18n.ts` で `ja` / `en` 切替）」に違反しています。

---

## セキュリティ / 堅牢性

### 7. `edit.handler.ts` の `shell: true`

`src/cli/handlers/edit.handler.ts:13` — `spawn(editor, [filePath], { shell: true })` の `shell: true` はコマンドインジェクションリスクがあります。`$EDITOR` の値が信頼できる環境設定であるとはいえ、`shell: false` にできる場合はそちらが安全です（ただしエディタ名にスペースを含むケースに対応するため `shell: true` が必要な場合もある）。

### 8. `resolveBody` の `await` 省略

`src/cli/handlers/shared.ts:44` — `return fs.readFile(...)` に `await` がありません。機能上は問題ありませんが（`async` 関数の return に Promise を渡すと自動 unwrap される）、try-catch でエラーをキャッチする場合にスタックトレースが不正確になる可能性があります。

---

## テスト

### 9. テストカバレッジの不足

- **ハンドラー層のテストがない** — CLI ハンドラー（`create.handler.ts`, `delete.handler.ts` 等）の単体テストがありません。統合テスト1件のみ。
- **エッジケースが少ない** — パーサーテストは各2件程度。異常系（不正フォーマット、空文字列、巨大入力）のテストが少ない。
- **`counter.repo` のテストがない** — ID採番はデータ整合性に直結する重要機能。
- **`activity.repo` のテストがない** — append と findAll の動作確認がされていない。
- **`config.repo` のテストがない**。

### 10. 統合テストの `process.chdir` 使用

`tests/commands/phase5.integration.test.ts:39` — `process.chdir()` はグローバル状態を変更するため、テストの並列実行で問題が起きます。Vitest のデフォルトは並列実行なので注意が必要です（現状は1テストのみなので問題は顕在化していない）。

---

## 軽微な指摘

### 11. `sortByFilter` の `'updated'` ソートが ID ベース

`src/service/task.service.ts:97` — `case 'updated': return copied.sort((a, b) => b.id - a.id)` は ID の降順であり、実際の更新日時ではありません。`TaskIndexEntry` に `updatedAt` フィールドがないための代替策ですが、`'updated'` というキー名から期待される動作と乖離しています。

### 12. `resolveActorName` が独自の `createCliContext()` を呼んでいる

`src/cli/handlers/mix.handler.ts:54-58` — ハンドラー内で既にコンテキストが生成されているのに、`resolveActorName()` で別のコンテキストを生成しています。コンテキストを引数として渡すべきです。

---

## 良い点

- **アーキテクチャの一貫性** — `commands → handlers → service → repository → parser → domain` の依存方向が厳守されている
- **パーサーの純粋性** — ファイルI/Oに一切触れない設計が守られている
- **アトミック書き込み** — `util/fs.ts` の実装がシンプルで正しい
- **エラー型の設計** — `TckError` 階層が適切で、exit code も正しくマッピングされている
- **コマンド宣言の分離** — `.command.ts` がルーティングのみに専念している
- **テストの構成** — 各レイヤーに対応したテストディレクトリ構成が明快
- **全テスト通過** — 30件すべてグリーン

---

## 優先度順の対応推奨

| 優先度 | 指摘   | 概要                                                  |
| ------ | ------ | ----------------------------------------------------- |
| **高** | #1     | `ActivityType` に削除系を追加、ハンドラー修正         |
| **高** | #6     | ハードコード日本語メッセージを i18n に移行            |
| **中** | #3     | `CliContext` をインターフェース型に変更               |
| **中** | #9     | counter.repo, activity.repo, config.repo のテスト追加 |
| **中** | #4,#12 | `resolveActorName` にコンテキストを渡す               |
| **低** | #5     | `indexService` を必須パラメータに                     |
| **低** | #2     | activity.repo の append 方式の検討                    |
| **低** | #11    | `'updated'` ソートの命名またはフィールド追加          |
