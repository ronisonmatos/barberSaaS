import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Upload de logo (configuracoes/actions.ts) aceita ate 5MB; margem extra pro overhead
      // do multipart/form-data (boundaries, headers dos campos) descrito na doc do Next.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
