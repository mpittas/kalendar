<script setup lang="ts">
useHead({ title: "Delete your account · klndr." });

/** Written for someone who cannot sign in any more, so the email route is first-class. */
const steps = [
  "Sign in to klndr.",
  "Open Profile (your name in the header) and scroll to “Delete account”.",
  "Type “delete my account” into the box to confirm, and enter your password if you sign in with one — or approve the pop-up if you sign in with Google or Apple.",
  "Press “Delete my account”. Everything goes at once: your activities, categories, blocks, checklist, notes and profile, and then the account itself.",
];

const removed = [
  "Your profile: display name, bio, phone, location, timezone and planning preferences.",
  "Every activity and category you created.",
  "Every scheduled block, in the past or the future.",
  "Your daily checklist — the items you keep, the ones you skipped, and the one-off items.",
  "Every day's notes.",
  "The account itself, with its email address, and the Apple token we were given if you signed in with Apple.",
];
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
    <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Delete your account</h1>
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
      You can delete your klndr. account and everything in it at any time, from the app, without asking anyone.
    </p>

    <section class="mt-8">
      <h2 class="text-base font-semibold text-foreground sm:text-lg">In the app</h2>
      <ol class="mt-3 space-y-2">
        <li v-for="(step, index) in steps" :key="index" class="flex gap-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <span class="shrink-0 font-semibold text-foreground">{{ index + 1 }}.</span>
          <span>{{ step }}</span>
        </li>
      </ol>
      <p class="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        Deleting cannot be undone: there is no backup and no waiting period.
      </p>
    </section>

    <section class="mt-8">
      <h2 class="text-base font-semibold text-foreground sm:text-lg">What gets deleted</h2>
      <ul class="mt-3 space-y-2">
        <li v-for="item in removed" :key="item" class="flex gap-2.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <span aria-hidden="true" class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
          <span>{{ item }}</span>
        </li>
      </ul>
    </section>

    <section class="mt-8">
      <h2 class="text-base font-semibold text-foreground sm:text-lg">If you can't sign in</h2>
      <p class="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        Email <a class="font-medium text-foreground underline underline-offset-4" href="mailto:[CONTACT EMAIL]?subject=Delete%20my%20klndr.%20account">[CONTACT EMAIL]</a>
        from the address on the account and ask us to delete it. We delete the account and its data within 30 days of
        confirming that the request comes from the account's owner, and we reply when it is done.
      </p>
    </section>

    <div class="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-6 text-xs sm:text-sm">
      <NuxtLink to="/privacy" class="font-medium text-foreground underline underline-offset-4">Privacy policy</NuxtLink>
      <NuxtLink to="/" class="text-muted-foreground underline underline-offset-4">Back to klndr.</NuxtLink>
    </div>
  </div>
</template>
