<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { UserProfile } from "~/composables/useAuth";

useHead({
  title: "My Profile · DayForge",
});

const { user, profile, loading, isConfigured, updateProfileData, logout, resetPassword } = useAuth();
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
      <div class="h-24 w-full animate-pulse rounded-2xl bg-slate-200" />
      <div class="h-64 w-full animate-pulse rounded-2xl bg-slate-200" />
    </div>

    <!-- Not authenticated state -->
    <div
      v-else-if="!user"
      class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
        🔒
      </div>
      <h2 class="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        Sign in to view your profile
      </h2>
      <p class="mt-2 text-sm text-slate-500 max-w-md mx-auto">
        Your user profile and personal preferences are stored securely in your Firebase backend. Please sign in or create an account to view and edit this information.
      </p>
      <div class="mt-6 flex justify-center gap-3">
        <NuxtLink
          to="/login?redirect=/profile"
          class="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          Sign In
        </NuxtLink>
        <NuxtLink
          to="/signup"
          class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          Create Account
        </NuxtLink>
      </div>
    </div>

    <!-- Authenticated Profile View & Editor -->
    <div v-else class="space-y-6">
      <!-- Header Banner / Card -->
      <div class="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white shadow-2xs">
              {{ initials }}
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-tight text-slate-900">
                {{ form.displayName || 'Your Profile' }}
              </h1>
              <p class="text-xs text-slate-500">{{ user.email }}</p>
              <div class="mt-1 flex items-center gap-2">
                <span class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  Firebase Connected
                </span>
                <span class="text-[11px] text-slate-400 font-mono">UID: {{ user.uid.slice(0, 12) }}...</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="handleLogout"
              class="rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      <!-- Alerts -->
      <div
        v-if="saveSuccess"
        class="flex items-center gap-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-800"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 10l3 3 7-7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>Profile saved successfully to cloud storage</span>
      </div>

      <div
        v-if="saveError"
        class="flex items-center gap-2.5 rounded-lg border border-rose-200/80 bg-rose-50/80 p-3 text-xs font-medium text-rose-800"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v4M10 14h.01" stroke-linecap="round" />
        </svg>
        <span>{{ saveError }}</span>
      </div>

      <div
        v-if="resetEmailSent"
        class="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 text-xs font-medium text-slate-800"
      >
        <svg viewBox="0 0 20 20" class="h-4 w-4 shrink-0 text-slate-600" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="5" width="14" height="10" rx="2" />
          <path d="M3 7l7 4 7-4" stroke-linecap="round" />
        </svg>
        <span>Password reset instructions sent to {{ user.email }}.</span>
      </div>

      <!-- Main Profile Form -->
      <div class="rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <form @submit.prevent="handleSave" class="space-y-6">
          <div class="border-b border-slate-100 pb-3">
            <h2 class="text-sm font-semibold text-slate-900">Personal Information</h2>
            <p class="text-xs text-slate-500">Update your details and contact information.</p>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label for="displayName" class="block text-xs font-medium text-slate-700">
                Display Name
              </label>
              <input
                id="displayName"
                v-model="form.displayName"
                type="text"
                placeholder="Your full name"
                class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label for="email" class="block text-xs font-medium text-slate-700">
                Account Email
              </label>
              <input
                id="email"
                :value="user.email"
                disabled
                type="email"
                class="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label for="phone" class="block text-xs font-medium text-slate-700">
                Phone Number
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label for="location" class="block text-xs font-medium text-slate-700">
                Location
              </label>
              <input
                id="location"
                v-model="form.location"
                type="text"
                placeholder="City, Country"
                class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-slate-900 focus:outline-hidden"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="bio" class="block text-xs font-medium text-slate-700">
                Bio / Notes
              </label>
              <textarea
                id="bio"
                v-model="form.bio"
                rows="3"
                placeholder="Tell us a little about your scheduling goals..."
                class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div class="border-b border-slate-100 pt-3 pb-3">
            <h2 class="text-sm font-semibold text-slate-900">Preferences & Schedule</h2>
            <p class="text-xs text-slate-500">Configure default planning options.</p>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label for="timezone" class="block text-xs font-medium text-slate-700">
                Timezone
              </label>
              <input
                id="timezone"
                v-model="form.timezone"
                type="text"
                placeholder="e.g. America/New_York or UTC"
                class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label for="defaultDuration" class="block text-xs font-medium text-slate-700">
                Default Block Duration
              </label>
              <select
                id="defaultDuration"
                v-model="form.defaultTaskDuration"
                class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-hidden"
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
                  class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span class="text-xs font-medium text-slate-700">Week starts on Monday</span>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="handleSendResetEmail"
              class="text-xs font-medium text-slate-600 transition hover:text-slate-900"
            >
              Reset password via email
            </button>

            <button
              type="submit"
              :disabled="isSaving"
              class="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-slate-800 disabled:opacity-50"
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
