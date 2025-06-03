import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AboutViewAnother from '@/views/AboutViewAnother.vue'
import HomeViewAnother from '@/views/HomeViewAnother.vue'
import { defineAsyncComponent } from 'vue'

const AboutView = defineAsyncComponent(() => import('@/views/AboutView.vue'))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/vue',
      name: 'vue',
      redirect: { name: 'about' },
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
          props: {
            path: 'vue',
          },
        },
        {
          path: 'about',
          name: 'about',
          // route level code-splitting
          // this generates a separate chunk (About.[hash].js) for this route
          // which is lazy-loaded when the route is visited.
          component: AboutView,
          props: {
            path: 'vue',
          },
        },
      ],
    },
    {
      path: '/another-path',
      name: 'another',
      redirect: { name: 'about-on-another-path' },
      children: [
        {
          path: '',
          name: 'home-on-another-path',
          component: HomeViewAnother,
          props: {
            path: 'another-path',
          },
        },
        {
          path: 'about',
          name: 'about-on-another-path',
          component: AboutViewAnother,
          props: {
            path: 'another-path',
          },
        },
      ],
    },
  ],
})

export default router
