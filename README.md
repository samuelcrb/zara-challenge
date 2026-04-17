# Zara Challenge — Tienda de Móviles

Aplicación fullstack para explorar y comprar móviles. El backend actúa como BFF (Backend-for-Frontend): proxea una API de terceros, protege las credenciales, normaliza las respuestas y procesa las imágenes antes de servírselas al cliente. El frontend es una SPA en React con routing, carrito persistente y transiciones animadas entre páginas.

---

## Tecnologías

**Backend**
- Node.js 18 + Express + TypeScript
- Sharp — procesado de imágenes (eliminación de fondo, conversión a WebP)!
- Vitest + Supertest — tests de integración

**Frontend**
- React 19 + Vite + TypeScript
- React Router DOM 7
- Framer Motion — transiciones de página y animaciones de grid
- SASS + CSS Modules
- Vitest + React Testing Library

**DevOps**
- Docker (multi-stage build)
- Docker Compose

---

## Cómo ejecutar el proyecto

### Prerequisitos
- Node.js 18+
- Docker y Docker Compose (para levantar todo junto)

### Con Docker (recomendado)

```bash
# Clona y entra al repo
git clone <repo-url>
cd zara-challenge

# Crea el .env del backend
cp root/backend/.env.example root/backend/.env
# Rellena API_KEY, UPSTREAM_API_URL y CORS_ORIGIN

# Lanza la aplicación
docker compose up --build
```

La app queda disponible en `http://localhost:3000`.

### En local (desarrollo)

```bash
# Backend
cd root/backend
npm install
npm run dev        # Puerto 3000

# Frontend (en otra terminal)
cd root/frontend
npm install
npm run dev        # Puerto 5173, proxea /api al backend
```

### Tests

```bash
# Backend
cd root/backend && npm test

# Frontend
cd root/frontend && npm test

# Con cobertura
npm run test:coverage
```

---

## Estructura del proyecto

```
zara-challenge/
├── root/
│   ├── backend/
│   │   └── src/
│   │       ├── features/
│   │       │   ├── products/         # GET /api/products y /api/products/:id
│   │       │   │   ├── products.router.ts
│   │       │   │   ├── products.cache.ts
│   │       │   │   └── products.router.test.ts
│   │       │   └── image/            # GET /api/image?url=...
│   │       │       ├── image.router.ts
│   │       │       ├── image.processor.ts
│   │       │       └── image.cache.ts
│   │       ├── config.ts
│   │       └── server.ts
│   └── frontend/
│       └── src/
│           ├── features/
│           │   ├── products/
│           │   │   ├── page/         # PhoneList y PhoneDetail
│           │   │   ├── components/   # PhoneGrid, PhoneCard, ColorSelector
│           │   │   ├── hooks/        # useProducts, useProductDetail
│           │   │   └── types/
│           │   └── cart/
│           │       ├── CartContext.tsx
│           │       ├── page/Cart/
│           │       └── types/
│           ├── components/           # Navbar, SearchBar, AnimatedRoutes...
│           ├── api/http.ts
│           ├── hooks/useDebounce.ts
│           └── utils/                # image.utils, price.utils
├── Dockerfile
├── docker-compose.yml
└── build.sh
```

La estructura sigue el mismo criterio en backend y frontend: cada feature tiene su propio directorio con todo lo que necesita (router/hook, tipos, tests, caché). No hay carpetas globales de `utils` o `helpers` que acaben siendo cajones de sastre.

---

## Arquitectura

### Flujo general

```
Browser → BFF (Express) → API de terceros
              ↓
       Normalización de datos
       Procesado de imágenes (Sharp)
       Caché en memoria
              ↓
       SPA React servida como estático
```

El backend cumple tres roles:
1. **Proxy seguro**: la `API_KEY` nunca sale del servidor
2. **Normalizador**: corrige inconsistencias de la API upstream antes de que lleguen al cliente
3. **Procesador de imágenes**: transforma y cachea las imágenes para que el frontend reciba siempre WebP optimizado

### Endpoints del BFF

| Endpoint | Descripción |
|---|---|
| `GET /api/products` | Lista de productos (caché 5 min por query params) |
| `GET /api/products/:id` | Detalle de producto |
| `GET /api/image?url=<url>` | Imagen procesada y cacheada (LRU, 50 entradas) |

### Estado en el frontend

- **Cart**: Context API + `localStorage`. Sin Redux ni Zustand, no hace falta para un único estado global.
- **Products**: caché a nivel de módulo que sobrevive la navegación. Al volver atrás no hay refetch.
- **UI local**: cada hook gestiona su propio `loading` y `error`.

---

## Decisiones técnicas

### BFF en lugar de llamar a la API directamente desde el cliente

La API requiere una clave. Si la pones en el frontend, cualquiera la extrae de las DevTools. El BFF resuelve eso y además centraliza la normalización de datos.

### Normalización de la API

La API upstream devuelve precios inconsistentes en el listado: el `basePrice` del listado no siempre coincide con el precio mínimo real del producto. La solución fue hacer un fetch paralelo de cada detalle durante la llamada al listado y sobreescribir el precio con el mínimo real de las opciones de almacenamiento.

Además se aplica:
- Deduplicación por ID (la API a veces repite productos)
- Conversión de URLs de imagen a HTTPS
- Adición de `renderKey` estables para que Framer Motion gestione correctamente las animaciones del grid

Hacer esto en el BFF significa que el cliente siempre recibe datos consistentes y no tiene que lidiar con estos casos.

### Procesado de imágenes en el servidor

Las imágenes originales tienen fondo blanco y vienen en formatos pesados. El pipeline con Sharp hace lo siguiente por cada imagen:
1. Asegura canal alfa
2. Elimina el fondo blanco (umbral 240)
3. Recorta el espacio transparente sobrante
4. Redimensiona a 400px de alto
5. Convierte a WebP (calidad 85)

El resultado se cachea con una LRU de 50 entradas. El cliente recibe imágenes sin fondo, uniformes y ligeras sin tener que procesar nada.

### Animaciones de página con dirección

Hay un `TransitionContext` que rastrea si la navegación es hacia adelante o hacia atrás. Las animaciones de entrada y salida usan variantes distintas según la dirección, lo que da una sensación de navegación coherente sin librerías de routing especializadas.

### Español como único idioma

La prueba técnica está en español y la app va a ser evaluada en ese contexto. Soportar i18n en una prueba técnica añade complejidad sin valor: más configuración, más archivos, más superficie de error. Decidí no hacerlo.

### Lo que no hice y por qué

- **Redux / Zustand**: el carrito es el único estado global y Context API es suficiente. Añadir una librería de estado sería over-engineering para este caso.
- **SSR / Next.js**: es una SPA sencilla, no hay requisitos de SEO ni de rendimiento en first-paint que lo justifiquen.
- **Base de datos**: el carrito se persiste en `localStorage`. Para una prueba técnica es correcto; en producción habría que plantearse sesiones server-side o una BD.
- **Autenticación**: fuera de scope.
- **i18n**: explicado arriba.

---

## Despliegue

La aplicación está desplegada en un VPS con Docker.

El `Dockerfile` tiene tres etapas:
1. **Build frontend**: `npm ci` + `npm run build` → genera los estáticos en `/build/dist`
2. **Build backend**: `npm ci` + `npm run build` → compila TypeScript
3. **Runtime**: imagen `node:18-slim` con solo las dependencias de producción, los estáticos del frontend y el backend compilado. El backend sirve los estáticos directamente con un fallback a `index.html` para el routing del cliente.

```bash
# En el VPS
git pull
docker compose up --build -d
```

El servidor arranca con `--max-old-space-size=400` para contener el uso de memoria del procesado de imágenes.

---

## Posibles mejoras

**Impacto alto**
- **Persistencia del carrito en servidor**: actualmente el carrito se pierde si el usuario limpia el storage o cambia de dispositivo. Una sesión server-side o un endpoint de carrito lo resolvería.
- **Paginación real**: el endpoint acepta `limit` y `offset` pero el frontend carga todo de una vez. Con catálogos grandes sería un problema.
- **Precarga inteligente de imágenes**: ahora se precargan todas las imágenes del listado en paralelo (con concurrencia limitada a 3). Podría mejorarse priorizando las imágenes visibles en el viewport.

**Impacto medio**
- **Tests E2E con Playwright o Cypress**: los tests actuales son unitarios e integración. Un test de flujo completo (buscar → ver detalle → añadir al carrito) daría más confianza en los cambios.
- **Error boundaries en React**: ahora los errores de componentes no se gestionan de forma controlada a nivel de árbol.
- **Cache distribuida**: la caché actual es en memoria por proceso. Con múltiples instancias o reinicios se pierde. Redis sería la solución natural.

**Impacto bajo**
- **Internacionalización**: si el producto tuviera que escalar a otros mercados, añadir i18n con `react-i18next` sería el paso lógico.
- **Optimistic UI en el carrito**: la adición al carrito es local e instantánea, pero si se conectara a un backend podría añadirse feedback optimista.
