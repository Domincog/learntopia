// Sleep, Stress and Mental Health
//
// Sleep science, the stress response, emotions and thinking, common mental-health conditions and where help comes from, and the role of other people.
// Part of the "Health & the Body" learning path (see content/index.js).
// General health education, not personal medical advice.
export default {
  id: 'sleep-mind',
  title: 'Sleep, Stress and Mental Health',
  tagline: 'Rest, pressure and the workings of your own mind.',
  category: 'health',
  level: 'Beginner',
  color: 'blue',
  cover: 'moon',
  requires: [],
  description: 'You will spend about a third of your life asleep, and the rest of it inside your own head. Find out what sleep is for, what sets your body clock and how to sleep better. See what stress does to a body in the short and the long run, and how thoughts, feelings and actions feed one another. Learn to recognise when a low mood or a worry has become something more, what treatments work, and how to help someone who is struggling.',
  outcomes: [
    'Describe the stages of sleep and what sleep does for body and brain',
    'Explain the body clock and how light, caffeine and habits affect sleep',
    'Explain the stress response and the difference between short-term and long-term stress',
    'Explain how thoughts, feelings and behaviour influence one another, and use simple tools to manage them',
    'Recognise the signs of common mental-health conditions and know what help exists',
    'Support someone who is struggling, and know what to do in a crisis',
  ],
  chapters: [
    {
      title: 'Sleep',
      lessons: [
        { id: 'why-sleep', title: 'A Third of Your Life', summary: 'What happens in a sleeping brain, night after night, and what goes wrong without it.', minutes: 13 },
        { id: 'body-clock', title: 'Your Inner Clock', summary: 'A twenty-four-hour rhythm in every cell, set by light: larks, owls, teenagers and jet lag.', minutes: 13 },
        { id: 'better-sleep', title: 'Sleeping Well', summary: 'Sleep pressure, caffeine, light and routine: what helps, what does not, and when to ask for help.', minutes: 13 },
      ],
    },
    {
      title: 'Stress and the mind',
      lessons: [
        { id: 'stress', title: 'Fight, Flight and the Long Haul', summary: 'The alarm system that saves your life in a sprint and wears you down in a marathon.', minutes: 13 },
        { id: 'emotions-mind', title: 'How Your Mind Works on You', summary: 'Thoughts, feelings and actions feed one another. Learn the loop, and where you can step in.', minutes: 13 },
      ],
    },
    {
      title: 'Mental health',
      lessons: [
        { id: 'mental-health', title: 'More Than a Bad Day', summary: 'Depression, anxiety and other common conditions: how to recognise them, and what really helps.', minutes: 14 },
        { id: 'connection', title: 'People Need People', summary: 'Why loneliness harms and belonging heals, how to help a friend, and a toolkit for your own wellbeing.', minutes: 13 },
      ],
    },
  ],
};
