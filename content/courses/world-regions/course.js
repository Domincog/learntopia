// Around the World: Places and Cultures
//
// A tour of the world today, region by region: know the map, the capitals and landmarks, the languages and faiths, the food, arts and festivals, and the history that explains them.
// Part of the "World" learning path (see content/index.js).
export default {
  id: 'world-regions',
  title: 'Around the World: Places and Cultures',
  tagline: 'Eight regions, their countries, landmarks, languages and ways of life.',
  category: 'world',
  level: 'Beginner',
  color: 'green',
  cover: 'landmarks',
  requires: ['world-geography'],
  description: 'Travel the world as it is now. In each of eight regions, learn to find the countries and great cities, recognise the landmarks, and understand what people speak, believe, eat and celebrate, and how geography and history made it so. By the end, a headline from anywhere will land on a map in your mind.',
  outcomes: [
    'Find the countries and major cities of each world region on a map',
    'Recognise famous landmarks and say where and what they are',
    'Describe the main languages and religions of each region',
    'Connect features of each region today to its geography and history',
    'Avoid common mix-ups: countries with similar names, capitals that are not the largest city, and regions that overlap',
  ],
  chapters: [
    {
      title: 'Europe, the Middle East and Africa',
      lessons: [
        { id: 'europe', title: 'Europe: The Crowded Peninsula', summary: 'Fifty countries on the western tip of Eurasia: seas, languages, cathedrals and a union.', minutes: 15 },
        { id: 'middle-east-north-africa', title: 'Where Three Continents Meet', summary: 'From Morocco to Iran: deserts and great rivers, the birthplace of three faiths, and the Arabic-speaking world.', minutes: 16 },
        { id: 'sub-saharan-africa', title: 'Africa South of the Sahara', summary: 'Savanna, rainforest and rift valley; two thousand languages; the youngest population on Earth.', minutes: 15 },
      ],
    },
    {
      title: 'Asia and the Pacific',
      lessons: [
        { id: 'south-asia', title: 'South Asia: Mountains and Monsoon', summary: 'A quarter of humanity between the Himalaya and the Indian Ocean, fed by great rivers and the monsoon.', minutes: 15 },
        { id: 'east-asia', title: 'East Asia: A Shared Inheritance', summary: 'China, Japan, the Koreas and Mongolia: written characters, old capitals and the newest megacities.', minutes: 15 },
        { id: 'southeast-asia-oceania', title: 'Islands, Straits and the Great Ocean', summary: 'Southeast Asia, Australia and the Pacific: twenty-five thousand islands and the busiest sea lanes in the world.', minutes: 15 },
      ],
    },
    {
      title: 'The Americas',
      lessons: [
        { id: 'latin-america', title: 'Latin America and the Caribbean', summary: 'From Mexico to Patagonia: the Andes and the Amazon, Spanish and Portuguese, and a blend of three continents.', minutes: 15 },
        { id: 'north-america', title: 'The United States and Canada', summary: 'Two vast countries of first peoples and later arrivals, from the Arctic to the Gulf.', minutes: 15 },
      ],
    },
  ],
};
