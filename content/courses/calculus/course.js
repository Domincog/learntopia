export default {
  id: 'calculus',
  title: 'Calculus in Pictures',
  tagline: 'The mathematics of change, without the fog.',
  category: 'math',
  level: 'Intermediate',
  color: 'red',
  cover: 'curve',
  requires: ['algebra'],
  description: 'Calculus answers two questions: how fast is it changing right now, and how much has piled up so far? Drag, zoom and sweep your way to both answers — and to the surprising fact that each one undoes the other.',
  outcomes: [
    'Tell an average rate from an instantaneous one, and find both from a graph or a table',
    'Read a derivative as the slope of a curve at a point, and match a graph to the graph of its derivative',
    'Differentiate polynomials with the power rule',
    'Read an integral as accumulated area, and estimate it with rectangles',
    'Explain why slopes and areas undo each other, and use that to find exact areas',
    'Find the best value of something by looking where its slope is zero',
    'Recognise growth in proportion to size, and say what makes the number e special',
  ],
  chapters: [
    {
      title: 'Rates of change',
      lessons: [
        { id: 'average-vs-instant', title: 'How Fast, Right Now?', summary: 'Average speed is easy. Speed at a single instant needs a new idea.', minutes: 12 },
        { id: 'the-derivative', title: 'The Slope Machine', summary: 'Zoom in until a curve looks straight, then record its slope everywhere.', minutes: 13 },
        { id: 'derivative-rules', title: 'Spotting the Pattern', summary: 'Measure a few slopes and discover the power rule for yourself.', minutes: 14 },
      ],
    },
    {
      title: 'Accumulation',
      lessons: [
        { id: 'area-under-curves', title: 'Adding Up Slices', summary: 'Distance is area under a speed graph. Trap it between rectangles.', minutes: 13 },
        { id: 'fundamental-theorem', title: 'The Big Connection', summary: 'Why finding areas is finding slopes, run backwards.', minutes: 13 },
      ],
    },
    {
      title: 'Calculus at work',
      lessons: [
        { id: 'optimization', title: 'Finding the Best', summary: 'The biggest pen, the best price, the largest box: look where the slope is zero.', minutes: 14 },
        { id: 'own-slope', title: 'The Curve That Is Its Own Slope', summary: 'Growth in proportion to size, the number e, and why 3% a year is not small.', minutes: 14 },
      ],
    },
  ],
};
