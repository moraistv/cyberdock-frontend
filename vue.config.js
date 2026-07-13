// vue.config.js
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  // Sourcemaps de produção consomem muita memória no build (bundle grande com
  // firebase/apexcharts) e foram a causa provável do OOM no Coolify (build
  // morrendo com exit 255 sem erro de compilação). Desligar reduz memória e
  // tempo de build, e ainda diminui o tamanho publicado.
  productionSourceMap: false,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: { '^/api': '/api' },
      },
    },
  },
});