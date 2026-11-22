// The Body II: Control, Defence and Movement
//
// Human physiology, part two: how the body senses, decides, defends and moves, and how a life begins, grows and ages.
// Part of the "Health & the Body" learning path (see content/index.js).
// General health education, not personal medical advice.
export default {
  id: 'body-control',
  title: 'The Body II: Control, Defence and Movement',
  tagline: 'Nerves, hormones, immunity, muscle and bone, and the cycle of life.',
  category: 'health',
  level: 'Beginner',
  color: 'violet',
  cover: 'neuron',
  requires: ['body-systems'],
  description: 'The first course followed the supply lines. This one meets the management: a nervous system that sends signals at up to a hundred metres a second, senses that build your picture of the world, hormones that set the pace of everything from growth to sleep, and an immune system that remembers every infection you have had. Then muscles and bones, and the story of a human life from a single cell to old age. The last two lessons cover reproduction, puberty and sexual health in plain, clinical language, written for readers of about 13 and up.',
  outcomes: [
    'Explain how neurons carry and pass on signals, and what the main parts of the brain do',
    'Explain how the eyes, ears and other senses work, and why perception can be fooled',
    'Explain how hormones control blood sugar, stress and growth through feedback',
    'Describe the layers of the immune system and how it remembers',
    'Explain how muscles, bones and joints produce movement and renew themselves',
    'Describe human reproduction, growth, puberty and ageing, and the basics of sexual health',
  ],
  chapters: [
    {
      title: 'Signals',
      lessons: [
        { id: 'nervous-system', title: 'Wired', summary: 'Eighty-six billion neurons, a reflex faster than thought, and the brain that runs the show.', minutes: 13 },
        { id: 'senses', title: 'Windows on the World', summary: 'How eyes, ears, skin, nose and tongue turn light, sound and chemicals into experience.', minutes: 13 },
        { id: 'hormones', title: 'Chemical Messengers', summary: 'Slow signals in the blood: insulin, adrenaline, thyroid hormone and the feedback loops that steer them.', minutes: 13 },
      ],
    },
    {
      title: 'Defence and movement',
      lessons: [
        { id: 'immune-system', title: 'Your Standing Army', summary: 'Barriers, first responders and specialists with a memory: how the body fights infection.', minutes: 13 },
        { id: 'muscles-bones', title: 'Levers and Motors', summary: 'Two hundred and six bones, six hundred muscles, and tissue that rebuilds itself all your life.', minutes: 12 },
      ],
    },
    {
      title: 'A human life',
      lessons: [
        { id: 'life-cycle', title: 'From One Cell to Old Age', summary: 'Conception, pregnancy, childhood, puberty and ageing: the body through a lifetime.', minutes: 13 },
        { id: 'sexual-health', title: 'Sexual and Reproductive Health', summary: 'Clear facts about fertility, contraception, infections and consent.', minutes: 12 },
      ],
    },
  ],
};
