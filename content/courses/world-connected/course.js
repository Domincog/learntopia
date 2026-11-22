// One World: 1450 to 1800
//
// The early modern world: the oceans become highways, and plants, people, silver, germs and ideas move as never before.
// Part of the "World" learning path (see content/index.js).
export default {
  id: 'world-connected',
  title: 'One World: 1450 to 1800',
  tagline: 'Ships join the continents, and nothing stays where it was.',
  category: 'world',
  level: 'Intermediate',
  color: 'teal',
  cover: 'ship',
  requires: ['world-crossroads'],
  description: 'In a few decades around 1500, sailors tied the oceans together and the two halves of the world met. Follow the voyages, then follow what moved: potatoes and horses, silver and smallpox, and more than twelve million enslaved Africans. Meet the great empires of Asia at their height, and watch print, reform and a new science remake how people think.',
  outcomes: [
    'Trace the great voyages and explain how winds and currents shaped them',
    'Explain the Columbian Exchange and its effects on food, population and power',
    'Locate and compare the Ottoman, Safavid, Mughal, Ming and Qing, and Tokugawa states',
    'Explain how printing changed religion, language and learning in Europe',
    'Describe the Scientific Revolution and the Enlightenment and why they mattered',
    'Describe the Atlantic slave trade, its scale, and its lasting consequences',
  ],
  chapters: [
    {
      title: 'The oceans open',
      lessons: [
        { id: 'voyages', title: 'The World Made Round', summary: 'Zheng He, da Gama, Columbus, Magellan: how sailors learned the winds and tied the oceans together.', minutes: 14 },
        { id: 'columbian-exchange', title: 'The Great Exchange', summary: 'Potatoes, horses, silver and smallpox cross the Atlantic. Dinner, and the world, are never the same.', minutes: 14 },
      ],
    },
    {
      title: 'Empires and ideas',
      lessons: [
        { id: 'gunpowder-empires', title: 'Sultans, Shahs and Emperors', summary: 'From Istanbul to Beijing: the great land empires of Asia at their height.', minutes: 14 },
        { id: 'print-and-reform', title: 'The Printing Revolution', summary: 'Movable type, a rebirth of learning and a split in the church: what cheap books did to Europe.', minutes: 14 },
        { id: 'new-science', title: 'A New Way of Knowing', summary: 'Copernicus moves the Earth, Galileo looks up, Newton writes the rules, and reason becomes a cause.', minutes: 14 },
      ],
    },
    {
      title: 'The price of sugar',
      lessons: [
        { id: 'atlantic-world', title: 'Sugar, Silver and Chains', summary: 'The Atlantic system that made fortunes from forced labour, and the people who survived and resisted it.', minutes: 13 },
      ],
    },
  ],
};
