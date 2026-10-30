import { safeBrandColor } from "./validation";

// Sin imports de servidor: lo usan también componentes de cliente (vista previa de Ajustes).
/** Variables CSS que aplican el branding del tenant a su subtree público. */
export function tenantThemeVars(rawColor: string): React.CSSProperties {
  // Se escribe en atributos style: un valor inválido o con CSS extra cae al color por defecto
  const brandColor = safeBrandColor(rawColor);
  return {
    "--color-primary": brandColor,
    "--color-primary-hover": `color-mix(in oklch, ${brandColor} 88%, black)`,
    "--color-primary-soft": `color-mix(in oklch, ${brandColor} 8%, white)`,
  } as React.CSSProperties;
}
