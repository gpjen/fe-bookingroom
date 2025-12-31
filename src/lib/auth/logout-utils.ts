"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";

export const performLogout = async (session: Session | null) => {
  try {
    // Keys to preserve in localStorage and sessionStorage
    const keysToPreserve = ["app:lang", "app:theme", "app:themeMode"];
    
    // Function to selectively clear storage
    const selectivelyClearStorage = (storage: Storage) => {
      const itemsToKeep: { [key: string]: string } = {};
      
      // Preserve specific keys
      keysToPreserve.forEach(key => {
        const value = storage.getItem(key);
        if (value !== null) {
          itemsToKeep[key] = value;
        }
      });
      
      // Preserve all sidebar-group-* keys
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith("sidebar-group-")) {
          const value = storage.getItem(key);
          if (value !== null) {
            itemsToKeep[key] = value;
          }
        }
      }
      
      // Clear all
      storage.clear();
      
      // Restore preserved items
      for (const key in itemsToKeep) {
        storage.setItem(key, itemsToKeep[key]);
      }
    };

    // 1. Clear local and session storage selectively
    selectivelyClearStorage(localStorage);
    selectivelyClearStorage(sessionStorage);

    // 2. Clear all cookies for the current domain
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // 3. Get required data for Keycloak logout
    const issuerUrl = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
    const postLogoutRedirectUri = window.location.origin;

    // Validate environment variables
    if (!issuerUrl) {
      console.error("NEXT_PUBLIC_KEYCLOAK_ISSUER is not defined.");
      throw new Error("Keycloak Issuer URL is missing.");
    }
    if (!clientId) {
      console.error("NEXT_PUBLIC_KEYCLOAK_CLIENT_ID is not defined.");
      throw new Error("Keycloak Client ID is missing.");
    }

    // 4. Construct the OIDC logout URL
    const logoutUrl = new URL(`${issuerUrl}/protocol/openid-connect/logout`);
    logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
    logoutUrl.searchParams.set("client_id", clientId);
    
    const idToken = session?.idToken as string;
    if (idToken) {
      logoutUrl.searchParams.set("id_token_hint", idToken);
    } else {
      console.warn("idToken is missing from session. Keycloak logout might fail without it.");
    }

    console.log("Attempting Keycloak logout with URL:", logoutUrl.toString());

    // 5. Sign out from NextAuth first, without a redirect
    // This clears NextAuth's specific session cookie.
    try {
      await signOut({ redirect: false });
    } catch (signOutError) {
      console.error("Error during local NextAuth signOut:", signOutError);
    }

    // 6. Redirect the browser to Keycloak's logout URL
    window.location.href = logoutUrl.toString();

  } catch (error) {
    console.error("Critical error during performLogout:", error);
    // Fallback to simple local logout if there's a critical error
    await signOut({ callbackUrl: "/" });
  }
};
