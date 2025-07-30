import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    resolve: { alias: { '@': '/src' } }, // import '@/components/…'
  server: {
    host: true,        // permite abrir desde otros dispositivos
    port: 5173         // puerto por defecto de Vite
    // ⚠️ HTTPS NO configurado porque decidiste omitir mkcert;
    // para móvil real usaremos deploy o túnel cuando llegue el momento.
  }
});

