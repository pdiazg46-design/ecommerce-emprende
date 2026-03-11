# BIBLIA DEL E-COMMERCE EMPRENDE (SaaS Multi-Tenant)

> **Documento Vivo de Transferencia de Conocimiento y Arquitectura.** 
> Este documento debe ser leído por cualquier Agente o Desarrollador que retome el proyecto para comprender a fondo el modelo arquitectónico subyacente de "E-commerce Emprende".

---

## 🏗 Origen y Evolución a Ecosistema SaaS

Originalmente, el proyecto funcionaba como un "Single-Tenant", es decir, renderizaba una única tienda estática a partir de un correo electrónico directamente incrustado en el código base. Tras la evolución al modelo **Multi-Tenant (SaaS)**, la plataforma actúa como un motor que hospeda a **infinitos emprendedores simultáneamente**, proporcionándoles a cada uno de ellos un subdominio/ruta única para sus propias tiendas (ej. `midominio.com/panaderia-maria`).

### 1. El Pilar: "storeSlug" (Identidad de Negocio)
El campo más sensible e importante de la red es `storeSlug`.
- **Ubicación BD:** Pertenece al modelo `EcommerceSettings` en Supabase/Prisma (`storeSlug String? @unique`).
- **Función:** Actúa como la llave de enrutamiento dinámico.
- **Configuración:** En el componente `src/components/admin/BrandConfig.tsx`, el emprendedor (el dueño del comercio) reclama, limpia y valida su Slug. 
- Al guardar la configuración mediante la ruta `/api/ecommerce-settings`, su tienda pública queda viva y disponible automáticamente en la ruta `/su-slug`.

## 🌐 Estructura de Rutas Dinámicas (Next.js 15)

El ecosistema hace un uso rudo de **App Router** (`src/app/`):

1. **La Portada Raíz (`/`)**: 
   - Archivo: `src/app/page.tsx`
   - Un *Landing Page* institucional general. Atrapa al tráfico general que entra al dominio padre sin buscar una tienda en específico. Contiene explicaciones del SaaS y los desvía al acceso (Login).
2. **El Catálogo de la Tienda (`/[storeSlug]`)**:
   - Archivo: `src/app/[storeSlug]/page.tsx`
   - Al cargar, extrae el parámetro `storeSlug` de la URL, localiza en Prisma su propietario (`userId`), y extrae exclusivamente el Logo, Nombre, Eslogan de ese negocio, **y pinta solamente los productos que pertenezcan a ese User ID específico**.
3. **El Detalle del Producto (`/[storeSlug]/productos/[slug]`)**:
   - Archivo: `src/app/[storeSlug]/productos/[slug]/page.tsx`
   - Conserva el contexto del negocio (Logo y Footer institucional) y resuelve el detalle estricto de la base de datos de un producto.
4. **El Checkout Multi-Tienda (`/[storeSlug]/cart`)**:
   - Archivo: `src/app/[storeSlug]/cart/page.tsx`
   - El carrito ha sido aislado por completo dentro de la ruta para que entienda a quién le está enviando la compra el cliente final.

> ⚠️ **TRAMPA ARQUITECTÓNICA NEXT.JS 15 (Promise Params)**:  Desde la versión 15 de Next.js, el objeto `params` que entrega la URL dinámica en los "Server Components" (`page.tsx`) **ES UNA PROMESA ASÍNCRONA** y NO un objeto sincrónico. Consumirlo de forma inmediata arrojará un fulminante **"Application error - Digest: 114416115"** (Error 500) en Producción (Vercel).
> 
> *Solución Obligatoria:* La firma del export default debe forzarse usando tipado tipo Promesa, ejemplo: `export default async function Home({ params }: { params: Promise<{ storeSlug: string }> })` seguido de un `const { storeSlug } = await params;` en la primera línea. Esto fue arreglado e implementado a nivel de Catálogo y Carrito en esta iteración. ¡Cuidado al crear nuevas rutas dinámicas!

## 🛒 Aislamiento del Carrito (Zustand)

El estado del carrito vive en el navegador local del cliente usando `zustand/middleware persist`. Si un cliente compra en `/tienda-a` y luego visita `/tienda-b`, sus datos no pueden mezclarse.
- **Lógica de Protección:** `src/lib/cart-store.ts` maneja la variable `currentStoreSlug`. 
- Si un cliente llama al método `addItem()` e intenta enviar al carrito un elemento proveniente de un `storeSlug` distinto al que ya existía anclado a su sesión actual en Zustand, **el Carrito se purgará automáticamente (borrón y cuenta nueva)**. Es un blindaje arquitectónico "Data Leak Prevention" del SaaS.
- El componente flotante de icono de total (`CartBadge.tsx`) está rediseñado para reaccionar mediante cálculo puro de elementos activos con un `.reduce`.

## 🎨 Principios UX y de Interfaz

1. **Diseño de Cabecera Asimétrica**:
   - La cabecera en `/[storeSlug]/page.tsx` aloja toda la "Identidad" de un vendedor a la **Izquierda**, superponiendo orgánicamente a través de `flex-row` el *Logo* junto al *Nombre* descriptivo y su *Eslogan*.
   - El *Carrito Reactivo* vive solitario y anclado al extremo derecho (`justify-end`).
2. **Branding Institucional**:
   - Todas las páginas públicas poseen, antes del cierre de capa, un Footer Institucional promoviendo al padre tecnológico del SaaS: **"Powered by AT-SIT"** apuntando a `atsittelecom@gmail.com`.
3. **Imágenes Multi-Nube (Supabase Storage)**:
   - El panel de configuración `BrandConfig.tsx` utiliza componentes de file-upload para evadir inputs de texto duros al subir imágenes de logo. Sube y reescribe URLs efímeras con políticas públicas hacia Supabase Buckets.

## 🚀 Despliegue y Base de Datos

- El ORM de cabecera es **Prisma**. Toda la fuerza transaccional se inyecta y extrae con el CLI de Prisma.
- Cambios de esquemas en Supabase: `npx prisma db push`.
- Compilación Vercel: La app ha resistido comprobaciones duras de TypeScript (código 0). Para inyectar en línea, ejecutar compilado local (`npm run build`) para depurar, seguido del Vercel CLI de producción rápida (`npx vercel --prod --yes`). Todo está sanitizado y limpio de variables huérfanas o rutas fantasma no mapeadas.
