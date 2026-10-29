import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { LOGO_MAX_BYTES, PHOTO_MAX_BYTES } from "./tenant-settings-limits";

export { LOGO_MAX_BYTES, PHOTO_MAX_BYTES };

/**
 * Tipo real de la imagen por sus primeros bytes. El MIME del form lo controla el cliente,
 * así que no sirve para decidir qué se guarda en public/.
 */
export function sniffImageType(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP") return "webp";
  return null;
}

/** Guarda la foto de un avance. Devuelve la URL pública o null si no es una imagen válida. */
export async function savePhoto(file: File, tenantId: string, maxBytes = PHOTO_MAX_BYTES): Promise<string | null> {
  if (file.size === 0 || file.size > maxBytes) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffImageType(buf);
  if (!ext) return null;
  const dir = path.join(process.cwd(), "public", "uploads", tenantId);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${tenantId}/${name}`;
}

/** Logo (2 MB) o foto del local (5 MB) de la landing del taller. */
export function saveTenantImage(file: File, tenantId: string, kind: "logo" | "storefront"): Promise<string | null> {
  return savePhoto(file, tenantId, kind === "logo" ? LOGO_MAX_BYTES : PHOTO_MAX_BYTES);
}

/**
 * Borra una imagen reemplazada. Solo acepta URLs con la forma exacta que genera savePhoto
 * dentro de la carpeta del taller: cualquier otra cosa (otro taller, "..", URLs externas) se ignora.
 */
export async function deleteTenantUpload(url: string | null, tenantId: string): Promise<void> {
  if (!url) return;
  const m = url.match(/^\/uploads\/([^/]+)\/([0-9a-f-]+\.(?:jpg|png|webp))$/);
  if (!m || m[1] !== tenantId) return;
  await rm(path.join(process.cwd(), "public", "uploads", tenantId, m[2]), { force: true });
}
