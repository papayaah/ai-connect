/**
 * SQL Validator - Ensures queries are safe to execute
 * Works in Browser, Deno, and Node.js
 */

export interface SqlValidationResult {
  valid: boolean;
  error?: string;
}

const BLOCKED_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE',
  'CREATE', 'GRANT', 'REVOKE', 'EXECUTE', 'CALL', 'VACUUM',
  'REINDEX', 'CLUSTER', 'COMMENT', 'LOCK', 'UNLISTEN', 'NOTIFY'
];

const SENSITIVE_PATTERNS = [
  /password/i,
  /stripe_customer/i,
  /api_key/i,
  /secret/i,
  /auth\.users/i,
  /pg_catalog/i,
  /information_schema/i,
];

/**
 * Validates that a SQL query is safe to execute
 * - Must be a SELECT statement
 * - Cannot contain dangerous keywords
 * - Cannot access sensitive tables/columns
 * - Cannot contain multiple statements
 */
export function validateSql(sql: string): SqlValidationResult {
  if (!sql || typeof sql !== 'string') {
    return { valid: false, error: 'SQL query is required' };
  }

  const normalized = sql.trim().toUpperCase();

  // Must start with SELECT or WITH (for CTEs)
  if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
    return { valid: false, error: 'Query must be a SELECT statement' };
  }

  // Check for blocked keywords (could indicate SQL injection or dangerous operations)
  for (const keyword of BLOCKED_KEYWORDS) {
    // Use word boundary to avoid false positives (e.g., "SELECTED" shouldn't match "SELECT")
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sql)) {
      return { valid: false, error: `Query contains blocked keyword: ${keyword}` };
    }
  }

  // Check for sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(sql)) {
      return { valid: false, error: 'Query attempts to access sensitive data' };
    }
  }

  // Check for multiple statements (SQL injection prevention)
  // Allow semicolon only at the very end
  const semicolonIndex = sql.indexOf(';');
  if (semicolonIndex !== -1 && semicolonIndex < sql.trim().length - 1) {
    return { valid: false, error: 'Multiple statements not allowed' };
  }

  // Check for comments (could be used to bypass validation)
  if (sql.includes('--') || sql.includes('/*')) {
    return { valid: false, error: 'SQL comments not allowed' };
  }

  return { valid: true };
}

/**
 * Adds safety limits to a SQL query if not already present
 */
export function addSafetyLimits(sql: string, maxRows: number = 1000): string {
  const upperSql = sql.toUpperCase();

  // Don't add LIMIT if query already has one or is a COUNT query
  if (upperSql.includes(' LIMIT ') || upperSql.includes('COUNT(')) {
    return sql;
  }

  // Remove trailing semicolon if present
  let cleanSql = sql.trim();
  if (cleanSql.endsWith(';')) {
    cleanSql = cleanSql.slice(0, -1);
  }

  return `${cleanSql} LIMIT ${maxRows}`;
}
