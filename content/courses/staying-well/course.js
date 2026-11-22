// Staying Well: Prevention and Everyday Medicine
//
// Preventive health and health literacy: infection and hygiene, vaccines, medicines, everyday care, the measurements that predict disease, screening, substances, and how to judge a health claim.
// Part of the "Health & the Body" learning path (see content/index.js).
// General health education, not personal medical advice.
export default {
  id: 'staying-well',
  title: 'Staying Well: Prevention and Everyday Medicine',
  tagline: 'Germs, vaccines, medicines, check-ups and the numbers worth knowing.',
  category: 'health',
  level: 'Intermediate',
  color: 'teal',
  cover: 'shield',
  requires: ['body-control'],
  description: 'Most of what keeps people alive and well is unglamorous: clean hands, vaccines, a blood-pressure cuff, a sunscreen bottle, a seat belt. Learn how infections spread and how they are stopped, what antibiotics can and cannot do, how to read a medicine label, which numbers about your own body are worth knowing, how screening works and where it misleads, what alcohol and tobacco do, and how to tell a real health finding from a headline.',
  outcomes: [
    'Explain how infections spread and which everyday measures stop them',
    'Explain how vaccines protect individuals and communities',
    'Use medicines safely and explain why antibiotics do not treat viruses',
    'Look after teeth, skin, eyes and ears',
    'Interpret blood pressure, cholesterol, blood sugar and body measurements, and name the main risk factors for heart disease, stroke and diabetes',
    'Explain what screening tests can and cannot tell you',
    'Describe the effects of tobacco, alcohol and other drugs',
    'Judge a health claim: absolute and relative risk, cause and correlation, quality of evidence',
  ],
  chapters: [
    {
      title: 'Infection',
      lessons: [
        { id: 'germs', title: 'Germs and How They Spread', summary: 'Bacteria, viruses and the routes they travel, from a London water pump to your own two hands.', minutes: 14 },
        { id: 'vaccines', title: 'Training the Immune System', summary: 'How a vaccine teaches without the disease, and why enough protected people protect everyone.', minutes: 13 },
        { id: 'medicines', title: 'Medicines and How to Use Them', summary: 'What antibiotics can and cannot do, how to read a label, and why the dose makes the poison.', minutes: 14 },
      ],
    },
    {
      title: 'Looking after yourself',
      lessons: [
        { id: 'everyday-care', title: 'Teeth, Skin, Eyes and Ears', summary: 'Small daily habits that protect the parts of you that do not grow back.', minutes: 13 },
        { id: 'know-your-numbers', title: 'Know Your Numbers', summary: 'Blood pressure, cholesterol, blood sugar and waist: what they measure and what they predict.', minutes: 14 },
        { id: 'screening', title: 'Catching Things Early', summary: 'What cancer is, how screening finds it, and why a positive test does not always mean disease.', minutes: 14 },
      ],
    },
    {
      title: 'Choices and claims',
      lessons: [
        { id: 'substances', title: 'Alcohol, Tobacco and Other Drugs', summary: 'What they do in the body, why they are hard to stop, and what stopping gives back.', minutes: 14 },
        { id: 'health-claims', title: 'Is That Really True?', summary: 'Miracle foods, scary headlines and supplements: a toolkit for judging any health claim.', minutes: 14 },
      ],
    },
  ],
};
