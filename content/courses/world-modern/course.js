// The Modern World: 1750 to Today
//
// The last 275 years: industry, revolutions, empires, two world wars, decolonisation and the Cold War, and the accelerating present.
// Part of the "World" learning path (see content/index.js).
export default {
  id: 'world-modern',
  title: 'The Modern World: 1750 to Today',
  tagline: 'Steam, revolutions, world wars and the planet we share now.',
  category: 'world',
  level: 'Intermediate',
  color: 'red',
  cover: 'factory',
  requires: ['world-connected'],
  description: 'In less than three centuries the world\'s population grew tenfold, most empires rose and fell, and humanity went from horse to moon rocket. Learn how coal and steam changed work, how the idea of the nation redrew the map, how two world wars and a cold one shaped the present, and how a hundred new countries won their independence.',
  outcomes: [
    'Explain why the Industrial Revolution began where and when it did, and what it changed',
    'Compare the American, French, Haitian and Latin American revolutions',
    'Explain nationalism and the new imperialism of the nineteenth century',
    'Explain the causes, course and consequences of the two world wars',
    'Describe the Cold War and the wave of decolonisation, on the map and the timeline',
    'Describe the main changes in the world since 1950: population, cities, trade, technology and climate',
  ],
  chapters: [
    {
      title: 'An age of revolutions',
      lessons: [
        { id: 'industrial-revolution', title: 'Coal, Steam and Cotton', summary: 'Why machines and factories appeared first in Britain, and how they changed work, cities and the air itself.', minutes: 15 },
        { id: 'age-of-revolutions', title: 'Liberty, Equality, Independence', summary: 'Philadelphia, Paris, Haiti, Caracas: fifty years in which subjects decided to become citizens.', minutes: 14 },
        { id: 'nations-and-empires', title: 'Flags and Empires', summary: 'New nations are forged in Europe and Japan while a handful of powers carve up Africa and Asia.', minutes: 15 },
      ],
    },
    {
      title: 'The world at war',
      lessons: [
        { id: 'first-world-war', title: 'The War That Ended Four Empires', summary: 'How a shot in Sarajevo led to the trenches, a revolution in Russia and a new map.', minutes: 14 },
        { id: 'second-world-war', title: 'A World in Flames', summary: 'Dictators, a war on every ocean, the Holocaust and the bomb, and the order built from the ruins.', minutes: 14 },
      ],
    },
    {
      title: 'One planet',
      lessons: [
        { id: 'cold-war-decolonisation', title: 'Two Blocs and a Hundred New Flags', summary: 'A world split between two superpowers, while empires dissolve from India to Ghana to Vietnam.', minutes: 14 },
        { id: 'globalisation', title: 'The Great Acceleration', summary: 'Since 1950: three times as many people, cities of millions, container ships, the internet and a warming planet.', minutes: 14 },
      ],
    },
  ],
};
