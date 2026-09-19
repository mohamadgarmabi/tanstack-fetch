import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import NpmPackages from './components/NpmPackages.vue'
import NpmDownloadBadges from './components/NpmDownloadBadges.vue'
import HomePackagesLink from './components/HomePackagesLink.vue'
import './custom.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('NpmPackages', NpmPackages)
    app.component('NpmDownloadBadges', NpmDownloadBadges)
    app.component('HomePackagesLink', HomePackagesLink)
  },
}

export default theme
