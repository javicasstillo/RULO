# RULO Picadas · Sistema de gestión

Sistema de gestión hecho a medida para RULO Picadas: stock de insumos, recetas
de picadas con costo automático, ventas, gastos, caja (ingresos/egresos),
reportes de rentabilidad y clientes. Hecho con **React + Vite** y
**Firebase Firestore** como base de datos en tiempo real.

## ¿Qué incluye?

- **Insumos y stock**: cargás lo que comprás (ej. 1 kg de jamón a $8.000) y el
  sistema calcula solo el costo por 100 g / 100 ml / unidad. Cada compra nueva
  actualiza el costo y suma stock; alerta cuando algo está por debajo del mínimo.
- **Picadas (recetas)**: armás cada picada eligiendo insumos y cantidades; el
  costo total y el margen (%) se calculan solos, en vivo, mientras cargás.
- **Ventas**: registrás qué se vendió; descuenta stock de insumos automáticamente
  (según las recetas) y calcula la ganancia de cada venta.
- **Gastos**: packaging, delivery, alquiler, servicios, marketing, sueldos, etc.
  Las compras de insumos generan un gasto automáticamente.
- **Ingresos y egresos**: libro de caja único que junta ventas + gastos +
  movimientos manuales (aportes, retiros).
- **Reportes**: ranking de rentabilidad por picada, gastos por categoría,
  facturación por producto, comparativa mensual.
- **Clientes**: registro simple de clientes frecuentes.
- **Panel**: resumen del día/mes, gráfico de ventas vs. gastos, alertas de
  stock bajo, productos más vendidos.
- **Configuración**: exportar todo a CSV, historial completo de movimientos de stock.

## 1) Crear el proyecto en Firebase (gratis)

1. Andá a https://console.firebase.google.com y creá un proyecto nuevo.
2. En el proyecto, andá a **Compilación → Firestore Database** → crear base de
   datos (modo producción, la región no importa mucho, elegí una cercana
   como `southamerica-east1`).
3. Andá a **Compilación → Authentication → Sign-in method** y activá
   **Email/contraseña**.
4. En **Authentication → Users**, creá tu usuario (el email y contraseña con
   los que vas a entrar al sistema).
5. Andá a **Configuración del proyecto** (ícono de tuerca) → en "Tus apps"
   agregá una **app web** (ícono `</>`). Copiá el objeto `firebaseConfig` que
   te muestra.

## 2) Configurar el proyecto localmente

```bash
cd rulo-picadas
npm install
cp .env.example .env
```

Abrí `.env` y pegá los valores que te dio Firebase:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 3) Reglas de seguridad de Firestore

En Firebase Console → Firestore Database → Reglas, pegá el contenido del
archivo `firestore.rules` (incluido en este proyecto) y publicá. Esto hace
que solo vos (usuario logueado) puedas leer y escribir los datos.

## 4) Correr el sistema

```bash
npm run dev
```

Abrí `http://localhost:5173`, iniciá sesión con el usuario que creaste en el
paso 1.4, y ¡listo! Ya podés cargar tus insumos, armar tus picadas y empezar
a registrar ventas.

## 5) Publicarlo online (opcional, para usarlo desde el celular)

La forma más simple es con **Firebase Hosting** (gratis):

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # elegí el proyecto, carpeta pública "dist", SPA: sí
npm run build
firebase deploy
```

También podés subir la carpeta a Vercel o Netlify conectando este repo;
solo acordate de cargar las mismas variables de entorno del `.env` en la
configuración del hosting.

## Cómo funciona el cálculo de costos

1. En **Insumos**, cargás cómo comprás cada cosa: cantidad, unidad (kg, g, l,
   ml o unidad) y precio pagado. El sistema calcula automáticamente el costo
   por cada 100 g / 100 ml / 100 unidades, y lo muestra al instante mientras
   escribís.
2. En **Productos**, armás la receta de cada picada indicando cuánto usás de
   cada insumo (ej. 150 g de jamón, 100 g de queso, 6 aceitunas). El costo
   total de la picada se calcula sumando el costo de cada insumo según lo que
   usa la receta.
3. Al cargar el **precio de venta**, ves el margen (%) en tiempo real.
4. Cuando registrás una **venta**, el sistema descuenta automáticamente el
   stock de cada insumo según las recetas de lo vendido, y calcula la
   ganancia real de esa venta (precio − costo de insumos).

## Estructura de datos (Firestore)

- `ingredients` — insumos: costo por unidad base, stock actual, mínimo.
- `products` — picadas: receta (lista de insumos + cantidades), precio.
- `sales` — ventas: items vendidos, total, costo, ganancia.
- `expenses` — gastos por categoría.
- `cashMovements` — movimientos de caja manuales.
- `stockMovements` — historial de compras/ventas/ajustes de stock.
- `clients` — clientes.

## Notas

- Todos los montos están en pesos argentinos (ARS) por defecto; se puede
  cambiar el `Intl.NumberFormat` en `src/lib/units.js` si hace falta otra moneda.
- Este sistema es de un solo local/marca. Si en el futuro tenés varios puntos
  de venta, se puede extender agregando un campo `location` a ventas y stock.
