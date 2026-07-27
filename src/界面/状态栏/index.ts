import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { waitUntil } from 'async-wait-until';

$(async () => {
  if (typeof waitGlobalInitialized === 'function') {
    await waitGlobalInitialized('Mvu');
  }
  if (typeof getVariables === 'function') {
    await waitUntil(() => {
      const vars = getVariables({ type: 'message' });
      return vars && vars.stat_data && vars.stat_data.主角;
    });
  }

  const app = createApp(App);
  app.use(createPinia());
  app.mount('#app');
});
