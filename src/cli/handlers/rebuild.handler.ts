import { createCliContext } from '../context.js';
import { getTranslator } from './shared.js';

export async function rebuildHandler(): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  await context.indexService.rebuild();
  console.log(t('indexRebuilt'));
}
