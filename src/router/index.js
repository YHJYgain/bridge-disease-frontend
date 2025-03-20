import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import UserCenterView from '../views/UserCenterView.vue'
import DiseaseDetectionView from '../views/DiseaseDetectionView.vue'
import DetectionRecordsView from '../views/DetectionRecordsView.vue'
import MediaLibraryView from '../views/MediaLibraryView.vue'
import ModelLibraryView from '../views/ModelLibraryView.vue'
import UserManagementView from '../views/UserManagementView.vue'
import OperationLogsView from '../views/OperationLogsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
    },
    {
      path: '/user-center',
      name: 'user-center',
      component: UserCenterView,
    },
    {
      path: '/disease-detection',
      name: 'disease-detection',
      component: DiseaseDetectionView,
    },
    {
      path: '/detection-records',
      name: 'detection-records',
      component: DetectionRecordsView,
    },
    {
      path: '/media-library',
      name: 'media-library',
      component: MediaLibraryView,
    },
    {
      path: '/model-library',
      name: 'model-library',
      component: ModelLibraryView,
    },
    {
      path: '/user-management',
      name: 'user-management',
      component: UserManagementView,
    },
    {
      path: '/operation-logs',
      name: 'operation-logs',
      component: OperationLogsView,
    },
  ],
})

export default router
