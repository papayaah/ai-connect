/**
 * Express/Node.js Handler
 * For traditional Node.js servers using Express
 */

import { askDatabase, type AskDatabaseResult } from '../core';

export interface ExpressHandlerConfig {
  /**
   * Your database schema - REQUIRED
   * Describes your tables and columns so the AI can generate correct SQL.
   */
  schema: string;

  /** Function to get API key */
  getApiKey: () => string | Promise<string>;

  /** Function to execute SQL queries */
  executeQuery: (sql: string) => Promise<any[]>;

  /** AI provider to use */
  provider?: 'google' | 'openai' | 'anthropic';

  /** Model to use */
  model?: string;
}

interface ExpressRequest {
  body: any;
  method: string;
}

interface ExpressResponse {
  status: (code: number) => ExpressResponse;
  json: (data: any) => void;
}

type NextFunction = (error?: any) => void;

/**
 * Creates an Express middleware handler
 *
 * @example
 * // server.js
 * import express from 'express';
 * import { Pool } from 'pg';
 * import { createExpressHandler } from '@reactkits.dev/ai-connect/server';
 *
 * const app = express();
 * const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 *
 * const askDatabaseHandler = createExpressHandler({
 *   getApiKey: () => process.env.GEMINI_API_KEY!,
 *   executeQuery: async (sql) => {
 *     const { rows } = await pool.query(sql);
 *     return rows;
 *   },
 * });
 *
 * app.use(express.json());
 * app.post('/api/ask-database', askDatabaseHandler);
 */
export function createExpressHandler(config: ExpressHandlerConfig) {
  const {
    getApiKey,
    executeQuery,
    provider = 'google',
    model: defaultModel = 'gemini-2.5-flash',
    schema,
  } = config;

  return async (req: ExpressRequest, res: ExpressResponse, next?: NextFunction) => {
    try {
      const { question, model, maxRows, formatResults } = req.body || {};

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Question is required' });
      }

      const apiKey = await getApiKey();

      const result: AskDatabaseResult = await askDatabase({
        question,
        executeQuery,
        apiKey,
        provider,
        model: model || defaultModel,
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
