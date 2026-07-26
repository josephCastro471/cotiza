import 'dotenv/config.js';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL },
    // demo.test.js reseeds (wipes + recreates) the whole test database, which
    // races against every other Prisma-integration test file if they run in
    // parallel worker processes. Vitest 2's default fileParallelism: true
    // makes this racy by default, not just under --sequence.shuffle — it only
    // passed before because file-size ordering happened to schedule
    // demo.test.js last. Running files sequentially is a cheap containment
    // (costs a few seconds on this ~9s suite); a proper fix (isolated test
    // DB/project per file) is out of scope for this round.
    fileParallelism: false,
  },
});
