const PLACEHOLDER_PATTERNS = [
  'sx-filter__skeeks-cms-components-imaging-filters-Thumbnail',
  'nophoto',
  'no-photo',
  'no_photo',
  'noimage',
  'no-image',
  'no_image',
]

export function getProductImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (PLACEHOLDER_PATTERNS.some(p => url.includes(p))) return null
  return url
}
