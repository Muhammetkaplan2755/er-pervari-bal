/* Responsive photo attributes. Each shop photo ships as name-640.webp / name-1220.webp
   (generated from public/images/name.jpg, which stays as the fallback and og:image).
   width/height are the intrinsic size so the browser reserves space before load (no layout shift). */
const sizes = {
  dukkan: [1220, 1638],
  icecek: [1220, 1520],
  'krem-bal': [1220, 1527],
  petek: [1220, 1473],
  raflar: [1220, 1518],
  suzme: [1220, 1499],
}

export function photo(name) {
  const [width, height] = sizes[name]
  return {
    src: `/images/${name}.jpg`,
    srcSet: `/images/${name}-640.webp 640w, /images/${name}-1220.webp 1220w`,
    width,
    height,
  }
}
