import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Pi-hole Remote',
    description: 'Control your Pi-hole(s) from your browser',
    permissions: ['storage'],
    host_permissions: ['<all_urls>'],
    icons: {
      '16': 'icon/16.png',
      '48': 'icon/48.png',
      '128': 'icon/128.png',
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
