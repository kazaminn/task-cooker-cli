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
  | 'configNotFound'
  | 'invalidId'
  | 'idsRequired'
  | 'taskProjectAmbiguous'
  | 'mixProjectAmbiguous'
  | 'multiProjectTaskUpdate'
  | 'editorExitedAbnormally'
  | 'mixCommentBodyRequired'
  | 'taskUpdateIdsRequired'
  | 'invalidLanguage'
  | 'configKeyNotFound'
  | 'activityTaskCreated'
  | 'activityTaskUpdated'
  | 'activityTaskDeleted'
  | 'activityMixCreated'
  | 'activityMixCommentAdded'
  | 'activityMixDeleted'
  | 'activityProjectCreated'
  | 'activityProjectDeleted'
  | 'activityTaskStatusChanged';

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
    invalidId: 'IDが不正です: {value}',
    idsRequired: 'IDを1つ以上指定してください。',
    taskProjectAmbiguous:
      'task #{id} が複数プロジェクトで見つかりました。--proj を指定してください。',
    mixProjectAmbiguous:
      'mix #{id} が複数プロジェクトで見つかりました。--proj を指定してください。',
    multiProjectTaskUpdate:
      '複数プロジェクトの task を同時更新できません。--proj で絞り込んでください。',
    editorExitedAbnormally: 'エディタが異常終了しました: {code}',
    mixCommentBodyRequired: 'コメント本文を指定してください。',
    taskUpdateIdsRequired: '更新対象のIDが必要です。',
    invalidLanguage: 'language は ja または en を指定してください。',
    configKeyNotFound: '設定キーが見つかりません: {key}',
    activityTaskCreated: 'タスクを作成: {title}',
    activityTaskUpdated: 'タスクを更新: {title}',
    activityTaskDeleted: 'タスクを削除: #{id}',
    activityMixCreated: 'ミックスを作成: {title}',
    activityMixCommentAdded: 'コメント追加 by {actor}',
    activityMixDeleted: 'ミックスを削除: #{id}',
    activityProjectCreated: 'プロジェクトを作成: {name}',
    activityProjectDeleted: 'プロジェクトを削除: {slug}',
    activityTaskStatusChanged: 'ステータス変更: {status}',
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
    invalidId: 'Invalid ID: {value}',
    idsRequired: 'Specify at least one ID.',
    taskProjectAmbiguous:
      'task #{id} was found in multiple projects. Specify --proj.',
    mixProjectAmbiguous:
      'mix #{id} was found in multiple projects. Specify --proj.',
    multiProjectTaskUpdate:
      'Cannot update tasks across multiple projects at once. Narrow down with --proj.',
    editorExitedAbnormally: 'Editor exited abnormally: {code}',
    mixCommentBodyRequired: 'Specify a comment body.',
    taskUpdateIdsRequired: 'At least one ID is required for update.',
    invalidLanguage: 'language must be either ja or en.',
    configKeyNotFound: 'Config key not found: {key}',
    activityTaskCreated: 'Task created: {title}',
    activityTaskUpdated: 'Task updated: {title}',
    activityTaskDeleted: 'Task deleted: #{id}',
    activityMixCreated: 'Mix created: {title}',
    activityMixCommentAdded: 'Comment added by {actor}',
    activityMixDeleted: 'Mix deleted: #{id}',
    activityProjectCreated: 'Project created: {name}',
    activityProjectDeleted: 'Project deleted: {slug}',
    activityTaskStatusChanged: 'Status changed: {status}',
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
