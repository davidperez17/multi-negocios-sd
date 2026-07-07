import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oculta el botón flotante "N" de Next.js dev tools: tapaba contenido
  // al probar en móvil. Solo afecta desarrollo; en producción no existe.
  devIndicators: false,
};

export default nextConfig;
