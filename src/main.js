import { createApp } from 'vue'
import Antd from 'ant-design-vue';
import App from './App.vue'
import 'ant-design-vue/dist/reset.css';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
const app = createApp(App);
app.use(Antd).mount('#app');