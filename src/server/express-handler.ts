/**
 * Express/Node.js Handler
 * For traditional Node.js servers using Express
 */

import { askDatabase, type AskDatabaseResult } from '../core';
import { type LanguageModel } from '../core/ai-caller';

export interface ExpressHandlerConfig {
  /**
   * Your database schema - REQUIRED
   * Describes your tables and columns so the AI can generate correct SQL.
   */
  schema: string;

  /**
   * Function to get the AI model instance.
   *
   * @example
   * ```typescript
   * import { google } from '@ai-sdk/google';
   *
   * getModel: () => google('gemini-2.5-flash')
   * ```
   */
  getModel: () => LanguageModel | Promise<LanguageModel>;

  /** Function to execute SQL queries */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeQuery: (sql: string) => Promise<any[]>;
}

interface ExpressRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  method: string;
}

interface ExpressResponse {
  status: (code: number) => ExpressResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: (data: any) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NextFunction = (error?: any) => void;

/**
 * Creates an Express middleware handler
 *
 * @example
 * ```typescript
 * // server.js
 * import express from 'express';
 * import { Pool } from 'pg';
 * import { google } from '@ai-sdk/google';
 * import { createExpressHandler } from '@reactkits.dev/ai-connect/server';
 * import { MY_APP_SCHEMA } from './schema';
 *
 * const app = express();
 * const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 *
 * const askDatabaseHandler = createExpressHandler({
 *   schema: MY_APP_SCHEMA,
 *   getModel: () => google('gemini-2.5-flash'),
 *   executeQuery: async (sql) => {
 *     const { rows } = await pool.query(sql);
 *     return rows;
 *   },
 * });
 *
 * app.use(express.json());
 * app.post('/api/ask-database', askDatabaseHandler);
 * ```
 */
export function createExpressHandler(config: ExpressHandlerConfig) {
  const { getModel, executeQuery, schema } = config;

  return async (req: ExpressRequest, res: ExpressResponse, next?: NextFunction) => {
    try {
      const { question, maxRows, formatResults } = req.body || {};

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Question is required' });
      }

      const model = await getModel();

      const result: AskDatabaseResult = await askDatabase({
        question,
        executeQuery,
        model,
        schema,
        maxRows,
        formatResults,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('[ai-connect] Error:', error);

      const message = error instanceof Error ? error.message : 'Internal server error';
      const status = message.includes('invalid') || message.includes('required') ? 400 : 500;

      return res.status(status).json({ error: message });
    }
  };
}
