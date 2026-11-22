export default {
  id: 'inference',
  title: 'Statistical Inference',
  tagline: 'How to learn about millions from a sample, and know how sure you are.',
  category: 'data',
  level: 'Intermediate',
  color: 'red',
  cover: 'interval',
  requires: ['statistics', 'probability'],
  description: 'A poll, a drug trial and an A/B test all face the same question: is this result real, or is it luck? Build the reasoning from the ground up by simulating thousands of samples. Learn what a confidence interval and a p-value do and do not say, and how honest-looking studies go wrong.',
  outcomes: [
    'Explain how sample averages vary and why bigger samples vary less',
    'Build and correctly interpret a confidence interval',
    'Carry out a hypothesis test by simulation and say exactly what a p-value means',
    'Tell statistical significance from practical importance, and weigh the two kinds of error',
    'Recognise what a randomised experiment can show that observational data cannot',
    'Spot p-hacking and other ways that studies mislead',
  ],
  chapters: [
    {
      title: 'From sample to population',
      lessons: [
        { id: 'sampling-distributions', title: 'The Dance of the Sample Mean', summary: 'Draw sample after sample and watch their averages form a pattern of their own.', minutes: 14 },
        { id: 'confidence-intervals', title: 'A Range You Can Trust', summary: 'What "95% confident" really promises, and the popular reading that is wrong.', minutes: 13 },
      ],
    },
    {
      title: 'Testing a claim',
      lessons: [
        { id: 'hypothesis-tests', title: 'Could It Be Chance?', summary: 'Assume nothing is going on, simulate that world, and see how surprising your data is.', minutes: 13 },
        { id: 'errors-and-power', title: 'Two Ways to Be Wrong', summary: 'False alarms and missed effects, and why "significant" does not mean "important".', minutes: 12 },
      ],
    },
    {
      title: 'Reading studies',
      lessons: [
        { id: 'experiments', title: 'Which Version Wins?', summary: 'Why tossing a coin to form the groups is the most powerful idea in science.', minutes: 12 },
        { id: 'forking-paths', title: 'How to Find Something in Nothing', summary: 'Test enough things and something will look real. P-hacking, and how to defend against it.', minutes: 13 },
      ],
    },
  ],
};
