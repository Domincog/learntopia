// The World at a Glance
//
// The foundation of the World path: the physical and human map. Every later course leans on the mental map built here.
// Part of the "World" learning path (see content/index.js).
export default {
  id: 'world-geography',
  title: 'The World at a Glance',
  tagline: 'A map of the planet you can carry in your head.',
  category: 'world',
  level: 'Beginner',
  color: 'blue',
  cover: 'globe',
  requires: [],
  description: 'Where is everything, and why is it there? Build a working map of the planet in your head: the continents and oceans, the mountains and rivers, the climates, the eight billion people and the lines they have drawn. Along the way, find out why every flat map lies and how a clockmaker solved the problem of longitude.',
  outcomes: [
    'Place the continents, oceans and the main mountain ranges, rivers and deserts on a blank map',
    'Explain what a map projection distorts, and compare the true sizes of countries',
    'Read latitude and longitude, and explain time zones',
    'Explain the main causes of climate: latitude, height, winds and ocean currents',
    'Describe where the world\'s people live and why',
    'Explain what a country is and why borders run where they do',
  ],
  chapters: [
    {
      title: 'The big picture',
      lessons: [
        { id: 'continents-oceans', title: 'Seven Continents, Five Oceans', summary: 'Build the map in your head: where the land and the water are, and how big they really are.', minutes: 11 },
        { id: 'maps-lie', title: 'Every Map Lies', summary: 'A round world cannot lie flat. See what each map stretches, and why Greenland is not the size of Africa.', minutes: 13 },
        { id: 'latitude-longitude', title: 'An Address for Every Place', summary: 'Two numbers pin down any spot on Earth. One of them took a clockmaker to solve.', minutes: 14 },
      ],
    },
    {
      title: 'The living planet',
      lessons: [
        { id: 'land-and-water', title: 'Mountains, Rivers and Deserts', summary: 'The great landforms, the moving plates that build them, and why cities cling to rivers.', minutes: 13 },
        { id: 'climate', title: 'Why It Is Hot Here and Cold There', summary: 'Latitude, height, winds and ocean currents: a few rules behind every climate.', minutes: 14 },
      ],
    },
    {
      title: 'The human map',
      lessons: [
        { id: 'where-people-live', title: 'Eight Billion Neighbours', summary: 'Most people live on a small share of the land. See where, and work out why.', minutes: 13 },
        { id: 'countries-borders', title: 'Lines on the Map', summary: 'What makes a country, why some borders wiggle and others run ruler-straight, and how the map keeps changing.', minutes: 15 },
      ],
    },
  ],
};
