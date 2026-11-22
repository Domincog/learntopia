// The Body I: Fuel, Air and Blood
//
// Human physiology, part one: what every cell needs and the systems that deliver it (heart and blood, lungs, gut, energy, kidneys and balance).
// Part of the "Health & the Body" learning path (see content/index.js).
// General health education, not personal medical advice.
export default {
  id: 'body-systems',
  title: 'The Body I: Fuel, Air and Blood',
  tagline: 'How thirty trillion cells are fed, supplied and kept in balance.',
  category: 'health',
  level: 'Beginner',
  color: 'pink',
  cover: 'heartbeat',
  requires: [],
  description: 'You are a city of about thirty trillion cells, and every one of them needs fuel, oxygen and a way to get rid of waste. Follow a red blood cell round the double loop of the circulation, a breath down to the air sacs, and a meal from plate to bloodstream. Then see how the body burns its fuel and how it keeps temperature, water and salt steady without your ever thinking about it.',
  outcomes: [
    'Explain how cells, tissues, organs and systems fit together, and what every cell needs',
    'Trace blood through the heart and round both loops of the circulation, and explain pulse and blood pressure',
    'Say what the parts of blood do',
    'Explain how the lungs exchange gases and what controls breathing',
    'Follow food through the digestive system and say where it is broken down and absorbed',
    'Explain how cells release energy from food, and how the body keeps its internal conditions steady',
  ],
  chapters: [
    {
      title: 'Built from cells',
      lessons: [
        { id: 'cells-to-systems', title: 'Thirty Trillion Cells', summary: 'From one cell to a whole body: what cells need, and how organs team up to supply it.', minutes: 12 },
      ],
    },
    {
      title: 'The supply lines',
      lessons: [
        { id: 'heart-circulation', title: 'The Pump and the Loop', summary: 'One heart, two circuits: follow the blood, feel your pulse, and see what blood pressure measures.', minutes: 14 },
        { id: 'blood', title: 'What Blood Carries', summary: 'Red cells, white cells, platelets and plasma: a delivery service, a defence force and a repair crew.', minutes: 13 },
        { id: 'breathing', title: 'Every Breath', summary: 'Down the airway to hundreds of millions of air sacs, where oxygen is swapped for carbon dioxide.', minutes: 13 },
      ],
    },
    {
      title: 'Fuel and balance',
      lessons: [
        { id: 'digestion', title: 'From Plate to Bloodstream', summary: 'A tube several metres long that turns lunch into molecules small enough to cross into the blood.', minutes: 14 },
        { id: 'energy', title: 'Burning Fuel', summary: 'How cells turn food and oxygen into usable energy, and where the fat goes when you lose it.', minutes: 13 },
        { id: 'kidneys-balance', title: 'Keeping the Balance', summary: 'Temperature, water, salt and sugar held steady by feedback, with the kidneys as chief chemists.', minutes: 13 },
      ],
    },
  ],
};
