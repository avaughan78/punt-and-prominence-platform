export interface RequirementChip {
  group: string
  label: string
  text: string
  pattern?: RegExp
  singular?: string
  plural?: string
}

export const REQUIREMENT_CHIPS: RequirementChip[] = [
  { group: 'Format',  label: 'Reel',              text: '1 Reel',                pattern: /(\d+)\s+Reels?/i,              singular: 'Reel',  plural: 'Reels' },
  { group: 'Format',  label: 'Static post',        text: '1 static post' },
  { group: 'Format',  label: 'Carousel',           text: '1 carousel (3+ images)' },
  { group: 'Format',  label: 'Story',              text: '1 Story',               pattern: /(\d+)\s+Stor(?:y|ies)/i,       singular: 'Story', plural: 'Stories' },
  { group: 'Format',  label: 'TikTok video',       text: '1 TikTok video' },
  { group: 'Tagging', label: 'Tag us',             text: 'tag @yourbusiness' },
  { group: 'Tagging', label: 'Tag location',       text: 'tag our location' },
  { group: 'Tagging', label: 'Use our hashtag',    text: 'use #yourhashtag' },
  { group: 'Content', label: 'Show the product',   text: 'show the product' },
  { group: 'Content', label: 'Show the interior',  text: 'show the interior' },
  { group: 'Content', label: 'Face on camera',     text: 'face on camera' },
  { group: 'Content', label: 'Mention in caption', text: 'mention us in the caption' },
  { group: 'Style',   label: 'Authentic feel',     text: 'authentic, natural feel' },
  { group: 'Style',   label: 'Strong hook',        text: 'strong hook in first 3 seconds' },
  { group: 'Style',   label: 'Call to action',     text: 'include a call to action' },
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
