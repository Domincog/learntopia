// Food and Nutrition
//
// Evidence-based nutrition: nutrients, what they do, eating patterns that are known to be healthy, and how to judge the claims.
// Part of the "Health & the Body" learning path (see content/index.js).
// General health education, not personal medical advice.
export default {
  id: 'nutrition',
  title: 'Food and Nutrition',
  tagline: 'What food is made of, what your body does with it, and how to eat well without the hype.',
  category: 'health',
  level: 'Beginner',
  color: 'green',
  cover: 'apple',
  requires: ['body-systems'],
  description: 'Few subjects carry as much noise as food. This course goes back to what is well established: what carbohydrate, fat and protein are and what the body does with each, why fibre and a handful of vitamins and minerals matter so much, how much water you really need, and what the healthiest eating patterns on Earth have in common. You will also learn to read a food label and to see through a diet headline.',
  outcomes: [
    'Say what the main nutrients are and what the body uses each for',
    'Explain how different carbohydrates affect blood sugar, and why fibre matters',
    'Tell the main kinds of fat apart and explain their links to heart health',
    'Explain protein needs and where to get them',
    'Name the vitamins and minerals most often lacking, and who may need supplements',
    'Read a nutrition label and judge a diet claim against the evidence',
    'Describe what healthy eating patterns have in common',
  ],
  chapters: [
    {
      title: 'What food is made of',
      lessons: [
        { id: 'energy-balance', title: 'What Food Is For', summary: 'Fuel, building material and tiny helpers: the three jobs of food, and what a calorie measures.', minutes: 12 },
        { id: 'carbohydrates', title: 'Sugar, Starch and Fibre', summary: 'Why an apple and a spoonful of sugar are not the same thing to your blood.', minutes: 13 },
        { id: 'fats', title: 'The Truth About Fat', summary: 'Saturated, unsaturated, trans: which fats do what, and how the advice came to change.', minutes: 12 },
        { id: 'protein', title: 'Building Blocks', summary: 'Twenty amino acids, nine you must eat, and how much protein a body really needs.', minutes: 11 },
      ],
    },
    {
      title: 'Small things that matter',
      lessons: [
        { id: 'vitamins-minerals', title: 'Small Amounts, Big Jobs', summary: 'From scurvy to iron and vitamin D: the micronutrients, and who really needs a supplement.', minutes: 14 },
        { id: 'water-salt', title: 'Water, Salt and What to Drink', summary: 'How much water you need, what salt does to blood pressure, and what is in your glass.', minutes: 13 },
      ],
    },
    {
      title: 'Eating well',
      lessons: [
        { id: 'eating-well', title: 'Putting a Plate Together', summary: 'What the healthiest diets share, how to read a label, and how to see through a food headline.', minutes: 14 },
      ],
    },
  ],
};
