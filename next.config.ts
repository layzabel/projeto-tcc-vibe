import type { NextConfig } from "next";

// Exportação estática: não há servidor próprio. Todo o app é HTML/JS/CSS
// servido como arquivos, e os dados ficam apenas no navegador.
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
