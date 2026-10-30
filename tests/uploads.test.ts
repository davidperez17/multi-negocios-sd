import { describe, expect, it } from "vitest";
import { sniffImageType } from "@/lib/uploads";

const bytes = (...b: number[]) => Buffer.from(b);

describe("sniffImageType (magic bytes, no el MIME que manda el navegador)", () => {
  it("reconoce JPEG", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0))).toBe("jpg");
  });
  it("reconoce PNG", () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0))).toBe("png");
  });
  it("reconoce WebP", () => {
    expect(sniffImageType(Buffer.from("RIFF\x00\x00\x00\x00WEBPVP8 ", "latin1"))).toBe("webp");
  });
  it("rechaza HTML disfrazado de PNG", () => {
    expect(sniffImageType(Buffer.from("<html><script>alert(1)</script></html>"))).toBeNull();
  });
  it("rechaza SVG", () => {
    expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
  });
  it("rechaza RIFF que no es WebP (ej. WAV)", () => {
    expect(sniffImageType(Buffer.from("RIFF\x00\x00\x00\x00WAVEfmt ", "latin1"))).toBeNull();
  });
  it("rechaza archivos vacíos o cortos", () => {
    expect(sniffImageType(Buffer.alloc(0))).toBeNull();
    expect(sniffImageType(bytes(0xff, 0xd8))).toBeNull();
  });
});

describe("logo y foto del local", async () => {
  const { afterEach } = await import("vitest");
  const { existsSync, mkdirSync, rmSync, writeFileSync } = await import("node:fs");
  const path = await import("node:path");
  const { deleteTenantUpload, saveTenantImage } = await import("@/lib/uploads");

  const TENANT = "test-uploads-tenant";
  const dir = path.join(process.cwd(), "public", "uploads", TENANT);
  const pngOf = (size: number) => {
    const buf = Buffer.alloc(size);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf);
    return new File([buf], "x.png", { type: "image/png" });
  };
  const fileOf = (url: string) => path.join(process.cwd(), "public", url);

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("logo de 3 MB se rechaza; como foto del local se acepta", async () => {
    expect(await saveTenantImage(pngOf(3 * 1024 * 1024), TENANT, "logo")).toBeNull();
    const url = await saveTenantImage(pngOf(3 * 1024 * 1024), TENANT, "storefront");
    expect(url).toMatch(new RegExp(`^/uploads/${TENANT}/[0-9a-f-]+\\.png$`));
    expect(existsSync(fileOf(url!))).toBe(true);
  });

  it("borra un archivo propio del taller, y borrar dos veces no lanza", async () => {
    const url = (await saveTenantImage(pngOf(1000), TENANT, "logo"))!;
    await deleteTenantUpload(url, TENANT);
    expect(existsSync(fileOf(url))).toBe(false);
    await expect(deleteTenantUpload(url, TENANT)).resolves.toBeUndefined();
  });

  it("nunca borra fuera de la carpeta del taller", async () => {
    mkdirSync(dir, { recursive: true });
    const witness = path.join(process.cwd(), "public", "uploads", "otro-tenant-witness.png");
    writeFileSync(witness, "x");
    try {
      for (const url of [
        "/uploads/otro-tenant/x.png",
        `/uploads/${TENANT}/../otro-tenant-witness.png`,
        `/uploads/${TENANT}/../../package.json`,
        "https://evil/x.png",
        "",
      ]) {
        await deleteTenantUpload(url, TENANT);
      }
      await deleteTenantUpload(null, TENANT);
      expect(existsSync(witness)).toBe(true);
      expect(existsSync(path.join(process.cwd(), "package.json"))).toBe(true);
    } finally {
      rmSync(witness, { force: true });
    }
  });
});
