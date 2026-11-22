// Crossroads: 500 to 1500
//
// The "middle" millennium told as a story of connections: trade routes, shared knowledge, great kingdoms on every continent, and two hemispheres that did not yet know each other.
// Part of the "World" learning path (see content/index.js).
export default {
  id: 'world-crossroads',
  title: 'Crossroads: 500 to 1500',
  tagline: 'Caravans, monsoon winds and the thousand years that linked the Old World.',
  category: 'world',
  level: 'Intermediate',
  color: 'yellow',
  cover: 'compass',
  requires: ['world-ancient'],
  description: 'Between the fall of Rome and the voyages of Columbus, the centre of the world was not Europe. Ride the Silk Roads and the monsoon winds, visit the libraries of Baghdad and the gold markets of Mali, watch China invent printing and gunpowder, follow the Mongols across a continent, and cross the ocean to the cities of the Maya, the Aztecs and the Inca.',
  outcomes: [
    'Map the main land and sea trade routes of Afro-Eurasia and say what moved along them',
    'Explain how the Islamic world preserved, extended and passed on knowledge',
    'Locate the great African kingdoms and trading cities and explain the sources of their wealth',
    'Describe the inventions of Tang and Song China and how they spread',
    'Describe medieval Europe and Byzantium and place them in the wider world',
    'Explain how the Mongol Empire connected Eurasia, for better and for worse',
    'Describe the civilisations of the Americas before 1492',
  ],
  chapters: [
    {
      title: 'Roads between worlds',
      lessons: [
        { id: 'silk-roads', title: 'Silk Roads and Monsoon Winds', summary: 'Camels across the desert, dhows across the ocean: the routes that carried silk, spices, religions and stories.', minutes: 14 },
        { id: 'islamic-world', title: 'The House of Wisdom', summary: 'A new faith, an empire from Spain to the Indus, and the scholars who gave us algebra and passed on the numerals of India.', minutes: 14 },
      ],
    },
    {
      title: 'Kingdoms and empires',
      lessons: [
        { id: 'african-kingdoms', title: 'Gold, Salt and Stone', summary: 'Mali and its golden king, the Swahili coast, Great Zimbabwe and the rock churches of Ethiopia.', minutes: 13 },
        { id: 'song-china', title: 'Paper, Print, Compass, Powder', summary: 'The richest, most inventive society of its age, and the neighbours who learned from it.', minutes: 14 },
        { id: 'medieval-europe', title: 'Castles, Cathedrals and Constantinople', summary: 'Lords and peasants in the west, a Roman empire still alive in the east, and the cities that woke up between them.', minutes: 14 },
        { id: 'mongols', title: 'The Largest Land Empire', summary: 'Horse archers from the steppe join China to Persia. Trade and travellers flow. So does the plague.', minutes: 14 },
      ],
    },
    {
      title: 'Across the ocean',
      lessons: [
        { id: 'americas', title: 'Worlds Apart: The Americas Before 1492', summary: 'Maya astronomers, a city on a lake, roads along the Andes: civilisations built with no contact with Africa, Europe or Asia.', minutes: 14 },
      ],
    },
  ],
};
