<script setup lang="ts">
import { ref } from "vue";

useHead({
  title: "Log In · klndr.",
});

const { login, loginWithGoogle, resetPassword, isConfigured } = useAuth();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isSubmitting = ref(false);
const showForgotPassword = ref(false);

const getFriendlyErrorMessage = (err: any) => {
  const code = err?.code || "";
  if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) {
    return "Invalid email or password. Please verify your credentials.";
  }
  if (code.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code.includes("too-many-requests")) {
    return "Too many failed attempts. Please try again in a few minutes.";
  }
  return err.message || "An unexpected error occurred while logging in.";
};

const handleLogin = async () => {
  error.value = null;
  successMessage.value = null;

  if (!email.value || !password.value) {
    error.value = "Please fill in all fields.";
    return;
  }

  isSubmitting.value = true;
  try {
    await login(email.value.trim(), password.value);
    const redirect = safeRedirect(route.query.redirect);
    router.push(redirect);
  } catch (err: any) {
    error.value = getFriendlyErrorMessage(err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleGoogleLogin = async () => {
  error.value = null;
  isSubmitting.value = true;
  try {
    await loginWithGoogle();
    const redirect = safeRedirect(route.query.redirect);
    router.push(redirect);
  } catch (err: any) {
    error.value = getFriendlyErrorMessage(err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleResetPassword = async () => {
  error.value = null;
  successMessage.value = null;

  if (!email.value) {
    error.value = "Please enter your email address to receive password reset instructions.";
    return;
  }

  try {
    await resetPassword(email.value.trim());
    successMessage.value = "Password reset email sent. Check your inbox.";
    showForgotPassword.value = false;
  } catch (err: any) {
    error.value = getFriendlyErrorMessage(err);
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
          Welcome back
        </h2>
        <p class="mt-1 text-xs sm:text-sm text-muted-foreground">
          Sign in to your klndr. account
        </p>
      </div>

      <!-- Warning if Firebase is not yet configured -->
      <div
        v-if="!isConfigured"
        class="rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-900"
      >
        <p class="font-medium">Firebase credentials required for cloud login</p>
        <p class="mt-0.5 text-amber-800">
          Set credentials in <code class="rounded bg-amber-100/70 px-1 py-0.5 font-mono text-[11px]">.env</code> to activate cloud auth.
        </p>
      </div>

      <!-- Error and Success Alerts -->
      <div
        v-if="error"
        class="flex items-center gap-2.5 rounded-lg border border-rose-200/80 bg-rose-50/80 p-3 text-xs sm:text-sm font-medium text-rose-800"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v4M10 14h.01" stroke-linecap="round" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <div
        v-if="successMessage"
        class="flex items-center gap-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs sm:text-sm font-medium text-emerald-800"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 10l3 3 7-7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{{ successMessage }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
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
          <div class="flex items-center justify-between">
            <label for="password" class="block text-xs sm:text-sm font-medium text-foreground">
              Password
            </label>
            <button
              type="button"
              @click="showForgotPassword = !showForgotPassword"
              class="text-xs text-muted-foreground hover:text-foreground transition underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
          />
        </div>

        <div v-if="showForgotPassword" class="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <p class="text-xs text-muted-foreground">Send password reset link to <span class="font-medium text-foreground">{{ email || 'entered email' }}</span>?</p>
          <button
            type="button"
            @click="handleResetPassword"
            class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent transition"
          >
            Send Reset Email
          </button>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
        >
          <span v-if="isSubmitting">Signing in...</span>
          <span v-else>Sign In</span>
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
        @click="handleGoogleLogin"
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
        Sign in with Google
      </button>

      <p class="text-center text-xs sm:text-sm text-muted-foreground">
        Don't have an account?
        <NuxtLink to="/signup" class="font-medium text-foreground underline underline-offset-4 hover:text-primary transition">
          Sign up
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
