import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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
export async function savePhoto(file: File, tenantId: string): Promise<string | null> {
  if (file.size === 0 || file.size > PHOTO_MAX_BYTES) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffImageType(buf);
  if (!ext) return null;
  const dir = path.join(process.cwd(), "public", "uploads", tenantId);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${tenantId}/${name}`;
}
