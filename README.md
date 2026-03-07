# TaskCooker CLI

TaskCooker CLI (`tck`) is a Node.js command line tool for managing tasks and mixes (thread-style discussions) in plain text files.

## Requirements

- Node.js 20+
- pnpm

## Setup

```sh
pnpm install
pnpm build
```

Build output is generated under `dist/`. After building, you can run the CLI with `node dist/bin/tck.js` or link it locally with your preferred workflow.

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
# initialize a workspace
node dist/bin/tck.js init

# create a project
node dist/bin/tck.js project create "My Project" --slug project-1

# create a task in the default project
node dist/bin/tck.js create "Investigate parser bug" --body "Initial notes"

# inspect tasks
node dist/bin/tck.js list
node dist/bin/tck.js view 1

# update task state
node dist/bin/tck.js update 1 --title "Investigate parser regression" --priority high
node dist/bin/tck.js cook 1
node dist/bin/tck.js serve 1

# inspect activity history
node dist/bin/tck.js log
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

## Commands

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
