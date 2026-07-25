# Cotiza — Sistema de diseño

> Documento de referencia persistente. Toda decisión visual del proyecto se deriva de aquí.
> Los prompts de implementación **no** deben repetir estas reglas: deben citar este archivo.
>
> Versión 1.0 · Fase 1 (Definición y diseño) · Julio 2026

---

## 0. Cómo usar este documento

- Vive en la raíz del repo como `design-system.md`.
- En Claude Code, se carga como contexto persistente (`/context` o referencia explícita en `CLAUDE.md`).
- Cualquier cambio de token se hace **aquí primero**, luego en `tokens.css`. Nunca al revés.
- Si un componente necesita un valor que no está en este documento, no se inventa: se agrega aquí con justificación.

---

## 1. Concepto

**"Papel contable."**

Cotiza es, en el fondo, una máquina de producir documentos formales. La identidad visual sale del mundo del propio documento: el papel contable de banda verde, el folio numerado, la columna de importes alineada a la derecha, el sello de aprobación.

Esto no es decoración: es la razón por la que cada decisión existe.

| Elemento del mundo real | Traducción a la interfaz |
|---|---|
| Papel contable de banda verde | Filas alternas de tabla en verde pálido, no gris |
| Folio / número de documento | Identificadores en monoespaciada (`COT-2026-0148`) |
| Columna de importes | Cifras tabulares alineadas a la derecha, siempre |
| Sello de goma | Marca de aprobación/rechazo rotada, en detalle y PDF |
| Reglas impresas | Hairlines de 1px en vez de sombras |

### Los tres elementos de firma

1. **Banda contable.** Filas alternas en `--band`. Aparece en cada tabla del producto, que es donde más tiempo mira el usuario.
2. **El sello.** Al aprobar o rechazar, la vista de detalle y el PDF reciben un sello tipográfico rotado −4°, con actor y fecha. Es el momento memorable del flujo.
3. **Color que solo comunica.** Los botones primarios son tinta casi negra. El color aparece únicamente para señalar estado. Nunca hay color decorativo.

---

## 2. Anti-patrones (prohibidos en este proyecto)

Esta lista es vinculante. Si un componente cae en alguno, se rechaza en revisión.

- Gradientes de cualquier tipo. Ninguno. Ni sutiles.
- Glassmorphism, `backdrop-filter`, blur decorativo.
- Paleta `slate` de Tailwind por defecto (`#0F172A` + `#3B82F6`).
- Inter, Roboto, Poppins, Montserrat.
- Sombras grandes y difusas en tarjetas. Elevación = borde, no sombra.
- Emojis como iconos.
- Pills de estado saturadas y multicolores tipo semáforo.
- Border-radius mayor a 8px (nada de `rounded-2xl`).
- Animaciones de scroll, parallax, contadores animados.
- Iconos decorativos que no comunican una acción.
- Texto centrado en bloques de datos.
- Skeleton con shimmer animado que recorre la pantalla.

---

## 3. Color

### 3.1 Escala neutral

El neutral tiene un sesgo verde mínimo (H≈150, S≈8%). No es gris frío ni cálido: es el gris del papel de oficina.

| Token | Hex | Uso |
|---|---|---|
| `--paper` | `#EFF2ED` | Fondo de aplicación |
| `--surface` | `#FFFFFF` | Tarjetas, tablas, modales |
| `--band` | `#F4F7F1` | Fila alterna de tabla (banda contable) |
| `--line` | `#DCE2D9` | Hairline por defecto |
| `--line-strong` | `#C3CCBF` | Divisor enfatizado, borde en hover |
| `--ink-400` | `#8A9791` | Placeholder, texto deshabilitado |
| `--ink-500` | `#5C6B64` | Texto secundario, labels |
| `--ink-700` | `#2C3A34` | Texto de énfasis medio |
| `--ink-900` | `#14201B` | Texto principal, botón primario |

Contraste verificado: `--ink-500` sobre `--surface` = 5.9:1. `--ink-400` sobre `--surface` = 3.2:1 (solo placeholder, nunca texto informativo).

### 3.2 Estados de cotización

Cinco hues, todos desaturados. Cada uno se acompaña **siempre** de etiqueta de texto: el color nunca es el único portador de significado.

| Estado | Punto/Texto | Tinte de fondo | Regla |
|---|---|---|---|
| Borrador | `#6E7A74` | `#F0F2F0` | Gris tinta — aún no existe para nadie más |
| Enviado | `#2F5D8C` | `#E8EFF6` | Azul acero — informativo, en espera |
| Aprobado | `#1F6B4E` | `#E6F0EA` | Verde profundo — terminal positivo |
| Rechazado | `#A33A28` | `#F7EAE7` | Rojo óxido — terminal negativo |
| Vencido | `#8A6212` | `#F6EFE1` | Ámbar apagado — expiró sin decisión |

### 3.3 Funcionales

| Token | Hex | Uso |
|---|---|---|
| `--focus` | `#2F5D8C` | Anillo de foco, enlaces |
| `--danger` | `#A33A28` | Acciones destructivas |
| `--success` | `#1F6B4E` | Confirmación |
| `--stamp-approve` | `#1F6B4E` | Sello de aprobación |
| `--stamp-reject` | `#A33A28` | Sello de rechazo |

### 3.4 Reglas de aplicación

- Botón primario: fondo `--ink-900`, texto blanco. **Uno solo por vista.**
- Botón secundario: fondo transparente, borde `--line-strong`, texto `--ink-900`.
- Botón terciario/ghost: sin borde, hover con fondo `--paper`.
- Botón destructivo: texto `--danger`, borde `--danger` al 30%. Fondo sólido rojo solo dentro del diálogo de confirmación.
- Nunca usar `--success` como color de acción. Verde = estado aprobado, exclusivamente.

### 3.5 Modo oscuro

**Fuera de alcance para la demo.** Decisión consciente: un modo oscuro a medias se ve peor que no tenerlo, y el producto se demuestra en pantalla clara. Los tokens ya están estructurados para admitirlo después sin refactor.

---

## 4. Tipografía

### 4.1 Familias

```
UI y prosa     IBM Plex Sans      400, 500, 600
Datos y folios IBM Plex Mono      400, 500  (font-variant-numeric: tabular-nums)
PDF (solo)     IBM Plex Serif     400, 600  — encabezado del documento
```

Por qué Plex: diseñada como tipografía de ingeniería corporativa, tiene carácter propio en terminales y en la `a` de doble piso, soporte impecable de acentos y `ñ`, y las tres variantes comparten métricas. Cohesión con justificación, no capricho.

Fallback: `'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif`.

### 4.2 Escala

Densidad alta (dashboard). Raíz 16px, UI a 14px — estándar en tablas densas de producto.

| Rol | Tamaño / interlínea | Peso | Uso |
|---|---|---|---|
| `display` | 28 / 34 | 600 | Cifra de KPI |
| `h1` | 22 / 28 | 600 | Título de página |
| `h2` | 18 / 24 | 600 | Sección, título de modal |
| `h3` | 15 / 20 | 600 | Encabezado de tarjeta |
| `body` | 14 / 20 | 400 | Texto de interfaz |
| `body-strong` | 14 / 20 | 500 | Énfasis en línea |
| `small` | 13 / 18 | 400 | Metadatos, ayuda |
| `label` | 12 / 16 | 500 | Mayúsculas, `letter-spacing: 0.06em` |
| `mono-data` | 13 / 18 | 400 | Importes, folios, RUC, fechas |
| `mono-amount` | 14 / 20 | 500 | Total de cotización |

Nada por debajo de 12px. Los 12px se reservan a `label` en mayúsculas, que es más legible a ese tamaño.

### 4.3 Reglas

- Todo número que se compara verticalmente va en `IBM Plex Mono` con `tabular-nums`, alineado a la derecha.
- Sentence case en toda la interfaz. Nunca Title Case. Mayúsculas solo en `label` y en el sello.
- Los importes siempre llevan símbolo y separador de miles: `$ 1.248,50`. Formato `es-EC`.
- El folio nunca se trunca ni se envuelve.

---

## 5. Espaciado, forma y elevación

### 5.1 Escala (base 4)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

Densidad de dashboard: padding interno de celda 10px vertical / 14px horizontal. Padding de tarjeta 16-20px. Gutter de grilla 16px.

### 5.2 Radios

| Elemento | Radio |
|---|---|
| Input, botón, select | 6px |
| Tarjeta, modal, drawer | 8px |
| Chip de estado | 4px |
| Tabla y sus celdas | 0 |
| Avatar | 50% |

### 5.3 Elevación

Regla: **elevación = borde, no sombra.** Tarjetas y paneles en flujo usan `1px solid var(--line)` y cero sombra.

Solo los elementos flotantes llevan sombra:

```css
--shadow-popover: 0 1px 2px rgba(20,32,27,.05), 0 8px 24px rgba(20,32,27,.10);
--shadow-modal:   0 2px 4px rgba(20,32,27,.06), 0 16px 48px rgba(20,32,27,.14);
```

Máximo dos capas flotantes simultáneas. Una tercera significa que hacía falta una página, no un popover.

---

## 6. Iconografía

- **Lucide React**, exclusivamente. Sin mezclar sets.
- Trazo 1.5px. Tamaños: 16px en línea y botones, 20px en navegación, 24px máximo en estados vacíos.
- Heredan `currentColor`. Nunca se colorean por decoración.
- Icono solo (sin texto) requiere `aria-label` y tooltip.
- Iconos asignados: `FileText` cotizaciones · `Users` clientes · `Package` catálogo · `CheckSquare` aprobaciones · `LayoutDashboard` resumen · `Settings` ajustes · `Building2` empresa · `Download` PDF · `Send` enviar · `Stamp` aprobar.

---

## 7. Movimiento

Sobrio y funcional. El movimiento confirma una acción; nunca la anuncia.

```css
--dur-fast: 120ms;   /* salidas, hover */
--dur-base: 160ms;   /* entradas, cambios de estado */
--dur-slow: 220ms;   /* drawer, modal */
--ease: cubic-bezier(.2, .8, .3, 1);
```

- Hover y foco: 120ms sobre `background-color` y `border-color`. Nunca sobre `width`/`height`.
- Drawer: entra desde la derecha con `transform: translateX()`, 220ms.
- Modal: `opacity` + `scale(.98 → 1)`, 160ms.
- Toast: entra desde abajo-derecha, permanece 4s, sale en 120ms.
- **El sello es la única excepción expresiva**: al aprobar, aparece con `scale(1.06 → 1)` + `opacity` en 220ms, una sola vez. Es el clímax del flujo y se lo gana.
- Sin animaciones de scroll, parallax ni contadores animados.
- `@media (prefers-reduced-motion: reduce)` desactiva todo excepto cambios de opacidad instantáneos.

---

## 8. Componentes

### 8.1 Tabla de datos (componente central del producto)

La tabla es donde vive el producto. Especificación estricta:

- Encabezado: `label` en mayúsculas, `--ink-500`, fondo `--surface`, borde inferior `1px solid --line-strong`, sticky al hacer scroll.
- Filas alternas: par en `--surface`, impar en `--band`. Sin bordes entre filas.
- Hover de fila: fondo `--paper`, transición 120ms, `cursor: pointer` si es navegable.
- Fila seleccionada: borde izquierdo de 2px en `--ink-900`, sin radio.
- Columnas numéricas: `text-align: right`, `IBM Plex Mono`, `tabular-nums`.
- Columna de estado: punto de 6px + etiqueta de texto.
- Última columna: acciones en menú `⋯`, nunca botones sueltos que ensucien la grilla.
- Altura de fila: 44px (cumple objetivo táctil mínimo).
- Sin scroll horizontal en desktop: en ≤1024px se colapsan columnas secundarias, no se hace scroll lateral.

### 8.2 Chip de estado

```
● Aprobado
```

Punto de 6px en el color del estado + etiqueta en `--ink-700`, 13px. Fondo del tinte solo en la vista de detalle; en tablas va sin fondo, únicamente punto y texto. Nunca color solo.

### 8.3 Formularios

- Label visible siempre, arriba del campo, 13px `--ink-500`. Nunca placeholder como label.
- Input: 36px de alto, borde `--line`, radio 6px, fondo `--surface`.
- Foco: `box-shadow: 0 0 0 3px rgba(47,93,140,.18)` + borde `--focus`. Nunca se elimina el anillo.
- Error: borde `--danger`, mensaje debajo del campo con icono `AlertCircle` de 14px. Nunca un bloque de errores solo arriba.
- Validación en `blur`, no en cada tecla. Excepto el editor de líneas, que recalcula en vivo.
- Ayuda contextual debajo del campo, 12px `--ink-400`.
- Campos obligatorios: se marcan los opcionales con "(opcional)", no los obligatorios con asterisco.

### 8.4 Editor de líneas de cotización

El componente más importante de la demo. Debe sentirse impecable.

- Fila = producto, cantidad, precio unitario, descuento %, subtotal (calculado, solo lectura).
- Selector de producto con búsqueda por teclado, que trae precio por defecto y permite sobrescribirlo.
- Recálculo inmediato al escribir, sin botón "calcular".
- Panel de totales fijo a la derecha (o abajo en móvil): subtotal, descuento, IVA 15%, total.
- El total se muestra en `mono-amount` sobre una regla superior de 2px.
- Fila vacía siempre disponible al final: agregar es escribir, no hacer clic en "+".
- Eliminar línea: icono discreto que aparece en hover, con deshacer en toast.

### 8.5 Estados vacíos

Invitación, no disculpa. Icono de 24px `--ink-400`, título en `h3`, una línea de explicación, un botón primario.

> **Aún no hay cotizaciones**
> Crea la primera y quedará en borrador hasta que la envíes.
> `[ Crear cotización ]`

Nunca "No se encontraron resultados" a secas.

### 8.6 Carga

Skeleton con bloques en `--band`, sin shimmer animado. La tabla reserva su altura exacta para evitar salto de layout (CLS < 0.1).

### 8.7 Toasts

Abajo a la derecha. Fondo `--ink-900`, texto blanco, 13px, sin icono. Máximo una línea. Acción de deshacer como texto subrayado cuando aplique.

### 8.8 El sello

```
┌────────────────────────┐
│   A P R O B A D O      │   ← IBM Plex Mono 600, tracking 0.18em
│   24 jul 2026          │   ← 11px
│   M. Vásquez · Gerente │
└────────────────────────┘
```

Borde de 2px en `--stamp-approve`, radio 4px, rotación −4°, opacidad 0.85. Aparece en la vista de detalle sobre la esquina superior derecha del documento y se replica en el PDF. Rechazo: idéntico en `--stamp-reject`.

---

## 9. Estructura de pantallas

### 9.1 Arquitectura de información

```
/login                        Ingreso + acceso rápido de demo
/registro                     Alta de usuario
/                             Resumen
/cotizaciones                 Lista
/cotizaciones/nueva           Editor
/cotizaciones/:id             Detalle · sello · PDF
/aprobaciones                 Bandeja (Gerente/Admin)
/clientes                     Lista + panel lateral CRUD
/catalogo                     Lista + panel lateral CRUD
/ajustes                      Empresa, impuestos, usuarios
```

### 9.2 Marco global

```
┌──────────────┬────────────────────────────────────────────────┐
│              │  Empresa A ▾        ⌘K          MV  Vendedor ▾ │
│   COTIZA     ├────────────────────────────────────────────────┤
│              │  Datos de demostración · Restablecer           │  ← franja demo
│  ▪ Resumen   ├────────────────────────────────────────────────┤
│  ▪ Cotizac.  │                                                │
│  ▪ Aprobac.  │                                                │
│  ▪ Clientes  │              contenido                         │
│  ▪ Catálogo  │                                                │
│              │                                                │
│  ─────────   │                                                │
│  ▪ Ajustes   │                                                │
└──────────────┴────────────────────────────────────────────────┘
   224px                        fluido, máx 1440px
```

- Sidebar fija de 224px, fondo `--paper`, sin iconos coloreados. Ítem activo: fondo `--surface` + borde izquierdo 2px `--ink-900`.
- Selector de empresa arriba a la izquierda del topbar: es la prueba visible del multi-tenant.
- Franja de demo persistente y discreta, con botón para restablecer datos. Comunica intención, no es un adorno.
- En ≤1024px la sidebar colapsa a iconos; en ≤768px pasa a drawer.

### 9.3 Login

Dos columnas. Izquierda: formulario. Derecha: panel `--ink-900` con una sola frase y el folio de ejemplo en mono. Sin ilustración, sin stock, sin blob.

Debajo del formulario, el detalle que importa para un reclutador:

```
Entrar como:  [ Administrador ]  [ Gerente ]  [ Vendedor ]  [ Cliente ]
```

Un clic y está dentro con datos reales. Nadie debería tener que copiar credenciales de un README.

### 9.4 Resumen

```
┌─────────┬─────────┬─────────┬─────────┐
│ Borrad. │ Enviad. │ Aprobad.│ Monto   │
│    4    │    7    │   12    │ $48.320 │   ← display 28/600, mono
└─────────┴─────────┴─────────┴─────────┘

┌────────────────────────────┬───────────────────┐
│  Cotizaciones recientes    │  Pendientes de    │
│  (tabla, 6 filas)          │  aprobación (3)   │
└────────────────────────────┴───────────────────┘
```

KPI sin icono, sin flecha de tendencia inventada, sin sparkline decorativo. Etiqueta arriba en `label`, cifra abajo en `display` monoespaciada. Si hay comparación contra el mes anterior, es un dato real del seed o no está.

### 9.5 Lista de cotizaciones

Barra de filtros: búsqueda, estado (segmentado), cliente, rango de fechas. Los filtros persisten en la URL — un ingeniero senior no pierde el estado al recargar.

Columnas: `Folio` (mono) · `Cliente` · `Estado` · `Emitida` · `Vence` · `Total` (mono, derecha) · `⋯`

### 9.6 Detalle de cotización

Documento a la izquierda (encabezado de empresa, datos de cliente, tabla de líneas, totales), barra de acciones a la derecha con el historial del flujo:

```
Creada       12 jul · J. Sarango
Enviada      13 jul · J. Sarango
Aprobada     14 jul · M. Vásquez
```

El sello se superpone al encabezado del documento. Acciones visibles según rol y estado — las no permitidas no se muestran deshabilitadas, simplemente no están.

---

## 10. Roles y permisos

| Acción | Admin | Gerente | Vendedor | Cliente |
|---|:--:|:--:|:--:|:--:|
| Ver todas las cotizaciones de la empresa | ✓ | ✓ | — | — |
| Ver cotizaciones propias | ✓ | ✓ | ✓ | ✓ (dirigidas a él) |
| Crear / editar borrador | ✓ | ✓ | ✓ | — |
| Enviar a aprobación | ✓ | ✓ | ✓ | — |
| Aprobar / rechazar | ✓ | ✓ | — | — |
| CRUD clientes | ✓ | ✓ | ✓ (crear/editar) | — |
| CRUD catálogo | ✓ | ✓ | — | — |
| Descargar PDF | ✓ | ✓ | ✓ | ✓ |
| Gestionar usuarios y ajustes | ✓ | — | — | — |

**Regla de UI:** la acción que el rol no puede ejecutar no se renderiza. Nada de botones grises que frustran.
**Regla de backend:** el permiso se valida siempre en el servidor. La UI oculta; el API decide.

---

## 11. Máquina de estados

```
              enviar              aprobar
  BORRADOR ───────────▶ ENVIADO ───────────▶ APROBADO
     ▲                    │  │
     │      devolver      │  │   rechazar
     └────────────────────┘  └───────────▶ RECHAZADO
                            │
                            │ vence la fecha
                            ▼
                        VENCIDO
```

Reglas:

- `BORRADOR` es el único estado editable. Al enviarse, la cotización se congela.
- `APROBADO` y `RECHAZADO` son terminales. Para cambiar algo se duplica en un nuevo borrador (`COT-2026-0148-R1`).
- `VENCIDO` lo asigna un job por fecha de validez; puede devolverse a borrador duplicando.
- Cada transición registra actor, timestamp y comentario opcional en `cotizacion_eventos`. El historial del detalle se lee de ahí, no se infiere.

---

## 12. Multi-tenant en la interfaz

- Cada usuario pertenece a una `empresa_id`. El JWT lleva `sub`, `empresa_id` y `rol`.
- El aislamiento se aplica en el servidor mediante una extensión de Prisma que inyecta `empresa_id` en todo `where`. **Nunca se filtra en el cliente.**
- Para la demo, el usuario admin puede alternar entre Empresa A y Empresa B desde el topbar. Cada empresa tiene su propio nombre, logo, IVA, secuencia de folios y catálogo.
- Al cambiar de empresa, cambian visiblemente: el nombre en el topbar, el logo del PDF y los datos. Esa es la demostración — que el reclutador lo vea, no que lo lea.
- Empresa A: constructora, IVA 15%, prefijo `COT-A`. Empresa B: consultora de TI, IVA 15%, prefijo `COT-B`.

---

## 13. Voz y redacción

Español neutro con registro profesional ecuatoriano. Directo, sin adornos.

- Sentence case en botones, títulos, menús. Sin punto final en labels.
- Verbo primero: "Crear cotización", "Enviar a aprobación", "Descargar PDF". Nunca "Enviar" a secas ni "Aceptar".
- El nombre de una acción no cambia en el flujo: el botón dice "Aprobar", el toast dice "Cotización aprobada".
- Errores: qué pasó y qué hacer. Sin "Error:", sin primera persona, sin disculpas.
  - Sí: "El cliente no tiene correo registrado. Agrégalo para poder enviar."
  - No: "Error: no se pudo completar la operación."
- Prohibidas: "exitosamente", "por favor", "simplemente", "fácil", "potencia", "sin fisuras", signos de exclamación.
- Términos consistentes: *cotización* (no "presupuesto" ni "proforma"), *cliente*, *ítem*, *catálogo*, *folio*.

---

## 14. Accesibilidad — piso mínimo

- Contraste 4.5:1 en todo texto informativo. Verificado en la paleta.
- Anillo de foco visible en todo elemento interactivo. Jamás `outline: none` sin reemplazo.
- Navegación completa por teclado: `Tab` en tablas, `Esc` cierra drawer y modal, `Enter` confirma.
- `⌘K` / `Ctrl+K` abre búsqueda global.
- Objetivo táctil mínimo 44×44px con 8px de separación.
- Estado nunca se comunica solo por color: siempre punto + etiqueta.
- Tablas con `<th scope="col">` y `<caption>` visualmente oculto.
- `aria-live="polite"` en toasts y en el total del editor de líneas.
- `prefers-reduced-motion` respetado.
- Sin bloqueo de zoom, sin anchos fijos en px para contenedores.

---

## 15. Tokens (implementación)

### `tokens.css`

```css
:root {
  --paper: #EFF2ED;
  --surface: #FFFFFF;
  --band: #F4F7F1;
  --line: #DCE2D9;
  --line-strong: #C3CCBF;

  --ink-400: #8A9791;
  --ink-500: #5C6B64;
  --ink-700: #2C3A34;
  --ink-900: #14201B;

  --st-draft: #6E7A74;    --st-draft-bg: #F0F2F0;
  --st-sent: #2F5D8C;     --st-sent-bg: #E8EFF6;
  --st-approved: #1F6B4E; --st-approved-bg: #E6F0EA;
  --st-rejected: #A33A28; --st-rejected-bg: #F7EAE7;
  --st-expired: #8A6212;  --st-expired-bg: #F6EFE1;

  --focus: #2F5D8C;
  --danger: #A33A28;

  --radius-control: 6px;
  --radius-card: 8px;
  --radius-chip: 4px;

  --dur-fast: 120ms;
  --dur-base: 160ms;
  --dur-slow: 220ms;
  --ease: cubic-bezier(.2, .8, .3, 1);

  --shadow-popover: 0 1px 2px rgba(20,32,27,.05), 0 8px 24px rgba(20,32,27,.10);
  --shadow-modal:   0 2px 4px rgba(20,32,27,.06), 0 16px 48px rgba(20,32,27,.14);
}
```

### `tailwind.config.js`

```js
export default {
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
}
```

Carga de fuentes:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

`IBM Plex Serif` se carga únicamente en la ruta del PDF, no en el bundle principal.

```css
.tabular { font-variant-numeric: tabular-nums; }
```

---

## 16. El PDF

El PDF no es una captura de la pantalla: es el mismo sistema en soporte impreso.

- A4, márgenes 20mm.
- Encabezado: nombre de la empresa en `IBM Plex Serif` 600, datos fiscales en `IBM Plex Sans` 9pt.
- Folio arriba a la derecha en mono, 11pt.
- Tabla de líneas con banda contable — es donde el concepto cierra el círculo.
- Totales en bloque a la derecha, regla superior de 1pt, total en mono 12pt.
- Sello replicado si el estado es aprobado o rechazado.
- Pie: validez, condiciones de pago, "Documento generado el {fecha} · Cotiza".
- Sin color más allá del sello y las bandas. Debe verse correcto impreso en blanco y negro.

Implementación: `@react-pdf/renderer`. Elegido sobre `jsPDF` porque permite componer el documento declarativamente con los mismos tokens, en vez de posicionar coordenadas a mano.

---

## 17. Datos de demostración

El seed decide si la demo impresiona o no. No puede verse como datos de prueba.

- 2 empresas, 8 usuarios (2 por rol en Empresa A, 2 en Empresa B).
- 12 clientes con nombres y RUC verosímiles ecuatorianos.
- 18 ítems de catálogo, mezcla de productos y servicios con precios coherentes.
- 24 cotizaciones repartidas entre los cinco estados, con fechas de los últimos 90 días y montos entre $ 320 y $ 18.400.
- 3 cotizaciones deliberadamente en `ENVIADO` para que el reclutador pueda ejecutar la aprobación en vivo.
- Historial de eventos completo en cada una: sin él, el sello no tiene autor y el detalle se ve hueco.
- Botón "Restablecer datos de demostración" que vuelve al seed en un clic.

---

## 18. Lista de verificación antes de entregar

- [ ] Contraste verificado en cada par texto/fondo
- [ ] Foco visible en todo elemento interactivo
- [ ] Navegación completa por teclado, `Esc` cierra overlays
- [ ] `prefers-reduced-motion` respetado
- [ ] Responsive verificado en 375 / 768 / 1024 / 1440
- [ ] Sin scroll horizontal en ningún breakpoint
- [ ] Sin gradientes, sin glassmorphism, sin emojis como iconos
- [ ] Cifras en mono tabular alineadas a la derecha
- [ ] Estados con punto + etiqueta, nunca color solo
- [ ] Estados vacíos redactados y con acción
- [ ] Skeletons reservan altura (CLS < 0.1)
- [ ] Un solo botón primario por vista
- [ ] Copy revisado contra la sección 13
- [ ] PDF legible impreso en blanco y negro
- [ ] Aislamiento multi-tenant verificado en el servidor, no en el cliente
- [ ] Acceso rápido de demo funcionando para los cuatro roles
```
