import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Uncomment and update the following redirects if you choose to use Farcaster's Hosted Manifest service.
  // Currently, the app serves the local manifest from /public/.well-known/farcaster.json
  /*
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/YOUR_MANIFEST_ID', // Replace YOUR_MANIFEST_ID
        permanent: false,
      },
    ];
  },
  */
};

export default nextConfig;
