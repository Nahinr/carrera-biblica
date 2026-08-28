import { defineConfig } from 'vite';

// Publicado en GitHub Pages como sitio de proyecto:
// https://<usuario>.github.io/carrera-biblica/
// Si alguna vez cambias el nombre del repositorio, actualiza `base` aquí también.
export default defineConfig({
  base: '/carrera-biblica/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
