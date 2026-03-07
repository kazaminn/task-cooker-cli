import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const packageJsonPath = resolve(rootDir, 'package.json');
const lockfilePath = resolve(rootDir, 'pnpm-lock.yaml');
const licensePath = resolve(rootDir, 'LICENSE');
const distDir = resolve(rootDir, 'dist');
const sampleWorkspaceDir = resolve(rootDir, 'examples', 'sample-workspace');
const releaseRootDir = resolve(rootDir, 'release');

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(sourcePath, destinationPath) {
  if (await exists(sourcePath)) {
    await cp(sourcePath, destinationPath, { recursive: true });
  }
}

function createReleaseManifest(pkg) {
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    author: pkg.author,
    license: pkg.license,
    private: pkg.private,
    type: pkg.type,
    bin: pkg.bin,
    engines: pkg.engines,
    dependencies: pkg.dependencies,
    scripts: {
      tck: 'tck',
      help: 'tck --help',
      init: 'tck init',
      'project:list': 'tck project list',
      'project:create': 'tck project create "My Project" --slug project-1',
      'task:create:new': 'tck create new',
      'mix:create:new': 'tck mix create new',
      'sample:install': 'pnpm --dir sample-project install',
      'sample:start': 'pnpm --dir sample-project exec tck list',
    },
  };
}

function createSampleProjectPackageJson() {
  return {
    name: 'task-cooker-cli-sample-project',
    private: true,
    version: '0.0.0',
    description:
      'Sample workspace for trying the TaskCooker CLI release package',
    dependencies: {
      'task-cooker-cli': 'file:..',
    },
    scripts: {
      tck: 'tck',
      help: 'tck --help',
      'project:list': 'tck project list',
      list: 'tck list',
      view: 'tck view 1',
      mix: 'tck mix view 1',
      'task:create:new': 'tck create new',
      'mix:create:new': 'tck mix create new',
    },
  };
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? -1}`));
    });
  });
}

async function createZipArchive(sourceDir, targetZipPath) {
  if (process.platform !== 'win32') {
    console.warn(
      'Skipping zip creation because automatic zip packaging is only configured for Windows.'
    );
    return;
  }

  await rm(targetZipPath, { force: true });
  await runCommand('powershell', [
    '-NoProfile',
    '-Command',
    `Compress-Archive -Path "${sourceDir}\\*" -DestinationPath "${targetZipPath}"`,
  ]);
}

function createReleaseReadme(pkg) {
  const packageDirName = `tck-cli-v${pkg.version}`;

  return `# TaskCooker CLI Release Package

## 日本語

このフォルダは TaskCooker CLI（\`tck\`）の配布用パッケージです。

最短導線:

1. \`pnpm install --prod --frozen-lockfile\`
2. \`pnpm run help\`
3. \`pnpm run project:create\`
4. \`pnpm run sample:install\`
5. \`pnpm run sample:start\`

### 同梱内容

- \`dist/\`
- \`package.json\`
- \`pnpm-lock.yaml\`
- \`sample-project/\`
- \`../tck-cli-v${pkg.version}.zip\` を GitHub Releases に添付しやすい構成

### 必要環境

- Node.js 20 以上
- pnpm

### 使い方

\`\`\`sh
cd ${packageDirName}
pnpm install --prod --frozen-lockfile
pnpm run help
\`\`\`

グローバルインストールは不要です。インストール後は \`pnpm exec tck\` で実行できます。

よく使うコマンドは \`package.json\` の scripts に入っています。

\`\`\`sh
pnpm run help
pnpm run init
pnpm run project:list
pnpm run project:create
pnpm run task:create:new
pnpm run mix:create:new
pnpm run sample:install
pnpm run sample:start
\`\`\`

最初に同梱のサンプル workspace を試す場合:

\`\`\`sh
cd sample-project
Get-Content README.md
pnpm install
pnpm run list
pnpm run view
\`\`\`

新しい workspace を作る場合:

\`\`\`sh
mkdir my-project
cd my-project
pnpm exec tck init
\`\`\`

### 補足

- このパッケージには開発用ファイル（\`src/\`, \`tests/\` など）は含まれていません。
- 依存関係は \`pnpm install --prod --frozen-lockfile\` で導入してください。
- \`sample-project/\` は CLI の動作確認用です。実運用では別ディレクトリで \`pnpm exec tck init\` を実行してください。
- GitHub Releases では \`tck-cli-v${pkg.version}.zip\` を配布するのが最も扱いやすい想定です。

## English

This folder is a distributable package for TaskCooker CLI (\`tck\`).

Shortest path:

1. \`pnpm install --prod --frozen-lockfile\`
2. \`pnpm run help\`
3. \`pnpm run project:create\`
4. \`pnpm run sample:install\`
5. \`pnpm run sample:start\`

### Included Files

- \`dist/\`
- \`package.json\`
- \`pnpm-lock.yaml\`
- \`sample-project/\`
- \`../tck-cli-v${pkg.version}.zip\` for easy GitHub Releases distribution

### Requirements

- Node.js 20 or later
- pnpm

### Usage

\`\`\`sh
cd ${packageDirName}
pnpm install --prod --frozen-lockfile
pnpm run help
\`\`\`

No global installation is required. After installing dependencies, run the CLI with \`pnpm exec tck\`.

Common commands are available via \`package.json\` scripts.

\`\`\`sh
pnpm run help
pnpm run init
pnpm run project:list
pnpm run project:create
pnpm run task:create:new
pnpm run mix:create:new
pnpm run sample:install
pnpm run sample:start
\`\`\`

To try the bundled sample workspace first:

\`\`\`sh
cd sample-project
cat README.md
pnpm install
pnpm run list
pnpm run view
\`\`\`

To create a fresh workspace:

\`\`\`sh
mkdir my-project
cd my-project
pnpm exec tck init
\`\`\`

### Notes

- This package does not include development files such as \`src/\` or \`tests/\`.
- Install runtime dependencies with \`pnpm install --prod --frozen-lockfile\`.
- \`sample-project/\` is only for exploring the CLI. For real use, create another directory and run \`pnpm exec tck init\`.
- For GitHub Releases, distributing \`tck-cli-v${pkg.version}.zip\` is the intended path.
`;
}

async function createSampleProject(targetDir) {
  const sampleRootDir = resolve(targetDir, 'sample-project');
  await cp(sampleWorkspaceDir, sampleRootDir, { recursive: true });
  await writeFile(
    resolve(sampleRootDir, 'package.json'),
    `${JSON.stringify(createSampleProjectPackageJson(), null, 2)}\n`,
    'utf8'
  );
}

async function main() {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  if (!version) {
    throw new Error(
      'package.json must define a version before creating a release package.'
    );
  }

  if (!(await exists(distDir))) {
    throw new Error(
      'dist directory was not found. Run the build step before packaging the release.'
    );
  }

  const packageDirName = `tck-cli-v${version}`;
  const targetDir = resolve(releaseRootDir, packageDirName);

  await mkdir(releaseRootDir, { recursive: true });
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });

  await cp(distDir, resolve(targetDir, 'dist'), { recursive: true });
  await copyIfExists(lockfilePath, resolve(targetDir, 'pnpm-lock.yaml'));
  await copyIfExists(licensePath, resolve(targetDir, 'LICENSE'));

  const releasePackageJson = createReleaseManifest(packageJson);
  await writeFile(
    resolve(targetDir, 'package.json'),
    `${JSON.stringify(releasePackageJson, null, 2)}\n`,
    'utf8'
  );
  await writeFile(
    resolve(targetDir, 'README.md'),
    createReleaseReadme(packageJson),
    'utf8'
  );
  await createSampleProject(targetDir);
  await createZipArchive(
    targetDir,
    resolve(releaseRootDir, `${packageDirName}.zip`)
  );

  console.log(`Created release package: ${targetDir}`);
}

await main();
