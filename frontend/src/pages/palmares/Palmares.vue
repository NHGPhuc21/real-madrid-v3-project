<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-3">
      
      
    </div>

    <h1 class="fw-bold mb-3">List of cups in Real Madrid history</h1>

    

    <PalmaresList :items="footballTrophies" />
  </div>
</template>

<script>
import data from "@/assets/data/palmares.json";
import PalmaresList from "@/pages/palmares/PalmaresList.vue";

export default {
  name: "PalmaresPage",
  components: { PalmaresList },
  data() {
    return {
      activeTab: "football",
    };
  },
  computed: {
    footballTrophies() {
      return data.football || [];
    },
  },
};
</script>

<style scoped>
.nav-link.active {
  background-color: #4b4ded;
}
</style>
