export default {
  id: 'trigonometry',
  title: 'Trigonometry: Circles & Waves',
  tagline: 'Measure what you cannot reach, then watch a circle turn into a wave.',
  category: 'math',
  level: 'Intermediate',
  color: 'yellow',
  cover: 'wave',
  requires: ['geometry', 'algebra'],
  description: 'Trigonometry starts with a simple fact about similar triangles and ends by describing sound, tides and anything that repeats. Measure a tree without climbing it, walk a point around a circle, and see the sine wave appear from its shadow.',
  outcomes: [
    'Use sine, cosine and tangent to find unknown sides and angles of right triangles',
    'Read sine and cosine as coordinates on the unit circle, for any angle',
    'Measure angles in radians and convert to and from degrees',
    'Describe a wave by its amplitude, period and shift',
    'Solve triangles without a right angle using the laws of sines and cosines',
  ],
  chapters: [
    {
      title: 'Triangles',
      lessons: [
        { id: 'right-triangle-ratios', title: 'The Ratio That Never Changes', summary: 'Same angle, same ratio: where sine, cosine and tangent come from.', minutes: 12 },
        { id: 'finding-sides-angles', title: 'Heights You Cannot Climb', summary: 'Measure a tree from the ground, and run the ratios backwards to find an angle.', minutes: 13 },
      ],
    },
    {
      title: 'The circle',
      lessons: [
        { id: 'unit-circle', title: 'Around the Circle', summary: 'Angles past 90 degrees: sine and cosine as the coordinates of a moving point.', minutes: 13 },
        { id: 'radians', title: 'A Better Way to Measure Angles', summary: 'Measure an angle by the arc it cuts off, and see why a full turn is 2π.', minutes: 12 },
      ],
    },
    {
      title: 'Waves and beyond',
      lessons: [
        { id: 'sine-waves', title: 'Waves from a Wheel', summary: 'Unroll the circle into a wave, then stretch, squeeze and slide it to fit daylight and sound.', minutes: 12 },
        { id: 'any-triangle', title: 'Triangles Without a Right Angle', summary: 'Pythagoras with a correction term, the law of sines, and how to locate a ship from the shore.', minutes: 14 },
      ],
    },
  ],
};
