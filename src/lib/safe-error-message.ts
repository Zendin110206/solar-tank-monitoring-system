const INTERNAL_SERVICE_ERROR_PATTERNS = [
  /\bER_[A-Z0-9_]+\b/i,
  /mysql/i,
  /sql/i,
  /unknown column/i,
  /field list/i,
  /duplicate entry/i,
  /constraint/i,
  /database/i,
  /\b(EAUTH|EAI_AGAIN|ECONNRESET|ECONNREFUSED|ENOTFOUND|ESOCKET|ETIMEDOUT)\b/i,
  /authentication failed/i,
  /getaddrinfo/i,
  /invalid login/i,
  /self[- ]signed certificate/i,
  /certificate/i,
  /ECONN/i,
  /ETIMEDOUT/i,
] as const;

export function isInternalServiceError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return INTERNAL_SERVICE_ERROR_PATTERNS.some((pattern) =>
    pattern.test(error.message),
  );
}

export function getSafeErrorMessage(
  error: unknown,
  {
    fallbackMessage,
    internalMessage,
  }: {
    fallbackMessage: string;
    internalMessage: string;
  },
): string {
  if (isInternalServiceError(error)) {
    return internalMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

export function getSafeErrorStatus(
  error: unknown,
  {
    defaultStatus = 400,
    internalStatus = 500,
  }: {
    defaultStatus?: number;
    internalStatus?: number;
  } = {},
): number {
  return isInternalServiceError(error) ? internalStatus : defaultStatus;
}
