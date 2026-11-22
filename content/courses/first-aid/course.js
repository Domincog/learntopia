// First Aid: When Minutes Matter
//
// Recognising emergencies and the first actions that save lives, following current international first-aid and resuscitation guidelines. Education, not certification.
// Part of the "Health & the Body" learning path (see content/index.js).
// General health education, not personal medical advice.
export default {
  id: 'first-aid',
  title: 'First Aid: When Minutes Matter',
  tagline: 'What to do before the ambulance arrives.',
  category: 'health',
  level: 'Beginner',
  color: 'red',
  cover: 'firstaid',
  requires: [],
  description: 'In most emergencies the first person on the scene is not a professional. It is whoever happens to be there. Learn to keep yourself safe, call for help properly, recognise a cardiac arrest, a heart attack and a stroke, give chest compressions and use a defibrillator, help someone who is choking or bleeding, cool a burn, and deal with fainting, seizures and extremes of heat and cold. This course teaches the knowledge; a hands-on class teaches the hands.',
  outcomes: [
    'Approach an emergency safely and call for help effectively',
    'Recognise cardiac arrest and describe how to give chest compressions and use a defibrillator',
    'Recognise the signs of a heart attack and a stroke and act fast',
    'Help someone who is choking, having a severe allergic reaction or an asthma attack',
    'Control serious bleeding, treat burns and manage suspected fractures and head injuries',
    'Respond to fainting, seizures, low blood sugar, heat illness, hypothermia and poisoning',
  ],
  chapters: [
    {
      title: 'First things first',
      lessons: [
        { id: 'first-steps', title: 'Stop, Look, Call', summary: 'Your own safety, a quick check of the person, and how to make an emergency call that gets help fast.', minutes: 12 },
        { id: 'cpr', title: 'Hands on the Chest', summary: 'When a heart stops, a bystander is the difference. Chest compressions and the defibrillator on the wall.', minutes: 14 },
      ],
    },
    {
      title: 'Heart, brain and breath',
      lessons: [
        { id: 'heart-stroke', title: 'Heart Attack and Stroke', summary: 'Learn the signs, because the treatments work only if they start in time.', minutes: 13 },
        { id: 'choking-breathing', title: 'When Someone Cannot Breathe', summary: 'Choking, severe allergy and asthma: three emergencies with simple, specific first actions.', minutes: 14 },
      ],
    },
    {
      title: 'Injuries and everyday emergencies',
      lessons: [
        { id: 'bleeding-burns', title: 'Bleeding, Burns and Breaks', summary: 'Press on it, cool it, keep it still: first aid for the commonest injuries.', minutes: 14 },
        { id: 'everyday-emergencies', title: 'Fainting, Seizures, Heat and Cold', summary: 'What to do, and what not to do, for faints, seizures, low blood sugar, heatstroke, hypothermia and poisoning.', minutes: 15 },
      ],
    },
  ],
};
