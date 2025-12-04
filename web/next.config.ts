import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-font-assets",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /\/_next\/static.+\.js$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static-js-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: /\.(?:mp3|wav|ogg)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-audio-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-style-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-data",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        // API calls - never cache, always fetch from network
        urlPattern: /\/api\/.*$/i,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "others",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',
  // Turbopack config to allow webpack-based PWA plugin
  turbopack: {},
};

export default withPWA(nextConfig);
