import router from '@/router'
import '@/assets/main.css'
import '@fewangsit/wangsvue-presets/fixedasset/style.css'
import '@fewangsit/wangsvue-fats/style.css'

import createVueMicroApp from '@microtsm/vue'
import App from '@/App.vue'
import { WangsVue } from '@fewangsit/wangsvue-fats'
import preset from '@fewangsit/wangsvue-presets/fixedasset'

export const { mount, unmount } = createVueMicroApp(App, {
  el: '#app', // Only used for standalone development
  setupInstance(app, props) {
    app.use(WangsVue, { preset })
    app.use(router)
  },
})
