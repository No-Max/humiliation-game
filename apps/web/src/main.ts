import { createApp } from 'vue';
import App from './App.vue';
import { initUmami } from './lib/umami';
import { router } from './router';
import './style.css';

initUmami();

createApp(App).use(router).mount('#app');
