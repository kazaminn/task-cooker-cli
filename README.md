# TaskCooker CLI

TaskCooker CLI (`tck`) is a Node.js command line tool for managing tasks and mixes (thread-style discussions) in plain text files.

## Mental Model

- `project`: a folder under `projects/`
- `task`: one work item like `task-1.md`
- `mix`: a discussion thread like `mix-1.md`
- `.tck/`: machine-managed index, counters, and activity log

If you only remember one thing: first `init`, then `project create`, then `create`, then `list`.

## Requirements

- Node.js 20+
- pnpm

## Developer Setup

```sh
pnpm install
pnpm build
```

Build output is generated under `dist/`. `pnpm build` also creates a release-ready folder under `release/tck-cli-v<version>/` and a zip archive at `release/tck-cli-v<version>.zip`. After building, you can run the CLI with `node dist/bin/tck.js` or use the generated release package for local distribution.

## Get Started

There are two common ways to use this repository.

### 1. Try the generated release package

```sh
cd release/tck-cli-v<version>
pnpm install --prod --frozen-lockfile
pnpm run help
pnpm run project:create
pnpm run sample:install
pnpm run sample:start
```

Then open `release/tck-cli-v<version>/sample-project/README.md`.

The source version of that sample workspace lives in `examples/sample-workspace/`.

### 2. Use the CLI directly while developing

```sh
pnpm install
pnpm build
node dist/bin/tck.js --help
```

Create a workspace:

```sh
mkdir my-project
cd my-project
node /path/to/task-cooker-cli/dist/bin/tck.js init
node /path/to/task-cooker-cli/dist/bin/tck.js project create "My Project" --slug project-1
```

## Release Package

After `pnpm build`, a distributable folder is created at `release/tck-cli-v<version>/` with:

- `dist/`
- `package.json`
- `README.md`
- `pnpm-lock.yaml`
- `sample-project/`

The same build also creates `release/tck-cli-v<version>.zip`, which is the easiest artifact to upload to GitHub Releases.

`sample-project/` is copied from `examples/sample-workspace/`, so user-facing sample data can be edited there.

If `LICENSE` exists in the repository root, it is copied as well.

From that folder, consumers can install runtime dependencies and execute the CLI:

```sh
cd release/tck-cli-v<version>
pnpm install --prod --frozen-lockfile
pnpm run help
pnpm run task:create:new
```

## Install As A Local Package

Build the CLI first:

```sh
cd /path/to/task-cooker-cli
pnpm install
pnpm build
```

Then install it into another local project with a `file:` dependency:

```sh
cd <your-project>
pnpm add /path/to/task-cooker-cli
```

You can then invoke the binary from that project with:

```sh
pnpm exec tck --help
```

If you change this CLI during development, rebuild it before using the updated binary from the consuming project:

```sh
cd /path/to/task-cooker-cli
pnpm build
```

If you prefer symlink-style development instead of a `file:` dependency:

```sh
cd /path/to/task-cooker-cli
pnpm link --global

cd <your-project>
pnpm link --global task-cooker-cli
```

## Quick Start

```sh
# 1. initialize a workspace
node dist/bin/tck.js init

# 2. create a project
node dist/bin/tck.js project create "My Project" --slug project-1

# 3. create a task in the default project
node dist/bin/tck.js create "Investigate parser bug" --body "Initial notes"

# 4. inspect tasks
node dist/bin/tck.js list
node dist/bin/tck.js view 1

# 5. update task state
node dist/bin/tck.js update 1 --title "Investigate parser regression" --priority high
node dist/bin/tck.js cook 1
node dist/bin/tck.js serve 1

# 6. inspect activity history
node dist/bin/tck.js log
```

Editor-based create flow:

```sh
node dist/bin/tck.js create new
node dist/bin/tck.js mix create new
```

## Workspace Layout

`tck init` creates the following structure in the current directory:

```text
my-project/
  .tck/
    counter.json
    index.json
    activity.log
  projects/
    project-1/
      project.md
      task-1.md
      mix-1.md
  tck.config.json
```

- `projects/` contains user-facing markdown files.
- `.tck/` contains generated machine data.
- `master.todo` is intentionally not managed by the CLI.

## Common Commands

### First-day flow

```sh
tck init
tck project create "My Project" --slug project-1
tck create "First task"
tck list
```

### Task flow

```sh
tck create "Task title"
tck create new
tck list
tck view 1
tck update 1 --title "New title"
tck prep 1
tck cook 1
tck serve 1
tck delete 1 --force
```

### Mix flow

```sh
tck mix create --title "Discussion title"
tck mix create new
tck mix list
tck mix view 1
tck mix comment 1 --body "My comment"
tck mix close 1
```

### Project flow

```sh
tck init
tck project list
tck project create "Project name" --slug project-1
tck project view project-1
tck project delete project-1 --force
```

## Full Command Reference

### Initialization and config

```sh
tck init
tck config get [key]
tck config set <key> <value>
```

### Projects

```sh
tck project list [--json]
tck project create "Project name" [--slug <slug>] [--json]
tck project view <slug> [--json]
tck project delete <slug> --force [--json]
```

### Tasks

```sh
tck create "Task title" [-s <status>] [-p <priority>] [--proj <slug>] [--mix <id>] [--body "text"] [--body-file <file>] [--json]
tck list [-s <status>] [-p <priority>] [--proj <slug>] [--due <date>] [--sort <key>] [--json]
tck view <id> [--proj <slug>] [--json]
tck edit <id> [--proj <slug>]
tck update <id>... [--title "title"] [--body "text"] [--body-file <file>] [-s <status>] [-p <priority>] [--proj <slug>] [--json]
tck delete <id> --force [--proj <slug>] [--json]
tck log [--proj <slug>] [--type <activity-type>] [--json]
```

Status shortcuts:

```sh
tck order <id>... [--proj <slug>] [--json]
tck prep <id>... [--proj <slug>] [--json]
tck cook <id>... [--proj <slug>] [--json]
tck serve <id>... [--proj <slug>] [--json]
```

Supported task statuses:

- `order`
- `prep`
- `cook`
- `serve`

Supported priorities:

- `urgent`
- `high`
- `medium`
- `low`

### Mixes

```sh
tck mix create [--proj <slug>] [--title "title"] [--body "text"] [--body-file <file>] [--json]
tck mix list [--proj <slug>] [--status <open|closed>] [--json]
tck mix view <id> [--proj <slug>] [--json]
tck mix edit <id> [--proj <slug>] [--title "title"] [--body "text"] [--body-file <file>] [--json]
tck mix close <id> [--proj <slug>] [--json]
tck mix reopen <id> [--proj <slug>] [--json]
tck mix comment <id> [--proj <slug>] [--body "text"] [--body-file <file>] [--json]
tck mix delete <id> --force [--proj <slug>] [--json]
```

### Maintenance

```sh
tck rebuild
```

Rebuild refreshes `.tck/index.json` from issue files when the index gets out of sync.

## Development

```sh
pnpm build
pnpm test
pnpm lint
pnpm typecheck
pnpm ci
```

Project docs:

- `docs/tck-cli-spec.md`
- `docs/tck-cli-architecture.md`
