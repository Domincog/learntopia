export default {
  id: 'proofs',
  title: 'Proofs: How to Be Certain',
  tagline: 'A thousand examples are not a proof. One good argument is.',
  category: 'logic',
  level: 'Intermediate',
  color: 'orange',
  cover: 'proof',
  requires: ['logic'],
  description: 'Mathematics is the one place where "it has always worked so far" is not good enough. See patterns that hold a dozen times and then break, and learn the handful of argument shapes that settle a question for ever: direct proof, contradiction, induction, the pigeonhole principle and invariants. The last lesson uses them to compare infinities.',
  outcomes: [
    'Tell evidence from proof, and write a short direct proof',
    'Prove a statement by assuming the opposite and reaching a contradiction',
    'Use induction to prove a claim about every positive whole number',
    'Apply the pigeonhole principle to guarantee a coincidence',
    'Use an invariant to show that something is impossible',
    'Explain why some infinite sets are larger than others',
  ],
  chapters: [
    {
      title: 'What a proof is',
      lessons: [
        { id: 'evidence-is-not-proof', title: 'Evidence Is Not Proof', summary: 'Patterns that hold again and again, then fail. What it takes to be sure.', minutes: 11 },
        { id: 'contradiction', title: 'Suppose It Were False', summary: 'Assume the opposite, follow the logic, and watch it collapse.', minutes: 13 },
        { id: 'induction', title: 'Dominoes', summary: 'Prove the first case, prove that each case knocks over the next, and all of them fall.', minutes: 14 },
      ],
    },
    {
      title: 'Tools for the impossible',
      lessons: [
        { id: 'pigeonhole', title: 'More Pigeons Than Holes', summary: 'An idea so simple it sounds useless, with consequences nobody expects.', minutes: 11 },
        { id: 'invariants', title: 'What Never Changes', summary: 'To show that something cannot be done, find the quantity no move can change.', minutes: 13 },
        { id: 'infinity', title: 'Some Infinities Are Bigger', summary: 'A hotel that is full but never turns anyone away, and a list that can never be complete.', minutes: 14 },
      ],
    },
  ],
};
