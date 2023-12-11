// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  modularizeImports: {
    "@mui/material": {
      transform: "@mui/material/{{member}}",
    },
    "@mui/joy": {
      transform: "@mui/joy/{{member}}",
    },
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
    "@mui/lab": {
      transform: "@mui/lab/{{member}}",
    },
  },
  images: {
    domains: ["storage.googleapis.com"],
    minimumCacheTTL: 1500000,
  },
  compiler: {
    removeConsole: false,
  },
};

module.exports = nextConfig;
