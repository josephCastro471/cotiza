import 'dotenv/config.js';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL },
  },
});
