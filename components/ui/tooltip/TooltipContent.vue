<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, useForwardPropsEmits, type TooltipContentEmits, type TooltipContentProps } from "reka-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TooltipContentProps>(), { sideOffset: 4 });
const emits = defineEmits<TooltipContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      v-bind="{ ...forwarded, ...$attrs }"
      class="z-50 w-fit origin-(--reka-tooltip-content-transform-origin) text-balance rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
    >
      <slot />
      <TooltipArrow class="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-primary fill-primary" />
    </TooltipContent>
  </TooltipPortal>
</template>
