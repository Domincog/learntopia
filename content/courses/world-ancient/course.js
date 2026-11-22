// First Worlds: To 500 CE
//
// History from the peopling of the planet to about 500 CE, always tied to the map: why here, why then.
// Part of the "World" learning path (see content/index.js).
export default {
  id: 'world-ancient',
  title: 'First Worlds: To 500 CE',
  tagline: 'From the first footsteps out of Africa to Rome and Han China.',
  category: 'world',
  level: 'Beginner',
  color: 'orange',
  cover: 'pyramid',
  requires: ['world-geography'],
  description: 'For most of the human story there were no cities, no writing and no farms. Follow our species out of Africa and across every ocean, watch farming and cities appear beside a handful of rivers, see writing invented more than once, and meet the empires and the ideas of the classical world, many of which are still with us.',
  outcomes: [
    'Trace the spread of humans across the continents and the Pacific, and place it on a timeline',
    'Explain why farming began where it did and what it changed',
    'Locate the first river-valley civilisations and say what they had in common',
    'Explain how writing developed, from tokens to alphabets',
    'Place the Persian, Greek, Roman, Mauryan and Han worlds on the map and in time',
    'Say where the major classical religions and philosophies began and how they spread',
  ],
  chapters: [
    {
      title: 'Before history',
      lessons: [
        { id: 'peopling', title: 'Out of Africa', summary: 'How one species walked, paddled and sailed to every continent but one.', minutes: 12 },
        { id: 'farming', title: 'The Seeds of Everything', summary: 'In several places, independently, people began to grow their food. Nothing was the same again.', minutes: 11 },
      ],
    },
    {
      title: 'Cities and writing',
      lessons: [
        { id: 'river-valleys', title: 'Four Rivers, Four Civilisations', summary: 'Tigris and Euphrates, Nile, Indus, Yellow River: why the first cities grew beside water.', minutes: 12 },
        { id: 'writing', title: 'Marks That Speak', summary: 'From clay tokens to the alphabet: how writing was invented, more than once, and what it changed.', minutes: 11 },
      ],
    },
    {
      title: 'The classical world',
      lessons: [
        { id: 'persia-greece', title: 'Persians, Greeks and Alexander', summary: 'A vast empire, a scatter of quarrelsome cities, and the young king who stitched their worlds together.', minutes: 12 },
        { id: 'rome-han', title: 'Rome and Han', summary: 'Two empires at opposite ends of Eurasia, each sure it was the centre of the world.', minutes: 12 },
        { id: 'beliefs', title: 'Ideas That Outlived Empires', summary: 'The Buddha, Confucius, the Hebrew prophets, the Greek philosophers, Jesus: where great traditions began and how they travelled.', minutes: 12 },
      ],
    },
  ],
};
