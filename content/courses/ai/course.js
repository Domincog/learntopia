export default {
  id: 'ai',
  title: 'How AI Learns',
  tagline: 'Open the box and turn the knobs yourself.',
  category: 'data',
  level: 'Beginner',
  color: 'blue',
  cover: 'network',
  description: 'Modern AI rests on a surprisingly simple idea, repeated billions of times: adjust numbers until the predictions get better. Tune a model by hand, watch a machine do the same by rolling downhill, build a tiny language model, and see exactly why fluent text is not the same as true text. School maths is enough; no programming needed.',
  outcomes: [
    'Explain what a model, a weight, a prediction and an error are',
    'Tune an artificial neuron to separate two groups, and say what its weights mean',
    'Describe training as gradient descent: small steps downhill on the error',
    'Explain why layers of neurons can do what a single neuron cannot',
    'Explain how a language model picks the next word, and why it can be confidently wrong',
  ],
  chapters: [
    {
      title: 'Machines that predict',
      lessons: [
        { id: 'prediction-machines', title: 'Prediction Machines', summary: 'A model is a recipe with adjustable numbers. Tune one by hand.', minutes: 11 },
        { id: 'a-single-neuron', title: 'One Neuron', summary: 'Weights, a bias and a straight border that says yes or no.', minutes: 10 },
        { id: 'learning-by-descent', title: 'Learning Is Rolling Downhill', summary: 'Measure the error, nudge the weights downhill, repeat.', minutes: 12 },
      ],
    },
    {
      title: 'From neurons to chatbots',
      lessons: [
        { id: 'layers', title: 'Why Layers Matter', summary: 'One neuron draws one line. A network fences in a region.', minutes: 10 },
        { id: 'predicting-words', title: 'Guess the Next Word', summary: 'Build a language model small enough to read in full.', minutes: 12 },
        { id: 'limits', title: 'Confidently Wrong', summary: 'Why fluent is not the same as true, and how to use AI tools well.', minutes: 11 },
      ],
    },
  ],
};
