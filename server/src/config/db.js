import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

const tenantContext = new AsyncLocalStorage();

const TENANT_MODELS = new Set(['Usuario', 'Cliente', 'CatalogoItem', 'Cotizacion']);
const READ_OPS = new Set(['findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow', 'findMany', 'count', 'aggregate', 'groupBy']);
const WHERE_WRITE_OPS = new Set(['update', 'updateMany', 'delete', 'deleteMany']);

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  name: 'tenantScoping',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!TENANT_MODELS.has(model)) return query(args);

        const store = tenantContext.getStore();
        if (!store) return query(args);

        const { empresaId } = store;
        const nextArgs = { ...args };

        if (READ_OPS.has(operation) || WHERE_WRITE_OPS.has(operation)) {
          nextArgs.where = { ...(nextArgs.where || {}), empresaId };
        } else if (operation === 'create') {
          nextArgs.data = { ...nextArgs.data, empresaId };
        } else if (operation === 'createMany') {
          nextArgs.data = (nextArgs.data || []).map((row) => ({ ...row, empresaId }));
        } else if (operation === 'upsert') {
          nextArgs.where = { ...(nextArgs.where || {}), empresaId };
          nextArgs.create = { ...nextArgs.create, empresaId };
        }

        return query(nextArgs);
      },
    },
  },
});

function runWithTenant(context, fn) {
  // Prisma's query methods return a lazy "PrismaPromise" whose .then() (which
  // is what actually triggers the $allOperations extension above) only fires
  // once the caller awaits it. If we just returned `tenantContext.run(context,
  // fn)`, the await happens back in the caller — after run()'s synchronous
  // callback has already returned — so tenantContext.getStore() would see
  // nothing inside the extension. Awaiting fn() here, inside an async callback
  // passed to run(), forces that first .then() linkage to happen while the
  // store is still the active AsyncLocalStorage context, so it (and every
  // downstream async continuation of it) stays tagged with this tenant.
  return tenantContext.run(context, async () => fn());
}

export { prisma, runWithTenant, tenantContext };
