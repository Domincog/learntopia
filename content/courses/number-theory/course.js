export default {
  id: 'number-theory',
  title: 'The Secret Life of Numbers',
  tagline: 'Primes, remainders and unbreakable codes.',
  category: 'math',
  level: 'Beginner',
  color: 'orange',
  cover: 'primes',
  description: 'Whole numbers hide patterns that took thousands of years to find, and that now guard every message you send. Arrange dots, sieve out primes, cut up rectangles and turn a cipher wheel to discover them for yourself.',
  outcomes: [
    'Tell at a glance whether a number is divisible by 2, 3, 5, 9 or 10, and explain why the tests work',
    'Break any number into its prime factors',
    'Find greatest common divisors with Euclid\'s algorithm',
    'Do arithmetic on a clock (modular arithmetic)',
    'Explain how multiplying primes makes modern secret codes possible',
    'Work out enormous powers on a clock, and use Fermat\'s little theorem',
    'Lock and unlock a message with a public key, and say what keeps it safe',
  ],
  chapters: [
    {
      title: 'Building blocks',
      lessons: [
        {
          id: 'divisibility',
          title: 'What Divides What',
          summary: 'Factors, multiples and quick tests that read a number\'s digits.',
          minutes: 10,
        },
        {
          id: 'primes',
          title: 'The Atoms of Arithmetic',
          summary: 'Sieve out the primes, split numbers into them, and see why they never run out.',
          minutes: 12,
        },
        {
          id: 'gcd-euclid',
          title: 'Euclid\'s Shortcut',
          summary: 'Cut squares off a rectangle to find the oldest algorithm still in daily use.',
          minutes: 11,
        },
      ],
    },
    {
      title: 'Clock arithmetic',
      lessons: [
        {
          id: 'clock-arithmetic',
          title: 'Arithmetic on a Clock',
          summary: 'When numbers wrap around: remainders as a number system of their own.',
          minutes: 11,
        },
        {
          id: 'secret-codes',
          title: 'Secret Codes',
          summary: 'From Caesar\'s shifted alphabet to the one-way street behind modern encryption.',
          minutes: 11,
        },
      ],
    },
    {
      title: 'The mathematics of secrets',
      lessons: [
        {
          id: 'power-cycles',
          title: 'Powers That Come Home',
          summary: 'Find the last digit of a number with 85 digits, and meet Fermat\'s little theorem.',
          minutes: 12,
        },
        {
          id: 'public-keys',
          title: 'Build a Public Key',
          summary: 'Lock and unlock messages by hand with a toy version of the code that guards the internet.',
          minutes: 12,
        },
      ],
    },
  ],
};
