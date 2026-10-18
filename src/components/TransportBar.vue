<script setup>
import { fmtClock } from '../lib/files.js'

defineProps({ playing: Boolean, t: Number, total: Number, canExport: Boolean, exporting: Boolean })
const emit = defineEmits(['toggle', 'restart', 'seek', 'export'])
</script>

<template>
  <div class="transport">
    <button class="icon" :aria-label="playing ? 'Pause' : 'Play'" @click="emit('toggle')">{{ playing ? '❚❚' : '▶' }}</button>
    <button class="icon" aria-label="Restart" @click="emit('restart')">↺</button>
    <input type="range" min="0" max="1000" :value="total ? (t / total) * 1000 : 0" aria-label="Timeline" @input="emit('seek', $event.target.value / 1000)">
    <span class="clock">{{ fmtClock(t) }} / {{ fmtClock(total) }}</span>
    <button class="primary" :disabled="exporting || !canExport" @click="emit('export')">Export</button>
  </div>
</template>
