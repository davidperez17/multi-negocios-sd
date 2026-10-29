# Landing personalizable del taller — diseño

Fecha: 2026-10-28 · Estado: listo para aprobación
Bocetos aprobados en la sesión: `.superpowers/brainstorm/453068-1793232672/content/landing-v3.html` y `ajustes-v1.html` (no versionados; las capturas de referencia se describen abajo).

## Intención y por qué

La página pública de cada taller (`/t/[slug]`) la abre casi siempre el **cliente final** (dueño del vehículo) desde un link que le mandaron por WhatsApp, en el celular. Viene a una sola cosa: **ver cómo va su carro con el código que le dio el taller**. Todo lo demás en la página existe para que esa acción se sienta confiable y del taller, no de una plataforma genérica.

El usuario pidió más personalización para los talleres, diseñada "como un UX/UI senior enfocado a conectar con el cliente final". En la conversación se aclaró que:

- **Muchos talleres no tienen un local bonito**: no quieren fotos de fondo. La página debe verse completa y profesional **sin ninguna foto**.
- Si suben una foto, es **solo del local**, y va **junto a la dirección** para que el cliente reconozca el lugar ("sí, aquí dejé mi carro") y lo encuentre.
- **La mayoría no tiene logo**, solo su nombre en un rótulo. Sin logo se muestra **solo el nombre en letras** (sin recuadro de iniciales ni espacio de logo).
- La consulta sigue siendo **con el código** que da el taller (`TX-XXXXXX`), no con la placa (la placa es pública y expondría el carro de cualquiera).

Éxito = el cliente entiende en 2 segundos qué hacer, consulta su carro sin llamar, y percibe al taller como serio aunque el taller no haya subido nada.

## Metas

1. Rediseñar `/t/[slug]` mobile-first alrededor de una sola acción: consultar con el código.
2. Dar al dueño, desde Ajustes, control sobre cómo se ve su página: color (ya existe), estilo de fondo del encabezado, logo opcional, foto del local opcional, año de apertura, lema, mostrar/ocultar carros entregados, horario estructurado.
3. Que la página muestre "Abierto ahora · cierra 6:00 p. m." / "Cerrado · abre mañana 8:00 a. m." en hora de Guatemala.
4. Reorganizar Ajustes en pestañas con vista previa en vivo.

## No-metas

- Constructor de páginas libre (arrastrar bloques, secciones a elección, textos por sección).
- Fotos de fondo, galerías, carruseles de trabajos.
- Reseñas o testimonios (no hay datos reales; inventarlos es una anti-meta).
- Dominio propio por taller o subdominios.
- Modo oscuro de la landing.
- Cambiar la página de seguimiento (`/t/[slug]/seguimiento/[code]`) más allá de heredar el estilo de fondo si el builder lo considera trivial.

## Anti-metas (fracaso aunque funcione)

- Una página que se ve vacía, rota o "de plantilla" cuando el taller no subió logo ni foto.
- Cualquier dato de confianza falso o inflado (el contador de carros debe salir de órdenes reales).
- El cliché que `PRODUCT.md` prohíbe: negro grasa + naranja + tipografías "heavy duty".
- Que el formulario del código pierda protagonismo frente a decoración.
- Texto ilegible sobre el fondo del encabezado en cualquier combinación color × estilo.
- Exponer información del carro sin el código (sigue igual que hoy).

## La página pública (decidido)

Orden en celular (boceto `landing-v3`):

1. **Encabezado** con el fondo elegido (color de marca + estilo):
   - Izquierda: **con logo**, el logo en un contenedor cuadrado pequeño **junto al nombre** (como el boceto "con logo"); el logo va sobre una placa clara para que logos oscuros o transparentes se vean sobre el color de marca. **Sin logo**, solo **el nombre del taller en letras** (wordmark, Geist 800), sin recuadro ni iniciales. El nombre siempre está en el texto (lectores de pantalla y `<title>`). *(Decidido por el boceto aprobado.)*
   - Derecha: botón **WhatsApp** (si el taller tiene WhatsApp).
   - Chip de estado: "Abierto ahora · cierra 6:00 p. m." / "Cerrado · abre el lunes 8:00 a. m.". Si el taller no configuró horario, no se muestra el chip.
   - Título **"¿Cómo va tu carro?"** y una línea: "Pon el código que te dimos al recibirlo y mira avances, fotos y costos."
   - Tarjeta de consulta: etiqueta visible "Código de seguimiento"; campo con **prefijo fijo `TX-`** para teclear solo 6 caracteres; mayúsculas automáticas, sin autocorrector; si pegan el código completo o el link de seguimiento, se extrae el código. Botón **"Ver mi carro"** (con estado de carga). Debajo: "¿No tienes tu código? **Pídelo por WhatsApp**" (link a wa.me con texto prellenado; si no hay WhatsApp, usar teléfono).
   - **Señales de confianza** (dos recuadros bajo la tarjeta, cada uno solo si hay dato): "**312** carros entregados" (conteo real de órdenes `DELIVERED` del tenant, solo si el dueño lo activó) y "**Desde 1998**" (+ zona/ciudad si existe).
2. **Lo que hacemos**: el **lema** como subtítulo y la **descripción** como párrafo corto (ambos opcionales), luego servicios como etiquetas + tipos de vehículo ("Carros y camiones"). Se oculta la sección completa si no hay lema, descripción ni servicios. El lema y la descripción también alimentan la vista previa del link al compartirlo por WhatsApp (metadatos Open Graph). *(Mi decisión.)*
3. **Visítanos**: foto del local (si existe) → dirección → botones **Google Maps** y **Waze** → horario por día. Sin foto, la dirección va en un bloque con ícono de ubicación.
4. Pie: "Impulsado por TallerLink".

Se **quita** la sección "Así de simple" (3 pasos): el cliente que llega ya tiene su código.

**Palabra según el vehículo** *(mi decisión)*: los textos dicen "carro" por defecto ("¿Cómo va tu carro?", "Ver mi carro", "carros entregados"). Si el taller atiende **solo motos** dicen "moto"; **solo camiones**, "camión". Se resuelve en una función pura con tests, reutilizando `VEHICLE_TYPE_*` de `src/lib/status.ts`.

**Fondo del encabezado**: 4 estilos, todos con el color de marca: **Liso**, **Degradado**, **Puntos**, **Líneas**. Los patrones son CSS (sin imágenes) y sutiles; el texto blanco debe cumplir 4.5:1 en todas las combinaciones (el color ya se oscurece al guardar si no llega a 4.5:1; el patrón no debe bajar el contraste efectivo).

## Ajustes (decidido)

Boceto `ajustes-v1`. Ajustes pasa de un formulario largo a **tres pestañas**:

- **Mi página**: Apariencia (color: los 8 sugeridos + "Otro color", ya existe; fondo del encabezado: 4 opciones) · Fotos opcionales (Logo: "Si no tienes, mostramos tu nombre en letras"; Foto del local: en celular el botón dice "Tomar o subir foto" y abre la cámara) · Confianza (año de apertura, lema, casilla "Mostrar cuántos carros hemos entregado (N)") · Horario (interruptor abierto/cerrado por día, hora de apertura y cierre, acción "Copiar el horario del lunes a toda la semana").
- **Contacto**: WhatsApp, teléfono, correo, dirección, ciudad, link de Google Maps opcional.
- **Servicios**: servicios como etiquetas que se agregan y quitan; tipos de vehículo que atiende; descripción.

**Vista previa en vivo**: en escritorio, a la derecha, un celular con la página que se actualiza al cambiar color, fondo, logo, foto, nombre/lema y horario (sin guardar). En celular, botón "Ver cómo queda" que abre la vista previa. Guardar sigue siendo explícito.

Solo ADMIN puede editar (STAFF ve en solo lectura, como hoy).

## Restricciones

- Stack existente: Next.js App Router, Tailwind v4, Prisma + SQLite (`db push`, sin migraciones), server actions delgados con lógica en `src/lib/` y tests vitest con DB desechable. TDD como en el resto del repo.
- Seguir `CLAUDE.md`: toda query filtra por `tenantId` de la sesión; `brandColor` solo OKLCH vía `tenantThemeVars()`/`safeBrandColor()`; nada de CSS crudo del usuario en `style`.
- `DESIGN.md` / `PRODUCT.md`: una sola familia (Geist), mobile-first a 360–390px, contraste AA, `prefers-reduced-motion`, íconos Lucide (sin emojis), toques ≥44px. La landing es registro "brand" (Committed con el color del tenant).
- Lineamientos ui-ux-pro-max aplicados: patrón "Minimal Single Column" (una acción, grande, primero), contacto visible arriba, etiquetas visibles en formularios, sin emojis como íconos. Se descartaron su paleta naranja y la tipografía Lexend por chocar con `PRODUCT.md`/`DESIGN.md`.
- Imágenes subidas: validar por magic bytes como `src/lib/uploads.ts` (JPEG/PNG/WebP), límite de tamaño, nombre aleatorio, una carpeta por tenant. Reemplazar o quitar un logo/foto debe borrar el archivo anterior.
- Hora: todo cálculo de "abierto ahora" en `America/Guatemala`.

## Datos (decidido a alto nivel)

En `Tenant`: `logoUrl` (ya existe, sin uso), `storefrontPhotoUrl`, `heroStyle` (`SOLID | GRADIENT | DOTS | LINES`, default `GRADIENT` para parecerse a la landing actual), `foundedYear`, `showDeliveredCount`, `mapsUrl`, y un horario estructurado por día que reemplaza al texto libre `schedule`.

## Horario sin configurar *(mi decisión)*

El horario estructurado tiene un estado explícito **"sin horario por día"** (null), que es el default para todos los talleres existentes y nuevos. En Ajustes, la sección Horario muestra un interruptor **"Usar horario por día"** apagado; mientras esté apagado, el editor por día no se muestra, se conserva el texto libre actual y guardar Ajustes **no** escribe horario. **Cierre al mediodía (decidido por el usuario):** cada día puede tener **uno o dos tramos** (p. ej. 8:00–12:00 y 14:00–18:00). En el editor, cada día abierto tiene un tramo y la acción "Agregar cierre al mediodía" que lo parte en dos; "Copiar el horario del lunes a toda la semana" copia también el segundo tramo. El chip de la página muestra "Abierto ahora · cierra 12:00 p. m.", "Cerrado al mediodía · abre 2:00 p. m.", "Cerrado · abre mañana 8:00 a. m." o "Cerrado · abre el lunes 8:00 a. m.". Visítanos lista los tramos ("8:00 a. m. – 12:00 p. m. · 2:00 – 6:00 p. m."). Validación: tramos dentro del día, inicio < fin, sin traslape.

Al encenderlo aparecen los días con valores sugeridos (Lun–Vie 8:00–18:00, Sáb 8:00–13:00, Dom cerrado) que el dueño revisa antes de guardar. Así nunca se publica un "Abierto ahora" que el dueño no configuró. No se intenta interpretar el texto libre viejo.

## Compatibilidad

- Talleres existentes (demo y registrados) con `schedule` en texto libre: hasta que el dueño configure el horario estructurado, la página muestra el texto viejo en Visítanos y **no** muestra el chip "Abierto ahora".
- Sin `heroStyle` guardado → default. Sin logo/foto → variantes sin imagen.
- El seed debe quedar con datos que luzcan bien (al menos un taller con horario estructurado y año de apertura).

## Lo que queda al constructor

- Forma exacta de guardar el horario (JSON en una columna vs tabla), siempre que admita 1–2 tramos por día y la lógica de "abierto ahora" sea una función pura testeada (tramos partidos, días cerrados, "abre mañana/el lunes", último tramo del día).
- Diseño fino de los patrones Puntos/Líneas, espaciados, tamaños, animaciones de entrada (respetando reduced-motion).
- Cómo se arma el link de Waze (búsqueda por dirección) y de Google Maps (usar `mapsUrl` si existe; si no, búsqueda por dirección + ciudad).
- Recorte/redimensionado de imágenes (el logo se muestra en un contenedor fijo; la foto del local con `object-cover` y relación de aspecto fija).
- Si la vista previa reutiliza los mismos componentes de la landing (recomendado) o una versión reducida.
- Versión escritorio de la landing (dos columnas como hoy es aceptable) siempre que celular sea la prioridad.

## Mis decisiones (para revisar)

- Quitar "Así de simple".
- Prefijo fijo `TX-` en el campo del código.
- Contador de carros entregados con casilla para ocultarlo (talleres nuevos con pocos carros).
- "Pídelo por WhatsApp" bajo el botón.
- Pestañas Mi página / Contacto / Servicios, horario dentro de "Mi página" porque se muestra en la página.
- Default de fondo: Degradado.
- Logo junto al nombre con placa clara; lema y descripción en "Lo que hacemos" y en la vista previa de WhatsApp.
- "carro/moto/camión" según los tipos de vehículo del taller.
- Horario por día apagado por defecto ("Usar horario por día").
