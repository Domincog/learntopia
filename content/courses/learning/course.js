export default {
  id: 'learning',
  title: 'How to Learn Anything',
  tagline: 'The science of making knowledge stick.',
  category: 'meta',
  level: 'Beginner',
  color: 'orange',
  cover: 'memory',
  description:
    'Most of us were never taught how to learn. Decades of research point to a handful of ' +
    'simple habits that beat re-reading and cramming by a wide margin. In this course you run ' +
    'the experiments on yourself, feel each habit work, and finish with a study system of your own.',
  outcomes: [
    'Explain why forgetting is normal — and how spacing turns it to your advantage',
    'Use retrieval practice instead of re-reading',
    'Mix topics so you learn to choose the right tool',
    'Judge what you really know, not what merely feels familiar',
    'Turn facts into understanding by asking why',
    'Work with the limits of working memory and attention instead of against them',
    'Build a small daily study habit that lasts',
  ],
  chapters: [
    {
      title: 'Memory, the user manual',
      lessons: [
        { id: 'forgetting-curve', title: 'Why We Forget', summary: 'Memories fade on a curve. A well-timed review bends it.', minutes: 8 },
        { id: 'retrieval', title: 'Pull, Don’t Push', summary: 'Testing yourself builds memory. Re-reading mostly builds confidence.', minutes: 8 },
        { id: 'mix-it-up', title: 'Mix It Up', summary: 'Why shuffled practice feels worse and works better.', minutes: 7 },
        { id: 'know-what-you-know', title: 'Know What You Know', summary: 'Familiar is not the same as learned. Calibrate your confidence.', minutes: 8 },
      ],
    },
    {
      title: 'Understanding, attention and habit',
      lessons: [
        { id: 'ask-why', title: 'Ask Why', summary: 'Facts stick when they connect. Build the connections on purpose.', minutes: 9 },
        { id: 'narrow-doorway', title: 'The Narrow Doorway', summary: 'Test the limits of your working memory, then learn the trick that beats them.', minutes: 10 },
        { id: 'one-thing', title: 'One Thing at a Time', summary: 'Measure what switching tasks costs you, and why rest is part of the work.', minutes: 8 },
        { id: 'build-your-system', title: 'Build Your System', summary: 'Bust the myths, pick the right tool, and plan a habit that lasts.', minutes: 11 },
      ],
    },
  ],
};
