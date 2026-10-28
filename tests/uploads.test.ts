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
