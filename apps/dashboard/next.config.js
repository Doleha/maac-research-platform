/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@maac/types'],
  output: 'standalone',
};

module.exports = nextConfig;
