# Sample Workspace

## 日本語

このフォルダは、TaskCooker CLI の動作確認用サンプル workspace です。

最初にやることは 2 つだけです。

1. `pnpm install`
2. `pnpm run project:list`

### 使い方

```sh
pnpm install
pnpm run project:list
pnpm run list
pnpm run view
pnpm run mix
```

この workspace には以下が含まれています。

- プロジェクト 1 件
- タスク 1 件
- ミックス 1 件

よく使うコマンド:

```sh
pnpm run help
pnpm run project:list
pnpm run list
pnpm run view
pnpm run mix
pnpm run task:create:new
pnpm run mix:create:new
```

実運用を始める場合は、このフォルダをそのまま使うのではなく、新しいディレクトリで `pnpm exec tck init` を実行してください。

## English

This folder is a sample workspace for trying TaskCooker CLI.

Start with only two steps.

1. `pnpm install`
2. `pnpm run project:list`

### Usage

```sh
pnpm install
pnpm run project:list
pnpm run list
pnpm run view
pnpm run mix
```

This workspace includes:

- one project
- one task
- one mix

Common commands:

```sh
pnpm run help
pnpm run project:list
pnpm run list
pnpm run view
pnpm run mix
pnpm run task:create:new
pnpm run mix:create:new
```

For real use, create a new directory and run `pnpm exec tck init` instead of reusing this sample workspace.
