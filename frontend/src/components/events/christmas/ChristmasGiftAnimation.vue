<template>
  <div class="overlay">
    <div class="stage">

      <!-- 🎁 Gift box -->
      <div ref="box" class="gift-box">
        <div ref="lid" class="lid"></div>
        <div class="box-body"></div>
      </div>

      <!-- ✨ Light glow -->
      <div ref="glow" class="glow"></div>

      <!-- 💌 Card (CENTER) -->
      <div ref="card" class="invitation-card">
  <div class="invite-header">
  <span class="tree">🎄</span>
  <h2>Merry Christmas</h2>
  <span class="tree">🎄</span>
</div>


  <div class="invite-body">
    <p class="invite-message">
      {{ message }}
    </p>
  </div>

  <div class="invite-footer">
    <button class="close-btn" @click="$emit('close')">
      Close
    </button>
  </div>
</div>


    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { gsap } from "gsap";

defineProps({
  message: {
    type: String,
    default: ""
  }
});

const box = ref(null);
const lid = ref(null);
const glow = ref(null);
const card = ref(null);

onMounted(() => {
  const tl = gsap.timeline();

  // Initial state
  gsap.set(lid.value, { rotateX: 0 });
  gsap.set(glow.value, { opacity: 0, scale: 0.6 });
  gsap.set(card.value, {
    opacity: 0,
    scale: 0.6
  });

  tl
    // 1️⃣ Box drops in
    .from(box.value, {
      y: -120,
      scale: 0.6,
      opacity: 0,
      duration: 0.6,
      ease: "back.out(1.7)"
    })

    // 2️⃣ Shake
    .to(box.value, {
      x: -8,
      duration: 0.08,
      yoyo: true,
      repeat: 6
    })

    // 3️⃣ Lid opens
    .to(lid.value, {
      rotateX: -120,
      duration: 0.7,
      ease: "power3.out"
    })

    // 4️⃣ Glow burst
    .to(glow.value, {
      opacity: 1,
      scale: 1.6,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.3")

    // 5️⃣ Hide box completely
    .to(box.value, {
      opacity: 0,
      scale: 0.4,
      duration: 0.35,
      ease: "power2.in"
    })

    // 6️⃣ Card appears CENTERED in glow
    .to(card.value, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.6)"
    });
});
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage {
  position: relative;
  width: 360px;
  height: 360px;
}
.tree {
  font-size: 1.3rem;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.6));
}

/* 🎁 Gift box */
.gift-box {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 140px;
  transform-style: preserve-3d;
}

.box-body {
  width: 100%;
  height: 100%;
  background: #c40000;
  border-radius: 14px;
}

.lid {
  position: absolute;
  top: -22px;
  width: 100%;
  height: 30px;
  background: #e00000;
  border-radius: 10px;
  transform-origin: bottom center;
}

/* ✨ Glow */
.glow {
  position: absolute;
  inset: 40px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 200, 0.9),
    rgba(255, 255, 200, 0.4) 40%,
    transparent 65%
  );
  border-radius: 50%;
  z-index: 0;
}

/* 💌 Card — CENTERED */
/* 🎴 Invitation Card */
.invitation-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  width: 300px;
  padding: 24px 22px;

  background: linear-gradient(135deg, #b30000, #d40000);
  border-radius: 18px;
  color: #fff;
  text-align: center;

  z-index: 2;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
  border: 3px solid rgba(255, 215, 0, 0.65);

  /* 🔥 QUAN TRỌNG */
  display: flex;
  flex-direction: column;
  gap: 14px; /* khoảng cách đều, không dư */
}


/* Header giống thiệp */
.invite-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 14px;
}

.invite-header h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
}

.ornament {
  color: gold;
  font-size: 1.2rem;
}

/* Body */
.invite-body {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 18px;
}

.invite-message {
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-line;
}

/* Footer */
.invite-footer {
  text-align: center;
}

.close-btn {
  background: gold;
  color: #7a0000;
  border: none;
  padding: 8px 26px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

.close-btn:hover {
  background: #ffdf55;
}


.card h2 {
  margin-bottom: 8px;

  /* ✅ BẮT BUỘC 1 DÒNG */
  white-space: nowrap;

  /* Giữ đẹp khi màn hình nhỏ */
  font-size: 22px;
  line-height: 1.2;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.card p {
  margin: 8px 0 0;
  text-align: center;

  /* 🔧 Fix text dài / không có space */
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;

  line-height: 1.5;
}

.card button {
  margin-top: 16px;
  background: #b30000;
  color: #ffffff;
  border: none;
  padding: 8px 22px;
  border-radius: 999px;
  cursor: pointer;
}
</style>
