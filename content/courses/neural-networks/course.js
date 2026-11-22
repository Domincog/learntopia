export default {
  id: 'neural-networks',
  title: 'Inside Neural Networks',
  tagline: 'How modern AI actually works, one mechanism at a time.',
  category: 'data',
  level: 'Advanced',
  color: 'violet',
  cover: 'layers',
  requires: ['ai', 'linear-algebra'],
  description: 'How AI Learns showed the big picture. This course opens the machinery: what a bend in a neuron buys you, how a network scores its own guesses, how blame flows backwards to every weight, and the two ideas behind language models: meaning as coordinates, and attention.',
  outcomes: [
    'Explain why networks need a non-linear step, and build shapes out of ReLU bends',
    'Turn raw scores into probabilities and measure a prediction with cross-entropy',
    'Carry out backpropagation by hand on a small network',
    'Diagnose training runs: learning rate, batch size, overfitting and when to stop',
    'Describe how embeddings place words in space, and measure how alike two of them are',
    'Compute a step of attention by hand and say what it lets a language model do',
  ],
  chapters: [
    {
      title: 'What a network computes',
      lessons: [
        { id: 'activation-functions', title: 'Bending the Line', summary: 'Without a bend, a hundred layers are no better than one. Build curves from ReLU pieces.', minutes: 13 },
        { id: 'scores-to-probabilities', title: 'Scoring a Guess', summary: 'Softmax turns scores into probabilities. Cross-entropy says how wrong they were.', minutes: 12 },
      ],
    },
    {
      title: 'How it learns',
      lessons: [
        { id: 'backpropagation', title: 'Passing the Blame Backwards', summary: 'The chain rule, applied layer by layer, tells every weight which way to move.', minutes: 14 },
        { id: 'training-in-practice', title: 'The Art of Training', summary: 'Batches, learning rates, validation curves and knowing when to stop.', minutes: 13 },
      ],
    },
    {
      title: 'How language models work',
      lessons: [
        { id: 'embeddings', title: 'Meaning as Coordinates', summary: 'Give every word a position in space, and words used alike end up close together.', minutes: 13 },
        { id: 'attention', title: 'What to Look At', summary: 'Each token scores all the others, and takes in a weighted average of them.', minutes: 14 },
      ],
    },
  ],
};
