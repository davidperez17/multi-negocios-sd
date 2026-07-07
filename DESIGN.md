# Design

Mood: **bahía de servicio calibrada** — luz blanca de inspección, herramienta ordenada, presupuesto claro sobre la mesa. La calidez y la identidad viven en el color de marca y el branding del tenant, nunca en el fondo.

## Theme

- Modo claro. El personal del taller trabaja bajo luz de día/neón en mostrador; los clientes consultan al aire libre desde el celular. Luz ambiente alta → superficie blanca pura.
- Estrategia de color: **Restrained** en el admin (neutrales + primario ≤10%); la landing pública puede subir a **Committed** con el color del tenant en el hero.

## Colors (OKLCH only)

```css
:root {
  --bg: oklch(1 0 0);                     /* blanco puro */
  --surface: oklch(0.967 0.005 340);      /* paneles, cards */
  --surface-2: oklch(0.94 0.008 340);     /* sidebar, toolbar */
  --ink: oklch(0.185 0.015 340);          /* texto cuerpo, ≥7:1 vs bg */
  --muted: oklch(0.46 0.012 340);         /* texto secundario, ≥4.5:1 */
  --border: oklch(0.9 0.008 340);

  --primary: oklch(0.5 0.2 340);          /* magenta-plum; texto blanco encima */
  --primary-hover: oklch(0.45 0.2 340);
  --primary-soft: oklch(0.96 0.03 340);   /* fondos tenue de selección */

  --accent: oklch(0.85 0.1 195);          /* teal claro; texto ink encima */
  --accent-ink: oklch(0.3 0.09 200);

  /* Estados de orden de servicio (icono + etiqueta siempre, nunca solo color) */
  --status-received: oklch(0.46 0.012 340);
  --status-progress: oklch(0.5 0.16 250);   /* azul; texto blanco */
  --status-waiting: oklch(0.78 0.14 80);    /* ámbar; texto ink oscuro */
  --status-ready: oklch(0.55 0.15 150);     /* verde; texto blanco */
  --status-delivered: oklch(0.46 0.012 340);
  --danger: oklch(0.55 0.2 25);             /* texto blanco */
}
```

- Tenant puede sobreescribir `--primary` en su landing pública (branding propio); el admin de la plataforma mantiene el plum.
- Texto blanco sobre cualquier fill saturado de L 0.42–0.78 (botones, pills). Texto oscuro solo sobre fills pálidos (L > 0.85).

## Typography

- **Una sola familia: Geist Sans** (incluida con Next.js), pesos 400/500/600/800. Sin pareja display; la landing usa 800 a gran escala.
- Escala fija rem (product): 0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25.
- Landing (brand): hero con clamp, techo ≤ 5rem; `text-wrap: balance` en h1–h3.
- Datos tabulares y códigos de seguimiento: `font-variant-numeric: tabular-nums`; código de tracking en Geist Mono.
- Line-height cuerpo 1.6; prosa máx 70ch.

## Spacing & Layout

- Escala de 4px: 4/8/12/16/24/32/48/64.
- Admin: sidebar fija (colapsa a barra inferior en móvil) + área de contenido max-w-6xl. Tablas densas permitidas.
- Landing pública: secciones a ancho completo, contenido max-w-5xl, mobile-first a 390px.
- Radios: 8px controles, 12px cards, pills full. Z-scale semántica: dropdown 10 < sticky 20 < backdrop 30 < modal 40 < toast 50 < tooltip 60.

## Components

- **StatusPill**: fondo del estado + icono + etiqueta. Nunca solo color.
- **Stepper de orden**: Recibido → Diagnóstico → Aprobación → En reparación → Control de calidad → Listo → Entregado. Vertical en móvil, horizontal en desktop.
- **Timeline de avances**: hora + nota + foto opcional; el más reciente resaltado.
- **Desglose de costos**: tabla con mano de obra / repuestos, subtotales, total en tabular-nums.
- Todo interactivo con estados: default, hover, focus-visible, active, disabled, loading.
- Loading: skeletons, no spinners centrados. Empty states que enseñan la acción siguiente.

## Motion

- 150–250 ms, ease-out-quart. Motion = estado (cambio de status, nuevo avance entrante), no decoración.
- Página de seguimiento: al llegar un avance nuevo por polling, el item entra con fade+rise 200 ms y highlight tenue que decae.
- Sin secuencias orquestadas de carga en el admin. `prefers-reduced-motion` → crossfade instantáneo.
