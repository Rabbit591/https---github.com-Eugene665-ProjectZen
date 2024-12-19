import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/homeView.vue';
import Login from './components/logForm.vue';
import Register from './components/regForm.vue';
import Profile from './views/profile.vue';
import Project_page from './views/project_page.vue';


const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/project_page', component: Project_page },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


export default router;
