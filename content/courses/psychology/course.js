// Psychology: How Minds Work
//
// An introduction to psychology as an experimental science: perception and attention, learning, memory, judgement, development, social behaviour and individual differences, with an honest account of which famous findings have held up.
// General education about how minds work. It is not a tool for diagnosing yourself or anyone else.
export default {
  id: 'psychology',
  title: 'Psychology: How Minds Work',
  tagline: 'What a century of experiments has found out about seeing, remembering, deciding and getting along.',
  category: 'people',
  level: 'Beginner',
  color: 'violet',
  cover: 'mind',
  requires: [],
  description: 'Everyone is an amateur psychologist, and most of what "everyone knows" about the mind is wrong. This course treats psychology as what it is, a science that tests its guesses. You will take part in classic experiments yourself: miss something in plain sight, remember a word that was never shown, be pulled by an anchor you know is irrelevant. Along the way you will learn how conditioning shapes habits, how children build a mind, why ordinary people conform and obey, what personality and intelligence tests can and cannot tell you, and which famous findings fell apart when someone ran them again.',
  outcomes: [
    'Explain how psychologists test ideas, and why some famous findings failed to replicate',
    'Explain why perception is an active guess, and what attention lets through',
    'Describe classical and operant conditioning and how reinforcement shapes behaviour',
    'Explain why memory is reconstructed rather than replayed, and what that means for eyewitnesses',
    'Recognise common shortcuts and biases in judgement, and when they help',
    'Describe the main milestones in how children come to think and understand other minds',
    'Explain how situations and groups shape behaviour',
    'Say what personality and intelligence tests measure, and what they do not',
  ],
  chapters: [
    {
      title: 'A science of the mind',
      lessons: [
        { id: 'science-of-mind', title: 'How Do We Know?', summary: 'Why "obvious" is not evidence, how an experiment settles an argument, and what happened when psychology re-ran its classics.', minutes: 15 },
      ],
    },
    {
      title: 'Taking in the world',
      lessons: [
        { id: 'perception', title: 'Seeing Is Guessing', summary: 'Illusions, expectations and the gorilla nobody saw: your brain builds the world it shows you.', minutes: 13 },
        { id: 'conditioning', title: 'Bells, Levers and Slot Machines', summary: 'How associations and consequences shape what animals and people do, and why some habits are so hard to break.', minutes: 14 },
        { id: 'memory', title: 'Memory Is Not a Recording', summary: 'Every memory is rebuilt when you use it. That is why confident witnesses can be wrong.', minutes: 14 },
      ],
    },
    {
      title: 'Thinking and growing',
      lessons: [
        { id: 'thinking', title: 'Fast Answers, Slow Thoughts', summary: 'Anchors, frames and vivid examples: the shortcuts that usually work, and how they trip us up.', minutes: 14 },
        { id: 'development', title: 'Growing a Mind', summary: 'From a baby who thinks a hidden toy is gone to a child who knows what you are thinking.', minutes: 14 },
      ],
    },
    {
      title: 'People among people',
      lessons: [
        { id: 'social', title: 'The Power of the Situation', summary: 'Conformity, obedience and bystanders: what the famous studies really showed.', minutes: 14 },
        { id: 'differences', title: 'Measuring People', summary: 'Personality, intelligence and the tests that claim to capture them: what holds up, and what is a horoscope in a lab coat.', minutes: 14 },
      ],
    },
  ],
};
