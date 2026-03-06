import { ValidationError } from '../domain/errors.js';

export interface ParsedCommentBlock {
  author: string;
  timestamp: string;
}

const COMMENT_BLOCK_RE = /^<!--\s*comment\s+@([^\s]+)\s+([^\s]+)\s*-->$/;

export function parseCommentBlock(input: string): ParsedCommentBlock {
  const matched = COMMENT_BLOCK_RE.exec(input.trim());

  if (!matched) {
    throw new ValidationError('コメントブロックの形式が不正です');
  }

  return {
    author: matched[1],
    timestamp: matched[2],
  };
}

export function formatCommentBlock(block: ParsedCommentBlock): string {
  return `<!-- comment @${block.author} ${block.timestamp} -->`;
}
