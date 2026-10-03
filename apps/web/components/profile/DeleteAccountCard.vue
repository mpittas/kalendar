<script setup lang="ts">
import { CircleAlert, Trash2 } from "lucide-vue-next";
import { computed, ref } from "vue";

const props = defineProps<{
  /** Password accounts must type their password: Firebase asks for a recent sign-in before deleting. */
  needsPassword: boolean;
  /** True while the deletion runs; the button says so and nothing can be pressed twice. */
  busy: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ (e: "delete", payload: { password?: string }): void }>();

/** The phrase to type. Long enough that it cannot happen by accident. */
const CONFIRMATION = "delete my account";

const typed = ref("");
const password = ref("");

const confirmed = computed(() => typed.value.trim().toLowerCase() === CONFIRMATION);
const ready = computed(() => confirmed.value && (!props.needsPassword || password.value.length > 0) && !props.busy);

const fieldClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:outline-none sm:h-9";

const remove = () => {
  if (!ready.value) return;
  emit("delete", props.needsPassword ? { password: password.value } : {});
};
</script>

<template>
  <section class="rounded-xl border border-destructive/30 bg-destructive/5 p-5 shadow-xs sm:p-6">
    <h3 class="text-sm font-semibold text-foreground">Delete account</h3>
    <p class="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
      This erases your activities, categories, timeline blocks, checklist, notes and profile for good.
      There is no way to undo it.
    </p>

    <div class="mt-4 space-y-3">
      <label class="block space-y-1.5">
        <span class="block text-xs font-medium text-foreground">
          Type <span class="font-mono font-semibold">{{ CONFIRMATION }}</span> to confirm
        </span>
        <input
          v-model="typed"
          type="text"
          autocomplete="off"
          :disabled="busy"
          :placeholder="CONFIRMATION"
          :class="fieldClass"
        />
      </label>

      <label v-if="needsPassword" class="block space-y-1.5">
        <span class="block text-xs font-medium text-foreground">Your password</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          :disabled="busy"
          placeholder="••••••••"
          :class="fieldClass"
        />
      </label>

      <p v-if="error" class="flex items-start gap-1.5 text-xs text-destructive">
        <CircleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{{ error }}</span>
      </p>

      <button
        type="button"
        :disabled="!ready"
        @click="remove"
        class="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-4 text-xs font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-auto sm:text-sm"
      >
        <Trash2 class="h-4 w-4" aria-hidden="true" />
        <span>{{ busy ? "Deleting…" : "Delete my account" }}</span>
      </button>
    </div>
  </section>
</template>
