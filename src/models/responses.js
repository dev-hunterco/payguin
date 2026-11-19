export function centsToDecimal(cents) {
  if (cents == null) return null;
  return Number((cents / 100).toFixed(2));
}

export function decimalToCents(decimal) {
  if (decimal == null) return null;
  return Math.round(decimal * 100);
}

export function listResponse(data, totalCount, offset = 0, limit = 10) {
  return {
    object: 'list',
    hasMore: offset + limit < totalCount,
    totalCount,
    limit,
    offset,
    data,
  };
}

export function errorResponse(errors) {
  return {
    errors: errors.map(e => ({
      code: e.code || 'invalid_action',
      description: e.description || e.message || 'Unknown error',
    })),
  };
}

export function parsePagination(query) {
  const offset = Math.max(0, parseInt(query.offset) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  return { offset, limit };
}
