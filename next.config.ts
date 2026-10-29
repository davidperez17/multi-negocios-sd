import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oculta el botón flotante "N" de Next.js dev tools: tapaba contenido
  // al probar en móvil. Solo afecta desarrollo; en producción no existe.
  devIndicators: false,
  experimental: {
    // Fotos hasta 5 MB (PHOTO_MAX_BYTES); Ajustes puede mandar logo (2 MB) + foto del local juntos.
    // El default de Next (1 MB) rechazaba fotos normales de celular.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
