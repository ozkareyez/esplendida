# DESIGN.md

# Esplendida Makeup — Design System & UI Specification

## 1. Descripción del proyecto

**Esplendida Makeup** es una tienda e-commerce enfocada en:

* Maquillaje
* Cuidado facial
* Cuidado corporal
* Cuidado capilar
* Brochas y herramientas
* Accesorios de belleza
* Combos y promociones


El sitio debe transmitir una identidad de belleza moderna, femenina, juvenil, accesible y comercial.

La experiencia debe priorizar:

1. Descubrimiento de productos
2. Conversión a compra
3. Navegación sencilla
4. Visualización atractiva del catálogo
5. Promociones y productos destacados
6. Experiencia móvil

---

# 2. Objetivo del diseño

Crear una experiencia de e-commerce moderna inspirada en la estructura comercial de Purpure Makeup, pero con una interfaz limpia, rápida y visual.

El diseño debe sentirse:

* Moderno
* Femenino
* Juvenil
* Elegante
* Colorido sin ser excesivo
* Comercial
* Fácil de navegar
* Orientado a conversión

No debe parecer un marketplace genérico.

---

# 3. Identidad visual

## 3.1 Personalidad

La identidad visual debe comunicar:

> Belleza + confianza + diversión + accesibilidad + cuidado personal.

La marca debe sentirse cercana y aspiracional al mismo tiempo.

---

# 4. Paleta de colores

## Origen de la paleta

El color de identidad se extrae del logotipo real de Espléndida, no de referencias
de terceros. El magenta cromado del logo es el primario; el dorado del logo es el
acento. Cualquier paleta nueva debe derivarse de esos dos tonos para no competir
con la marca.

## Color principal

```text
Primary — Magenta Intenso
#B2235B
```

Es el color de marca. Se usa en CTAs, enlaces activos, precios y elementos de
identidad.

## Variaciones

```text
Primary Light — Rosa Medio
#DC5B86

Primary Lighter — Rosa Pastel
#F9C7D4

Primary Dark — Magenta Profundo
#8C1A49
```

## Acento

```text
Accent — Dorado
#C9A24B
```

Derivado del dorado del logo. Restringido a detalles: íconos de confianza,
subrayados, separadores y estados de marca. No debe competir con el primario.

## WhatsApp

```text
#25D366
```

Exclusivo para acciones de WhatsApp (botón flotante, envío de pedido, enlaces).

## Semánticos

```text
Éxito
#16A34A

Advertencia
#F59E0B

Error / Agotado
#EF4444
```

## Colores neutros

```text
Texto principal — Negro
#2B2B2B

Texto secundario — Gris
#6B7280

Borde
#E5E7EB

Superficie
#FFFFFF

Fondo de página
#FAFAFA

Superficie tenue
#F5F5F5
```

## Contraste

Todas las combinaciones texto/fondo deben cumplir WCAG AA (4.5:1 en texto normal,
3:1 en texto grande). Verificar en particular `--foreground` sobre `--background`
y blanco sobre `--primary`.

## Uso recomendado

* Primary: botones principales, precios, enlaces activos, favicon de foco.
* Primary Dark: hover y estado activo.
* Primary Lighter: fondos de secciones y superficies suaves.
* Accent: detalles decorativos y señales de confianza.
* Blanco: fondos principales.
* Negro: títulos y texto principal.
* Gris: información secundaria.

No utilizar más de dos colores de marca en una misma vista.

---

# 5. Tipografía

## Fuente principal

Inter para todo el sistema. Sans geométrica, con excelente legibilidad en
pantalla y peso suficiente para jerarquía sin recurrir a serifas decorativas.

```text
Inter
```

## Fuente de marca

Playfair Display se reserva para el logotipo y los títulos editoriales de las
páginas de contenido (Nosotros, legales, contacto). No se usa en interfaz de
tienda, donde resta legibilidad a nombres de producto y precios.

```text
Playfair Display — solo marca y títulos editoriales
```

## Prohibido

Las interfaces de tienda no usan tipografías script, manuscritas ni display
exageradas. El logotipo es la única excepción.

## Jerarquía

La escala se define con `clamp()` en `globals.css` para que escale con el
viewport sin saltos entre breakpoints. Los pesos son 700 para títulos y 400/600
para texto, nunca 500 como peso de título.

### H1 — `.text-h1`

```text
clamp(2rem, 4vw, 3.25rem)   /* 32px – 52px */
font-weight: 700
line-height: 1.15
letter-spacing: -0.01em
```

### H2 — `.text-h2`

```text
clamp(1.625rem, 3vw, 2.5rem)   /* 26px – 40px */
font-weight: 700
line-height: 1.2
```

### H3 — `.text-h3`

```text
1.25rem – 1.5rem
font-weight: 600
line-height: 1.3
```

### Body — `.text-body`

```text
1rem
font-weight: 400
line-height: 1.7
```

### Body pequeño — `.text-body-sm`

```text
0.875rem
font-weight: 400
line-height: 1.6
```

### Caption / eyebrow — `.text-caption`

```text
0.75rem
text-transform: uppercase
letter-spacing: 0.18em
font-weight: 600
```

### Precio — `.text-price`

```text
1.125rem – 1.375rem
font-weight: 700
font-variant-numeric: tabular-nums
```

Los precios usan cifras tabulares para que las columnas de precios alineen
verticalmente en el grid de producto.

---

# 6. Layout general

El sitio debe utilizar un contenedor central.

```text
Desktop
max-width: 1280px
padding: 24px
```

En pantallas grandes:

```text
max-width: 1400px
```

En móvil:

```text
padding: 16px
```

---

# 7. Header

El Header es uno de los elementos más importantes.

Debe contener:

```text
┌─────────────────────────────────────────────────────┐
│ Logo        Categorías        Buscar       ♡  🛒    │
└─────────────────────────────────────────────────────┘
```

## Elementos

### Logo

Ubicación:

```text
izquierda
```

Debe tener suficiente espacio visual y no competir con el resto del contenido.

### Navegación

Categorías principales:

* Inicio
* Esplendida
* Cuidado facial
* Maquillaje
* Brochas
* Corporal
* Capilar
* Combos y Promos

La web actual utiliza precisamente esta estructura de navegación principal.

### Buscador

Debe permitir:

```text
Buscar productos
```

Placeholder:

```text
¿Qué estás buscando?
```

Debe tener:

* Campo amplio
* Icono de búsqueda
* Autocomplete opcional
* Resultados rápidos

### Iconos

Mostrar:

* Buscar
* Cuenta
* Favoritos
* Carrito

---

# 8. Header móvil

En móvil utilizar:

```text
☰   LOGO   🛒
```

Al abrir el menú:

```text
Inicio

Esplendida
Cuidado facial
Maquillaje
Brochas
Corporal
Capilar
Combos y Promos

----------------

Buscar
Mi cuenta
Mis pedidos
```

El menú debe ocupar aproximadamente el 80–90% del ancho de pantalla.

---

# 9. Hero Section

El Home debe comenzar con una sección visual de alto impacto.

## Estructura

```text
┌───────────────────────────────────────────────┐
│                                               │
│        NUEVA COLECCIÓN                        │
│                                               │
│        Descubre tu nuevo look                │
│                                               │
│        [ COMPRAR AHORA ]                     │
│                                               │
│                              PRODUCT IMAGE    │
│                                               │
└───────────────────────────────────────────────┘
```

## Características

* Imagen grande
* Texto corto
* CTA claro
* Alto contraste
* Diseño limpio

Evitar grandes cantidades de texto.

---

# 10. Sección Nueva Colección

La página actual destaca una sección de **Nueva Colección**, donde aparecen productos como cosmetiqueras, delineadores, beauty blenders, encrespadores y productos corporales.

Diseño recomendado:

```text
Nueva colección

[ Producto ] [ Producto ] [ Producto ] [ Producto ]
```

En desktop:

```text
4 productos
```

En tablet:

```text
3 productos
```

En móvil:

```text
2 productos
```

---

# 11. Product Card

La tarjeta de producto es el componente principal del e-commerce.

## Estructura

```text
┌────────────────────────┐
│                        │
│       PRODUCT IMAGE    │
│                        │
│                  ♡     │
├────────────────────────┤
│ MARCA                  │
│ Nombre del producto    │
│                        │
│ $29.900                │
│                        │
│ [ AGREGAR AL CARRITO ] │
└────────────────────────┘
```

## Imagen

Ratio recomendado:

```text
1:1
```

La imagen debe ocupar la mayor parte de la tarjeta.

## Nombre

Máximo:

```text
2 líneas
```

## Precio

Debe tener alta visibilidad.

Ejemplo:

```text
$29.900
```

## Precio anterior

Para promociones:

```text
$46.000
$29.900
```

El precio anterior debe aparecer tachado.

---

# 12. Estados de producto

Las tarjetas pueden incluir etiquetas:

```text
NUEVO
```

```text
MÁS VENDIDO
```

```text
OFERTA
```

```text
AGOTADO
```

Las etiquetas deben utilizarse de forma discreta.

---

# 13. Productos destacados

Crear una sección:

```text
MÁS VENDIDOS
```

La página actual utiliza esta sección para destacar productos como polvos, brilli brilli, splash, sombras, mantequillas corporales y lip gloss.

Diseño:

```text
MÁS VENDIDOS

[Producto] [Producto] [Producto] [Producto]
```

CTA:

```text
VER TODOS
```

---

# 14. Categorías

Crear una sección visual de categorías.

Categorías principales:

```text
CORPORAL
MAQUILLAJE
FACIAL
```

La página actual destaca estas tres categorías en el Home, con 91 productos corporales, 70 de maquillaje y 24 faciales en la información rastreada.

Diseño:

```text
┌──────────────────┐
│                  │
│     IMAGEN       │
│                  │
│    CORPORAL      │
│   91 productos   │
│                  │
└──────────────────┘
```

---

# 15. Categorías completas

La tienda debe soportar categorías y subcategorías.

Principales:

```text
Maquillaje
Cuidado facial
Corporal
Capilar
Brochas
Accesorios
Uñas
```

Subcategorías de maquillaje:

```text
Bases
Correctores
Polvos
Rubores
Iluminadores
Contornos
Sombras
Delineadores
Pestañinas
Labiales
Lip Gloss
Tinta de labios
```

La tienda actual posee una estructura amplia de categorías, incluyendo bases, cejas, contornos, iluminadores, labios, ojos, rostro, rubores, sombras y primers/fijadores.

---

# 16. Página de categoría

Ejemplo:

```text
MAQUILLAJE

Inicio / Maquillaje

[ Filtros ]          [ Ordenar por ]

┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│      │ │      │ │      │ │      │
│ IMG  │ │ IMG  │ │ IMG  │ │ IMG  │
│      │ │      │ │      │ │      │
└──────┘ └──────┘ └──────┘ └──────┘
```

## Filtros

Permitir filtrar por:

* Categoría
* Precio
* Marca
* Disponibilidad
* Color
* Tipo de producto

## Ordenamiento

```text
Más relevantes
Más vendidos
Precio menor a mayor
Precio mayor a menor
Más recientes
```

La tienda actual también ofrece opciones de ordenamiento por características, relevancia, ventas, alfabético, precio y fecha.

---

# 17. Página de producto

La página debe priorizar la conversión.

```text
┌──────────────────────┬───────────────────────────┐
│                      │ MARCA                     │
│                      │                           │
│   PRODUCT IMAGE      │ Nombre del producto       │
│                      │                           │
│                      │ $29.900                   │
│                      │                           │
│                      │ Seleccionar tono          │
│                      │                           │
│                      │ [-] 1 [+]                 │
│                      │                           │
│                      │ [ AGREGAR AL CARRITO ]    │
│                      │                           │
│                      │ ♡ Añadir a favoritos      │
└──────────────────────┴───────────────────────────┘
```

---

# 18. Galería del producto

Debe permitir:

* Imagen principal
* Miniaturas
* Zoom
* Cambio de imagen
* Swipe en móvil

Las fotografías deben tener fondo limpio y buena iluminación.

---

# 19. Botón principal

CTA principal:

```text
AGREGAR AL CARRITO
```

Características:

```text
background: #7B2CBF
color: white
border-radius: 8px
font-weight: 600
```

Hover:

```text
background: #5A189A
```

---

# 20. Carrito

El carrito debe aparecer como Drawer lateral en desktop.

```text
┌──────────────────────────┐
│ TU CARRITO            X  │
├──────────────────────────┤
│ Producto                 │
│ $29.900                  │
│ [-] 1 [+]                │
├──────────────────────────┤
│ Producto                 │
│ $22.000                  │
├──────────────────────────┤
│ Subtotal                 │
│ $51.900                  │
│                          │
│ [ IR AL CARRITO ]        │
│ [ FINALIZAR COMPRA ]     │
└──────────────────────────┘
```

---

# 21. Promociones

Las promociones deben tener una jerarquía visual fuerte.

Ejemplo:

```text
ANTES       AHORA

$46.000     $29.900
```

Mostrar además:

```text
-35%
```

No utilizar demasiados banners simultáneamente.

---

# 22. Combos

Crear sección:

```text
COMBOS Y PROMOS
```

Los combos deben mostrar:

* Productos incluidos
* Precio anterior
* Precio actual
* Porcentaje de descuento
* CTA

Ejemplo:

```text
COMBO GLOW

Incluye:
✓ Producto 1
✓ Producto 2
✓ Producto 3

$46.000 → $29.900

[ COMPRAR COMBO ]
```

---

# 23. Footer

Footer dividido por columnas.

```text
┌─────────────────────────────────────────────────┐
│ Esplendida                                         │
│ Belleza que te representa                      │
│                                                 │
│ CATEGORÍAS       INFORMACIÓN       AYUDA       │
│                                                 │
│ Maquillaje       Sobre nosotros     FAQ         │
│ Facial           Contacto           Envíos      │
│ Corporal         Tiendas            Devoluciones│
│ Capilar          Políticas          PQRS        │
│                                                 │
│                 REDES SOCIALES                  │
│                                                 │
│                © Esplendida MAKEUP                 │
└─────────────────────────────────────────────────┘
```

La estructura actual incluye categorías, políticas de envío, devoluciones, privacidad, cookies, términos y condiciones, además de enlaces de contacto, preguntas frecuentes y tiendas.

---

# 24. Contacto

Mostrar claramente:

```text

```

WhatsApp:

```text
+57 300 325 6677
```

Horario PQRS:

```text
Lunes a viernes
09:00 a.m. – 6:00 p.m.
```

Actualmente la tienda informa que no tiene atención los sábados, domingos y festivos.

---

# 25. WhatsApp

Agregar botón flotante.

Desktop:

```text
                         ┌─────┐
                         │ WA  │
                         └─────┘
```

Móvil:

```text
┌─────────────────────────────┐
│ 💬 ¿Necesitas ayuda?        │
│ Habla con nosotros          │
└─────────────────────────────┘
```

Debe permanecer visible pero no bloquear contenido.

---

# 26. Responsive Design

## Desktop

```text
≥ 1200px
```

Product grid:

```text
4 columnas
```

## Tablet

```text
768px – 1199px
```

Product grid:

```text
3 columnas
```

## Mobile

```text
< 768px
```

Product grid:

```text
2 columnas
```

---

# 27. Mobile UX

Prioridades:

1. Buscar producto
2. Navegar categorías
3. Agregar al carrito
4. Consultar producto
5. Comprar

Los botones deben tener un área táctil mínima de aproximadamente:

```text
44px
```

---

# 28. Espaciado

Utilizar sistema de 8px.

```text
8px
16px
24px
32px
40px
48px
64px
80px
```

Evitar valores aleatorios.

---

# 29. Border Radius

Utilizar bordes suaves.

Cards:

```text
12px
```

Botones:

```text
8px
```

Inputs:

```text
8px
```

Badges:

```text
999px
```

---

# 30. Sombras

Utilizar sombras muy suaves.

```css
box-shadow:
0 4px 20px rgba(0, 0, 0, 0.06);
```

Evitar sombras pesadas.

---

# 31. Animaciones

Las animaciones deben ser sutiles.

Hover de producto:

```text
scale: 1.02
```

Duración:

```text
200ms
```

Botones:

```text
150–200ms
```

Drawer:

```text
250–300ms
```

No utilizar animaciones excesivas.

---

# 32. Estados

Todos los componentes interactivos deben contemplar:

```text
Default
Hover
Focus
Active
Disabled
Loading
Error
Success
```

---

# 33. Loading

Para productos utilizar Skeleton Loading.

```text
┌──────────────┐
│ ████████████ │
│ ████████████ │
│              │
│ █████████    │
│ ██████       │
└──────────────┘
```

Evitar spinners grandes.

---

# 34. Accesibilidad

Debe cumplir buenas prácticas WCAG.

Requisitos:

* Contraste suficiente
* Navegación mediante teclado
* Labels en formularios
* Alt text en imágenes
* Focus visible
* Botones correctamente identificados
* No depender exclusivamente del color

---

# 35. SEO

Cada producto debe tener:

```text
<title>
<meta description>
URL amigable
H1 único
Schema Product
Schema Breadcrumb
```

Ejemplo:

```text

```

---

# 36. Arquitectura visual del Home

Orden recomendado:

```text
HEADER

HERO

NUEVA COLECCIÓN

MÁS VENDIDOS

CATEGORÍAS

BANNER PROMOCIONAL

MAQUILLAJE

CUIDADO FACIAL

CORPORAL

COMBOS Y PROMOS

NEWSLETTER

FOOTER
```

---

# 37. Componentes reutilizables

El frontend debe construirse utilizando componentes reutilizables.

```text
Header
MobileMenu
SearchBar
Hero
CategoryCard
ProductCard
ProductGrid
ProductBadge
Price
Rating
AddToCartButton
CartDrawer
QuantitySelector
ProductGallery
ProductInfo
FilterSidebar
SortSelect
PromoBanner
Newsletter
Footer
WhatsAppButton
```

---

# 38. Estructura recomendada del frontend

```text
src/
├── components/
│   ├── layout/
│   │   ├── Header
│   │   ├── Footer
│   │   └── MobileMenu
│   │
│   ├── product/
│   │   ├── ProductCard
│   │   ├── ProductGrid
│   │   ├── ProductGallery
│   │   └── ProductInfo
│   │
│   ├── cart/
│   │   ├── CartDrawer
│   │   └── CartItem
│   │
│   ├── home/
│   │   ├── Hero
│   │   ├── Categories
│   │   ├── FeaturedProducts
│   │   └── PromoBanner
│   │
│   └── ui/
│       ├── Button
│       ├── Badge
│       ├── Input
│       └── Skeleton
│
├── pages/
│   ├── Home
│   ├── Products
│   ├── ProductDetail
│   ├── Cart
│   └── Checkout
│
├── data/
├── hooks/
├── services/
├── styles/
└── utils/
```

---

# 39. Principios de diseño

## 1. Producto primero

Las fotografías deben tener protagonismo.

## 2. Menos texto

La tienda vende productos visuales. Priorizar:

```text
Imagen
Nombre
Precio
Oferta
CTA
```

## 3. Navegación sencilla

El usuario debe encontrar un producto en pocos pasos.

## 4. Mobile first

La experiencia móvil debe considerarse desde el inicio.

## 5. Conversión

Cada sección debe tener un propósito comercial.

## 6. Consistencia

Los componentes deben reutilizarse.

---

# 40. Referencia del catálogo actual

La tienda cuenta con un catálogo amplio de productos y múltiples categorías. La página de productos muestra categorías relacionadas con maquillaje, rostro, ojos, labios, cuidado facial, corporal, capilar y accesorios.

Por tanto, el diseño debe estar preparado para manejar un catálogo grande sin perder rendimiento ni facilidad de navegación.

---

# 41. Objetivo final

El resultado debe sentirse como:

> **Una tienda de belleza moderna, visual y fácil de comprar, donde el producto sea siempre el protagonista.**

La interfaz debe combinar:

```text
Esplendida
   +
E-COMMERCE MODERNO
   +
EXPERIENCIA MOBILE
   +
CONVERSIÓN
```

El diseño no debe copiar literalmente la implementación existente, sino tomarla como referencia funcional y evolucionarla hacia una experiencia más moderna, rápida y consistente.
