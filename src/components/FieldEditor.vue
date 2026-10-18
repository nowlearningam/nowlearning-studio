<script setup>
import { computed } from 'vue'
import { addFile, getAsset, assetTick } from '../lib/assets.js'

const props = defineProps({ field: { type: Object, required: true }, obj: { type: Object, required: true } })
const emit = defineEmits(['notify', 'seek'])

const ACCEPT = { image: 'image/*', images: 'image/*', video: 'video/*', audio: 'audio/*' }
const id = computed(() => 'f-' + props.field.key + '-' + Math.random().toString(36).slice(2, 6))
const asset = computed(() => {
  assetTick.value
  return getAsset(props.obj[props.field.key])
})
const thumb = (assetId) => {
  assetTick.value
  const a = getAsset(assetId)
  return a && a.kind === 'image' ? a.url : ''
}

async function pick(e) {
  const files = [...e.target.files]
  e.target.value = ''
  const k = props.field.key
  try {
    if (props.field.type === 'images') {
      const ids = []
      for (const f of files) ids.push(await addFile(f))
      props.obj[k] = [...(props.obj[k] || []), ...ids]
    } else if (files[0]) props.obj[k] = await addFile(files[0])
  } catch (err) {
    emit('notify', err.message || 'Could not add that file.', true)
  }
}
function move(arr, i, dir) {
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}
const addItem = () => props.obj[props.field.key].push({ ...props.field.newItem })
</script>

<template>
  <div class="field">
    <template v-if="field.type === 'checkbox'">
      <label class="chk"><input type="checkbox" v-model="obj[field.key]"> {{ field.label }}</label>
    </template>

    <template v-else-if="field.type === 'list'">
      <div class="lh">{{ field.label }}</div>
      <div v-for="(item, i) in obj[field.key]" :key="i" class="item">
        <div class="ihead">
          <b>{{ field.itemLabel }} {{ i + 1 }}</b>
          <span>
            <button class="mini" aria-label="Move up" @click="move(obj[field.key], i, -1)">↑</button>
            <button class="mini" aria-label="Move down" @click="move(obj[field.key], i, 1)">↓</button>
            <button class="mini" aria-label="Remove" @click="obj[field.key].splice(i, 1)">✕</button>
          </span>
        </div>
        <FieldEditor v-for="f in field.fields" :key="f.key" :field="f" :obj="item" @notify="(m, e) => emit('notify', m, e)" @seek="(x) => emit('seek', x)" />
      </div>
      <button class="add" @click="addItem">+ Add {{ field.itemLabel.toLowerCase() }}</button>
    </template>

    <template v-else-if="field.type === 'images'">
      <div class="lh">{{ field.label }}</div>
      <div class="thumbs">
        <div v-for="(sid, i) in obj[field.key]" :key="sid + i" class="th">
          <img :src="thumb(sid)" alt="">
          <span>
            <button class="mini" aria-label="Move earlier" @click="move(obj[field.key], i, -1)">←</button>
            <button class="mini" aria-label="Move later" @click="move(obj[field.key], i, 1)">→</button>
            <button class="mini" aria-label="Remove" @click="obj[field.key].splice(i, 1)">✕</button>
          </span>
        </div>
      </div>
      <label class="add file">+ Add images<input type="file" multiple :accept="ACCEPT.images" hidden @change="pick"></label>
    </template>

    <template v-else-if="field.type === 'image' || field.type === 'video' || field.type === 'audio'">
      <div class="lh">{{ field.label }}</div>
      <div class="filerow">
        <img v-if="asset && asset.kind === 'image'" class="pv" :src="asset.url" alt="">
        <span v-else-if="asset" class="fname">{{ asset.name }}<template v-if="asset.duration"> · {{ Math.round(asset.duration) }}s</template></span>
        <span v-else class="fname dim">None</span>
        <label class="add file">{{ asset ? 'Replace' : 'Choose' }}<input type="file" :accept="ACCEPT[field.type]" hidden @change="pick"></label>
        <button v-if="obj[field.key]" class="mini" aria-label="Remove file" @click="obj[field.key] = ''">✕</button>
      </div>
    </template>

    <template v-else-if="field.type === 'textarea'">
      <label :for="id">{{ field.label }}</label>
      <textarea :id="id" v-model="obj[field.key]"></textarea>
    </template>

    <template v-else-if="field.type === 'number'">
      <label :for="id">{{ field.label }}</label>
      <input :id="id" type="number" inputmode="decimal" :min="field.min" :max="field.max" :step="field.step || 1" v-model.number="obj[field.key]">
    </template>

    <template v-else-if="field.type === 'range'">
      <label :for="id">{{ field.label }} <i>{{ Math.round((obj[field.key] || 0) * 100) }}%</i></label>
      <input :id="id" type="range" :min="field.min" :max="field.max" :step="field.step" v-model.number="obj[field.key]" @input="field.seek != null && emit('seek', field.seek)">
    </template>

    <template v-else-if="field.type === 'select'">
      <label :for="id">{{ field.label }}</label>
      <select :id="id" v-model="obj[field.key]">
        <option v-for="o in field.options" :key="o" :value="o">{{ o }}</option>
      </select>
    </template>

    <template v-else-if="field.type === 'color'">
      <label :for="id">{{ field.label }}</label>
      <input :id="id" type="color" v-model="obj[field.key]">
    </template>

    <template v-else>
      <label :for="id">{{ field.label }}</label>
      <input :id="id" type="text" v-model="obj[field.key]">
    </template>
  </div>
</template>
