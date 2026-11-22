export default {
  id: 'linear-algebra',
  title: 'Linear Algebra: Vectors & Matrices',
  tagline: 'The mathematics of arrows, grids and data.',
  category: 'math',
  level: 'Intermediate',
  color: 'teal',
  cover: 'matrix',
  requires: ['algebra', 'geometry'],
  description: 'Linear algebra is the working language of computer graphics, data science and machine learning. Start with arrows you can drag, measure how much two of them agree, then meet matrices as machines that move the whole plane. Every idea here can be seen before it is computed.',
  outcomes: [
    'Add, scale and combine vectors, as arrows and as columns of numbers',
    'Use the dot product to measure angle and similarity',
    'Read a matrix as a transformation of the plane, and multiply matrices in the right order',
    'Use the determinant to tell whether a transformation can be undone, and undo it',
    'Find the directions a matrix only stretches: its eigenvectors',
  ],
  chapters: [
    {
      title: 'Vectors',
      lessons: [
        { id: 'vectors', title: 'Arrows With a Purpose', summary: 'A vector is a move. Add them tip to tail, scale them, and reach any point.', minutes: 13 },
        { id: 'dot-product', title: 'How Much Do They Agree?', summary: 'One number that measures alignment: the dot product, angles and shadows.', minutes: 13 },
      ],
    },
    {
      title: 'Matrices',
      lessons: [
        { id: 'matrices-transform', title: 'Machines That Move Space', summary: 'A matrix is a rule for moving every point. Watch where the grid goes.', minutes: 12 },
        { id: 'matrix-multiplication', title: 'One Move After Another', summary: 'Multiplying matrices means doing one transformation, then another. Order matters.', minutes: 13 },
      ],
    },
    {
      title: 'What a matrix does',
      lessons: [
        { id: 'determinants-inverses', title: 'Squash, Flip, Undo', summary: 'The determinant measures how area changes, and tells you when there is no way back.', minutes: 13 },
        { id: 'eigenvectors', title: 'The Directions That Stay Put', summary: 'Most arrows get knocked off course. A few only stretch, and they explain the matrix.', minutes: 14 },
      ],
    },
  ],
};
