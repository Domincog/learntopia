export default {
  id: 'statistics',
  title: 'Data & Statistics',
  tagline: 'Read data without being fooled by it.',
  category: 'data',
  level: 'Beginner',
  color: 'pink',
  cover: 'chart',
  description: 'Drag data points, draw samples and bend charts to see what averages hide, what a correlation can and cannot tell you, and how honest numbers are made to mislead.',
  outcomes: [
    'Choose between the mean and the median, and explain why',
    'Describe how spread out data is, and read the shape of a histogram',
    'Judge a relationship from a scatter plot without mistaking it for cause and effect',
    'Explain why a small random sample can speak for millions, and why a biased one cannot',
    'Spot the standard tricks in misleading charts and statistics',
  ],
  chapters: [
    {
      title: 'Describing data',
      lessons: [
        { id: 'center', title: 'The Middle of the Data', summary: 'Mean and median, and what happens when a billionaire walks in.', minutes: 9 },
        { id: 'spread', title: 'How Spread Out?', summary: 'Two data sets, the same average, very different stories.', minutes: 10 },
        { id: 'distributions', title: 'The Shape of Data', summary: 'Histograms, skew, and the bell curve with its limits.', minutes: 11 },
      ],
    },
    {
      title: 'Relationships and samples',
      lessons: [
        { id: 'correlation', title: 'Do They Move Together?', summary: 'Scatter plots, trend lines and the correlation trap.', minutes: 12 },
        { id: 'sampling', title: 'A Spoonful of Soup', summary: 'Why a small sample can speak for millions, and when it cannot.', minutes: 11 },
        { id: 'misleading-data', title: 'Lying with Charts', summary: 'Spot the tricks that make honest numbers deceive.', minutes: 11 },
      ],
    },
  ],
};
