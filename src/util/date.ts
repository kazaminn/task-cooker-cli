import { format, isValid, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * YYYY-MM-DD または ISO 8601 文字列を Date オブジェクトに変換する。
 * パース失敗時は null を返す（ValidationError は呼び出し元でスロー）。
 */
export function parseDateString(value: string): Date | null {
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

/**
 * Date オブジェクトを YYYY-MM-DD 文字列に変換する（due date の永続化用）。
 */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Date をユーザー設定の dateFormat でフォーマットする（表示用）。
 * tz が指定された場合はタイムゾーン変換を行う。
 */
export function formatDateDisplay(
  date: Date,
  dateFormat = 'yyyy-MM-dd',
  tz?: string
): string {
  const d = tz ? toZonedTime(date, tz) : date;
  return format(d, dateFormat);
}

/**
 * ISO タイムスタンプ文字列を人間が読める形式に変換する（ログ表示用）。
 * パース失敗時は元の文字列をそのまま返す。
 */
export function formatTimestamp(isoString: string, tz?: string): string {
  const date = parseISO(isoString);
  if (!isValid(date)) return isoString;
  return formatDateDisplay(date, 'yyyy-MM-dd HH:mm:ss', tz);
}

/**
 * YYYY-MM-DD 形式として有効かどうかを検証する。
 */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return parseDateString(value) !== null;
}
