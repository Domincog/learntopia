// Physics II: Orbits & Waves
//
// The follow-on to "Physics: Motion & Forces", in the same rhythm: one
// prediction as the hook (two at most), then teach, then ask. Each idea is
// stated on a teaching screen, with its unit and a worked example, before a
// graded step uses it. Conventions used throughout: SI units;
// g is taken as 10 m/s² at the ground and the Earth's radius as 6400 km (the
// measured values are quoted once, in "Falling Around the Earth"); air
// resistance and friction are ignored unless a step says otherwise; the speed
// of sound in air is 340 m/s and the speed of light 300 000 km/s. The
// mathematics stops at algebra: squares, square roots and proportion.
//
// Bespoke widgets: whirl-ball, orbit-cannon, gravity-probe, pendulum-lab,
// rope-wave, wave-adder, standing-wave, light-ray (src/widgets/). Shared
// constants and figure builders live in ./helpers.js.
export default {
  id: 'physics-2',
  title: 'Physics II: Orbits & Waves',
  tagline: 'Circles, swings and ripples: motion that repeats.',
  category: 'science',
  level: 'Intermediate',
  color: 'teal',
  cover: 'orbit',
  requires: ['physics'],
  description: 'Motion & Forces explained things that move in lines and arcs. This course is about motion that comes back: a ball on a string, the Moon around the Earth, a weight on a spring, a ripple on a pond. The same few ideas explain why astronauts float, why a guitar string has a note, and where a rainbow gets its colours.',
  outcomes: [
    'Explain why moving in a circle needs a force towards the centre, and find its size',
    'Explain orbits and weightlessness as free fall, using gravity\'s inverse-square law',
    'Predict what does and does not change the period of a pendulum or a spring',
    'Relate a wave\'s speed, frequency and wavelength, and add waves to explain beats and musical notes',
    'Explain reflection, refraction and colour with the wave picture of light',
  ],
  chapters: [
    {
      title: 'Going in circles',
      lessons: [
        { id: 'circular-motion', title: 'Turning Without Speeding Up', summary: 'Steady speed, changing velocity: the pull towards the centre that every turn needs.', minutes: 13 },
        { id: 'gravity-orbits', title: 'Falling Around the Earth', summary: 'Fire a cannonball fast enough and it never lands. Gravity, orbits and floating astronauts.', minutes: 14 },
      ],
    },
    {
      title: 'Back and forth',
      lessons: [
        { id: 'oscillations', title: 'Swings and Springs', summary: 'What sets the rhythm of a pendulum? Not what most people expect.', minutes: 12 },
        { id: 'waves', title: 'A Disturbance That Travels', summary: 'The wave moves; the water does not. Speed, frequency and wavelength.', minutes: 13 },
      ],
    },
    {
      title: 'When waves meet',
      lessons: [
        { id: 'superposition', title: 'Adding Waves', summary: 'Two waves in the same place simply add. That one rule gives beats, silence and music.', minutes: 13 },
        { id: 'light', title: 'Light as a Wave', summary: 'Mirrors, lenses and rainbows: what bending and colour tell us about light.', minutes: 14 },
      ],
    },
  ],
};
