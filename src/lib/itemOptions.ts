export interface OptionChoice {
  label: string
  priceCents: number
}

export interface OptionGroup {
  id: string
  label: string
  required: boolean
  multiSelect: boolean
  choices: OptionChoice[]
}

const WONTON_SOUP_EXTRAS: OptionGroup = {
  id: 'extras',
  label: 'EXTRAS',
  required: false,
  multiSelect: true,
  choices: [
    { label: 'Extra Wonton', priceCents: 300 },
    { label: 'Extra Vegetable', priceCents: 300 },
    { label: 'Add Chicken', priceCents: 300 },
    { label: 'Add Beef', priceCents: 300 },
    { label: 'Add BBQ Pork', priceCents: 300 },
    { label: 'Add King Prawn', priceCents: 500 },
  ],
}

// BBQ Wonton Soup — With Noodle 免费
const BBQ_WONTON_SOUP_OPTIONS: OptionGroup[] = [
  {
    id: 'noodle',
    label: 'NOODLE',
    required: true,
    multiSelect: false,
    choices: [
      { label: 'With Noodle', priceCents: 0 },
      { label: 'No Noodle', priceCents: 0 },
    ],
  },
  WONTON_SOUP_EXTRAS,
]

// Wonton Soup — With Noodle +$2.00
const WONTON_SOUP_OPTIONS: OptionGroup[] = [
  {
    id: 'noodle',
    label: 'NOODLE',
    required: true,
    multiSelect: false,
    choices: [
      { label: 'With Noodle', priceCents: 200 },
      { label: 'No Noodle', priceCents: 0 },
    ],
  },
  WONTON_SOUP_EXTRAS,
]

const RICE_BOWL_OPTIONS: OptionGroup[] = [
  {
    id: 'rice',
    label: 'RICE',
    required: true,
    multiSelect: false,
    choices: [
      { label: 'Boiled Rice', priceCents: 0 },
      { label: 'Fried Rice', priceCents: 0 },
      { label: 'Ham Fried Rice', priceCents: 200 },
    ],
  },
]

export const ITEM_OPTIONS: Record<string, OptionGroup[]> = {
  // Wonton Soups
  '5da9ce92-f728-413c-974f-9f12820c40e6': BBQ_WONTON_SOUP_OPTIONS, // BBQ Wonton Soup — With Noodle 免费
  '5b022ba0-b2e4-439b-a1c8-42b58c81e7d0': WONTON_SOUP_OPTIONS,     // Wonton Soup — With Noodle +$2
  // Rice Bowls
  '16008ae9-8679-487d-8d93-483d4a2d1c42': RICE_BOWL_OPTIONS, // Original BBQ Pork Bowl
  '34a5d374-b3b9-4638-90d0-836cfdaee81e': RICE_BOWL_OPTIONS, // Satay Chicken Bowl
  'e85b381b-317f-4fc4-b471-ad2334ada647': RICE_BOWL_OPTIONS, // Mongolian Beef Bowl
  'd3daff3b-070a-43fb-a7bb-c5ea07155516': RICE_BOWL_OPTIONS, // Sweet Sour Pork Bowl
  '85f945bd-9189-4338-b7eb-d14d3983770b': RICE_BOWL_OPTIONS, // Crispy Honey Chicken Bowl
  '163dd518-7b8a-418b-bfe1-28f25239d2f4': RICE_BOWL_OPTIONS, // Curry Chicken Bowl
  '482aa29a-ad4b-43c8-9e98-e5a35dc7bc2c': RICE_BOWL_OPTIONS, // Garlic King Prawns Bowl
  'a3ca3264-5302-4b8e-a0b2-ce28728b51ab': RICE_BOWL_OPTIONS, // Special Chilli Beef Bowl
  '5f961487-9e05-42c0-a9bc-c8e26d0a00cc': RICE_BOWL_OPTIONS, // Chicken Stir Fry Bowl
}
