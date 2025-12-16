<template>
  <div class="ratio ratio-16x9 bg-dark rounded overflow-hidden">
    <video
      ref="videoEl"
      class="w-100 h-100"
      playsinline
      controls
      :poster="poster || ''"
    />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

// props: m3u8 (ưu tiên), mp4 (fallback), poster
const props = defineProps({
  m3u8: { type: String, default: '' },
  mp4: { type: String, default: '' },
  poster: { type: String, default: '' },
  autoplay: { type: Boolean, default: false }
})

const videoEl = ref(null)
let hls = null

async function attach() {
  if (!videoEl.value) return

  // Ưu tiên HLS nếu có m3u8
  if (props.m3u8) {
    const canNativeHls = videoEl.value.canPlayType('application/vnd.apple.mpegURL')
    if (canNativeHls) {
      videoEl.value.src = props.m3u8
      if (props.autoplay) videoEl.value.play().catch(()=>{})
      return
    }
    // dùng hls.js cho Chrome/Firefox/Edge
    const { default: Hls } = await import('hls.js')
    if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 30 })
      hls.loadSource(props.m3u8)
      hls.attachMedia(videoEl.value)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (props.autoplay) videoEl.value.play().catch(()=>{})
      })
      return
    }
  }

  // Fallback MP4
  if (props.mp4) {
    videoEl.value.src = props.mp4
    if (props.autoplay) videoEl.value.play().catch(()=>{})
  }
}

watch(() => [props.m3u8, props.mp4], attach, { immediate: true })

onMounted(attach)
onBeforeUnmount(() => {
  if (hls) {
    try { hls.destroy() } catch {}
    hls = null
  }
})
</script>
