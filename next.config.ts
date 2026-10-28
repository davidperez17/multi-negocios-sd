import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oculta el botón flotante "N" de Next.js dev tools: tapaba contenido
  // al probar en móvil. Solo afecta desarrollo; en producción no existe.
  devIndicators: false,
  experimental: {
    // Fotos de avances hasta 5 MB (PHOTO_MAX_BYTES) + margen del multipart.
    // El default de Next (1 MB) rechazaba fotos normales de celular.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
