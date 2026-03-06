# tck CLI 仕様書 v6

last-updated: 2026-03-06

## 概要

TaskCookerのCLIツール。タスクとミックス（スレッド型ディスカッション）をコマンドラインで管理する。
テキストファイルベースで永続化し、将来的にFirestoreへの移行を想定する。
日本語・英語対応（設定で切替）。

---

## 責務分離

### CLI

- タスク・ミックスの CRUD
- `index.json` の更新
- `activity.log` の記録
- `--json` 出力（VSCode拡張との接続用）

### VSCode拡張

- `master.todo` の編集支援
- `#id` の補完・ジャンプ
- サブタスクの進捗表示
- UI表示全般

### master.todo

- 人間用ダッシュボード
- CLIは読み書きしない
- ユーザーが手動で管理

---

## ステータス

| 値      | 意味                       |
| ------- | -------------------------- |
| `order` | 未着手（注文が入った状態） |
| `prep`  | 準備中                     |
| `cook`  | 調理中（進行中）           |
| `serve` | 完了（提供済み）           |

## 優先順位

| 値       | 意味               |
| -------- | ------------------ |
| `urgent` | 緊急（将来拡張用） |
| `high`   | 高                 |
| `medium` | 中                 |
| `low`    | 低                 |

- 現時点の運用は `high` / `medium` / `low` の3段階
- `urgent` は将来の拡張に備えて仕様として定義

## 共通オプション

| 短縮 | ロングオプション        | 説明             |
| ---- | ----------------------- | ---------------- |
| `-s` | `--status <status>`     | ステータス指定   |
| `-p` | `--priority <priority>` | 優先順位指定     |
|      | `--proj <slug>`         | プロジェクト指定 |
|      | `--json`                | JSON形式で出力   |
|      | `--help`                | ヘルプ表示       |
|      | `--version`             | バージョン表示   |

- `--help` / `--version` はロングオプションのみ

---

## コマンド一覧

### 初期化・設定

```
tck init
tck config get [<key>]
tck config set <key> <value>
```

### プロジェクト

```
tck project list [--json]
tck project create "プロジェクト名" [--slug <slug>]
tck project view <slug> [--json]
tck project delete <slug> --force
```

- `--slug` 未指定時は `project-1` のように自動連番（日本語タイトル前提）
- 削除は `--force` 必須

### タスク

```
tck create "タスク名" [-s <status>] [-p <priority>] [--proj <slug>] [--mix <id>] [--body "本文"] [--body-file <file>]
tck list [-s <status>] [-p <priority>] [--proj <slug>] [--due <date>] [--sort <key>] [--json]
tck view <id> [--json]
tck edit <id>
tck update <id>... [--title "タイトル"] [--body "本文"] [--body-file <file>] [-s <status>] [-p <priority>] [--proj <slug>]
tck delete <id> --force
tck log [--json]
```

#### ステータス遷移コマンド

```
tck order <id>...
tck prep <id>...
tck cook <id>...
tck serve <id>...
```

- 複数IDの同時指定可能

#### `tck list` のソートキー

| キー       | 説明         |
| ---------- | ------------ |
| `status`   | ステータス順 |
| `priority` | 優先順位順   |
| `due`      | 期限日順     |
| `created`  | 作成日順     |
| `updated`  | 更新日順     |

#### `tck list` の出力形式

テーブル表示（デフォルト）：

```
ID  Status  Priority  Due         Title
1   cook    high      2026-03-16  UIState不具合調査
2   order   low                   README整備
5   prep    medium    2026-03-20  スキーマ見直し
```

JSON出力（`--json` 指定時）：

```json
[
  {
    "id": 1,
    "status": "cook",
    "priority": "high",
    "due": "2026-03-16",
    "title": "UIState不具合調査"
  },
  { "id": 2, "status": "order", "priority": "low", "title": "README整備" }
]
```

#### `tck list` のデータソース

- `index.json` を読み取ってフィルタ・ソートする
- イシューファイルを毎回スキャンしない

#### 補足

- `--mix <id>` 指定時は `--proj` 不要（ミックス側のプロジェクトを自動継承）
- `--body` と `--body-file` は排他（同時指定はエラー）
- `tck edit` は `$EDITOR`（設定の `editor` でフォールバック可）でイシューファイル全体を開く
- `tck view` はターミナルに表示（詳細はイシューファイルから読み取り）
- `tck log` はアクティビティログを時系列で表示（GitHubイシューのタイムライン形式）
- サブタスクの集計はCLIでは行わない（VSCode拡張の責務）
- 将来対応: `tck view task 1` 形式でのリソース種別明示

### ミックス（スレッド型ディスカッション）

```
tck mix create [--proj <slug>] [--title "タイトル"] [--body "本文"] [--body-file <file>]
tck mix list [--proj <slug>] [--json]
tck mix view <id> [--json]
tck mix edit <id> [--title "タイトル"] [--body "本文"] [--body-file <file>]
tck mix close <id>
tck mix reopen <id>
tck mix comment <id> [--body "コメント"] [--body-file <file>]
tck mix delete <id> --force
```

#### コメント

- 初期実装は簡易形式：ミックスファイルにHTMLコメント区切りで追記
- 投稿者名とタイムスタンプをHTMLコメント（パーサー用）と可視ヘッダー（プレビュー用）で二重記載
- コメント単体の編集・削除は初期実装では未対応
- 投稿者にはAIエージェント（Claude、Codex等）も想定。投稿者の検証はバイパスする
- Firestoreでは `mixes/{mixId}/posts/{postId}` のサブコレクション構造に変換

---

## 終了コード

| コード | 意味                                 |
| ------ | ------------------------------------ |
| `0`    | 正常終了                             |
| `1`    | エラー（対象が見つからない等）       |
| `2`    | バリデーションエラー（不正な引数等） |

---

## ID採番

- タスクとミックスは同一名前空間でプロジェクトスコープの連番（1, 2, 3...）
- ゼロ埋めなし
- 採番カウンタは `.tck/counter.json` で管理
- IDは単調増加、削除しても再利用しない（GitHubと同じ）
- Firestoreでは UUID がドキュメントID。移行時にマッピングで変換

```json
{
  "task": 7,
  "mix": 3,
  "project": 2
}
```

### サブタスク

- サブタスクは採番しない
- イシューファイル内のチェックリストとして管理
- 大きくなったサブタスクは `tck create` で独立イシューに昇格し `#id` で紐づけ
- サブタスクの解析・進捗表示はVSCode拡張の責務

---

## ソースオブトゥルース

```
projects/*/task-*.md, mix-*.md  →  実データ（source of truth）
.tck/index.json                 →  機械用インデックス（CLIが生成・更新）
.tck/activity.log               →  操作履歴
master.todo                     →  人間用ダッシュボード（手動管理）
```

- CLIの操作はイシューファイルを更新し、`index.json` を同期更新する
- `master.todo` にはCLIは一切触れない
- 整合性が壊れた場合は `tck rebuild` でイシューファイルから `index.json` を再構築

---

## ディレクトリ構造

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
  master.todo                   # 人間用ダッシュボード
  tck.config.json               # 設定ファイル
  .gitignore
  .prettierrc
```

- `projects/` はプロジェクトルート直下に配置（`.tck` の外側）
- `.tck/` には機械生成ファイルのみ（`counter.json`、`index.json`、`activity.log`）
- `tck.config.json` はプロジェクトルート直下に配置
- `master.todo` はプロジェクトルート直下に配置（人間が手動管理）
- Firestoreのコレクション階層（`projects/{id}/tasks/{id}`、`projects/{id}/mixes/{id}`）に準拠
- プロジェクト内はフォルダ分けせずファイルプレフィクスで区別
- プロジェクトルートは `tck.config.json` または `.tck/` の存在で判定し、Git同様に親ディレクトリを探索して解決する

---

## データ形式

### チェックボックス

```
[ ] 未完了タスク
[x] 完了タスク
```

- `[ ]` / `[x]` 形式を使用（行頭の揃えやすさを優先）

### インデックス（.tck/index.json）

CLIが生成・更新する機械用インデックス。`tck list` のデータソース。

```json
{
  "tasks": [
    {
      "id": 1,
      "project": "project-1",
      "title": "UIState不具合調査",
      "status": "cook",
      "priority": "high",
      "due": "2026-03-16",
      "path": "projects/project-1/task-1.md"
    }
  ],
  "mixes": [
    {
      "id": 1,
      "project": "project-1",
      "title": "UIのレスポンシブ対応",
      "status": "open",
      "path": "projects/project-1/mix-1.md"
    }
  ]
}
```

### イシューファイル（projects/_/task-_.md）

ヘッダー部にメタデータ、`---` 以降はマークダウン自由記述。

```
Title: UIState不具合調査
Project: myyomumoji-client
Status: cook
Priority: high
Due: 2026-03-16

Tasks:
  [ ] 原因調査
    [ ] Sliderコンポーネント確認 #5
    [ ] RadioGroup確認
  [ ] 修正実装
  [x] 再現確認 @done(26-03-06)

---

## メモ

調査中に気づいたこと。
```

- ネストされたタスクは字下げで表現
- ネストタスクが独立イシューに昇格する場合は `#id` で紐づけ
- 最初の `---` のみをメタデータとマークダウン本文の区切りとして認識
- `Created` / `Updated` はファイルのタイムスタンプ（`stat`）で管理し、ヘッダーには持たない

### ミックスファイル（projects/_/mix-_.md）

```
Title: UIのレスポンシブ対応
Project: myyomumoji-client
Status: open

<!-- comment @suzuki 2026-03-06T10:00:00+09:00 -->
**suzuki** - 2026-03-06 10:00

初回コメント本文。マークダウン可。

<!-- comment @codex 2026-03-06T11:30:00+09:00 -->
**codex** - 2026-03-06 11:30

自動生成されたレビューコメント。
```

- ヘッダー部にメタデータ
- HTMLコメントがパーサー用の区切り（`<!-- comment @投稿者 タイムスタンプ -->`）
- 太字行が人間用の可視ヘッダー
- Firestore移行時に個別の `MixPost` ドキュメントに変換

### マスターTODO（master.todo）

人間用ダッシュボード。CLIは読み書きしない。プロジェクトルート直下に配置。

```
MyYomuMoji:
  [ ] UIState不具合調査 @cook @high #1
    [ ] Sliderコンポーネント確認
    [ ] RadioGroup確認
  [ ] README整備 @order @low

TaskCooker:
  [ ] スキーマ見直し @order @medium #3

その他:
  [ ] 税金納付 @urgent @today
  [x] API疎通確認 @done(26-03-06)
```

#### 対応タグ（VSCode拡張での解釈用）

| タグ                               | 意味                       |
| ---------------------------------- | -------------------------- |
| `@order` `@prep` `@cook` `@serve`  | ステータス                 |
| `@urgent` `@high` `@medium` `@low` | 優先順位                   |
| `@today`                           | 今日期限                   |
| `@due(YYYY-MM-DD)`                 | 期限日                     |
| `@done(YY-MM-DD)`                  | 完了日                     |
| `#id`                              | イシューファイルとの紐づけ |

---

## アクティビティログ

GitHubイシューのタイムライン形式。既存の `Activity` 型に準拠。JSONL形式で `.tck/activity.log` に記録。

### ActivityType

```
task_create | task_update | mix_create | mix_post_create | project_create | project_update
```

- シングルユーザー前提のため `team_create` / `user_signup` / `profile_update` は除外

### 形式

```jsonl
{"time":"2026-03-06T10:00:00+09:00","type":"task_create","projectId":"project-1","taskId":1,"text":"タスクを作成: UIState不具合調査"}
{"time":"2026-03-06T10:05:00+09:00","type":"task_update","projectId":"project-1","taskId":1,"text":"ステータス変更: order -> cook"}
{"time":"2026-03-06T11:00:00+09:00","type":"mix_post_create","projectId":"project-1","mixId":2,"text":"コメント追加 by codex"}
```

---

## 設定（tck.config.json）

プロジェクトルート直下に配置。

```json
{
  "user": {
    "name": "suzuki",
    "email": "suzuki@example.com"
  },
  "defaultProject": "project-1",
  "editor": "vim",
  "dateFormat": "YYYY-MM-DD",
  "language": "ja"
}
```

| キー             | 型     | 説明                                            |
| ---------------- | ------ | ----------------------------------------------- |
| `user.name`      | string | 投稿者名（ログ・コメント表示用）                |
| `user.email`     | string | Firestore移行時のユーザー紐づけ用               |
| `defaultProject` | string | `--proj` 省略時のデフォルトプロジェクトスラッグ |
| `editor`         | string | `$EDITOR` のフォールバック                      |
| `dateFormat`     | string | タイムスタンプ表示形式                          |
| `language`       | string | 出力言語（`ja` / `en`）                         |

---

## 設計方針

- シングルユーザー前提（チーム・担当者・ソート順は省略）
- テキストファイルベースで永続化、Git管理可能
- フォーマットは editorconfig / prettier に委譲
- 将来的にFirestoreスキーマへの変換スクリプトで移行
- フィルタ・ソートは `tck list` に集約（`tck search` コマンドは設けない）
- 全文検索が必要な場合は `grep` で対応
- チェックボックスは `[ ]` / `[x]` 形式（行頭揃えを優先）
- `--json` 出力は初期実装から対応（VSCode拡張・CI・スクリプト連携用）
- サブタスクの集計・解析はCLIでは行わない（VSCode拡張の責務）
- CLIは `master.todo` に触れない（人間用ダッシュボード）
- ユーザーが直接触るファイル（`projects/`、`master.todo`、`tck.config.json`）は `.tck` の外に配置
- 機械生成ファイル（`counter.json`、`index.json`、`activity.log`）は `.tck/` 内に配置

---

## 将来対応

- `tck view task 1` 形式でのリソース種別明示
- プロジェクトステータス（`planning` / `cooking` / `on_hold` / `completed` のCLI版）の導入
- コメント単体の編集・削除
- `urgent` 優先順位の運用開始
- `tck next` / `tck inbox` / `tck done` 作業フローコマンド
- `tck view today` / `tck view cooking` クエリビュー

---

## v5からの変更点

- `projects/` ディレクトリを `.tck` の外側（プロジェクトルート直下）に移動
- `tck.config.json` を `.tck` の外側（プロジェクトルート直下）に移動（旧 `.tck/config.json`）
- `.tck/` には機械生成ファイルのみ配置（`counter.json`、`index.json`、`activity.log`）
- `dataDir` 設定を削除（`.tck` は常にプロジェクトルート直下の固定位置）
- プロジェクトルートの判定に `tck.config.json` または `.tck/` の存在を使用
