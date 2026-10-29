// URL pública de la app (env PUBLIC_URL). Next la necesita como metadataBase para que las
// imágenes de Open Graph (foto del local en la vista previa de WhatsApp) salgan con URL absoluta.
export function siteUrl(env: { PUBLIC_URL?: string } = { PUBLIC_URL: process.env.PUBLIC_URL }): URL | undefined {
  const raw = env.PUBLIC_URL?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}
