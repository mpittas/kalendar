<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { PROFILE_LIMITS, type UserProfile } from "~/composables/useAuth";

useHead({
  title: "Profile · klndr.",
});

const { user, profile, profileError, loading, updateProfileData, loadProfile, logout, resetPassword } = useAuth();
const router = useRouter();

const form = ref<Partial<UserProfile>>({
  displayName: "",
  bio: "",
  phone: "",
  location: "",
  timezone: "",
  weekStartsOnMonday: true,
  defaultTaskDuration: 60,
});

const isSaving = ref(false);
const saveSuccess = ref(false);
const saveError = ref<string | null>(null);
const resetEmailSent = ref(false);

const syncFormFromProfile = () => {
  if (profile.value) {
    form.value = {
      displayName: profile.value.displayName || "",
      bio: profile.value.bio || "",
      phone: profile.value.phone || "",
      location: profile.value.location || "",
      timezone: profile.value.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      weekStartsOnMonday: profile.value.weekStartsOnMonday ?? true,
      defaultTaskDuration: profile.value.defaultTaskDuration ?? 60,
    };
  } else if (user.value) {
    form.value.displayName = user.value.displayName || user.value.email?.split("@")[0] || "";
    form.value.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }
};

watch([user, profile], () => {
  syncFormFromProfile();
}, { immediate: true });

onMounted(() => {
  syncFormFromProfile();
});

const initials = computed(() => {
  const name = (form.value.displayName || user.value?.email || "U").trim();
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

const handleSave = async () => {
  saveError.value = null;
  saveSuccess.value = false;
  isSaving.value = true;

  try {
    await updateProfileData({
      displayName: form.value.displayName?.trim(),
      bio: form.value.bio?.trim(),
      phone: form.value.phone?.trim(),
      location: form.value.location?.trim(),
      timezone: form.value.timezone,
      weekStartsOnMonday: form.value.weekStartsOnMonday,
      defaultTaskDuration: Number(form.value.defaultTaskDuration) || 60,
    });
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 4000);
  } catch (err: any) {
    saveError.value = err.message || "Failed to save profile changes.";
  } finally {
    isSaving.value = false;
  }
};

const handleSendResetEmail = async () => {
  if (!user.value?.email) return;
  try {
    await resetPassword(user.value.email);
    resetEmailSent.value = true;
    setTimeout(() => {
      resetEmailSent.value = false;
    }, 5000);
  } catch (err: any) {
    saveError.value = err.message || "Failed to send reset email.";
  }
};

const handleLogout = async () => {
  await logout();
  router.push("/login");
};
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Loading state -->
    <div v-if="loading" class="space-y-4">
      <div class="h-24 w-full animate-pulse rounded-xl bg-muted" />
      <div class="h-64 w-full animate-pulse rounded-xl bg-muted" />
    </div>

    <!-- Not authenticated state -->
    <div
      v-else-if="!user"
      class="rounded-xl border border-border bg-card p-8 text-center shadow-xs"
    >
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-xl">
        🔒
      </div>
      <h2 class="mt-4 text-xl font-bold tracking-tight text-foreground">
        Sign in to view your profile
      </h2>
      <p class="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
        Your user profile and personal preferences are stored securely in your Firebase backend. Please sign in or create an account to view and edit this information.
      </p>
      <div class="mt-6 flex justify-center gap-3">
        <NuxtLink
          to="/login?redirect=/profile"
          class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition"
        >
          Sign In
        </NuxtLink>
        <NuxtLink
          to="/signup"
          class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-2xs hover:bg-accent transition"
        >
          Create Account
        </NuxtLink>
      </div>
    </div>

    <!-- Authenticated Profile View & Editor -->
    <div v-else class="space-y-6">
      <!-- Header Banner / Card -->
      <div class="overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold shadow-xs">
              {{ initials }}
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-tight text-foreground">
                {{ form.displayName || 'Your Profile' }}
              </h1>
              <p class="text-xs sm:text-sm text-muted-foreground">{{ user.email }}</p>
              <div class="mt-1.5 flex items-center gap-2">
                <span class="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Firebase Connected
                </span>
                <span class="text-[11px] text-muted-foreground font-mono">UID: {{ user.uid.slice(0, 12) }}...</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="handleLogout"
              class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-2xs transition hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      <!-- Alerts -->
      <div
        v-if="profileError"
        class="flex items-center justify-between gap-2.5 rounded-lg border border-rose-200/80 bg-rose-50/80 p-3 text-xs sm:text-sm font-medium text-rose-800"
      >
        <span>{{ profileError }}</span>
        <button
          type="button"
          class="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs text-rose-800 transition hover:bg-rose-50"
          @click="user && loadProfile(user)"
        >
          Retry
        </button>
      </div>

      <div
        v-if="saveSuccess"
        class="flex items-center gap-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs sm:text-sm font-medium text-emerald-800"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 10l3 3 7-7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>Profile saved successfully.</span>
      </div>

      <div
        v-if="saveError"
        class="flex items-center gap-2.5 rounded-lg border border-rose-200/80 bg-rose-50/80 p-3 text-xs sm:text-sm font-medium text-rose-800"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v4M10 14h.01" stroke-linecap="round" />
        </svg>
        <span>{{ saveError }}</span>
      </div>

      <div
        v-if="resetEmailSent"
        class="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-xs sm:text-sm font-medium text-foreground"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="5" width="14" height="10" rx="2" />
          <path d="M3 7l7 4 7-4" stroke-linecap="round" />
        </svg>
        <span>Password reset instructions sent to {{ user.email }}.</span>
      </div>

      <!-- Main Profile Form -->
      <div class="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <form @submit.prevent="handleSave" class="space-y-6">
          <div class="border-b border-border pb-3">
            <h2 class="text-sm sm:text-base font-semibold text-foreground">Personal Information</h2>
            <p class="text-xs sm:text-sm text-muted-foreground">Update your details and contact information.</p>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label for="displayName" class="block text-xs sm:text-sm font-medium text-foreground">
                Display Name
              </label>
              <input
                id="displayName"
                v-model="form.displayName"
                type="text"
                required
                :maxlength="PROFILE_LIMITS.displayName"
                placeholder="Your full name"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label for="email" class="block text-xs sm:text-sm font-medium text-foreground">
                Account Email
              </label>
              <input
                id="email"
                :value="user.email"
                disabled
                type="email"
                class="h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-sm text-muted-foreground shadow-2xs cursor-not-allowed"
              />
            </div>

            <div class="space-y-1.5">
              <label for="phone" class="block text-xs sm:text-sm font-medium text-foreground">
                Phone Number
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                :maxlength="PROFILE_LIMITS.phone"
                placeholder="+1 (555) 000-0000"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label for="location" class="block text-xs sm:text-sm font-medium text-foreground">
                Location
              </label>
              <input
                id="location"
                v-model="form.location"
                type="text"
                :maxlength="PROFILE_LIMITS.location"
                placeholder="City, Country"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
              />
            </div>

            <div class="space-y-1.5 sm:col-span-2">
              <label for="bio" class="block text-xs sm:text-sm font-medium text-foreground">
                Bio / Notes
              </label>
              <textarea
                id="bio"
                v-model="form.bio"
                rows="3"
                :maxlength="PROFILE_LIMITS.bio"
                placeholder="Tell us a little about your scheduling goals..."
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none"
              />
            </div>
          </div>

          <div class="border-b border-border pt-3 pb-3">
            <h2 class="text-sm sm:text-base font-semibold text-foreground">Preferences & Schedule</h2>
            <p class="text-xs sm:text-sm text-muted-foreground">Configure default planning options.</p>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label for="timezone" class="block text-xs sm:text-sm font-medium text-foreground">
                Timezone
              </label>
              <input
                id="timezone"
                v-model="form.timezone"
                type="text"
                :maxlength="PROFILE_LIMITS.timezone"
                placeholder="e.g. America/New_York or UTC"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors focus-visible:border-foreground focus-visible:outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label for="defaultDuration" class="block text-xs sm:text-sm font-medium text-foreground">
                Default Block Duration
              </label>
              <select
                id="defaultDuration"
                v-model="form.defaultTaskDuration"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors focus-visible:border-foreground focus-visible:outline-none"
              >
                <option :value="15">15 minutes</option>
                <option :value="30">30 minutes</option>
                <option :value="45">45 minutes</option>
                <option :value="60">60 minutes (1 hour)</option>
                <option :value="90">90 minutes</option>
                <option :value="120">120 minutes (2 hours)</option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <label class="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="form.weekStartsOnMonday"
                  class="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span class="text-xs sm:text-sm font-medium text-foreground">Week starts on Monday</span>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              @click="handleSendResetEmail"
              class="text-xs sm:text-sm font-medium text-muted-foreground transition hover:text-foreground underline-offset-4 hover:underline"
            >
              Reset password via email
            </button>

            <button
              type="submit"
              :disabled="isSaving || !profile"
              class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
            >
              <span v-if="isSaving">Saving...</span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
