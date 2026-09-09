import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "foodie-ssi.shop",
        "www.foodie-ssi.shop",
        "*.up.railway.app",
        "*.vercel.app",
      ],
    },
  },
};

export default withNextIntl(nextConfig);
