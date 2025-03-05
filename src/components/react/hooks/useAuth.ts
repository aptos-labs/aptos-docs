import { useStore } from "@nanostores/react";
import { getAuthStore } from "~/stores/auth";

export function useAuth() {
  const authStore = getAuthStore();
  const user = useStore(authStore.$user);
  const error = useStore(authStore.$error);
  const isLoading = useStore(authStore.$isLoading);

  return {
    user,
    error,
    isLoading,
    loginByGoogle: authStore.loginByGoogle,
    loginByGithub: authStore.loginByGithub,
    logout: authStore.logout,
  };
}
