<script setup lang="ts">
import { ref } from "vue";

useHead({
  title: "Create Account · klndr.",
});

const { signUp, loginWithGoogle, isConfigured } = useAuth();
const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref<string | null>(null);
const isSubmitting = ref(false);

const getFriendlyErrorMessage = (err: any) => {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) {
    return "An account with this email already exists. Please log in instead.";
  }
  if (code.includes("weak-password")) {
    return "Password is too weak. Please use at least 8 characters.";
  }
  if (code.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  return err.message || "Failed to create account. Please try again.";
};

const handleSignUp = async () => {
  error.value = null;

  if (!email.value || !password.value || !name.value) {
    error.value = "Please fill in all required fields.";
    return;
  }

  if (password.value.length < 8) {
    error.value = "Password must be at least 8 characters long.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  isSubmitting.value = true;
  try {
    await signUp(email.value.trim(), password.value, name.value.trim());
    router.push("/profile");
  } catch (err: any) {
    error.value = getFriendlyErrorMessage(err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleGoogleSignUp = async () => {
  error.value = null;
  isSubmitting.value = true;
  try {
    await loginWithGoogle();
    router.push("/profile");
  } catch (err: any) {
    error.value = getFriendlyErrorMessage(err);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="flex min-h-[calc(100vh-57px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 sm:p-7 shadow-xs">
      <div class="text-center">
        <NuxtLink to="/" class="inline-block text-2xl font-bold tracking-tight text-foreground">
          klndr.
        </NuxtLink>
        <h2 class="mt-3 text-lg font-semibold tracking-tight text-foreground">
          Create an account
        </h2>
        <p class="mt-1 text-xs sm:text-sm text-muted-foreground">
          Start time-blocking with klndr.
        </p>
      </div>

      <!-- Warning if Firebase is not yet configured -->
      <div
        v-if="!isConfigured"
        class="rounded-lg border border-amber-200/80 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-400/10 p-3 text-xs text-amber-900 dark:text-amber-200"
      >
        <p class="font-medium">Firebase credentials required for cloud signup</p>
        <p class="mt-0.5 text-amber-800 dark:text-amber-300">
          Set credentials in <code class="rounded bg-amber-100/70 dark:bg-amber-400/20 px-1 py-0.5 font-mono text-[11px]">.env</code> to activate cloud auth.
        </p>
      </div>

      <div
        v-if="error"
        class="flex items-center gap-2.5 rounded-lg border border-rose-200/80 bg-rose-50/80 dark:border-rose-400/25 dark:bg-rose-500/10 p-3 text-xs sm:text-sm font-medium text-rose-800 dark:text-rose-200"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v4M10 14h.01" stroke-linecap="round" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="handleSignUp">
        <div class="space-y-1.5">
          <label for="name" class="block text-xs sm:text-sm font-medium text-foreground">
            Full Name
          </label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            autocomplete="name"
            placeholder="Jane Doe"
            class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
          />
        </div>

        <div class="space-y-1.5">
          <label for="email" class="block text-xs sm:text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="you@example.com"
            class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
          />
        </div>

        <div class="space-y-1.5">
          <label for="password" class="block text-xs sm:text-sm font-medium text-foreground">
            Password (min 8 characters)
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
            placeholder="••••••••"
            class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
          />
        </div>

        <div class="space-y-1.5">
          <label for="confirm-password" class="block text-xs sm:text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            required
            autocomplete="new-password"
            placeholder="••••••••"
            class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
          />
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
        >
          <span v-if="isSubmitting">Creating account...</span>
          <span v-else>Create Account</span>
        </button>
      </form>

      <div class="relative my-3">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border" />
        </div>
        <div class="relative flex justify-center text-xs">
          <span class="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <button
        type="button"
        @click="handleGoogleSignUp"
        :disabled="isSubmitting"
        class="flex h-9 w-full items-center justify-center gap-2.5 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Sign up with Google
      </button>

      <p class="text-center text-xs sm:text-sm text-muted-foreground">
        Already have an account?
        <NuxtLink to="/login" class="font-medium text-foreground underline underline-offset-4 hover:text-primary transition">
          Sign in
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
