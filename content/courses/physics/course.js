// Physics: Motion & Forces
//
// Every lesson follows the same rhythm: predict, run the experiment, then
// explain. Conventions used throughout: SI units; g is taken as 10 m/s² (9.8
// is mentioned once, in "Speeding Up"); air resistance and friction are
// ignored unless a step says otherwise; along a track, right / away from the
// start is the positive direction.
//
// Bespoke widgets: motion-graph, ramp-roll, drop-tower, force-cart,
// projectile, energy-track, collision-lab (src/widgets/). Shared figure
// builders live in ./helpers.js.
export default {
  id: 'physics',
  title: 'Physics: Motion & Forces',
  tagline: 'Predict what happens. Then run the experiment.',
  category: 'science',
  level: 'Beginner',
  color: 'green',
  cover: 'motion',
  description: 'Drive carts, drop balls, launch projectiles and crash things together in simulations you control. Each lesson asks for your prediction first, so that by the end the laws of motion feel like common sense.',
  outcomes: [
    'Read velocity and acceleration from motion graphs',
    'Predict how forces change motion, using Newton\'s first and second laws',
    'Aim a projectile by treating its sideways and vertical motion separately',
    'Follow energy as it changes between kinetic, potential and heat',
    'Use conservation of momentum to work out what happens in a collision',
  ],
  chapters: [
    {
      title: 'Describing motion',
      lessons: [
        { id: 'position-and-velocity', title: 'Where and How Fast', summary: 'A position–time graph is not a picture of the path. Its slope is the velocity.', minutes: 11 },
        { id: 'acceleration', title: 'Speeding Up', summary: 'Acceleration is how fast velocity changes, and everything falls with the same one.', minutes: 12 },
      ],
    },
    {
      title: 'Explaining motion',
      lessons: [
        { id: 'forces-newton', title: 'Pushes and Pulls', summary: 'A net force changes velocity. No net force, no change: not even slowing down.', minutes: 12 },
        { id: 'projectiles', title: 'Aim High', summary: 'A flying ball makes two motions at once, and neither one affects the other.', minutes: 12 },
      ],
    },
    {
      title: 'What is conserved',
      lessons: [
        { id: 'energy', title: 'Energy Never Disappears', summary: 'Trade height for speed and back again, and see where friction puts the rest.', minutes: 13 },
        { id: 'momentum', title: 'Collisions', summary: 'Carts stick, bounce and stop dead, yet the total momentum never changes.', minutes: 11 },
      ],
    },
  ],
};
