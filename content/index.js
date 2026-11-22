/**
 * The catalog. To publish a new course, create
 * content/courses/<id>/course.js (+ lesson files) and add it to the list
 * below. Order here is the order shown in the app.
 *
 * `paths` strings courses together from beginner to advanced. A course
 * belongs to at most one path; the app uses the order to suggest what to
 * take next. Courses outside every path (such as "How to Learn Anything")
 * stand on their own.
 */
import learning from './courses/learning/course.js';
import algebra from './courses/algebra/course.js';
import geometry from './courses/geometry/course.js';
import functions from './courses/functions/course.js';
import trigonometry from './courses/trigonometry/course.js';
import calculus from './courses/calculus/course.js';
import calculus2 from './courses/calculus-2/course.js';
import probability from './courses/probability/course.js';
import probability2 from './courses/probability-2/course.js';
import numberTheory from './courses/number-theory/course.js';
import linearAlgebra from './courses/linear-algebra/course.js';
import logic from './courses/logic/course.js';
import proofs from './courses/proofs/course.js';
import python from './courses/python/course.js';
import algorithms from './courses/algorithms/course.js';
import python2 from './courses/python-2/course.js';
import algorithms2 from './courses/algorithms-2/course.js';
import physics from './courses/physics/course.js';
import physics2 from './courses/physics-2/course.js';
import statistics from './courses/statistics/course.js';
import inference from './courses/inference/course.js';
import ai from './courses/ai/course.js';
import neuralNetworks from './courses/neural-networks/course.js';
import worldGeography from './courses/world-geography/course.js';
import worldAncient from './courses/world-ancient/course.js';
import worldCrossroads from './courses/world-crossroads/course.js';
import worldConnected from './courses/world-connected/course.js';
import worldModern from './courses/world-modern/course.js';
import worldRegions from './courses/world-regions/course.js';
import bodySystems from './courses/body-systems/course.js';
import bodyControl from './courses/body-control/course.js';
import nutrition from './courses/nutrition/course.js';
import fitness from './courses/fitness/course.js';
import sleepMind from './courses/sleep-mind/course.js';
import stayingWell from './courses/staying-well/course.js';
import firstAid from './courses/first-aid/course.js';
import psychology from './courses/psychology/course.js';
import money from './courses/money/course.js';

export const categories = [
  { id: 'meta', title: 'Start here', color: 'orange', icon: 'sprout', blurb: 'Learn how to learn. A short course that makes every other course work better.' },
  { id: 'math', title: 'Math', color: 'blue', icon: 'sigma', blurb: 'Numbers, shapes, change and chance.' },
  { id: 'logic', title: 'Logic & Puzzles', color: 'violet', icon: 'puzzle', blurb: 'Reason carefully. Enjoy being stumped.' },
  { id: 'cs', title: 'Computer Science', color: 'teal', icon: 'code', blurb: 'Algorithms, code and how machines think.' },
  { id: 'science', title: 'Science', color: 'green', icon: 'atom', blurb: 'How the physical world works.' },
  { id: 'data', title: 'Data & AI', color: 'pink', icon: 'scatter', blurb: 'Make sense of data, and of the machines that learn from it.' },
  { id: 'world', title: 'World', color: 'yellow', icon: 'globe', blurb: 'Geography, history and culture, woven together: where things are, how they came to be, and what people made of them.' },
  { id: 'health', title: 'Health', color: 'red', icon: 'activity', blurb: 'How your body works and what is really known about keeping it well.' },
  { id: 'people', title: 'People & Money', color: 'blue', icon: 'handshake', blurb: 'How people think, decide and get along, and how to handle money with confidence.' },
];

export const courses = [
  learning,
  algebra,
  geometry,
  functions,
  trigonometry,
  calculus,
  calculus2,
  probability,
  probability2,
  numberTheory,
  linearAlgebra,
  logic,
  proofs,
  python,
  algorithms,
  python2,
  algorithms2,
  physics,
  physics2,
  statistics,
  inference,
  ai,
  neuralNetworks,
  worldGeography,
  worldAncient,
  worldCrossroads,
  worldConnected,
  worldModern,
  worldRegions,
  bodySystems,
  bodyControl,
  nutrition,
  fitness,
  sleepMind,
  stayingWell,
  firstAid,
  psychology,
  money,
];

export const paths = [
  {
    id: 'math',
    title: 'Mathematics',
    color: 'blue',
    icon: 'sigma',
    blurb: 'From balancing an equation to the working toolkit of calculus.',
    courses: ['algebra', 'geometry', 'functions', 'trigonometry', 'calculus', 'calculus-2'],
  },
  {
    id: 'chance',
    title: 'Chance & data',
    color: 'pink',
    icon: 'dice',
    blurb: 'Think clearly about uncertainty, then learn to draw conclusions from data.',
    courses: ['probability', 'statistics', 'probability-2', 'inference'],
  },
  {
    id: 'code',
    title: 'Programming & algorithms',
    color: 'teal',
    icon: 'code',
    blurb: 'Write real programs, then learn the strategies that make them fast.',
    courses: ['python', 'algorithms', 'python-2', 'algorithms-2'],
  },
  {
    id: 'machine-learning',
    title: 'Machine learning',
    color: 'violet',
    icon: 'brain-circuit',
    blurb: 'What it means for a machine to learn, the mathematics underneath, and how language models work.',
    courses: ['ai', 'linear-algebra', 'neural-networks'],
  },
  {
    id: 'reasoning',
    title: 'Logic & proof',
    color: 'orange',
    icon: 'puzzle',
    blurb: 'From detective puzzles to arguments that settle a question for ever.',
    courses: ['logic', 'number-theory', 'proofs'],
  },
  {
    id: 'physics',
    title: 'Physics',
    color: 'green',
    icon: 'atom',
    blurb: 'Predict how things move, then why they come back.',
    courses: ['physics', 'physics-2'],
  },
  {
    id: 'world',
    title: 'World Knowledge',
    color: 'yellow',
    icon: 'globe',
    blurb: 'The map, then the story: from the first humans to the present day, and a tour of the world as it is now.',
    courses: ['world-geography', 'world-ancient', 'world-crossroads', 'world-connected', 'world-modern', 'world-regions'],
  },
  {
    id: 'health',
    title: 'Health & the Body',
    color: 'red',
    icon: 'activity',
    blurb: 'First how the body works, then what is known about food, movement, sleep, the mind and prevention, and what to do in an emergency.',
    courses: ['body-systems', 'body-control', 'nutrition', 'fitness', 'sleep-mind', 'staying-well', 'first-aid'],
  },
];
