import { ConfigError, ValidationError } from '../../domain/errors.js';
import type { TckConfig } from '../../domain/types.js';
import { toJson } from '../../util/format.js';
import { createTranslator } from '../../util/i18n.js';
import { createCliContext } from '../context.js';

type ConfigLeaf = string;

function getValueByKey(config: TckConfig, key?: string): unknown {
  if (!key) {
    return config;
  }

  return key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }

    return undefined;
  }, config);
}

function setValueByKey(
  config: TckConfig,
  key: string,
  value: ConfigLeaf,
  locale: TckConfig['language']
): TckConfig {
  const t = createTranslator(locale);
  switch (key) {
    case 'user.name':
      return { ...config, user: { ...config.user, name: value } };
    case 'user.email':
      return { ...config, user: { ...config.user, email: value } };
    case 'defaultProject':
      return { ...config, defaultProject: value };
    case 'editor':
      return { ...config, editor: value };
    case 'dateFormat':
      return { ...config, dateFormat: value };
    case 'language':
      if (value !== 'ja' && value !== 'en') {
        throw new ValidationError(
          'language は ja または en を指定してください。'
        );
      }
      return { ...config, language: value };
    default:
      throw new ValidationError(t('unknownConfigKey', { key }));
  }
}

async function loadConfigOrThrow(): Promise<TckConfig> {
  const context = createCliContext();
  const config = await context.configRepository.load();
  if (!config) {
    const t = createTranslator('ja');
    throw new ConfigError(t('configNotFound'));
  }

  return config;
}

export async function configGetHandler(key?: string): Promise<void> {
  const config = await loadConfigOrThrow();
  const value = getValueByKey(config, key);
  if (value === undefined) {
    throw new ValidationError(`設定キーが見つかりません: ${key ?? ''}`);
  }

  if (typeof value === 'object') {
    console.log(toJson(value));
    return;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    console.log(value);
    return;
  }

  console.log(toJson(value));
}

export async function configSetHandler(
  key: string,
  value: string
): Promise<void> {
  const context = createCliContext();
  const config = await loadConfigOrThrow();
  const next = setValueByKey(config, key, value, config.language);
  await context.configRepository.save(next);
  console.log(`${key}=${value}`);
}
