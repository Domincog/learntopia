// Movement and Fitness
//
// The physiology and practice of physical activity: why it matters, stamina, strength, mobility, training and recovery, and making it a habit.
// Part of the "Health & the Body" learning path (see content/index.js).
// General health education, not personal medical advice.
export default {
  id: 'fitness',
  title: 'Movement and Fitness',
  tagline: 'What exercise does to a body, and how to build a habit that lasts.',
  category: 'health',
  level: 'Beginner',
  color: 'orange',
  cover: 'runner',
  requires: ['body-systems'],
  description: 'If the effects of regular movement came in a pill, it would be the most prescribed medicine in the world. See what activity does to your heart, muscles, bones, brain and mood, and how much is enough. Learn how stamina and strength are built, why rest is part of training, what actually causes sore muscles, and how to turn good intentions into a routine that survives a busy week.',
  outcomes: [
    'Explain the main health effects of physical activity and how much is recommended',
    'Explain how the heart, lungs and muscles adapt to aerobic training, and use heart rate to judge effort',
    'Explain how muscles and bones respond to strength training and why it matters at every age',
    'Describe the roles of flexibility, balance and posture, and the basics of back care',
    'Explain overload, recovery and adaptation, and common causes of injury',
    'Plan a realistic week of activity and apply what is known about building habits',
  ],
  chapters: [
    {
      title: 'Why move',
      lessons: [
        { id: 'why-move', title: 'The Nearest Thing to a Wonder Drug', summary: 'What regular movement does for almost every organ, and how much is enough.', minutes: 13 },
      ],
    },
    {
      title: 'Building a body',
      lessons: [
        { id: 'aerobic', title: 'Heart, Lungs and Stamina', summary: 'Why you get out of breath, how training changes your heart, and what your pulse can tell you.', minutes: 14 },
        { id: 'strength', title: 'Stronger', summary: 'How muscle and bone answer to load, and why strength matters more with every decade.', minutes: 13 },
        { id: 'mobility-balance', title: 'Bend, Reach, Balance', summary: 'Flexibility, balance and posture: what helps, what is myth, and how to look after your back.', minutes: 13 },
      ],
    },
    {
      title: 'Training that works',
      lessons: [
        { id: 'training-recovery', title: 'Stress, Rest, Adapt', summary: 'Fitness is built while you recover. Overload, soreness, sleep and how injuries happen.', minutes: 13 },
        { id: 'habits', title: 'Making It Stick', summary: 'From good intention to routine: what the science of habit says, and a week that fits your life.', minutes: 12 },
      ],
    },
  ],
};
