/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Disable webpack filesystem caching to resolve persistent ENOENT warnings
    // caused by path resolution bugs in the Next.js font loader.
    config.cache = false;
    return config;
  },
};

export default nextConfig;
