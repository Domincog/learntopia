export default {
  id: 'geometry',
  title: 'Geometry: Shape & Space',
  tagline: 'See why the rules of shape are true.',
  category: 'math',
  level: 'Beginner',
  color: 'teal',
  cover: 'shapes',
  description: 'Drag, tear, slide and roll shapes until the famous facts of geometry stop being formulas to memorise and start being obvious. Every rule in this course is something you watch happen before it is written down.',
  outcomes: [
    'Work out unknown angles on lines, at crossings and in triangles',
    'Find areas by cutting shapes up and rearranging the pieces',
    'Use Pythagoras’ theorem, and explain why it must be true',
    'Say what π measures, and find the circumference and area of a circle',
    'Predict how lengths, areas and volumes change when a shape is scaled',
  ],
  chapters: [
    {
      title: 'Angles and triangles',
      lessons: [
        { id: 'angles', title: 'Angles Everywhere', summary: 'Straight lines, crossing lines and parallel lines: what has to add up, and what has to match.', minutes: 11 },
        { id: 'triangle-sum', title: 'The Triangle Secret', summary: 'Tear the corners off any triangle and they make a straight line.', minutes: 9 },
      ],
    },
    {
      title: 'Area and length',
      lessons: [
        { id: 'area-rearranged', title: 'Cut and Rearrange', summary: 'Every area formula is a rectangle in disguise.', minutes: 10 },
        { id: 'pythagoras', title: 'Squares on the Sides', summary: 'The most useful theorem in geometry, discovered and then proved by sliding four triangles.', minutes: 10 },
      ],
    },
    {
      title: 'Circles and scale',
      lessons: [
        { id: 'circles-pi', title: 'What Pi Really Is', summary: 'Roll a wheel and π appears. Slice a circle and its area does too.', minutes: 11 },
        { id: 'similarity', title: 'Zoom In, Zoom Out', summary: 'Scale a shape: lengths, areas, volumes, and why giants cannot exist.', minutes: 11 },
      ],
    },
  ],
};
