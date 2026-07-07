# Product

## Register

product

## Users

- **Dueños y personal de talleres** (mecánicos, recepcionistas, administradores) de vehículos: carros, motos y camiones. Usan la app en mostrador y taller, a menudo en tablet o desktop con manos ocupadas — necesitan flujos rápidos, densos y sin fricción. Su trabajo: registrar órdenes de servicio, actualizar avances, gestionar costos y clientes.
- **Clientes finales del taller** (dueños de vehículos). Usan la landing pública del taller desde el celular para consultar el estado de su vehículo en tiempo real — avances, costos, fecha estimada — sin llamar al taller. Contexto: ansiedad por su vehículo, cero paciencia para interfaces confusas.

## Product Purpose

SaaS multi-tenant para talleres de vehículos. Cada taller (tenant) administra todo su negocio desde la app: órdenes de servicio, clientes, vehículos, costos y avances. Cada tenant recibe su propia landing pública con branding propio donde sus clientes consultan la reparación en tiempo real mediante un código de seguimiento.

Éxito = el teléfono del taller deja de sonar con "¿ya está mi carro?". El cliente confía porque ve avances y costos transparentes; el taller ahorra tiempo y proyecta profesionalismo.

MVP:
1. Admin del taller: órdenes de servicio con estados, avances publicables, desglose de costos, clientes y vehículos.
2. Landing pública por tenant con buscador de código de seguimiento.
3. Página de seguimiento en tiempo real: stepper de estado, timeline de avances, costos.

## Brand Personality

Precisa, transparente, moderna. Como un taller impecable donde las herramientas están ordenadas y el presupuesto se explica sin letra chica. Evoca confianza mediante claridad, no mediante estética "ruda" de taller.

## Anti-references

- Cliché de taller: negro grasa + naranja + texturas metálicas + tipografías "heavy duty". Este producto es software de gestión, no un póster de llantas.
- SaaS genérico AI: fondos crema, gradientes en texto, grids de cards idénticas, hero-metric templates.
- Portales de tracking tipo paquetería genérica: fríos, sin identidad del taller.

## Design Principles

1. **El estado del vehículo es el héroe.** En la página de seguimiento, el cliente debe entender en 2 segundos dónde está su vehículo y qué sigue.
2. **Transparencia como diseño.** Costos siempre desglosados, avances con fecha y hora. Nada oculto tras clics.
3. **Cada tenant se ve suyo.** La landing lleva nombre, logo y color del taller; la plataforma se hace invisible.
4. **Densidad al servicio del taller.** El admin es una herramienta de trabajo: tablas densas, acciones a un clic, familiaridad tipo Linear/Notion, cero decoración gratuita.
5. **Mobile-first en lo público.** El cliente consulta desde el celular; la landing y el seguimiento se diseñan primero a 390px.

## Accessibility & Inclusion

- WCAG AA: contraste cuerpo ≥4.5:1, focus visible en todo interactivo.
- Estados de orden distinguibles sin depender solo de color (icono + etiqueta).
- `prefers-reduced-motion` respetado en toda animación.
- Español como idioma primario de la UI.
