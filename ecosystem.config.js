module.exports = {
  apps: [
    {
      name: "fe-bookingroom",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
        PORT: 3031,

        // WAJIB & HARUS BENAR
        NEXTAUTH_URL: "http://192.168.130.105:3031",
        NEXTAUTH_SECRET: "dev_secret_replace_me",

        NEXT_PUBLIC_API_BASE_URL: "http://192.168.130.105:3031/api",

        // KEYCLOAK
        KEYCLOAK_CLIENT_ID: "e-booking",
        KEYCLOAK_CLIENT_SECRET: "1NMrIkPKdk9aoKd2rcdlqrhe8YwVTZEh",
        KEYCLOAK_ISSUER: "https://192.168.130.81/auth/realms/OBICOM",
        NEXT_PUBLIC_KEYCLOAK_ISSUER:
          "https://192.168.130.81/auth/realms/OBICOM",
        NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: "e-booking",

        // DB
        DATABASE_URL:
          "postgresql://it-apps:TempPass123!@192.168.130.105:5433/booking-room-staging?schema=public",

        // Portal API form get user data
        IAM_PORTAL_API_URL:"https://portal.obi.com/api",
        IAM_API_TIMEOUT:"5000"
      
      },
    },
  ],
};
