import type { TckConfig } from '../domain/types.js';

type MessageKey =
  | 'taskCreated'
  | 'taskUpdated'
  | 'taskDeleted'
  | 'mixCreated'
  | 'mixUpdated'
  | 'mixDeleted'
  | 'projectCreated'
  | 'projectUpdated'
  | 'projectDeleted'
  | 'indexRebuilt'
  | 'forceRequired'
  | 'bodyConflict'
  | 'defaultProjectRequired'
  | 'unknownConfigKey'
  | 'configNotFound';

type MessageMap = Record<MessageKey, string>;
type Locale = NonNullable<TckConfig['language']>;

const messages: Record<Locale, MessageMap> = {
  ja: {
    taskCreated: 'タスクを作成しました: #{id} {title}',
    taskUpdated: 'タスクを更新しました: #{id}',
    taskDeleted: 'タスクを削除しました: #{id}',
    mixCreated: 'ミックスを作成しました: #{id} {title}',
    mixUpdated: 'ミックスを更新しました: #{id}',
    mixDeleted: 'ミックスを削除しました: #{id}',
    projectCreated: 'プロジェクトを作成しました: {slug}',
    projectUpdated: 'プロジェクトを更新しました: {slug}',
    projectDeleted: 'プロジェクトを削除しました: {slug}',
    indexRebuilt: 'インデックスを再構築しました。',
    forceRequired: '削除には --force が必要です。',
    bodyConflict: '--body と --body-file は同時に指定できません。',
    defaultProjectRequired:
      '--proj を指定するか、tck.config.json に defaultProject を設定してください。',
    unknownConfigKey: '未対応の設定キーです: {key}',
    configNotFound:
      'tck.config.json が見つかりません。先に tck init を実行してください。',
  },
  en: {
    taskCreated: 'Task created: #{id} {title}',
    taskUpdated: 'Task updated: #{id}',
    taskDeleted: 'Task deleted: #{id}',
    mixCreated: 'Mix created: #{id} {title}',
    mixUpdated: 'Mix updated: #{id}',
    mixDeleted: 'Mix deleted: #{id}',
    projectCreated: 'Project created: {slug}',
    projectUpdated: 'Project updated: {slug}',
    projectDeleted: 'Project deleted: {slug}',
    indexRebuilt: 'Index rebuilt.',
    forceRequired: '--force is required for deletion.',
    bodyConflict: '--body and --body-file cannot be used together.',
    defaultProjectRequired:
      'Specify --proj or configure defaultProject in tck.config.json.',
    unknownConfigKey: 'Unknown config key: {key}',
    configNotFound: 'tck.config.json not found. Run tck init first.',
  },
};

function fillTemplate(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) {
    return template;
  }

  return template.replaceAll(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => {
    const value = vars[key];
    return value === undefined ? '' : String(value);
  });
}

export function createTranslator(locale: Locale = 'ja') {
  return (key: MessageKey, vars?: Record<string, string | number>): string =>
    fillTemplate(messages[locale][key], vars);
}
