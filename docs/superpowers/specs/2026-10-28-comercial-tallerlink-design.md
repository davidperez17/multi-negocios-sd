# Comercial vertical de TallerLink — diseño

Fecha: 2026-10-28 · Estado: listo para aprobación

## Intención y por qué

Conseguir talleres que paguen **Q199 al mes** por TallerLink en **todo Chimaltenango**. El comercial se publica en redes sociales y le habla al dueño del taller desde una herida concreta: **no sabe qué está pasando en su taller cuando no está, y nada queda documentado** (papelitos, cuadernos, llamadas de "¿ya está mi carro?").

El video tiene que hacer tres cosas, en este orden:

1. Abrir la herida en los primeros 3 segundos para que el dueño deje de hacer scroll.
2. Enseñar en pasos simples que la app se usa fácil (con pantallas reales).
3. Llevarlo a una prueba gratis de 30 días donde crea su taller él solo.

Éxito = dueños de taller de Chimaltenango que terminan de verlo y se registran a la prueba.

## Lo que decidió el usuario

- Formato vertical 9:16 para redes sociales.
- Herramienta de video: **HyperFrames** (HeyGen, composiciones HTML/CSS/GSAP renderizadas a MP4).
- Voz en off **femenina generada con ElevenLabs**.
- **Hook A:** "¿Sabés qué está pasando ahorita en tu taller?"
- Dolor: el dueño no sabe qué pasa en su taller y necesita documentarlo todo.
- Precio Q199/mes, mercado: talleres de todo Chimaltenango.
- Enseñar a usar la app en pasos simples.
- Motion graphics, buena tipografía, efectos de sonido, y un personaje creado con **Higgsfield** si hace falta.
- Llamada a la acción: **demo gratis de 30 días**; el dueño agrega todo su taller en pocos pasos y empieza a registrar todo.
- El dueño se registra **él solo dentro de la app** (no por WhatsApp). Ese registro es un proyecto aparte (ver Dependencias).
- **Trabajadores con roles:** el taller tendrá trabajadores con su propio usuario y rol para registrar datos. Eso es lo que hace verdadero el hook: los mecánicos registran mientras el dueño no está.
- **Condiciones:** prueba **sin tarjeta**, el Q199 **no incluye IVA**, **sin cobro de instalación**.
- **Dominio:** aún no existe; tentativo **micomercio.app** (por definir).
- **Presupuesto de créditos:** usar lo que haya, ajustado. Al 2026-10-28: Higgsfield **179 créditos** (plan lite). ElevenLabs no expone saldo por el conector; se estima con `estimate_only` antes de generar.
- Orden acordado: diseñar el comercial → diseñar y construir el registro + publicar la app → producir el comercial al final.

## Metas

- Un MP4 vertical de **35 a 40 segundos**, listo para subir a TikTok, Instagram Reels y Facebook Reels.
- Que se entienda **sin sonido** (subtítulos siempre visibles) y que suene bien con sonido.
- Que cada pantalla de la app que aparece sea **real** (capturas o grabaciones de la app funcionando).
- Que suene a Guatemala: voseo chapín, natural, cercano.

## No-metas

- No es una campaña de pauta: no se configuran anuncios, públicos ni presupuestos.
- No se publica en las cuentas de redes del usuario (se entrega el archivo).
- No hay versión horizontal, ni cortes de 15 s, ni versión en otro idioma (pueden venir después).
- No se construye aquí el registro ni el despliegue de la app.

## Anti-metas (sería un fracaso aunque el video funcione)

- Mostrar pantallas inventadas o funciones que la app no tiene (facturación, inventario, contabilidad, app nativa). Solo lo que existe hoy: órdenes, estados, avances con foto, costos, link de seguimiento para el cliente, tablero.
- Acento mexicano o "neutro de doblaje" en vez de chapín.
- Que parezca anuncio genérico hecho con IA: stock reluciente, personaje con cara de plástico, texto con gradientes.
- El cliché de taller que `PRODUCT.md` prohíbe en la marca: negro grasa + naranja + tipografías "heavy duty". El taller puede verse en la imagen de fondo; los gráficos del comercial son de TallerLink.
- Texto que no se lee en un teléfono, o que queda tapado por los botones de TikTok/Reels.
- Prometer algo del precio o la prueba que no sea cierto al publicarse.

## Guion y estructura (~38 s)

Voz (V) en voseo. Tiempos aproximados; mandan la voz y el ritmo final.

| # | Tiempo | Imagen | Voz | Sonido |
|---|--------|--------|-----|--------|
| 1 Hook | 0–3 s | Lucía a cámara, plano cerrado, tono de pregunta directa. Texto cinético "¿Sabés qué está pasando **ahorita** en tu taller?" | "¿Sabés qué está pasando ahorita en tu taller?" | Vibración de teléfono antes de la primera palabra |
| 2 Problema | 3–7 s | Ráfaga: cuaderno manchado, papelitos, teléfono sonando "¿ya está mi carro?". Palabras sueltas golpean pantalla | "Si todo está en papelitos y llamadas, nada está bajo control." | Papel arrugándose, timbre de teléfono |
| 3 Marca | 7–10 s | Reveal del nombre TallerLink en el plum de la marca; el teléfono entra deslizándose | "Con TallerLink tenés todo tu taller en el celular." | Whoosh |
| 4 Paso 1 | 10–14 s | Pantalla real de nueva orden; zoom a placa y datos | "Paso uno: registrá el carro cuando entra." | Tap / click suave |
| 5 Paso 2 | 14–18 s | Pantalla real de la orden: cambia el estado (pill animado) y se sube una foto | "Paso dos: marcá el avance y subí una foto." | Obturador de cámara, pop del pill |
| 6 Paso 3 | 18–23 s | Pantalla real de seguimiento público del cliente | "Paso tres: tu cliente ve el avance solo, con su link. Ya no te llama." | Ding de notificación |
| 7 Payoff | 23–27 s | Tablero real con todos los carros; cierra la herida del hook | "Y vos sabés qué pasa en cada carro, desde donde estés." | Whoosh suave |
| 8 Precio | 27–31 s | "Q199" cae con impacto; debajo "al mes + IVA · sin instalación · talleres de todo Chimaltenango" | "Todo por Q199 al mes, para talleres de todo Chimaltenango." | Caja registradora / impacto |
| 9 Cierre | 31–38 s | Lucía a cámara + registro real en 3 toques (nombre del taller → tu usuario → primer carro). Texto "30 días gratis · sin tarjeta · luego Q199/mes + IVA", botón animado con el link, "link en la bio" | "Probalo gratis 30 días. Creá tu taller en pocos pasos y empezá a registrar todo hoy." | Whoosh al entrar el botón, ding al tocarlo, música sube y cierra |

## Personaje: Lucía

- Chapina de ~30 años, camisa de trabajo, fondo de taller real (ordenado, luz de día). Cara de la voz: aparece en hook (1) y cierre (9).
- Se crea en Higgsfield: una imagen base de referencia para mantener la misma cara, y de ella **2 clips cortos** (hook y cierre), por presupuesto.
- Debe verse como persona creíble de Chimaltenango, no modelo de catálogo.
- Si los clips no logran sincronía labial convincente, Lucía no "habla" en cámara: aparece reaccionando/mirando a cámara y la voz va en off. Mejor eso que labios desfasados.

## Dirección visual y de sonido

- 1080×1920, 30 fps, MP4 H.264 + audio AAC.
- Tipografía: **Geist Sans 800** para titulares cinéticos y 500/600 para subtítulos; **Geist Mono** para códigos (TX-…) y montos. Es la familia de la marca (DESIGN.md) y evita lo "heavy duty". *(Corrige mi propuesta anterior de una grotesca condensada pesada.)*
- Marca: no existe logo de TallerLink. *Mi decisión:* el reveal de la escena 3 usa la palabra "TallerLink" en Geist Sans 800, sin inventar un símbolo.
- Color: plum de la marca `oklch(0.5 0.2 340)` para marca, precio y CTA; teal `oklch(0.85 0.1 195)` como acento; colores de estado de DESIGN.md en el pill animado. Fondos de motion graphics claros u oscuros neutros, nunca naranja/negro grasa.
- Teléfono: marco simple de celular con las pantallas reales; entra deslizándose, zooms a la parte que la voz nombra.
- Subtítulos quemados siempre visibles, sincronizados a la voz, dentro de la zona segura.
- Zona segura: nada importante en los ~250 px de arriba ni en los ~420 px de abajo, ni en los ~140 px del lado derecho (botones de TikTok/Reels).
- Precio honesto: la voz dice "Q199 al mes"; en pantalla siempre va "+ IVA". *(Mi decisión: decir "más IVA" en voz frena el ritmo; el texto lo deja claro.)*
- Sonido: voz al frente; música suave de fondo que baja (ducking) bajo la voz y sube en el cierre; efectos de la tabla de arriba. Volumen final aprox. −14 LUFS.

## Recursos y herramientas

- **Voz:** ElevenLabs. El `voice_id` sale de `creative_list_voices` (voz femenina que suene natural en español latinoamericano; probar con una línea del guion antes de generar todo). Si ninguna suena chapina, se puede diseñar una voz con `creative_design_voice`.
- **Efectos de sonido:** ElevenLabs (`creative_generate_in_flow`) si el conector restringido los permite; si no, Higgsfield `generate_audio`.
- **Música:** el conector de ElevenLabs disponible **no genera música**. Usar Higgsfield `generate_audio` si produce música utilizable, o una pista libre de derechos con licencia para uso comercial en redes.
- **Personaje:** Higgsfield (imagen + video).
- **Pantallas de la app:** capturas/grabaciones reales con Playwright sobre la app con datos demo verosímiles de Chimaltenango (nombres, placas P-, teléfonos +502). Las del registro se toman cuando ese proyecto exista.
- **Créditos:** generar con ElevenLabs y Higgsfield gasta créditos del usuario. Se cotiza antes de cada tanda (quote / `estimate_only`) y se confirma con el usuario. Nunca se repite una generación "para reintentar" sin avisar.
- **Reparto del presupuesto Higgsfield (179 créditos), mi decisión:** 1 imagen base de Lucía + 2 clips (hook y cierre) en modo estándar y **sin audio** (la voz viene de ElevenLabs). Lucía **no habla en cámara** por defecto: mira a cámara y reacciona, voz en off. Solo si la cotización deja margen se intenta sincronía labial. El clip opcional de la escena 3 se elimina. Si los créditos no alcanzan ni para eso, se avisa antes de gastar y se propone recargar o usar solo motion graphics.

## Dónde vive

*Mi decisión:* carpeta `marketing/comercial-tallerlink/` en este repo, fuera del build de Next. Se versionan las composiciones HyperFrames, el guion y los scripts de captura; los medios pesados generados (audio, video, renders) quedan fuera de git y se entregan aparte.

## Dependencias

1. **Registro propio en la app** con 30 días de prueba sin tarjeta — proyecto separado, se diseña después de aprobar este documento.
2. **Trabajadores con usuario y rol** (el dueño los agrega a su taller). Hoy la app no tiene forma de crear usuarios fuera del seed. Sin esto el hook y la escena 7 prometerían algo que no existe. *Mi decisión:* entra en el diseño del proyecto de registro.
3. **App publicada con dominio** (tentativo micomercio.app) — el link del cierre debe funcionar. Las composiciones se pueden armar con un marcador, pero no se renderiza la versión final sin el dominio real.

**Toda la producción va al final** (orden acordado con el usuario): voz, Lucía, música, efectos y capturas se hacen cuando el registro y el despliegue estén listos. Así las capturas no quedan viejas y la voz se graba en una sola tanda con todas las líneas definitivas. *(Mi decisión, deriva del orden acordado.)*

*Mi decisión:* el registro "en 3 toques (nombre del taller → tu usuario → primer carro)" se pasa como **deseo** al diseño del proyecto de registro, no como requisito. La escena 9 se ajusta al flujo que finalmente se construya; si son más pasos, se muestran acelerados.

## Lo que queda al constructor

- Ritmo exacto, transiciones, curvas de animación y orden fino de cortes.
- Elección final de efectos y música dentro de lo descrito.
- Prompts de Higgsfield y elección de modelo.
- Cómo instalar y estructurar HyperFrames.
- Datos demo concretos para las capturas.

## Supuestos míos para confirmar

- La prueba no pide tarjeta, y el Q199 se cobra después de los 30 días.
- Duración 35–40 s.
- Lucía como personaje (el usuario dijo "si es necesario"; yo decidí que sí, como cara de la voz).
- El Q199 es por taller, sin importar cuántos trabajadores o carros tenga.
- El nombre en pantalla es "TallerLink" aunque el dominio tentativo sea micomercio.app; si la marca cambia, cambia el reveal.
- La cuenta que publica se decide al publicar; "link en la bio" asume que esa cuenta tendrá el link.
