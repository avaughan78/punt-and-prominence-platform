export interface RequirementChip {
  group: string
  label: string
  text: string
  pattern?: RegExp
  singular?: string
  plural?: string
}

export const REQUIREMENT_CHIPS: RequirementChip[] = [
  { group: 'Format',  label: 'Reel',           text: '1 Reel',              pattern: /(\d+)\s+Reels?/i,                       singular: 'Reel',          plural: 'Reels' },
  { group: 'Format',  label: 'Static post',     text: '1 static post',       pattern: /(\d+)\s+static\s+posts?/i,               singular: 'static post',   plural: 'static posts' },
  { group: 'Format',  label: 'Carousel',        text: '1 carousel',          pattern: /(\d+)\s+carousels?/i,                    singular: 'carousel',      plural: 'carousels' },
  { group: 'Format',  label: 'Story',           text: '1 Story',             pattern: /(\d+)\s+Stor(?:y|ies)/i,                 singular: 'Story',         plural: 'Stories' },
  { group: 'Format',  label: 'TikTok video',    text: '1 TikTok video',      pattern: /(\d+)\s+TikTok\s+videos?/i,              singular: 'TikTok video',  plural: 'TikTok videos' },
  { group: 'Tagging', label: 'Tag us',          text: 'tag @yourbusiness' },
  { group: 'Tagging', label: 'Tag location',    text: 'tag our location' },
  { group: 'Tagging', label: 'Use our hashtag', text: 'use #yourhashtag' },
]

export function applyChip(current: string, chip: RequirementChip): string {
  if (chip.pattern && chip.singular && chip.plural) {
    const match = current.match(chip.pattern)
    if (match) {
      const n = parseInt(match[1]) + 1
      return current.replace(chip.pattern, `${n} ${n === 1 ? chip.singular : chip.plural}`)
    }
  }
  const trimmed = current.trim()
  return trimmed ? (trimmed.endsWith(',') ? `${trimmed} ${chip.text}` : `${trimmed}, ${chip.text}`) : chip.text
}
