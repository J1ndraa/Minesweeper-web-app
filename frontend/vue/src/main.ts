/*
 * @file: main.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Routes logic for the application
 * @date: December 2024
 */

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/style.css';

const app = createApp(App);

app.use(router);
app.mount('#app');