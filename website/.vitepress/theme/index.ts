import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import NpmPackages from './components/NpmPackages.vue'
import NpmDownloadBadges from './components/NpmDownloadBadges.vue'
import HomePackagesLink from './components/HomePackagesLink.vue'
import HomeIntro from './components/HomeIntro.vue'
import StatusPlayground from './components/StatusPlayground.vue'
import LiveQueryDemo from './components/LiveQueryDemo.vue'
import ReactQueryDemo from './components/ReactQueryDemo.vue'
import NextSsrDemo from './components/NextSsrDemo.vue'
import UploadDemo from './components/UploadDemo.vue'
import SseDemo from './components/SseDemo.vue'
import PackagesFeatured from './components/PackagesFeatured.vue'
import HomeLanding from './home/HomeLanding.vue'
import './custom.css'
import './home/home.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('NpmPackages', NpmPackages)
    app.component('NpmDownloadBadges', NpmDownloadBadges)
    app.component('HomePackagesLink', HomePackagesLink)
    app.component('HomeIntro', HomeIntro)
    app.component('StatusPlayground', StatusPlayground)
    app.component('LiveQueryDemo', LiveQueryDemo)
    app.component('ReactQueryDemo', ReactQueryDemo)
    app.component('NextSsrDemo', NextSsrDemo)
    app.component('UploadDemo', UploadDemo)
    app.component('SseDemo', SseDemo)
    app.component('PackagesFeatured', PackagesFeatured)
    app.component('HomeLanding', HomeLanding)
  },
}

export default theme
