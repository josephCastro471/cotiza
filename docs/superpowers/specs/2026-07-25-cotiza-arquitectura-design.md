# Cotiza — Arquitectura técnica (Fase 2)

> Spec de arquitectura. Complementa a `design-system.md` (que define lo visual) con las decisiones de backend, modelo de datos, API y despliegue.
>
> Fecha: 25 jul 2026 · Estado: aprobado, pendiente de plan de implementación.

---

## 1. Resumen y objetivo

Cotiza es un proyecto de portafolio: una demo multi-tenant de un sistema de cotizaciones, pensada para que un reclutador la use en vivo con distintos roles. El objetivo de esta fase es fijar la arquitectura técnica antes de escribir código — el diseño visual ya está cerrado en `design-system.md`.

## 2. Alcance

**Dentro de esta iteración (MVP core):**

- Login multi-rol (Admin, Gerente, Vendedor, Cliente) con accesos rápidos de demo.
- Resumen (dashboard con KPIs).
- Cotizaciones: lista, editor, detalle, ciclo completo (crear → enviar → aprobar/rechazar → vencer → duplicar).
- Aprobaciones (bandeja para Gerente/Admin).
- Exportar PDF.
- Multi-tenant con cambio de empresa (Empresa A / Empresa B) para el rol Admin.
- Datos de demostración (seed) y botón de reinicio.

**Fuera de esta iteración (segunda pasada):**

- CRUD completo de Clientes y Catálogo (pantallas propias con panel lateral).
- Ajustes (empresa, impuestos, usuarios).
- Registro de usuario (`/registro`) más allá de los usuarios sembrados.
- Modo oscuro (ya fuera de alcance también en `design-system.md` §3.5).

Clientes y catálogo existen como **entidades de datos** desde el día uno (las cotizaciones los referencian), pero sus pantallas de administración dedicadas se implementan después del flujo core.

## 3. Arquitectura general

```
┌──────────────────┐        HTTPS/REST         ┌──────────────────┐        ┌────────────┐
│  React + Vite      │ ────────────────────────▶ │  Express API       │ ─────▶ │  Neon      │
│  (Vercel)           │ ◀──────────────────────── │  (Render)           │        │  Postgres  │
└──────────────────┘        JSON + JWT           └──────────────────┘        └────────────┘
```

- Frontend: SPA con React + Vite y React Router. Sin SSR — todo el producto vive detrás de login, SEO no aplica.
- Backend: API REST con Express, bajo el prefijo `/api`. Autenticación por JWT (`Authorization: Bearer <token>`).
- Base de datos: PostgreSQL. Local vía Docker Compose en desarrollo; Neon (serverless) en producción.
- ORM: Prisma.
- Un solo repositorio: frontend en la raíz, backend en `server/` (mismo patrón que el proyecto de referencia `pulso`).
- Lenguaje: JavaScript (sin TypeScript), consistente con `pulso`.

## 4. Modelo de datos

Todas las entidades de negocio (excepto `Usuario` que la incluye directamente) cuelgan de `empresaId`.

```prisma
enum Rol {
  ADMIN
  GERENTE
  VENDEDOR
  CLIENTE
}

enum EstadoCotizacion {
  BORRADOR
  ENVIADO
  APROBADO
  RECHAZADO
  VENCIDO
}

enum TipoCatalogo {
  PRODUCTO
  SERVICIO
}

enum TipoEvento {
  CREADA
  ENVIADA
  APROBADA
  RECHAZADA
  DEVUELTA
  VENCIDA
}

model Empresa {
  id             String   @id @default(cuid())
  nombre         String
  ruc            String
  logoUrl        String?
  ivaPct         Decimal  @default(15)
  prefijoFolio   String   // "COT-A", "COT-B"
  siguienteFolio Int      @default(1)
  createdAt      DateTime @default(now())

  usuarios     Usuario[]
  clientes     Cliente[]
  catalogo     CatalogoItem[]
  cotizaciones Cotizacion[]
}

model Usuario {
  id           String   @id @default(cuid())
  empresaId    String
  nombre       String
  email        String   @unique
  passwordHash String
  rol          Rol
  clienteId    String?  // solo si rol = CLIENTE: a qué Cliente representa
  createdAt    DateTime @default(now())

  empresa               Empresa       @relation(fields: [empresaId], references: [id])
  clienteRepresentado   Cliente?      @relation(fields: [clienteId], references: [id])
  cotizacionesVendedor  Cotizacion[]  @relation("Vendedor")
  eventos               CotizacionEvento[]
}

model Cliente {
  id        String   @id @default(cuid())
  empresaId String
  nombre    String
  ruc       String
  email     String?
  telefono  String?
  direccion String?
  createdAt DateTime @default(now())

  empresa      Empresa      @relation(fields: [empresaId], references: [id])
  cotizaciones Cotizacion[]
  usuarios     Usuario[]
}

model CatalogoItem {
  id             String       @id @default(cuid())
  empresaId      String
  nombre         String
  descripcion    String?
  tipo           TipoCatalogo
  precioUnitario Decimal
  createdAt      DateTime     @default(now())

  empresa Empresa            @relation(fields: [empresaId], references: [id])
  lineas  CotizacionLinea[]
}

model Cotizacion {
  id                 String            @id @default(cuid())
  empresaId          String
  folio              String            // p.ej. "COT-A-0148", o "COT-A-0148-R1" al duplicar
  clienteId          String
  vendedorId         String
  estado             EstadoCotizacion  @default(BORRADOR)
  subtotal           Decimal
  descuentoTotal      Decimal          @default(0)
  iva                Decimal
  total              Decimal
  fechaEmision       DateTime          @default(now())
  fechaValidez       DateTime
  cotizacionPadreId  String?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  empresa          Empresa            @relation(fields: [empresaId], references: [id])
  cliente          Cliente            @relation(fields: [clienteId], references: [id])
  vendedor         Usuario            @relation("Vendedor", fields: [vendedorId], references: [id])
  cotizacionPadre  Cotizacion?        @relation("Duplicados", fields: [cotizacionPadreId], references: [id])
  duplicados       Cotizacion[]       @relation("Duplicados")
  lineas           CotizacionLinea[]
  eventos          CotizacionEvento[]

  @@unique([empresaId, folio])
}

model CotizacionLinea {
  id              String   @id @default(cuid())
  cotizacionId    String
  catalogoItemId  String?
  descripcion     String
  cantidad        Decimal
  precioUnitario  Decimal
  descuentoPct    Decimal  @default(0)
  subtotal        Decimal
  orden           Int

  cotizacion   Cotizacion    @relation(fields: [cotizacionId], references: [id], onDelete: Cascade)
  catalogoItem CatalogoItem? @relation(fields: [catalogoItemId], references: [id])
}

model CotizacionEvento {
  id            String     @id @default(cuid())
  cotizacionId  String
  tipo          TipoEvento
  actorId       String
  comentario    String?
  createdAt     DateTime   @default(now())

  cotizacion Cotizacion @relation(fields: [cotizacionId], references: [id], onDelete: Cascade)
  actor      Usuario    @relation(fields: [actorId], references: [id])
}
```

Notas:

- `folio` es único por `empresaId`, no globalmente — cada empresa tiene su propia secuencia (`siguienteFolio` en `Empresa`), consistente con `design-system.md` §12.
- Los importes son `Decimal`, nunca `Float`, para evitar errores de redondeo en dinero.
- `CotizacionEvento` es la fuente de verdad del historial (§9.6 y §11 del design doc) — el detalle y el sello leen de ahí, nunca se infiere del `estado` actual.

## 5. Máquina de estados

Igual a `design-system.md` §11:

```
BORRADOR --enviar--> ENVIADO --aprobar--> APROBADO
   ▲                    │  │
   └────devolver────────┘  └--rechazar--> RECHAZADO
                          │
                          fechaValidez pasada
                          ▼
                       VENCIDO
```

Reglas de implementación:

- Solo `BORRADOR` es editable (`PATCH /api/cotizaciones/:id` rechaza si el estado no es `BORRADOR`).
- `APROBADO` y `RECHAZADO` son terminales: no hay endpoint que los mute. Para "cambiar algo" se llama `POST /api/cotizaciones/:id/duplicar`, que crea un nuevo `BORRADOR` con `folio` `<original>-R1` y `cotizacionPadreId` apuntando al original.
- `VENCIDO` se evalúa de forma perezosa: cualquier lectura (`GET /api/cotizaciones` o `GET /api/cotizaciones/:id`) de una fila `ENVIADO` cuya `fechaValidez` ya pasó la actualiza a `VENCIDO` (con su `CotizacionEvento` tipo `VENCIDA`, actor = sistema) antes de devolverla. Se eligió esta estrategia en vez de un cron porque el backend en Render (free tier) no garantiza ejecución en segundo plano; la evaluación perezosa es correcta siempre y no depende de infraestructura extra.
- Cada transición crea un `CotizacionEvento` con actor, timestamp y comentario opcional.

## 6. Roles y permisos

Matriz igual a `design-system.md` §10. Se aplica en dos capas:

1. **Servidor (autoridad):** middleware `requireRole([...roles])` en cada ruta de escritura; el alcance de lectura (`GET /api/cotizaciones`) se filtra según rol dentro del `service` — Admin/Gerente ven todas las de la empresa, Vendedor solo las propias (`vendedorId = usuario.id`), Cliente solo las dirigidas a él. Un `Usuario` con `rol = CLIENTE` tiene un `clienteId` que lo vincula a su registro `Cliente`; el filtro de lectura usa `cotizacion.clienteId = usuario.clienteId`. El seed crea, para cada `Cliente` que debe poder loguearse en la demo, tanto el registro `Cliente` como el `Usuario` con ese `clienteId`.
2. **Cliente (cosmética):** el frontend no renderiza acciones que el rol no puede ejecutar. Nunca se muestran deshabilitadas.

La UI oculta; el API decide — si una acción no permitida llega al backend, responde `403`, no falla en silencio.

## 7. Multi-tenant

- El JWT lleva `sub` (usuarioId), `empresaId` y `rol`.
- Middleware de autenticación decodifica el JWT y guarda `{ usuarioId, empresaId, rol }` en un contexto por-request usando `AsyncLocalStorage`.
- Una extensión de Prisma (`prisma.$extends`) intercepta las operaciones de los modelos con tenant (`Usuario`, `Cliente`, `CatalogoItem`, `Cotizacion`, y transitivamente sus relaciones) e inyecta `empresaId` del contexto activo en todo `where` de lectura y en todo `create`/`update` verifica que el registro pertenezca al tenant. **Nunca se filtra en el cliente** — cumple `design-system.md` §12 al pie de la letra.
- Caso especial de demo: `POST /api/auth/switch-empresa` — solo `ADMIN` — reemite el JWT con un `empresaId` distinto (Empresa A ↔ Empresa B). Es la única vía para cruzar el aislamiento, y solo mueve la sesión del propio usuario admin, nunca expone datos de una empresa a un usuario de otra.

## 8. API

Todas las rutas bajo `/api`. `🔒` = requiere JWT válido. Roles entre paréntesis = `requireRole`.

```
POST   /auth/login                    { email, password } → { token, usuario }
POST   /auth/demo-login               { rol } → { token, usuario }  (usuario semilla de Empresa A)
GET    /auth/me                       🔒
POST   /auth/switch-empresa           🔒 (ADMIN)            { empresaId } → { token }

GET    /dashboard                     🔒                     KPIs: conteo por estado, monto aprobado

GET    /cotizaciones                  🔒  filtros: estado, clienteId, desde, hasta, q
POST   /cotizaciones                  🔒 (ADMIN,GERENTE,VENDEDOR)
GET    /cotizaciones/:id              🔒
PATCH  /cotizaciones/:id              🔒 (ADMIN,GERENTE,VENDEDOR)   solo si BORRADOR
POST   /cotizaciones/:id/enviar       🔒 (ADMIN,GERENTE,VENDEDOR)
POST   /cotizaciones/:id/aprobar      🔒 (ADMIN,GERENTE)
POST   /cotizaciones/:id/rechazar     🔒 (ADMIN,GERENTE)            { comentario? }
POST   /cotizaciones/:id/duplicar     🔒 (ADMIN,GERENTE,VENDEDOR)
GET    /cotizaciones/:id/pdf          🔒                             stream application/pdf

GET    /clientes                      🔒
POST   /clientes                      🔒 (ADMIN,GERENTE,VENDEDOR)
GET    /clientes/:id                  🔒
PATCH  /clientes/:id                  🔒 (ADMIN,GERENTE,VENDEDOR)
DELETE /clientes/:id                  🔒 (ADMIN,GERENTE)

GET    /catalogo                      🔒
POST   /catalogo                      🔒 (ADMIN,GERENTE)
PATCH  /catalogo/:id                  🔒 (ADMIN,GERENTE)
DELETE /catalogo/:id                  🔒 (ADMIN,GERENTE)

GET    /usuarios                      🔒 (ADMIN)
POST   /usuarios                      🔒 (ADMIN)
PATCH  /usuarios/:id                  🔒 (ADMIN)

GET    /empresas/:id                  🔒 (ADMIN)                    ajustes de la empresa actual
PATCH  /empresas/:id                  🔒 (ADMIN)

POST   /demo/reset                    🔒                             vuelve al seed original
GET    /health
```

Errores en formato uniforme: `{ error: { message, code } }`. Mensajes redactados según `design-system.md` §13 (qué pasó y qué hacer, sin "Error:", sin disculpas).

## 9. Estructura de carpetas

```
Cotiza/
├── design-system.md
├── mockup.html
├── docs/superpowers/specs/
├── src/                             # Vite + React
│   ├── api/client.js                # instancia axios, storage de token (cotiza.token / cotiza.user)
│   ├── context/                     # AuthContext, TenantContext
│   ├── components/                  # Table, Chip, Stamp, EmptyState, Toast... (design system §8)
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── cotizaciones/
│   │   ├── aprobaciones/
│   │   ├── clientes/
│   │   └── catalogo/
│   ├── styles/tokens.css            # de design-system.md §15
│   └── lib/                         # formatCurrency (es-EC), formatDate
└── server/
    ├── docker-compose.yml           # Postgres 16-alpine, solo desarrollo
    ├── .env.example
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.js
    └── src/
        ├── config/db.js             # cliente Prisma + extensión de tenant
        ├── middleware/
        │   ├── auth.js              # verifica JWT, puebla AsyncLocalStorage
        │   └── requireRole.js
        ├── modules/
        │   ├── auth/ dashboard/ cotizaciones/ clientes/ catalogo/ usuarios/ empresas/ demo/
        │   │   (cada uno: routes.js, controller.js, service.js)
        ├── pdf/                     # plantillas @react-pdf/renderer
        └── utils/
```

## 10. PDF

- `@react-pdf/renderer` en el backend compone el documento declarativamente en `GET /api/cotizaciones/:id/pdf` — no se guarda ningún archivo, se genera en cada request.
- Sigue `design-system.md` §16: A4, márgenes 20mm, encabezado en IBM Plex Serif, folio en mono arriba a la derecha, banda contable en la tabla de líneas, sello replicado si el estado es `APROBADO`/`RECHAZADO`.

## 11. Datos de demostración

`server/prisma/seed.js` reproduce `design-system.md` §17 exactamente:

- 2 empresas (Constructora Andes / `COT-A`, consultora de TI / `COT-B`), 8 usuarios (2 por rol en Empresa A, 2 en Empresa B).
- 12 clientes con nombres y RUC verosímiles ecuatorianos.
- 18 ítems de catálogo (mezcla de productos y servicios).
- 24 cotizaciones repartidas entre los cinco estados, fechas de los últimos 90 días, montos entre $320 y $18.400, con historial de eventos completo.
- 3 cotizaciones en `ENVIADO` explícitamente, para que la aprobación se pueda ejecutar en vivo durante la demo.
- `POST /api/demo/reset` trunca y vuelve a correr el seed.

## 12. Testing

Vitest en `server/`, alcance mínimo dirigido — solo lo que puede fallar en silencio y arruinar una demo en vivo:

- Cálculo de totales de `CotizacionLinea`/`Cotizacion` (subtotal → descuento → IVA 15% → total).
- Transiciones válidas/inválidas de la máquina de estados (sección 5).
- Aislamiento multi-tenant: una consulta con contexto de Empresa A nunca devuelve filas de Empresa B, incluso si el `where` del caller no lo especifica explícitamente.

Sin e2e ni tests de frontend en esta iteración.

## 13. Despliegue

- Frontend → Vercel. `VITE_API_URL` apunta al backend de Render.
- Backend → Render. Variables: `DATABASE_URL` (Neon), `JWT_SECRET` (generado con `crypto.randomBytes(48).toString('hex')`, nunca commiteado), `JWT_EXPIRES_IN=7d`, `FRONTEND_URL` (debe ser la URL real de Vercel, no `localhost` — ver nota de riesgo abajo), `PORT`.
- `server/.env.example` documenta las variables; `server/.env` va en `.gitignore`.
- **Riesgo conocido (lección de `pulso`):** si `FRONTEND_URL` en el backend desplegado no coincide exactamente con el origen de Vercel, el CORS falla en silencio — el health check responde `200` igual, y el fallo solo aparece al probar desde el navegador real. Verificar con un `curl` que envíe el header `Origin` de producción, no solo pegarle al endpoint de salud.

## 14. Decisiones fuera de alcance de esta spec

- Modo oscuro: explícitamente fuera de alcance (`design-system.md` §3.5).
- CRUD dedicado de Clientes/Catálogo/Ajustes y `/registro`: se planifican en una segunda iteración, después de que el flujo core esté funcionando end-to-end.
