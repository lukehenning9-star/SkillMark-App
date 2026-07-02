import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/auth surfaces out of search results.
      disallow: [
        "/messages",
        "/settings",
        "/onboarding",
        "/dashboard",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/api/",
      ],
    },
  };
}
