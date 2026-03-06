# Contributing Guide

このドキュメントは、TaskCooker CLI への貢献ルールを定義します。

## 1. ブランチと PR 運用

- 基本方針: 変更は Pull Request (PR) で `main` に取り込む
- `AI エージェント（Codex / Claude Code）` は `main` への直接 push を禁止
- リポジトリ管理者（人間メンテナ）は必要に応じて例外運用可

## 2. Commit Message ルール

本リポジトリは commitlint を利用します。コミットメッセージは以下形式に従ってください。

`<emoji> <type>(<scope>): <subject>`

許可される `type` (emoji):

- `🎉 init`
- `✨ feat`
- `🛠️ fix`
- `♻️ refactor`
- `🚀 perf`
- `🧪 test`
- `💄 style`
- `📝 docs`
- `🧹 chore`
- `🚧 wip`

**例**:

- `✨ feat(parser): support mix comment blocks`

## 3. PR タイトル ルール

- PR タイトルも commitlint ルールに準拠
- 推奨: PR の主コミットと同じ命名規約で記述

例:

- `✨ feat(cli): add rebuild command`
- `🛠️ fix(service): prevent duplicate id allocation`

## 4. ローカルで実施すること

- `husky` + `lint-staged` により、コミット時にフォーマット/関連チェックを実施
- push 前に `build` を実施（`.husky/pre-push`）
- 必要に応じて以下をローカル確認:
  - `pnpm run typecheck`
  - `pnpm run lint`
  - `pnpm run test`

## 5. CI の役割

- GitHub Actions は原則 `check`（検証）を担当
- 主要チェック:
  - PR title lint
  - typecheck
  - lint
  - format:check
  - test
- AI 向け workflow は `src/`, `bin/`, `tests/` などソース変更時のみ実行

## 6. AI エージェント向け追加ルール

- 変更は小さく分割し、レビューしやすい PR 単位で提出
- ワークフロー・権限設定の変更は、依頼がある場合のみ実施
- 仕様変更を伴う場合は `docs/` と整合させる
