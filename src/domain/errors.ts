export class TckError extends Error {
  public readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = 'TckError';
    this.exitCode = exitCode;
  }
}

export class NotFoundError extends TckError {
  constructor(resource: string, id: string | number) {
    super(`${resource}が見つかりません: ${id}`, 1);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends TckError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'ValidationError';
  }
}

export class ConfigError extends TckError {
  constructor(message: string) {
    super(message, 1);
    this.name = 'ConfigError';
  }
}
