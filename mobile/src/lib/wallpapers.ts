/**
 * Wallpaper themes. The illustrated ones are the approved backgrounds from the
 * web template registry (lib/template-registry.ts), with the same colors.
 * artwork = share of the canvas height kept clear at the bottom for the illustration.
 */
export type WallpaperTheme = {
  id: string
  name: string
  image?: number
  bg: string
  text: string
  accent: string
  panel: string
  border: string
  artwork: number
}

const fromRegistry = (artworkSpace: number) => artworkSpace / (390 * 16 / 9)

export const WALLPAPER_THEMES: WallpaperTheme[] = [
  { id: 'forest', name: 'Forest', bg: '#123B29', text: '#FFFFFF', accent: '#F4C54A', panel: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.14)', artwork: 0.12 },
  { id: 'paper', name: 'Paper', bg: '#F6F3EA', text: '#16211B', accent: '#1E5C40', panel: '#FFFFFF', border: '#E6E6DF', artwork: 0.12 },
  { id: 'dormosaur-adventure', name: 'Adventure', image: require('@/assets/wallpapers/dormosaur-adventure.jpg'), bg: '#dae8d7', text: '#264835', accent: '#1f6f50', panel: 'rgba(255,253,239,.92)', border: '#bacdb8', artwork: fromRegistry(160) },
  { id: 'dormosaur-night-mode', name: 'Night', image: require('@/assets/wallpapers/dormosaur-night-mode.jpg'), bg: '#14211e', text: '#edf8ef', accent: '#a6e4c4', panel: 'rgba(5,15,14,.90)', border: '#45695b', artwork: fromRegistry(125) },
  { id: 'sage-green', name: 'Sage', image: require('@/assets/wallpapers/sage-green.jpg'), bg: '#e2e7cb', text: '#304532', accent: '#416247', panel: 'rgba(255,255,243,.93)', border: '#cad5b7', artwork: fromRegistry(95) },
  { id: 'forest-whimsy', name: 'Whimsy', image: require('@/assets/wallpapers/forest-whimsy.jpg'), bg: '#e5efd9', text: '#284630', accent: '#356e4b', panel: 'rgba(255,254,241,.91)', border: '#bdd0b9', artwork: fromRegistry(310) },
  { id: 'ocean-party', name: 'Ocean', image: require('@/assets/wallpapers/ocean-party.jpg'), bg: '#b5e9f7', text: '#174656', accent: '#087b95', panel: 'rgba(247,255,255,.90)', border: '#acdadd', artwork: fromRegistry(130) },
  { id: 'cute-cat-blue', name: 'Cat Blue', image: require('@/assets/wallpapers/cute-cat-blue.jpg'), bg: '#d7eaff', text: '#253c63', accent: '#3869a5', panel: 'rgba(248,252,255,.91)', border: '#bfd5ec', artwork: fromRegistry(140) },
  { id: 'ultra-pink', name: 'Ultra Pink', image: require('@/assets/wallpapers/ultra-pink.jpg'), bg: '#fbe2e8', text: '#56273b', accent: '#9d375e', panel: 'rgba(255,248,251,.90)', border: '#ebc3d2', artwork: fromRegistry(105) },
  { id: 'pink-notebook', name: 'Notebook', image: require('@/assets/wallpapers/pink-notebook.jpg'), bg: '#fce7f3', text: '#59343f', accent: '#a94368', panel: 'rgba(255,251,249,.92)', border: '#e9c2cb', artwork: fromRegistry(100) },
]
