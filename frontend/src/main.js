//src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";


import { loadActiveEvent } from "@/events/useEvent";
import "@/styles/dark-mode.css";
import "./styles/christmas.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);
loadActiveEvent();
app.mount("#app");
