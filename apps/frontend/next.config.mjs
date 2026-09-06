/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  // The repository runs ESLint as an explicit workspace-wide verification gate.
  // Next 14's embedded runner does not understand this repository's flat config.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
