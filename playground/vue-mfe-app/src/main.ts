import router from "@/router";
import '@/assets/main.css'
import createVueMicroApp from "@microtsm/vue";
import {createApp} from "vue";
import App from "@/App.vue";

export const {mount, unmount} = createVueMicroApp(createApp(App), {
    // el: "#app",
    handleInstance(app, props) {
        // Install plugins
        app.use(router)

        // Add global properties
        app.config.globalProperties.$env = import.meta.env
        app.config.globalProperties.$user = props.user

        // Register global components
        // app.component('MyGlobalComponent', MyGlobalComponent)

    },
})

// createApp(App).use(router).mount("#app")