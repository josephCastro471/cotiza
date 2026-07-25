# Cotiza — Frontend SPA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Depends on:** `docs/superpowers/plans/2026-07-25-cotiza-backend-api.md` — the API endpoints listed there must exist and be runnable (`cd server && npm run dev`) before starting this plan.

**Goal:** Build the React + Vite SPA for Cotiza's MVP core — login, Resumen, Cotizaciones (lista/editor/detalle), Aprobaciones, PDF download, multi-tenant switch — matching `design-system.md` and `mockup.html` exactly.

**Architecture:** Client-side routed SPA (`react-router-dom`) consuming the REST API via a single axios instance. Auth state lives in a React context backed by `localStorage`. No global state library — server data is fetched per-page with plain `useEffect`/`useState`, which is enough at this scale and avoids adding a dependency the project doesn't need.

**Tech Stack:** React + Vite (JavaScript, no TypeScript), `react-router-dom`, `axios`, Tailwind CSS (config from `design-system.md` §15) + the token CSS variables from the same section, `lucide-react` icons, Vitest for the handful of pure-logic unit tests.

**Testing note:** Per the approved spec (§12), automated testing for this project is scoped to the backend only (money math, state machine, tenant isolation) — there is deliberately no frontend component/e2e test suite in this iteration. Frontend tasks below verify each deliverable by running the dev server and checking the behavior in the browser, except for the two pure-JS utilities (`lib/format.js`, `api/client.js`'s token helpers) which get small Vitest unit tests because they're easy to get subtly wrong and cheap to pin down.

## Global Constraints

- JavaScript only, no TypeScript (spec §3).
- Frontend never filters by `empresaId` or trusts client-side role checks for security — it only hides actions the role can't perform (spec §6); the backend is the enforcement authority.
- Visual rules are binding and come from `design-system.md`: no gradients, no glassmorphism, no `rounded-2xl`, no emoji icons, Lucide only, IBM Plex Sans/Mono/Serif only, elevation = border not shadow, single primary button per view (design-system.md §2–§7).
- Amounts always render right-aligned, IBM Plex Mono, `tabular-nums`, format `$ 1.248,50` (es-EC) (design-system.md §4.3).
- Estado is always dot + text label, never color alone (design-system.md §3.2, §8.2).
- Token storage: `localStorage` keys `cotiza.token` / `cotiza.usuario`, defined once in `src/api/client.js`, imported everywhere else — never re-declared (mirrors the validated pattern from the `pulso` reference project).
- List filters persist in the URL query string, not just component state (design-system.md §9.5).
- Voice/copy rules from `design-system.md` §13 apply to every user-facing string: verb-first button labels, sentence case, no "exitosamente"/"por favor"/exclamation marks, errors say what happened and what to do.

---

## File Structure

```
Cotiza/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css                      # Tailwind directives + CSS custom properties
    ├── api/
    │   └── client.js                  # axios instance, token storage, 401 handling
    ├── context/
    │   └── AuthContext.jsx
    ├── components/
    │   ├── ProtectedRoute.jsx
    │   ├── RoleRoute.jsx
    │   ├── Button.jsx
    │   ├── EstadoChip.jsx
    │   ├── EmptyState.jsx
    │   ├── Toast.jsx
    │   └── layout/
    │       ├── AppLayout.jsx
    │       ├── Sidebar.jsx
    │       ├── Topbar.jsx
    │       └── DemoStrip.jsx
    ├── lib/
    │   ├── format.js
    │   └── format.test.js
    ├── pages/
    │   ├── LoginPage.jsx
    │   └── ResumenPage.jsx
    └── features/
        ├── cotizaciones/
        │   ├── CotizacionesListPage.jsx
        │   ├── CotizacionEditorPage.jsx
        │   ├── LineasEditor.jsx
        │   └── CotizacionDetallePage.jsx
        └── aprobaciones/
            └── AprobacionesPage.jsx
```

---

### Task 1: Scaffold Vite + React + Tailwind

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`
- Create: `tailwind.config.js`, `postcss.config.js`
- Create: `src/main.jsx`, `src/App.jsx`, `src/index.css`

**Interfaces:**
- Produces: a running Vite dev server at `http://localhost:5173` rendering a placeholder `App` component, with Tailwind utilities and the design system's CSS variables available globally.

- [ ] **Step 1: Scaffold with Vite**

Run (from `Cotiza/`): `npm create vite@latest . -- --template react`
When prompted about the non-empty directory (it already has `design-system.md`, `mockup.html`, `docs/`), confirm proceeding — it only adds new files.

- [ ] **Step 2: Install runtime and dev dependencies**

Run:
```bash
npm install react-router-dom axios lucide-react
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react jsdom
npx tailwindcss init -p
```

- [ ] **Step 3: Configure `tailwind.config.js`**

Copy the config from `design-system.md` §15 verbatim, adding a `content` field:

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EFF2ED',
        surface: '#FFFFFF',
        band: '#F4F7F1',
        line: { DEFAULT: '#DCE2D9', strong: '#C3CCBF' },
        ink: { 400: '#8A9791', 500: '#5C6B64', 700: '#2C3A34', 900: '#14201B' },
        st: {
          draft: '#6E7A74', sent: '#2F5D8C', approved: '#1F6B4E',
          rejected: '#A33A28', expired: '#8A6212',
        },
        focus: '#2F5D8C',
        danger: '#A33A28',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
      },
      fontSize: {
        label: ['12px', { lineHeight: '16px', letterSpacing: '0.06em' }],
        small: ['13px', { lineHeight: '18px' }],
        body: ['14px', { lineHeight: '20px' }],
        h3: ['15px', { lineHeight: '20px' }],
        h2: ['18px', { lineHeight: '24px' }],
        h1: ['22px', { lineHeight: '28px' }],
        display: ['28px', { lineHeight: '34px' }],
      },
      borderRadius: { control: '6px', card: '8px', chip: '4px' },
      transitionTimingFunction: { std: 'cubic-bezier(.2,.8,.3,1)' },
    },
  },
};
```

- [ ] **Step 4: Configure `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Serif:wght@600&display=swap');

:root {
  --shadow-popover: 0 1px 2px rgba(20,32,27,.05), 0 8px 24px rgba(20,32,27,.10);
  --shadow-modal:   0 2px 4px rgba(20,32,27,.06), 0 16px 48px rgba(20,32,27,.14);
  --dur-fast: 120ms;
  --dur-base: 160ms;
  --dur-slow: 220ms;
  --ease: cubic-bezier(.2, .8, .3, 1);
}

body {
  @apply bg-paper text-ink-900 font-sans text-body antialiased;
}

.tabular {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Set `VITE_API_URL` for local dev**

Create `.env.development` at the repo root:

```
VITE_API_URL=http://localhost:4000/api
```

Create `.gitignore` at the repo root (if not already present) including at least:

```
node_modules/
dist/
.env.local
```

(`.env.development` is safe to commit — it only points at localhost, no secrets.)

- [ ] **Step 6: Replace `src/App.jsx` and `src/main.jsx` with a minimal placeholder**

`src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/App.jsx`:

```jsx
export default function App() {
  return <div className="p-6 text-h1 font-semibold">Cotiza — en construcción</div>;
}
```

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev`
Open `http://localhost:5173` — expect the page to show "Cotiza — en construcción" in IBM Plex Sans on the `--paper` background, no console errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html tailwind.config.js postcss.config.js .env.development .gitignore src/main.jsx src/App.jsx src/index.css
git commit -m "feat(web): scaffold Vite + React + Tailwind with design system tokens"
```

---

### Task 2: API client and token storage

**Files:**
- Create: `src/api/client.js`
- Test: `src/api/client.test.js`

**Interfaces:**
- Produces: default-exported axios instance with `baseURL = import.meta.env.VITE_API_URL`, an `Authorization` header auto-attached from storage, and a 401 interceptor that clears the session. Named exports: `TOKEN_KEY`, `USUARIO_KEY`, `guardarSesion(token, usuario)`, `leerSesion()`, `borrarSesion()`.

- [ ] **Step 1: Write the failing test**

`src/api/client.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { guardarSesion, leerSesion, borrarSesion, TOKEN_KEY, USUARIO_KEY } from './client';

describe('almacenamiento de sesión', () => {
  beforeEach(() => localStorage.clear());

  it('guarda y lee el token y el usuario', () => {
    guardarSesion('token-123', { id: 'u1', rol: 'ADMIN' });
    const sesion = leerSesion();
    expect(sesion.token).toBe('token-123');
    expect(sesion.usuario.rol).toBe('ADMIN');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-123');
    expect(JSON.parse(localStorage.getItem(USUARIO_KEY)).id).toBe('u1');
  });

  it('devuelve token y usuario nulos si no hay sesión guardada', () => {
    expect(leerSesion()).toEqual({ token: null, usuario: null });
  });

  it('borra la sesión', () => {
    guardarSesion('token-123', { id: 'u1' });
    borrarSesion();
    expect(leerSesion()).toEqual({ token: null, usuario: null });
  });
});
```

- [ ] **Step 2: Configure Vitest for a browser-like environment**

`vite.config.js` — add a `test` block:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/api/client.test.js`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement the API client**

`src/api/client.js`:

```js
import axios from 'axios';

export const TOKEN_KEY = 'cotiza.token';
export const USUARIO_KEY = 'cotiza.usuario';

export function guardarSesion(token, usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function leerSesion() {
  const token = localStorage.getItem(TOKEN_KEY);
  const usuarioRaw = localStorage.getItem(USUARIO_KEY);
  return { token: token || null, usuario: usuarioRaw ? JSON.parse(usuarioRaw) : null };
}

export function borrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const { token } = leerSesion();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      borrarSesion();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/api/client.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/api/client.js src/api/client.test.js vite.config.js
git commit -m "feat(web): add API client with session storage and 401 handling"
```

---

### Task 3: Auth context

**Files:**
- Create: `src/context/AuthContext.jsx`

**Interfaces:**
- Consumes: `api`, `guardarSesion`, `leerSesion`, `borrarSesion` from Task 2.
- Produces: `<AuthProvider>` and `useAuth()` returning `{ usuario, cargando, login(email, password), demoLogin(rol), logout(), switchEmpresa(empresaId) }`. `usuario` is `null` when logged out, otherwise `{ id, empresaId, nombre, email, rol, clienteId }`.

- [ ] **Step 1: Implement the context**

`src/context/AuthContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { guardarSesion, leerSesion, borrarSesion } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const { token, usuario: usuarioGuardado } = leerSesion();
    if (token && usuarioGuardado) setUsuario(usuarioGuardado);
    setCargando(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    guardarSesion(data.token, data.usuario);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const demoLogin = useCallback(async (rol) => {
    const { data } = await api.post('/auth/demo-login', { rol });
    guardarSesion(data.token, data.usuario);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    borrarSesion();
    setUsuario(null);
  }, []);

  const switchEmpresa = useCallback(async (empresaId) => {
    const { data } = await api.post('/auth/switch-empresa', { empresaId });
    const { data: usuarioActualizado } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.token}` } });
    guardarSesion(data.token, usuarioActualizado);
    setUsuario(usuarioActualizado);
    return usuarioActualizado;
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, demoLogin, logout, switchEmpresa }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
```

- [ ] **Step 2: Wire the provider into `App.jsx`**

`src/App.jsx`:

```jsx
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <div className="p-6 text-h1 font-semibold">Cotiza — en construcción</div>
    </AuthProvider>
  );
}
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev` — confirm no console errors (the placeholder still renders; `AuthProvider` mounting without a backend running should not throw, since it only reads `localStorage` on mount).

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.jsx src/App.jsx
git commit -m "feat(web): add AuthContext with login, demo-login, logout, switch-empresa"
```

---

### Task 4: Router, ProtectedRoute, RoleRoute

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/ProtectedRoute.jsx`
- Create: `src/components/RoleRoute.jsx`
- Create: `src/pages/LoginPage.jsx` (placeholder, filled in Task 7)
- Create: `src/pages/ResumenPage.jsx` (placeholder, filled in Task 9)

**Interfaces:**
- Consumes: `useAuth()` from Task 3.
- Produces: `<ProtectedRoute>` (redirects to `/login` if `usuario` is `null`), `<RoleRoute roles={[...]}>` (renders children only if `usuario.rol` is included, otherwise redirects to `/`).

- [ ] **Step 1: Implement the guards**

`src/components/ProtectedRoute.jsx`:

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

`src/components/RoleRoute.jsx`:

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ roles }) {
  const { usuario } = useAuth();
  if (!roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

- [ ] **Step 2: Create placeholder pages**

`src/pages/LoginPage.jsx`:

```jsx
export default function LoginPage() {
  return <div className="p-6">Login — pendiente (Task 7)</div>;
}
```

`src/pages/ResumenPage.jsx`:

```jsx
export default function ResumenPage() {
  return <div className="p-6">Resumen — pendiente (Task 9)</div>;
}
```

- [ ] **Step 3: Wire the router**

`src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ResumenPage from './pages/ResumenPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ResumenPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`. Visiting `/` with no session redirects to `/login`. Visiting `/login` shows the placeholder. Manually run `localStorage.setItem('cotiza.token','x'); localStorage.setItem('cotiza.usuario', JSON.stringify({rol:'ADMIN'}))` in the browser console, then reload `/` — it should now show the Resumen placeholder instead of redirecting.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/components/ProtectedRoute.jsx src/components/RoleRoute.jsx src/pages/LoginPage.jsx src/pages/ResumenPage.jsx
git commit -m "feat(web): add router with ProtectedRoute and RoleRoute guards"
```

---

### Task 5: Shared UI primitives

**Files:**
- Create: `src/components/Button.jsx`
- Create: `src/components/EstadoChip.jsx`
- Create: `src/components/EmptyState.jsx`
- Create: `src/components/Toast.jsx`

**Interfaces:**
- Produces: `<Button variant="primary|secondary|ghost|danger" icon={LucideIcon} ...props>`, `<EstadoChip estado="BORRADOR|ENVIADO|APROBADO|RECHAZADO|VENCIDO" />`, `<EmptyState icon={LucideIcon} title subtitle actionLabel onAction />`, `<ToastProvider>` + `useToast()` returning `{ mostrar(mensaje, { deshacer } = {}) }`.

- [ ] **Step 1: Implement `Button`**

`src/components/Button.jsx`:

```jsx
const VARIANTES = {
  primary: 'bg-ink-900 text-white border border-ink-900 hover:bg-[#0C1712]',
  secondary: 'bg-transparent text-ink-900 border border-line-strong hover:border-ink-400 hover:bg-surface',
  ghost: 'bg-transparent text-ink-900 border-0 hover:bg-paper',
  danger: 'bg-transparent text-danger border border-danger/30 hover:bg-danger/5',
};

export default function Button({ variant = 'secondary', icon: Icon, children, className = '', ...props }) {
  return (
    <button
      className={`h-9 px-3.5 rounded-control font-medium text-small inline-flex items-center gap-1.5 transition-colors duration-[120ms] ease-std disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Implement `EstadoChip`**

`src/components/EstadoChip.jsx`:

```jsx
const ESTADOS = {
  BORRADOR: { color: '#6E7A74', label: 'Borrador' },
  ENVIADO: { color: '#2F5D8C', label: 'Enviado' },
  APROBADO: { color: '#1F6B4E', label: 'Aprobado' },
  RECHAZADO: { color: '#A33A28', label: 'Rechazado' },
  VENCIDO: { color: '#8A6212', label: 'Vencido' },
};

export default function EstadoChip({ estado }) {
  const info = ESTADOS[estado];
  return (
    <span className="inline-flex items-center text-small text-ink-700 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: info.color }} />
      {info.label}
    </span>
  );
}
```

- [ ] **Step 3: Implement `EmptyState`**

`src/components/EmptyState.jsx`:

```jsx
import Button from './Button';

export default function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-2">
      {Icon && <Icon size={24} className="text-ink-400 mb-1" />}
      <p className="text-h3 font-semibold">{title}</p>
      <p className="text-small text-ink-500 max-w-sm">{subtitle}</p>
      {actionLabel && (
        <Button variant="primary" onClick={onAction} className="mt-3">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement `Toast`**

`src/components/Toast.jsx`:

```jsx
import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const mostrar = useCallback((mensaje, opciones = {}) => {
    setToast({ mensaje, ...opciones });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 bg-ink-900 text-white text-small rounded-control px-4 py-2.5 shadow-[var(--shadow-popover)]"
        >
          {toast.mensaje}
          {toast.deshacer && (
            <button onClick={toast.deshacer} className="ml-3 underline">
              Deshacer
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
```

- [ ] **Step 5: Wire `ToastProvider` into `App.jsx`**

Modify `src/App.jsx` — wrap `<BrowserRouter>` with `<ToastProvider>`:

```jsx
import { ToastProvider } from './components/Toast';
// ...
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          {/* ...Routes unchanged... */}
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
```

- [ ] **Step 6: Verify in the browser**

Run: `npm run dev` — no console errors, placeholder pages still render (these primitives aren't used yet, this task only proves they compile cleanly; import one temporarily into `ResumenPage.jsx` — e.g. `<EstadoChip estado="APROBADO" />` — confirm it renders a green dot + "Aprobado", then remove the temporary import).

- [ ] **Step 7: Commit**

```bash
git add src/components/Button.jsx src/components/EstadoChip.jsx src/components/EmptyState.jsx src/components/Toast.jsx src/App.jsx
git commit -m "feat(web): add Button, EstadoChip, EmptyState, Toast primitives"
```

---

### Task 6: App shell layout (Sidebar, Topbar, DemoStrip)

**Files:**
- Create: `src/components/layout/Sidebar.jsx`
- Create: `src/components/layout/Topbar.jsx`
- Create: `src/components/layout/DemoStrip.jsx`
- Create: `src/components/layout/AppLayout.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `useAuth()` (Task 3), `api` (Task 2).
- Produces: `<AppLayout>` — renders `Sidebar` + `Topbar` + `DemoStrip` + `<Outlet />` for the routed page content, matching `mockup.html`'s `.app` grid exactly. Company-switch UI is wired in Task 14; here the Topbar only displays the current company name, non-interactive.

- [ ] **Step 1: Implement `Sidebar`**

`src/components/layout/Sidebar.jsx`:

```jsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckSquare, Users, Package, Settings } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/aprobaciones', label: 'Aprobaciones', icon: CheckSquare },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/catalogo', label: 'Catálogo', icon: Package },
];

export default function Sidebar() {
  return (
    <aside className="bg-paper border-r border-line py-5 flex flex-col w-56">
      <div className="px-5 pb-6 flex items-baseline gap-2">
        <b className="text-h3">Cotiza</b>
        <span className="text-ink-400 text-[11px] font-mono">v0.1</span>
      </div>
      <nav className="flex flex-col gap-px px-2">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-r-control text-ink-700 transition-colors duration-[120ms] ease-std border-l-2 ${
                isActive ? 'bg-surface border-ink-900 text-ink-900 font-medium' : 'border-transparent hover:bg-surface'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
        <div className="h-px bg-line my-3 mx-3" />
        <NavLink
          to="/ajustes"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-r-control text-ink-700 transition-colors duration-[120ms] ease-std border-l-2 ${
              isActive ? 'bg-surface border-ink-900 text-ink-900 font-medium' : 'border-transparent hover:bg-surface'
            }`
          }
        >
          <Settings size={16} />
          Ajustes
        </NavLink>
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Implement `Topbar`**

`src/components/layout/Topbar.jsx`:

```jsx
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function iniciales(nombre) {
  return nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Topbar() {
  const { usuario } = useAuth();

  return (
    <header className="h-[52px] border-b border-line bg-surface flex items-center gap-4 px-6">
      <div className="flex items-center gap-2 px-2.5 py-1 border border-line-strong rounded-control font-medium text-small">
        <span className="w-[18px] h-[18px] rounded-chip bg-ink-900 text-white text-[10px] font-semibold grid place-items-center">
          {usuario?.nombreEmpresa?.[0] || 'E'}
        </span>
        {usuario?.nombreEmpresa || 'Empresa'}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 px-2.5 py-1 border border-line rounded-control text-ink-400 text-small min-w-[200px]">
        <Search size={14} />
        Buscar
        <kbd className="ml-auto font-mono text-[11px] border border-line rounded-[3px] px-1 text-ink-500">⌘K</kbd>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-[26px] h-[26px] rounded-full bg-ink-900 text-white grid place-items-center text-[11px] font-semibold">
          {usuario ? iniciales(usuario.nombre) : ''}
        </span>
        <small className="text-ink-500 text-small">
          {usuario?.nombre} · {usuario?.rol && usuario.rol.charAt(0) + usuario.rol.slice(1).toLowerCase()}
        </small>
      </div>
    </header>
  );
}
```

Note: `usuario.nombreEmpresa` doesn't exist on the backend's `serializarUsuario` yet — Task 14 extends `GET /auth/me`'s consumer expectations by having the frontend fetch the empresa name separately; until then this falls back to "Empresa". This is intentional incremental wiring, not a bug.

- [ ] **Step 3: Implement `DemoStrip`**

`src/components/layout/DemoStrip.jsx`:

```jsx
import { Info } from 'lucide-react';
import { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../Toast';

export default function DemoStrip() {
  const [restableciendo, setRestableciendo] = useState(false);
  const { mostrar } = useToast();

  async function restablecer() {
    setRestableciendo(true);
    try {
      await api.post('/demo/reset');
      mostrar('Datos de demostración restablecidos.');
      window.location.reload();
    } catch {
      mostrar('No se pudo restablecer los datos. Intenta de nuevo.');
    } finally {
      setRestableciendo(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5 py-1.5 px-6 bg-[#F6EFE1] border-b border-[#E6DBC2] text-small text-[#6B4C0E]">
      <Info size={14} />
      Datos de demostración. Los cambios no afectan a ningún sistema real.
      <button onClick={restablecer} disabled={restableciendo} className="ml-auto underline disabled:opacity-50">
        {restableciendo ? 'Restableciendo…' : 'Restablecer datos'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Implement `AppLayout`**

`src/components/layout/AppLayout.jsx`:

```jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import DemoStrip from './DemoStrip';

export default function AppLayout() {
  return (
    <div className="grid grid-cols-[224px_1fr] min-h-screen">
      <Sidebar />
      <div>
        <Topbar />
        <DemoStrip />
        <main className="p-6 max-w-[1440px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Nest `AppLayout` inside `ProtectedRoute` in the router**

Modify `src/App.jsx`:

```jsx
import AppLayout from './components/layout/AppLayout';
// ...
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<ResumenPage />} />
            </Route>
          </Route>
```

- [ ] **Step 6: Verify in the browser**

With a demo session in `localStorage` (see Task 4's manual check, or wait for Task 7's real login), reload `/` — expect the sidebar (224px, "Cotiza" wordmark, nav items with Resumen highlighted), topbar (company chip, search, user initials), and the amber demo strip, matching `mockup.html`'s layout.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout src/App.jsx
git commit -m "feat(web): add app shell layout — sidebar, topbar, demo strip"
```

---

### Task 7: Login page

**Files:**
- Modify: `src/pages/LoginPage.jsx`

**Interfaces:**
- Consumes: `useAuth().login`, `useAuth().demoLogin` (Task 3).
- Produces: functional login page, two columns per `design-system.md` §9.3, redirects to `/` on success.

- [ ] **Step 1: Implement the page**

`src/pages/LoginPage.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const ROLES_DEMO = [
  { rol: 'ADMIN', label: 'Administrador' },
  { rol: 'GERENTE', label: 'Gerente' },
  { rol: 'VENDEDOR', label: 'Vendedor' },
  { rol: 'CLIENTE', label: 'Cliente' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  async function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('El correo o la contraseña no coinciden. Verifica e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  async function entrarComo(rol) {
    setError('');
    try {
      await demoLogin(rol);
      navigate('/');
    } catch {
      setError('No se pudo iniciar la demo para ese rol. Intenta de nuevo.');
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="flex items-center justify-center p-8">
        <form onSubmit={manejarSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-h1 font-semibold mb-2">Iniciar sesión</h1>

          <div>
            <label className="block text-small text-ink-500 mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-9 border border-line rounded-control px-3 bg-surface focus:outline-none focus:ring-[3px] focus:ring-focus/20 focus:border-focus"
            />
          </div>

          <div>
            <label className="block text-small text-ink-500 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-9 border border-line rounded-control px-3 bg-surface focus:outline-none focus:ring-[3px] focus:ring-focus/20 focus:border-focus"
            />
          </div>

          {error && <p className="text-small text-danger">{error}</p>}

          <Button type="submit" variant="primary" disabled={enviando} className="mt-2 justify-center">
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>

          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-small text-ink-500 mb-2">Entrar como:</p>
            <div className="flex flex-wrap gap-2">
              {ROLES_DEMO.map(({ rol, label }) => (
                <Button key={rol} type="button" variant="secondary" onClick={() => entrarComo(rol)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className="hidden md:flex bg-ink-900 text-white items-center justify-center p-8">
        <div className="max-w-sm">
          <p className="text-h2 font-semibold mb-4">
            Cotizaciones que se aprueban, no que se pierden en un correo.
          </p>
          <p className="font-mono text-small text-white/70">COT-A-0148</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in the browser**

Run `npm run dev` and (with the backend running and seeded, per the backend plan's Task 9) visit `/login`. Click "Vendedor" under "Entrar como" — expect redirect to `/` showing the app shell with the seeded Vendedor's name in the topbar. Log out by clearing `localStorage` and reloading; try the real email/password form with a seeded user's email and password `demo1234` (see backend seed, Task 9) — expect the same successful redirect. Try a wrong password — expect the inline error message, no redirect.

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage.jsx
git commit -m "feat(web): implement login page with quick demo access"
```

---

### Task 8: Formatting utilities

**Files:**
- Create: `src/lib/format.js`
- Test: `src/lib/format.test.js`

**Interfaces:**
- Produces: `formatCurrency(valor) => string` (e.g. `1248.5 -> "$ 1.248,50"`), `formatDate(fechaISOoDate) => string` (e.g. `"14 jul 2026"`).

- [ ] **Step 1: Write the failing test**

`src/lib/format.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './format';

describe('formatCurrency', () => {
  it('formatea con separador de miles y símbolo, estilo es-EC', () => {
    expect(formatCurrency(1248.5)).toBe('$ 1.248,50');
    expect(formatCurrency(0)).toBe('$ 0,00');
    expect(formatCurrency(18400)).toBe('$ 18.400,00');
  });
});

describe('formatDate', () => {
  it('formatea una fecha como "14 jul 2026"', () => {
    expect(formatDate('2026-07-14T00:00:00.000Z')).toBe('14 jul 2026');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/format.test.js`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the utilities**

`src/lib/format.js`:

```js
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatCurrency(valor) {
  const numero = Number(valor);
  const partes = numero.toFixed(2).split('.');
  const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${entero},${partes[1]}`;
}

export function formatDate(fecha) {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/format.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.js src/lib/format.test.js
git commit -m "feat(web): add currency and date formatting utilities (es-EC)"
```

---

### Task 9: Resumen (dashboard) page

**Files:**
- Modify: `src/pages/ResumenPage.jsx`

**Interfaces:**
- Consumes: `GET /dashboard`, `GET /cotizaciones?estado=ENVIADO` (backend plan Tasks 15, 10-11), `formatCurrency`/`formatDate` (Task 8), `EstadoChip` (Task 5).

- [ ] **Step 1: Implement the page**

`src/pages/ResumenPage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import api from '../api/client';
import { formatCurrency, formatDate } from '../lib/format';
import EstadoChip from '../components/EstadoChip';
import Button from '../components/Button';

export default function ResumenPage() {
  const [kpis, setKpis] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then((res) => setKpis(res.data));
    api.get('/cotizaciones').then((res) => setRecientes(res.data.slice(0, 6)));
    api.get('/cotizaciones', { params: { estado: 'ENVIADO' } }).then((res) => setPendientes(res.data.slice(0, 3)));
  }, []);

  if (!kpis) return null;

  return (
    <div>
      <div className="flex items-end gap-4 mb-5">
        <div>
          <h1 className="text-h1 font-semibold">Resumen</h1>
        </div>
        <div className="flex-1" />
        <Button variant="secondary" icon={Download}>Exportar</Button>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/cotizaciones/nueva')}>
          Crear cotización
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ['Borradores', kpis.borradores],
          ['Enviadas', kpis.enviadas],
          ['Aprobadas', kpis.aprobadas],
          ['Monto aprobado', formatCurrency(kpis.montoAprobado)],
        ].map(([label, valor]) => (
          <div key={label} className="bg-surface border border-line rounded-card p-4">
            <div className="text-label uppercase">{label}</div>
            <div className="font-mono tabular text-display font-semibold mt-1.5">{valor}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
        <div className="bg-surface border border-line rounded-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4.5 py-3 border-b border-line">
            <h3 className="text-h3 font-semibold">Cotizaciones recientes</h3>
            <Link to="/cotizaciones" className="ml-auto text-small text-focus hover:underline">Ver todas</Link>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Folio', 'Cliente', 'Estado', 'Vence', 'Total'].map((h) => (
                  <th key={h} className="text-label uppercase text-left px-4.5 py-2.5 border-b border-line-strong whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recientes.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cotizaciones/${c.id}`)}
                  className={`cursor-pointer hover:bg-paper transition-colors duration-[120ms] ${i % 2 === 1 ? 'bg-band' : ''}`}
                >
                  <td className="px-4.5 h-11 font-mono tabular">{c.folio}</td>
                  <td className="px-4.5 font-medium">{c.cliente.nombre}</td>
                  <td className="px-4.5"><EstadoChip estado={c.estado} /></td>
                  <td className="px-4.5 font-mono tabular">{formatDate(c.fechaValidez)}</td>
                  <td className="px-4.5 text-right font-mono tabular">{formatCurrency(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-surface border border-line rounded-card">
          <div className="px-4.5 py-3 border-b border-line">
            <h3 className="text-h3 font-semibold">Pendientes de aprobación</h3>
          </div>
          {pendientes.map((c) => (
            <div key={c.id} className="p-4.5 border-b border-line last:border-b-0">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-small text-ink-500">{c.folio}</span>
                <span className="ml-auto font-mono tabular font-medium">{formatCurrency(c.total)}</span>
              </div>
              <p className="text-small text-ink-500 my-1.5">{c.cliente.nombre}</p>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => navigate(`/cotizaciones/${c.id}`)}>Revisar</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in the browser**

With the backend seeded and running, log in as Admin. `/` should show real KPI numbers matching what `GET /api/dashboard` returns (cross-check with `curl`), a 6-row recent table, and up to 3 pending-approval cards. Clicking a row navigates to `/cotizaciones/:id` (404s until Task 12 — that's expected at this point).

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResumenPage.jsx
git commit -m "feat(web): implement Resumen dashboard page"
```

---

### Task 10: Cotizaciones list page

**Files:**
- Create: `src/features/cotizaciones/CotizacionesListPage.jsx`
- Modify: `src/App.jsx` — add route `/cotizaciones`

**Interfaces:**
- Consumes: `GET /cotizaciones` with query params, `useSearchParams` for URL-persisted filters.

- [ ] **Step 1: Implement the page**

`src/features/cotizaciones/CotizacionesListPage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import api from '../../api/client';
import { formatCurrency, formatDate } from '../../lib/format';
import EstadoChip from '../../components/EstadoChip';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

const ESTADOS = ['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO', 'VENCIDO'];

export default function CotizacionesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  const q = searchParams.get('q') || '';
  const estado = searchParams.get('estado') || '';

  useEffect(() => {
    setCargando(true);
    const params = {};
    if (q) params.q = q;
    if (estado) params.estado = estado;
    api.get('/cotizaciones', { params }).then((res) => {
      setCotizaciones(res.data);
      setCargando(false);
    });
  }, [q, estado]);

  function actualizarFiltro(clave, valor) {
    const next = new URLSearchParams(searchParams);
    if (valor) next.set(clave, valor);
    else next.delete(clave);
    setSearchParams(next);
  }

  return (
    <div>
      <div className="flex items-end gap-4 mb-5">
        <h1 className="text-h1 font-semibold">Cotizaciones</h1>
        <div className="flex-1" />
        <Button variant="primary" icon={Plus} onClick={() => navigate('/cotizaciones/nueva')}>
          Crear cotización
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          placeholder="Buscar por folio"
          value={q}
          onChange={(e) => actualizarFiltro('q', e.target.value)}
          className="h-9 border border-line rounded-control px-3 bg-surface text-small focus:outline-none focus:ring-[3px] focus:ring-focus/20 focus:border-focus"
        />
        <select
          value={estado}
          onChange={(e) => actualizarFiltro('estado', e.target.value)}
          className="h-9 border border-line rounded-control px-2 bg-surface text-small"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-line rounded-card overflow-hidden">
        {!cargando && cotizaciones.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aún no hay cotizaciones"
            subtitle="Crea la primera y quedará en borrador hasta que la envíes."
            actionLabel="Crear cotización"
            onAction={() => navigate('/cotizaciones/nueva')}
          />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Folio', 'Cliente', 'Estado', 'Emitida', 'Vence', 'Total'].map((h) => (
                  <th key={h} className="text-label uppercase text-left px-4.5 py-2.5 border-b border-line-strong whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cotizaciones/${c.id}`)}
                  className={`cursor-pointer hover:bg-paper transition-colors duration-[120ms] ${i % 2 === 1 ? 'bg-band' : ''}`}
                >
                  <td className="px-4.5 h-11 font-mono tabular">{c.folio}</td>
                  <td className="px-4.5 font-medium">{c.cliente.nombre}</td>
                  <td className="px-4.5"><EstadoChip estado={c.estado} /></td>
                  <td className="px-4.5 font-mono tabular">{formatDate(c.fechaEmision)}</td>
                  <td className="px-4.5 font-mono tabular">{formatDate(c.fechaValidez)}</td>
                  <td className="px-4.5 text-right font-mono tabular">{formatCurrency(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the route**

Modify `src/App.jsx`:

```jsx
import CotizacionesListPage from './features/cotizaciones/CotizacionesListPage';
// ...
              <Route path="/cotizaciones" element={<CotizacionesListPage />} />
```

- [ ] **Step 3: Verify in the browser**

Visit `/cotizaciones` — expect all 12 (Empresa A's half of the seed) cotizaciones listed, filterable by estado (dropdown) and folio search (text input), with the filters reflected in the URL (`?estado=APROBADO`) and preserved across a page reload.

- [ ] **Step 4: Commit**

```bash
git add src/features/cotizaciones/CotizacionesListPage.jsx src/App.jsx
git commit -m "feat(web): implement cotizaciones list page with URL-persisted filters"
```

---

### Task 11: Cotización editor — line editor with live totals

**Files:**
- Create: `src/features/cotizaciones/LineasEditor.jsx`
- Create: `src/features/cotizaciones/CotizacionEditorPage.jsx`
- Modify: `src/App.jsx` — add route `/cotizaciones/nueva`

**Interfaces:**
- Consumes: `GET /clientes`, `GET /catalogo`, `POST /cotizaciones` (backend plan Tasks 13, 14, 10).
- Produces: `<LineasEditor lineas setLineas catalogo />` — a controlled list of line rows with an always-available empty trailing row, live per-line and grand totals (client-side preview only — the server recomputes and is authoritative on save).

- [ ] **Step 1: Implement `LineasEditor`**

`src/features/cotizaciones/LineasEditor.jsx`:

```jsx
import { X } from 'lucide-react';
import { formatCurrency } from '../../lib/format';

function calcularSubtotalLinea({ cantidad, precioUnitario, descuentoPct }) {
  const bruto = (cantidad || 0) * (precioUnitario || 0);
  return bruto - bruto * ((descuentoPct || 0) / 100);
}

export default function LineasEditor({ lineas, setLineas, catalogo, ivaPct = 15 }) {
  function actualizarLinea(index, campo, valor) {
    const next = [...lineas];
    next[index] = { ...next[index], [campo]: valor };
    setLineas(next);
  }

  function seleccionarCatalogo(index, catalogoItemId) {
    const item = catalogo.find((c) => c.id === catalogoItemId);
    const next = [...lineas];
    next[index] = {
      ...next[index],
      catalogoItemId,
      descripcion: item ? item.nombre : next[index].descripcion,
      precioUnitario: item ? Number(item.precioUnitario) : next[index].precioUnitario,
    };
    setLineas(next);
  }

  function eliminarLinea(index) {
    setLineas(lineas.filter((_, i) => i !== index));
  }

  function agregarFilaVacia() {
    setLineas([...lineas, { descripcion: '', cantidad: 1, precioUnitario: 0, descuentoPct: 0 }]);
  }

  const subtotal = lineas.reduce((acc, l) => acc + calcularSubtotalLinea(l), 0);
  const iva = subtotal * (ivaPct / 100);
  const total = subtotal + iva;

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['Producto', 'Cant.', 'Precio', 'Desc. %', 'Subtotal', ''].map((h) => (
              <th key={h} className="text-label uppercase text-left px-2 py-2 border-b border-line-strong">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea, i) => (
            <tr key={i} className="group">
              <td className="px-2 py-1.5">
                <select
                  value={linea.catalogoItemId || ''}
                  onChange={(e) => seleccionarCatalogo(i, e.target.value)}
                  className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small"
                >
                  <option value="">Ítem libre — escribe la descripción</option>
                  {catalogo.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                {!linea.catalogoItemId && (
                  <input
                    placeholder="Descripción"
                    value={linea.descripcion}
                    onChange={(e) => actualizarLinea(i, 'descripcion', e.target.value)}
                    className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small mt-1"
                  />
                )}
              </td>
              <td className="px-2 py-1.5 w-24">
                <input
                  type="number"
                  min="0"
                  value={linea.cantidad}
                  onChange={(e) => actualizarLinea(i, 'cantidad', Number(e.target.value))}
                  className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small font-mono tabular text-right"
                />
              </td>
              <td className="px-2 py-1.5 w-28">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={linea.precioUnitario}
                  onChange={(e) => actualizarLinea(i, 'precioUnitario', Number(e.target.value))}
                  className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small font-mono tabular text-right"
                />
              </td>
              <td className="px-2 py-1.5 w-20">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={linea.descuentoPct}
                  onChange={(e) => actualizarLinea(i, 'descuentoPct', Number(e.target.value))}
                  className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small font-mono tabular text-right"
                />
              </td>
              <td className="px-2 py-1.5 text-right font-mono tabular">{formatCurrency(calcularSubtotalLinea(linea))}</td>
              <td className="px-2 py-1.5 w-8">
                <button
                  onClick={() => eliminarLinea(i)}
                  className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-danger transition-opacity"
                  aria-label="Eliminar línea"
                >
                  <X size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={agregarFilaVacia} className="text-small text-focus hover:underline mt-2">
        + Agregar línea
      </button>

      <div className="mt-4.5 border-t-2 border-ink-900 pt-2.5 flex flex-col items-end gap-1 text-small">
        <div className="flex gap-4"><span className="text-ink-500">Subtotal</span><span className="font-mono tabular w-28 text-right">{formatCurrency(subtotal)}</span></div>
        <div className="flex gap-4"><span className="text-ink-500">IVA {ivaPct}%</span><span className="font-mono tabular w-28 text-right">{formatCurrency(iva)}</span></div>
        <div className="flex gap-4 text-h3 font-semibold"><span>Total</span><span className="font-mono tabular w-28 text-right">{formatCurrency(total)}</span></div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `CotizacionEditorPage`**

`src/features/cotizaciones/CotizacionEditorPage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import LineasEditor from './LineasEditor';

export default function CotizacionEditorPage() {
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [fechaValidez, setFechaValidez] = useState('');
  const [lineas, setLineas] = useState([{ descripcion: '', cantidad: 1, precioUnitario: 0, descuentoPct: 0 }]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { mostrar } = useToast();

  useEffect(() => {
    api.get('/clientes').then((res) => setClientes(res.data));
    api.get('/catalogo').then((res) => setCatalogo(res.data));
    const enQuinceDias = new Date();
    enQuinceDias.setDate(enQuinceDias.getDate() + 15);
    setFechaValidez(enQuinceDias.toISOString().slice(0, 10));
  }, []);

  async function guardar() {
    setError('');
    const lineasValidas = lineas.filter((l) => l.descripcion && l.cantidad > 0);
    if (!clienteId || lineasValidas.length === 0) {
      setError('Selecciona un cliente y agrega al menos una línea con descripción y cantidad.');
      return;
    }
    setGuardando(true);
    try {
      const { data } = await api.post('/cotizaciones', {
        clienteId,
        fechaValidez: new Date(fechaValidez).toISOString(),
        lineas: lineasValidas,
      });
      mostrar('Cotización guardada como borrador.');
      navigate(`/cotizaciones/${data.id}`);
    } catch {
      setError('No se pudo guardar la cotización. Revisa los datos e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="flex items-end gap-4 mb-5">
        <h1 className="text-h1 font-semibold">Nueva cotización</h1>
        <div className="flex-1" />
        <Button variant="primary" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar borrador'}
        </Button>
      </div>

      <div className="bg-surface border border-line rounded-card p-5 mb-4 flex gap-4">
        <div className="flex-1">
          <label className="block text-small text-ink-500 mb-1">Cliente</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small"
          >
            <option value="">Selecciona un cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="w-52">
          <label className="block text-small text-ink-500 mb-1">Vence</label>
          <input
            type="date"
            value={fechaValidez}
            onChange={(e) => setFechaValidez(e.target.value)}
            className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small"
          />
        </div>
      </div>

      {error && <p className="text-small text-danger mb-3">{error}</p>}

      <div className="bg-surface border border-line rounded-card p-5">
        <LineasEditor lineas={lineas} setLineas={setLineas} catalogo={catalogo} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the route**

Modify `src/App.jsx`:

```jsx
import CotizacionEditorPage from './features/cotizaciones/CotizacionEditorPage';
// ...
              <Route path="/cotizaciones/nueva" element={<CotizacionEditorPage />} />
```

- [ ] **Step 4: Verify in the browser**

Visit `/cotizaciones/nueva`. Select a client and a catalog item from the dropdown — price autofills. Change quantity/discount — the row subtotal and the totals panel recalculate immediately, no "calculate" button. Click "+ Agregar línea" — a new empty row appears. Save — expect a toast and redirect to the new cotización's detail page (which 404s until Task 12 — expected at this point). Check the created row in `npx prisma studio` (backend) to confirm the server-computed totals match what the editor previewed.

- [ ] **Step 5: Commit**

```bash
git add src/features/cotizaciones/LineasEditor.jsx src/features/cotizaciones/CotizacionEditorPage.jsx src/App.jsx
git commit -m "feat(web): implement cotización editor with live line totals"
```

---

### Task 12: Cotización detail page — document, stamp, history, actions

**Files:**
- Create: `src/features/cotizaciones/CotizacionDetallePage.jsx`
- Modify: `src/App.jsx` — add route `/cotizaciones/:id`

**Interfaces:**
- Consumes: `GET /cotizaciones/:id`, `POST /cotizaciones/:id/{enviar,aprobar,rechazar,duplicar}`, `GET /cotizaciones/:id/pdf` (backend plan Tasks 10-11, 16), `useAuth()` for role-based action visibility.

- [ ] **Step 1: Implement the page**

`src/features/cotizaciones/CotizacionDetallePage.jsx`:

```jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Send, Copy } from 'lucide-react';
import api, { leerSesion } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { formatCurrency, formatDate } from '../../lib/format';
import Button from '../../components/Button';

const ETIQUETA_EVENTO = {
  CREADA: 'Creada', ENVIADA: 'Enviada', APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada', DEVUELTA: 'Devuelta', VENCIDA: 'Vencida',
};

export default function CotizacionDetallePage() {
  const { id } = useParams();
  const [cotizacion, setCotizacion] = useState(null);
  const [actuando, setActuando] = useState(false);
  const { usuario } = useAuth();
  const { mostrar } = useToast();
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    api.get(`/cotizaciones/${id}`).then((res) => setCotizacion(res.data));
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function ejecutarAccion(accion, mensajeExito) {
    setActuando(true);
    try {
      await api.post(`/cotizaciones/${id}/${accion}`);
      mostrar(mensajeExito);
      cargar();
    } catch (err) {
      mostrar(err.response?.data?.error?.message || 'No se pudo completar la acción.');
    } finally {
      setActuando(false);
    }
  }

  async function duplicar() {
    setActuando(true);
    try {
      const { data } = await api.post(`/cotizaciones/${id}/duplicar`);
      mostrar('Cotización duplicada como nuevo borrador.');
      navigate(`/cotizaciones/${data.id}`);
    } catch {
      mostrar('No se pudo duplicar la cotización.');
    } finally {
      setActuando(false);
    }
  }

  function descargarPdf() {
    const { token } = leerSesion();
    fetch(`${import.meta.env.VITE_API_URL}/cotizaciones/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      });
  }

  if (!cotizacion) return null;

  const puedeEnviar = cotizacion.estado === 'BORRADOR' && ['ADMIN', 'GERENTE', 'VENDEDOR'].includes(usuario.rol);
  const puedeAprobarRechazar = cotizacion.estado === 'ENVIADO' && ['ADMIN', 'GERENTE'].includes(usuario.rol);
  const puedeDuplicar = ['APROBADO', 'RECHAZADO', 'VENCIDO'].includes(cotizacion.estado) && ['ADMIN', 'GERENTE', 'VENDEDOR'].includes(usuario.rol);
  const sello = cotizacion.estado === 'APROBADO' || cotizacion.estado === 'RECHAZADO' ? cotizacion.estado : null;
  const colorSello = cotizacion.estado === 'APROBADO' ? 'text-st-approved border-st-approved' : 'text-st-rejected border-st-rejected';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
      <div className="bg-surface border border-line rounded-card p-5.5 relative overflow-hidden">
        {sello && (
          <div className={`absolute top-6 right-5 border-2 rounded-chip px-3.5 py-1.5 text-center -rotate-[4deg] opacity-85 ${colorSello}`}>
            <b className="block font-mono text-small font-semibold tracking-[0.18em]">{sello}</b>
            <span className="block font-mono text-[11px] mt-0.5">{formatDate(cotizacion.updatedAt)}</span>
          </div>
        )}
        <h4 className="font-serif font-semibold text-[17px]">{cotizacion.empresa?.nombre}</h4>
        <div className="font-mono text-label text-ink-500 mt-1">{cotizacion.folio} · emitida {formatDate(cotizacion.fechaEmision)}</div>
        <p className="text-small text-ink-500 mt-3">{cotizacion.cliente.nombre} — RUC {cotizacion.cliente.ruc}</p>

        <table className="w-full border-collapse mt-4">
          <thead>
            <tr>
              {['Descripción', 'Cant.', 'Precio', 'Subtotal'].map((h) => (
                <th key={h} className="text-label uppercase text-left px-2 py-2 border-b border-line-strong">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cotizacion.lineas.map((l, i) => (
              <tr key={l.id} className={i % 2 === 1 ? 'bg-band' : ''}>
                <td className="px-2 h-11">{l.descripcion}</td>
                <td className="px-2 font-mono tabular">{l.cantidad}</td>
                <td className="px-2 font-mono tabular text-right">{formatCurrency(l.precioUnitario)}</td>
                <td className="px-2 font-mono tabular text-right">{formatCurrency(l.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4.5 border-t-2 border-ink-900 pt-2.5 flex justify-end gap-5 items-baseline">
          <span className="text-label uppercase">Total con IVA</span>
          <b className="font-mono tabular text-[16px]">{formatCurrency(cotizacion.total)}</b>
        </div>

        <div className="mt-4 border-t border-line pt-3 grid gap-1.5 text-small">
          {cotizacion.eventos.map((e) => (
            <div key={e.id} className="flex gap-3 text-ink-500">
              <b className="w-20 font-medium text-ink-700">{ETIQUETA_EVENTO[e.tipo]}</b>
              <span className="font-mono text-[12px]">{formatDate(e.createdAt)}</span>
              {e.actor.nombre}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-card p-4.5 flex flex-col gap-2">
        {puedeEnviar && (
          <Button variant="primary" icon={Send} disabled={actuando} onClick={() => ejecutarAccion('enviar', 'Cotización enviada.')}>
            Enviar a aprobación
          </Button>
        )}
        {puedeAprobarRechazar && (
          <>
            <Button variant="primary" disabled={actuando} onClick={() => ejecutarAccion('aprobar', 'Cotización aprobada.')}>Aprobar</Button>
            <Button variant="secondary" disabled={actuando} onClick={() => ejecutarAccion('rechazar', 'Cotización rechazada.')}>Rechazar</Button>
          </>
        )}
        {puedeDuplicar && (
          <Button variant="secondary" icon={Copy} disabled={actuando} onClick={duplicar}>Duplicar</Button>
        )}
        <Button variant="secondary" icon={Download} onClick={descargarPdf}>Descargar PDF</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the route**

Modify `src/App.jsx`:

```jsx
import CotizacionDetallePage from './features/cotizaciones/CotizacionDetallePage';
// ...
              <Route path="/cotizaciones/:id" element={<CotizacionDetallePage />} />
```

- [ ] **Step 3: Verify in the browser**

Open a `BORRADOR` cotización as Vendedor — only "Enviar a aprobación" and "Descargar PDF" show. Click "Enviar" — toast confirms, estado becomes `ENVIADO`, action buttons update. Log in as Gerente (or switch role via a fresh demo-login), open the same cotización — "Aprobar"/"Rechazar" show. Approve it — the stamp appears rotated in the top-right corner with the right color, the history list gains an "Aprobada" row with the Gerente's name, and "Duplicar" now shows. Click "Descargar PDF" — a new tab opens a valid PDF.

- [ ] **Step 4: Commit**

```bash
git add src/features/cotizaciones/CotizacionDetallePage.jsx src/App.jsx
git commit -m "feat(web): implement cotización detail page with stamp, history and actions"
```

---

### Task 13: Aprobaciones bandeja page

**Files:**
- Create: `src/features/aprobaciones/AprobacionesPage.jsx`
- Modify: `src/App.jsx` — add route `/aprobaciones`, wrapped in `RoleRoute`

**Interfaces:**
- Consumes: `GET /cotizaciones?estado=ENVIADO`, `POST /cotizaciones/:id/{aprobar,rechazar}`.

- [ ] **Step 1: Implement the page**

`src/features/aprobaciones/AprobacionesPage.jsx`:

```jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/Toast';
import { formatCurrency } from '../../lib/format';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

export default function AprobacionesPage() {
  const [pendientes, setPendientes] = useState([]);
  const [actuandoId, setActuandoId] = useState(null);
  const { mostrar } = useToast();
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    api.get('/cotizaciones', { params: { estado: 'ENVIADO' } }).then((res) => setPendientes(res.data));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function resolver(id, accion, mensajeExito) {
    setActuandoId(id);
    try {
      await api.post(`/cotizaciones/${id}/${accion}`);
      mostrar(mensajeExito);
      cargar();
    } catch {
      mostrar('No se pudo completar la acción.');
    } finally {
      setActuandoId(null);
    }
  }

  return (
    <div>
      <h1 className="text-h1 font-semibold mb-5">Aprobaciones</h1>

      {pendientes.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No hay cotizaciones pendientes" subtitle="Todo lo enviado ya fue aprobado o rechazado." />
      ) : (
        <div className="bg-surface border border-line rounded-card divide-y divide-line">
          {pendientes.map((c) => (
            <div key={c.id} className="p-4.5">
              <div className="flex items-baseline gap-2 cursor-pointer" onClick={() => navigate(`/cotizaciones/${c.id}`)}>
                <span className="font-mono text-small text-ink-500">{c.folio}</span>
                <span className="ml-auto font-mono tabular font-medium">{formatCurrency(c.total)}</span>
              </div>
              <p className="text-small text-ink-500 my-1.5">{c.cliente.nombre}</p>
              <div className="flex gap-2">
                <Button variant="primary" disabled={actuandoId === c.id} onClick={() => resolver(c.id, 'aprobar', 'Cotización aprobada.')}>
                  Aprobar
                </Button>
                <Button variant="secondary" disabled={actuandoId === c.id} onClick={() => resolver(c.id, 'rechazar', 'Cotización rechazada.')}>
                  Rechazar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add the route, restricted to Admin/Gerente**

Modify `src/App.jsx`:

```jsx
import RoleRoute from './components/RoleRoute';
import AprobacionesPage from './features/aprobaciones/AprobacionesPage';
// ...
              <Route element={<RoleRoute roles={['ADMIN', 'GERENTE']} />}>
                <Route path="/aprobaciones" element={<AprobacionesPage />} />
              </Route>
```

- [ ] **Step 3: Verify in the browser**

As Gerente, visit `/aprobaciones` — expect the `ENVIADO` cotizaciones (3+ per the seed). Approve one — it disappears from the list and a toast confirms. As Vendedor, visiting `/aprobaciones` directly should redirect to `/` (per `RoleRoute`).

- [ ] **Step 4: Commit**

```bash
git add src/features/aprobaciones/AprobacionesPage.jsx src/App.jsx
git commit -m "feat(web): implement aprobaciones bandeja page"
```

---

### Task 14: Multi-tenant company switch

**Files:**
- Modify: `src/components/layout/Topbar.jsx`
- Modify: `src/modules/auth/service.js` on the **backend** (`server/`) — extend `me()`'s response with `empresa.nombre`

**Interfaces:**
- Consumes: `useAuth().switchEmpresa` (Task 3, already implemented), `GET /empresas` (new minimal backend addition — list just `{ id, nombre }` for the two demo companies, ADMIN only).

- [ ] **Step 1: Add a minimal companies-list endpoint on the backend**

This wasn't in the original backend plan because the switcher UI didn't exist yet. Modify `server/src/modules/auth/service.js` — add:

```js
async function listarEmpresas() {
  return prisma.empresa.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } });
}
```

Update its `module.exports` to include `listarEmpresas`.

Modify `server/src/modules/auth/controller.js` — add:

```js
async function listarEmpresas(req, res, next) {
  try {
    res.json(await service.listarEmpresas());
  } catch (err) {
    next(err);
  }
}
```

Update its `module.exports` to include `listarEmpresas`.

Modify `server/src/modules/auth/routes.js` — add before `module.exports`:

```js
router.get('/empresas', requireAuth, requireRole('ADMIN'), controller.listarEmpresas);
```

Also modify `serializarUsuario` in `server/src/modules/auth/service.js` to include the company name, so the frontend Topbar can display it without a second request:

```js
function serializarUsuario(usuario, empresa) {
  return { id: usuario.id, empresaId: usuario.empresaId, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, clienteId: usuario.clienteId, nombreEmpresa: empresa?.nombre };
}
```

This changes the call sites in `login`, `demoLogin`, and `me` to fetch and pass the `empresa` — update each:

```js
async function login({ email, password }) {
  const usuario = await prisma.usuario.findUnique({ where: { email }, include: { empresa: true } });
  if (!usuario) return null;
  const valido = await verifyPassword(password, usuario.passwordHash);
  if (!valido) return null;
  const token = firmarToken({ sub: usuario.id, empresaId: usuario.empresaId, rol: usuario.rol });
  return { token, usuario: serializarUsuario(usuario, usuario.empresa) };
}

async function demoLogin({ rol }) {
  const usuario = await prisma.usuario.findFirst({
    where: { rol, empresa: { prefijoFolio: 'COT-A' } },
    orderBy: { createdAt: 'asc' },
    include: { empresa: true },
  });
  if (!usuario) return null;
  const token = firmarToken({ sub: usuario.id, empresaId: usuario.empresaId, rol: usuario.rol });
  return { token, usuario: serializarUsuario(usuario, usuario.empresa) };
}

async function me({ id }) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, include: { empresa: true } });
  if (!usuario) return null;
  return serializarUsuario(usuario, usuario.empresa);
}
```

- [ ] **Step 2: Run the existing backend auth tests to confirm no regression**

Run: `cd server && npx vitest run src/modules/auth/auth.test.js`
Expected: PASS — the existing assertions (`res.body.usuario.rol`, `me.body.email`) still hold since `serializarUsuario` only gained a field.

- [ ] **Step 3: Commit the backend addition**

```bash
git add server/src/modules/auth
git commit -m "feat(server): add empresas list endpoint and include company name in serialized usuario"
```

- [ ] **Step 4: Implement the switcher UI**

Modify `src/components/layout/Topbar.jsx` — replace the static company chip with an interactive one, visible only for Admin:

```jsx
import { useEffect, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function iniciales(nombre) {
  return nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Topbar() {
  const { usuario, switchEmpresa } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (usuario?.rol === 'ADMIN') {
      api.get('/auth/empresas').then((res) => setEmpresas(res.data));
    }
  }, [usuario?.rol]);

  async function elegir(empresaId) {
    setAbierto(false);
    await switchEmpresa(empresaId);
    window.location.reload();
  }

  return (
    <header className="h-[52px] border-b border-line bg-surface flex items-center gap-4 px-6 relative">
      <div className="relative">
        <button
          onClick={() => usuario?.rol === 'ADMIN' && setAbierto((v) => !v)}
          className={`flex items-center gap-2 px-2.5 py-1 border border-line-strong rounded-control font-medium text-small ${usuario?.rol === 'ADMIN' ? 'cursor-pointer hover:border-ink-400' : ''}`}
        >
          <span className="w-[18px] h-[18px] rounded-chip bg-ink-900 text-white text-[10px] font-semibold grid place-items-center">
            {usuario?.nombreEmpresa?.[0] || 'E'}
          </span>
          {usuario?.nombreEmpresa || 'Empresa'}
          {usuario?.rol === 'ADMIN' && <ChevronDown size={14} />}
        </button>
        {abierto && (
          <div className="absolute top-full left-0 mt-1 bg-surface border border-line rounded-control shadow-[var(--shadow-popover)] min-w-[200px] z-10">
            {empresas.map((e) => (
              <button
                key={e.id}
                onClick={() => elegir(e.id)}
                className="w-full text-left px-3 py-2 text-small hover:bg-paper"
              >
                {e.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 px-2.5 py-1 border border-line rounded-control text-ink-400 text-small min-w-[200px]">
        <Search size={14} />
        Buscar
        <kbd className="ml-auto font-mono text-[11px] border border-line rounded-[3px] px-1 text-ink-500">⌘K</kbd>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-[26px] h-[26px] rounded-full bg-ink-900 text-white grid place-items-center text-[11px] font-semibold">
          {usuario ? iniciales(usuario.nombre) : ''}
        </span>
        <small className="text-ink-500 text-small">
          {usuario?.nombre} · {usuario?.rol && usuario.rol.charAt(0) + usuario.rol.slice(1).toLowerCase()}
        </small>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Verify in the browser**

Log in as Admin — the company chip shows a chevron and opens a dropdown with "Constructora Andes Cía. Ltda." and "Consultora Delta TI". Selecting the other company reloads the app; Resumen/Cotizaciones now show that company's data exclusively (cross-check folio prefixes: `COT-A-*` vs `COT-B-*`). Log in as any non-Admin role — the chip shows the company name with no chevron and isn't clickable.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Topbar.jsx
git commit -m "feat(web): wire multi-tenant company switcher into Topbar for Admin"
```

---

### Task 15: Deployment to Vercel

**Files:**
- Create: `vercel.json` (only if the default Vite preset needs overriding — verify before adding)

**Interfaces:** none — infrastructure/config only.

- [ ] **Step 1: Set the production API URL**

In the Vercel dashboard (after importing the repo), set the environment variable `VITE_API_URL` to the deployed Render backend's URL plus `/api` (e.g. `https://cotiza-backend.onrender.com/api`) — this must match the backend plan's Task 19 deployment.

- [ ] **Step 2: Deploy**

Import the repo into Vercel with framework preset "Vite", root directory = repo root (frontend lives at the root per this plan's file structure, not in a subfolder). Trigger a deploy.

- [ ] **Step 3: Update the backend's CORS origin**

Back on Render (backend plan Task 19), set `FRONTEND_URL` to the real Vercel URL (e.g. `https://cotiza.vercel.app`) — **not** `localhost`. This is the exact failure mode documented in the backend plan's Global Constraints and spec §13: if skipped, the deployed frontend will get silent CORS failures on every request even though the backend's health check still returns `200`.

- [ ] **Step 4: Verify the production deployment end-to-end**

Open the Vercel URL in a real browser (not curl — CORS only manifests for actual browser-origin requests). Log in via a demo quick-access button, confirm the Resumen page loads real data, create a cotización, send it, approve it as Gerente, download its PDF, and switch companies as Admin. Open the browser devtools Network tab while doing this — confirm no CORS errors and no failed requests.

- [ ] **Step 5: Commit** (only if `vercel.json` was needed)

```bash
git add vercel.json
git commit -m "chore(web): add Vercel deployment configuration"
```

---

## Self-Review Notes

- **Spec coverage:** every MVP-core screen from spec §2 has a task — login (Task 7), Resumen (Task 9), Cotizaciones lista/editor/detalle (Tasks 10–12), Aprobaciones (Task 13), multi-tenant switch (Task 14), PDF (wired into Task 12). Clientes/Catálogo/Ajustes admin screens are correctly absent — they're explicitly deferred per spec §2 and §14; the editor (Task 11) only *reads* clientes/catálogo via the endpoints the backend plan already exposes, which is consistent with that deferral.
- **Placeholder scan:** no "TBD"/"implement later"; every step ships real, complete code. The one forward-reference (Topbar's `nombreEmpresa` in Task 6 before Task 14 adds it) is explicitly flagged as intentional incremental wiring, not a gap, and Task 14 closes it.
- **Type/signature consistency:** `useAuth()`'s returned shape (`usuario, cargando, login, demoLogin, logout, switchEmpresa`) defined in Task 3 is used identically by Tasks 4, 7, 12, 14. `EstadoChip`/`Button`/`EmptyState` prop names defined in Task 5 match every call site in Tasks 9, 10, 12, 13. Route paths (`/cotizaciones`, `/cotizaciones/nueva`, `/cotizaciones/:id`, `/aprobaciones`) are consistent between where each page is created and where `App.jsx` mounts it.
- **Cross-plan consistency:** confirmed against the backend plan that every endpoint this plan calls exists there — `/auth/{login,demo-login,me,switch-empresa}` (Task 12), `/dashboard` (Task 15), `/cotizaciones` CRUD+actions (Tasks 10–11), `/clientes`, `/catalogo` (Tasks 13–14), `/cotizaciones/:id/pdf` (Task 16), `/demo/reset` (Task 17) — except `GET /auth/empresas`, which didn't exist yet because the switcher UI hadn't been designed when the backend plan was written; **fixed during self-review** by adding it as Task 14's Step 1, with its own backend commit, rather than silently assuming it existed.
