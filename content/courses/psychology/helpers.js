// Psychology: How Minds Work · the facts of the course in one place.
//
// Every study, figure and date used by the lessons lives in a table here, with its source, so that a
// correction is made once. Figures, generated questions and feedback are built from these tables;
// tests/psychology-course.test.mjs keeps an independent copy of the key numbers and checks that the two agree.
//
// Each fact row is marked:
//   [S]  confirmed by a web search while the course was written (November 2026); the source is named
//   [K]  from the author's knowledge of the named source, not re-checked online: reviewers start here
// A [K] figure is never the only key of a graded numeric step; in the text it is hedged ("about").
//
// General education about how minds work. Nothing here scores, labels or diagnoses the learner.

/** "a" or "an" in front of a word. */
export const aAn = (word) => (/^[aeiou]/i.test(String(word)) ? 'an' : 'a');
/** Whole percentage of a part in a whole. */
export const pct = (part, whole) => Math.round((part / whole) * 100);

// Example people for scenarios. Never the learner.
export const PEOPLE = ['Amara', 'Kenji', 'Sofia', 'Ravi', 'Leila', 'Tomás', 'Ngozi', 'Mei', 'Jonas', 'Aisha', 'Diego', 'Hanna'];

/* -------------------------------------------------- 1 · science of mind */

// Lazarsfeld's trick (1949, review of "The American Soldier", Public Opinion Quarterly 13). He listed
// findings that sound obvious, then revealed that the survey had found the opposite of each. [K]
export const HINDSIGHT = [
  { stated: 'Better-educated soldiers had more nervous breakdowns than less-educated soldiers.', reason: 'Thinkers cope worse with the strain of battle than tough, practical people.',
    real: 'Better-educated soldiers had **fewer** such problems.', realReason: 'Education went with better preparation and coping.' },
  { stated: 'Soldiers from the countryside kept their spirits up better than soldiers from cities.', reason: 'Country people are used to a harder life.',
    real: 'Soldiers from **cities** were in better spirits.', realReason: 'City people were more used to crowds, ranks and orders.' },
  { stated: 'Soldiers were more eager to go home while the fighting lasted than after the enemy surrendered.', reason: 'Nobody wants to be killed.',
    real: 'They were **more** eager to go home after the surrender.', realReason: 'While the war lasted, leaving meant abandoning their comrades.' },
];
// Fischhoff 1975, "Hindsight ≠ foresight", J. Exp. Psychol.: Human Perception and Performance 1. [K]
// [K, second reviewer] Being told an outcome raised its judged probability by roughly ten percentage points on
// average (more for some events); a search confirmed the direction but not the size, so the lesson says
// "more predictable", not "far more".
export const FISCHHOFF = { year: 1975 };

// Proverbs that contradict each other: whatever happens, one of them "predicted" it.
export const PROVERBS = [
  ['Absence makes the heart grow fonder', 'Out of sight, out of mind'],
  ['Birds of a feather flock together', 'Opposites attract'],
  ['Many hands make light work', 'Too many cooks spoil the broth'],
  ['Look before you leap', 'He who hesitates is lost'],
];

// Popular beliefs about the mind and what the evidence says.
export const MYTHS = [
  // [K] Brain imaging and the brain's energy use (about 2% of body mass, about 20% of resting energy).
  { id: 'ten', claim: 'We use only 10% of our brains', verdict: false, why: 'Scans show activity all through the brain over a day, and damage to almost any part has effects. The brain is about 2% of your weight and uses about a fifth of your resting energy: no body could afford a 90% spare.' },
  // [K] Pashler, McDaniel, Rohrer & Bjork 2008, Psychological Science in the Public Interest 9.
  { id: 'styles', claim: 'People learn better when taught in their own "learning style" (visual, auditory…)', verdict: false, why: 'People do have preferences, but when studies match teaching to the preferred style, learning does not improve (review by Pashler and colleagues, 2008).' },
  // [K] Rauscher, Shaw & Ky 1993 (Nature; 36 students); Pietschnig, Voracek & Formann 2010 meta-analysis.
  { id: 'mozart', claim: 'Playing Mozart to babies makes them more intelligent', verdict: false, why: 'The 1993 study tested 36 college students, not babies, and found a small gain on one kind of puzzle lasting about a quarter of an hour. A 2010 analysis of about 40 later studies found very little, and no more for Mozart than for other music.' },
  // [K] Nielsen et al. 2013, PLoS ONE (1,011 brain scans).
  { id: 'sides', claim: 'People are either "left-brained" (logical) or "right-brained" (creative)', verdict: false, why: 'Some tasks do lean on one side more, but a 2013 study of more than 1,000 brain scans found no sign that people come in left-dominant and right-dominant kinds.' },
  // [K] Roediger & Karpicke 2006, Psychological Science 17; many replications.
  { id: 'testing', claim: 'Testing yourself helps you remember more than re-reading does', verdict: true, why: 'This one is true and has been repeated many times. *How to Learn Anything* is built on it.' },
];

// A vague idea and ways of turning it into something that can be measured.
export const MEASURES = [
  { idea: 'Lack of sleep makes people irritable', good: 'Count how often people snap at a partner in a set task, after 4 hours of sleep and after 8', vague: 'Ask people whether tiredness affects them', circular: 'See whether irritable people seem tired', off: 'Measure how many hours people sleep at weekends' },
  { idea: 'Music helps concentration', good: 'Compare the number of sums solved in ten minutes with music and in silence', vague: 'Ask music lovers whether music helps them', circular: 'Notice that people who concentrate well enjoy music', off: 'Count how many songs people know by heart' },
  { idea: 'Praise makes children try harder', good: 'Time how long children keep working on a hard puzzle after being praised, and after no comment', vague: 'Ask teachers whether praise works', circular: 'Check that children who try hard get praised', off: 'Record how many puzzles each child owns' },
  { idea: 'Crowds make people less helpful', good: 'Stage the same small accident with 1 onlooker and with 5, and time how long until someone helps', vague: 'Ask people whether they would help a stranger', circular: 'Point out that nobody helped in a famous case', off: 'Count how many people live in each city' },
  { idea: 'Phones distract drivers', good: 'In a driving simulator, measure braking time with and without a phone conversation', vague: 'Ask drivers whether they feel distracted', circular: 'Note that distracted drivers are often on the phone', off: 'Count how many drivers own a phone' },
];

// Clever Hans: Wilhelm von Osten's horse, Berlin; tested by Oskar Pfungst, report published 1907. [K]
export const HANS = { year: 1907, tester: 'Oskar Pfungst', owner: 'Wilhelm von Osten' };

// [S] Open Science Collaboration 2015, "Estimating the reproducibility of psychological science", Science 349:
// 100 studies from three journals, 270 authors; 97% of the originals reported a significant result, 36% of the
// replications did; replication effects were on average half the size of the originals.
export const OSC = { year: 2015, studies: 100, authors: 270, originalSig: 97, replicationSig: 36, effectShare: 0.5 };

// Classic findings and how they fared when repeated.
export const FINDINGS = [
  // [K] Carney, Cuddy & Yap 2010 (42 people); Ranehill et al. 2015 (200 people): no effect on hormones or risk-taking,
  // though people did report feeling more powerful. Carney herself said in 2016 that she no longer believes the effect is real.
  { id: 'power', short: 'A "power pose" raises testosterone', name: 'Standing in a "power pose" raises testosterone', status: 'failed', note: 'A study nearly five times larger found no change in hormones or in risk-taking (Ranehill and colleagues, 2015). People did say they felt a little more powerful.' },
  // [S] Hagger et al. 2016, Perspectives on Psychological Science 11: 23 laboratories, 2,141 people, effect d = 0.04.
  { id: 'ego', short: 'Willpower is a fuel that runs out', name: 'Willpower is a fuel that runs out after use ("ego depletion")', status: 'failed', note: 'Twenty-three laboratories ran the same test on 2,141 people in 2016 and found an effect close to zero.' },
  // [K] Bargh, Chen & Burrows 1996; Doyen et al. 2012 (PLoS ONE): no effect with automatic timing.
  { id: 'elderly', short: 'Words about old age slow your walk', name: 'Reading words about old age makes people walk more slowly', status: 'failed', note: 'When walking speed was timed by infrared beams instead of by people holding stopwatches, the effect vanished (Doyen and colleagues, 2012).' },
  // [K] Strack, Martin & Stepper 1988; Wagenmakers et al. 2016: 17 laboratories, 1,894 people, no effect.
  // Coles et al. 2022 (Many Smiles Collaboration, Nature Human Behaviour 6; 3,878 people in 19 countries): posing or
  // mimicking a smile raised reported happiness slightly; the pen-in-mouth method gave no clear effect.
  { id: 'pen', short: 'A pen in the teeth makes cartoons funnier', name: 'Holding a pen between your teeth (forcing a smile) makes cartoons funnier', status: 'failed', note: 'Seventeen laboratories repeated the pen study in 2016 and found no effect. (A 2022 study in 19 countries found that posing a smile in other ways lifts mood very slightly; the pen method again showed nothing clear.)' },
  { id: 'mozart', short: 'Mozart makes you more intelligent', name: 'Listening to Mozart makes you more intelligent', status: 'failed', note: 'Dozens of later studies found next to nothing.' },
  // [S] Stroop 1935; one of the most repeated findings in psychology (MacLeod 1991 reviewed over 700 studies [K]).
  { id: 'stroop', short: 'Clashing colour words slow you (Stroop)', name: 'Naming the ink colour of a word is slower when the word spells a different colour (Stroop)', status: 'held', note: 'Repeated many hundreds of times since 1935.' },
  // [K] Tversky & Kahneman 1974; Many Labs 1 (Klein et al. 2014): anchoring among the strongest effects in 36 samples.
  { id: 'anchor', short: 'Anchoring: a first number pulls guesses', name: 'An arbitrary number seen first pulls later estimates towards it (anchoring)', status: 'held', note: 'In a 2014 project that repeated 13 effects in 36 samples, anchoring was among the strongest.' },
  // [K] Roediger & Karpicke 2006 and many replications; Rowland 2014 meta-analysis.
  { id: 'testing', short: 'Testing yourself beats re-reading', name: 'Testing yourself beats re-reading for long-term memory', status: 'held', note: 'Repeated in laboratories and classrooms for decades.' },
  // [K] Asch 1951-56; Bond & Smith 1996 meta-analysis of 133 studies in 17 countries.
  { id: 'asch', short: 'Going along with a wrong group (Asch)', name: 'Some people go along with a group that gives an obviously wrong answer (Asch)', status: 'held', note: 'Found again in more than a hundred studies in many countries, though the size varies.' },
  // [K] Loftus & Palmer 1974 and several hundred later studies of the misinformation effect.
  { id: 'misinfo', short: 'Misleading questions change memories', name: 'Misleading questions asked afterwards change what witnesses remember', status: 'held', note: 'Shown again in hundreds of experiments.' },
];

// What changed after 2015.
export const REFORMS = [
  ['Pre-registration', 'The plan and the analysis are written down and time-stamped before the data are seen'],
  ['Registered report', 'A journal agrees to publish before the results are known, whatever they turn out to be'],
  ['Multi-lab replication', 'Many laboratories run the same study and pool thousands of participants'],
  ['Open data', 'The raw numbers are published so that anyone can re-check the analysis'],
];
// A problem, and the reform (a name from REFORMS) that answers it.
export const REFORM_CASES = [
  ['A team tries analysis after analysis and reports the one that "worked"', 'Pre-registration'],
  ['A careful study that found nothing is turned down by every journal', 'Registered report'],
  ['A striking result rests on 30 people in a single laboratory', 'Multi-lab replication'],
  ['A reader suspects a slip in the sums and has no way of checking', 'Open data'],
];

// Claims for "three questions": each has exactly one weakness.
export const CLAIMS = [
  { flaw: 'size', headline: 'chewing gum sharpens memory', detail: (n) => `${n} students chewed gum and ${n} did not, chosen by coin toss. The gum group recalled more words. Two other teams have since found the same.` },
  { flaw: 'size', headline: 'cold showers lift mood', detail: (n) => `${n} volunteers were assigned by lot to cold showers and ${n} to warm ones. The cold group reported better mood. A second laboratory found the same.` },
  { flaw: 'compare', headline: 'a breathing app reduces stress', detail: (n) => `${n} people used the app for a month and their stress scores fell. Nobody without the app was measured. A second team repeated this and found the same drop.` },
  { flaw: 'compare', headline: 'brain-training games raise test scores', detail: (n) => `${n} pupils played the games for a term and scored higher afterwards than before. No other pupils were tested. Another school reports the same.` },
  { flaw: 'repeat', headline: 'blue walls make workers more creative', detail: (n) => `${n} workers were assigned by lot to a blue room and ${n} to a white one. The blue group produced more ideas. Nobody has run the study again.` },
  { flaw: 'repeat', headline: 'handwriting notes beats typing them', detail: (n) => `${n} students were assigned by lot to write by hand and ${n} to type. The handwriting group did better on a test. This is the only study of its kind so far.` },
];
export const CLAIM_SIZES = { small: [9, 12, 14, 16], large: [240, 400, 650, 1200] };
export const THREE_QUESTIONS = { size: 'How many people?', compare: 'Compared with what?', repeat: 'Has anyone repeated it?' };

/* ---------------------------------------------------------- 2 · perception */

// [S] Simons & Chabris 1999, Perception 28: 192 observers; across all versions (a gorilla or a woman with an
// umbrella walking through for about 5 seconds, transparent or opaque film, easy or hard counting) 54% noticed the
// unexpected event and 46% did not.
// [K, reviewer] The famous version, in which the gorilla stops, faces the camera and thumps its chest (about 9 seconds
// on screen), was a separate condition shown to 12 further observers counting the white team's passes: half noticed.
export const GORILLA = { year: 1999, observers: 192, missed: 46, thumpObservers: 12, thumpMissed: 50 };
// [K] Simons & Levin 1998, Psychonomic Bulletin & Review 5: in the first "door" study 7 of 15 pedestrians noticed
// that the person they were talking to had been swapped.
export const DOOR = { year: 1998, noticed: 7, of: 15 };
// [S] Stroop 1935, J. Exp. Psychol. 18, experiment 2: naming the ink colours of 100 items took 63.3 s for coloured
// squares and 110.3 s for colour words printed in a clashing ink: 47 s, or 74%, longer.
export const STROOP = { year: 1935, items: 100, plain: 63.3, clash: 110.3 };
// [K] Cherry 1953 (J. Acoust. Soc. Am. 25); Moray 1959: about a third of listeners noticed their own name in
// the channel they were ignoring.
export const CHERRY = { year: 1953 };
// [K] Strayer & Johnston 2001 (Psychological Science 12): hand-held and hands-free conversations slowed
// simulated drivers alike. Redelmeier & Tibshirani 1997 (NEJM 336): crash risk about four times higher during
// a call, and hands-free units no safer.
export const DRIVING = { year: 2001 };
// Figures the learner sees: Müller-Lyer 1889, Ponzo 1911, Kanizsa 1955, Necker 1832; the duck-rabbit appeared in
// Fliegende Blätter in 1892 and was used by Jastrow in 1899; W. E. Hill's drawing appeared in Puck in 1915. [K]
export const FIGURES = { mullerLyer: 1889, ponzo: 1911, kanizsa: 1955, necker: 1832, duckRabbit: 1892, hill: 1915 };

export const ATTENTION_EFFECTS = {
  inattention: { name: 'Inattentional blindness', what: 'missing something plainly visible because attention is busy elsewhere' },
  change: { name: 'Change blindness', what: 'failing to notice that something has changed across a brief interruption' },
  stroop: { name: 'Stroop interference', what: 'an automatic skill (reading) getting in the way of the task you are trying to do' },
  cocktail: { name: 'The cocktail-party effect', what: 'following one voice among many, while something important to you (such as your name) can still break through' },
};
export const ATTENTION_CASES = [
  { effect: 'inattention', text: 'A radiologist searching a lung scan for small nodules does not see a picture of a gorilla, 48 times larger than a nodule, pasted into the scan.' },
  { effect: 'inattention', text: 'A cyclist rides straight in front of a driver who was looking that way, watching for cars. "I looked, but I did not see him," the driver says.' },
  { effect: 'inattention', text: 'Counting the passes in a basketball game, a viewer misses a person with an umbrella walking across the court.' },
  { effect: 'change', text: 'A film shows two people talking. Between camera shots an actor\'s scarf disappears, and hardly anyone in the audience notices.' },
  { effect: 'change', text: 'A stranger asks for directions. Two workers carry a door between you, and behind it the stranger is swapped for a different person. You carry on explaining.' },
  { effect: 'change', text: 'Two versions of a photo flick back and forth with a blank frame between them. It takes many seconds to see that an aircraft engine is missing in one.' },
  { effect: 'stroop', text: 'A sign says LEFT with an arrow pointing right. Saying which way the arrow points takes longer than it should.' },
  { effect: 'stroop', text: 'You are asked how many digits are in "4 4 4". The answer "four" pushes forward before "three" arrives.' },
  { effect: 'stroop', text: 'The word BLUE is printed in red ink. Naming the ink takes longer than naming the ink of a row of red crosses.' },
  { effect: 'cocktail', text: 'In a noisy café you follow your friend\'s story easily, and still turn round when someone at another table says your name.' },
  { effect: 'cocktail', text: 'Wearing headphones that play a different talk in each ear, a listener can repeat one talk word for word and afterwards cannot say what language the other was in.' },
];

/* -------------------------------------------------------- 3 · conditioning */

// [K, certain] Ivan Pavlov, Nobel Prize in Physiology or Medicine 1904, "in recognition of his work on the
// physiology of digestion" (nobelprize.org).
export const PAVLOV = { nobel: 1904, field: 'the physiology of digestion' };
// [K] Watson & Rayner 1920, J. Exp. Psychol. 3: one infant, "Albert B.", tested at about 9 months and conditioned
// from about 11 months; a loud noise was paired with a white rat seven times. No control child, no agreed measure
// of fear, and the fear was never removed. His identity is still disputed (Beck 2009; Powell 2014).
export const ALBERT = { year: 1920, infants: 1, pairings: 7 };
// [K] Garcia & Koelling 1966, Psychonomic Science 4. Thorndike 1898 (puzzle boxes), law of effect 1911.
// Skinner 1938, The Behavior of Organisms; Ferster & Skinner 1957, Schedules of Reinforcement.
// Tolman & Honzik 1930 (latent learning); Bandura, Ross & Ross 1961 (72 children aged 3 to 6).
export const LEARNING_YEARS = { garcia: 1966, thorndike: 1898, skinner: 1938, tolman: 1930, bandura: 1961, banduraChildren: 72 };
// [S for the first figure, K for the other two] Lepper, Greene & Nisbett 1973, JPSP 28: 51 preschool children.
// Share of free time spent drawing afterwards: promised a reward 8.59%, no reward 16.73%, surprise reward 18.09%
// ([K, reviewer]: the author had the last two the other way round; a search did not settle it. The lesson only
// says "about half as much", which holds either way.)
// The size and reach of this "overjustification" effect are debated (Cameron & Pierce 1994 against
// Deci, Koestner & Ryan 1999).
export const LEPPER = { year: 1973, children: 51, expected: 8.59, surprise: 18.09, none: 16.73 };

export const CLASSICAL_TERMS = {
  acquisition: { name: 'Acquisition', what: 'the response to the signal grows as signal and event are paired' },
  extinction: { name: 'Extinction', what: 'the response fades when the signal keeps coming without the event' },
  recovery: { name: 'Spontaneous recovery', what: 'after a rest, a faded response partly comes back by itself' },
  generalisation: { name: 'Generalisation', what: 'things that resemble the signal also set off the response' },
};
export const CLASSICAL_CASES = [
  { term: 'acquisition', text: 'A cat hears the tin opener just before every meal. After a week it comes running at the sound, before any food appears.' },
  { term: 'acquisition', text: 'Each time the dentist\'s drill has started, a twinge of pain has followed. Now a patient tenses up at the whine alone.' },
  { term: 'acquisition', text: 'A phone buzzes each time a message from a friend arrives. After some weeks the buzz by itself brings a small lift.' },
  { term: 'extinction', text: 'The tin opener is now used many times a day for other things, with no meal. Week by week the cat stops coming.' },
  { term: 'extinction', text: 'A song that once played during a frightening storm is heard again and again on calm days. The uneasy feeling it caused gets weaker each time.' },
  { term: 'extinction', text: 'A dog used to drool at the fridge door opening. The owner now opens it constantly without feeding the dog, and the drooling dies away.' },
  { term: 'recovery', text: 'A dog\'s drooling at a bell had faded to nothing by Friday. On Monday, after a weekend with no bell, the first ring makes it drool again, though less than before.' },
  { term: 'recovery', text: 'Someone had got over feeling queasy at the smell of a food that once made them ill. After months without meeting the smell, one whiff brings a little of the feeling back.' },
  { term: 'generalisation', text: 'A child stung by a wasp becomes nervous of flies, bees and anything else that buzzes.' },
  { term: 'generalisation', text: 'A dog trained with one bell also drools, a little less, at a bell with a slightly higher note.' },
  { term: 'generalisation', text: 'After a bad fall from a horse, a rider feels uneasy near ponies and donkeys too.' },
];

// Consequences, sorted. bucket: 0 positive reinforcement, 1 negative reinforcement, 2 punishment.
export const CONSEQUENCES = [
  { bucket: 0, text: 'A child tidies her room and is given a sticker. She tidies more often.', why: 'Something pleasant is added and the behaviour increases.' },
  { bucket: 0, text: 'A dog sits and gets a treat. It sits more readily next time.', why: 'Something pleasant is added and the behaviour increases.' },
  { bucket: 0, text: 'A post gets many likes, so its author posts more of the same.', why: 'Something pleasant is added and the behaviour increases.' },
  { bucket: 0, text: 'A worker is paid a bonus for each sale and makes more calls.', why: 'Something pleasant is added and the behaviour increases.' },
  { bucket: 1, text: 'The car beeps until you fasten the seat belt. You buckle up faster each trip.', why: 'Something unpleasant is taken away, and the behaviour **increases**. That is reinforcement, not punishment.' },
  { bucket: 1, text: 'A headache goes when you take a painkiller. Next time you reach for one sooner.', why: 'Something unpleasant is taken away, and the behaviour **increases**. That is reinforcement, not punishment.' },
  { bucket: 1, text: 'A child whines until a parent gives in; the whining stops. The parent gives in more often.', why: 'For the parent, something unpleasant stops, so giving in **increases**: negative reinforcement.' },
  { bucket: 1, text: 'Leaving a noisy room brings relief, so you leave noisy rooms sooner.', why: 'Something unpleasant is taken away, and the behaviour **increases**. That is reinforcement, not punishment.' },
  { bucket: 2, text: 'A driver is fined for speeding and speeds less on that road.', why: 'A consequence follows and the behaviour decreases: punishment.' },
  { bucket: 2, text: 'A child who hits his brother loses screen time, and hits less.', why: 'Something pleasant is taken away and the behaviour decreases: punishment (the "negative" kind).' },
  { bucket: 2, text: 'A cat that jumps on the stove gets a spray of water and stays off it.', why: 'Something unpleasant is added and the behaviour decreases: punishment.' },
  { bucket: 2, text: 'A player who argues with the referee is sent off, and argues less next match.', why: 'A consequence follows and the behaviour decreases: punishment.' },
];

// Schedules of reinforcement (Ferster & Skinner 1957) and everyday examples.
export const SCHEDULES = {
  fr: { name: 'Fixed ratio', rule: 'a reward after a set number of responses', examples: ['A free coffee after every tenth one bought', 'Pay for every 20 shirts sewn', 'A badge after every five lessons finished'] },
  vr: { name: 'Variable ratio', rule: 'a reward after a number of responses that keeps changing', examples: ['A slot machine that pays out after an unpredictable number of plays', 'Scratch cards: most lose, now and then one wins', 'Opening packs of trading cards to find a rare one'] },
  fi: { name: 'Fixed interval', rule: 'a reward for the first response after a set time', examples: ['A wage paid every Friday', 'A weekly quiz every Monday morning', 'A bus that leaves every hour on the hour'] },
  vi: { name: 'Variable interval', rule: 'a reward for the first response after a time that keeps changing', examples: ['Checking whether a message has arrived', 'Fishing: a bite comes after an unpredictable wait', 'Looking out of the window for a parcel van'] },
};

/* --------------------------------------------------------------- 4 · memory */

// [K, certain] Miller 1956, Psychological Review 63; Cowan 2001, Behavioral and Brain Sciences 24.
export const SPAN = { miller: 7, millerYear: 1956, cowan: 4, cowanYear: 2001 };
// [K] Roediger & McDermott 1995, JEP: LMC 21. The "sleep" list is one of their published lists.
// [S] The missing word was falsely recognised about as often as words that had been studied.
// [K] It was recalled by about 40% of students in experiment 1 and 55% in experiment 2.
export const DRM = {
  year: 1995, lure: 'sleep',
  words: ['bed', 'rest', 'awake', 'tired', 'dream', 'wake', 'snooze', 'blanket', 'doze', 'slumber', 'snore', 'nap', 'peace', 'yawn', 'drowsy'],
  test: { studied: ['bed', 'dream', 'nap', 'yawn'], other: ['door', 'sugar', 'pencil'] },
  recalled: [40, 55],
};
// [S] Loftus & Palmer 1974, J. Verbal Learning and Verbal Behavior 13. Experiment 1 (45 students): mean speed
// estimates in miles per hour by verb. Table 1 gives 40.8 for "smashed": that is what a scanned copy of the paper
// found by search reads (reviewer, November 2026), and what most sources give; an OCR copy and some revision
// sites print 40.5. The lesson rounds to 41 and "nine more", which is true of both.
// Experiment 2 (150 students, 50 a group), one week later, "Did you see any broken glass?" (there was none):
// smashed 16 of 50, hit 7 of 50, not asked about speed 6 of 50. [K for 7 and 6]
export const LOFTUS = {
  year: 1974, students: 45,
  speeds: [['smashed', 40.8], ['collided', 39.3], ['bumped', 38.1], ['hit', 34.0], ['contacted', 31.8]],
  glass: { group: 50, smashed: 16, hit: 7, control: 6 },
};
// [S] Loftus & Pickrell 1995 (Psychiatric Annals 25): 24 participants, 6 of whom (25%) came to "remember" an
// invented event. [S] Murphy et al. 2023 (Memory 31), preregistered: 123 participants, 35%.
// [K] Scoboria et al. 2017 pooled eight such studies: 423 participants, about 30%.
export const MALL = { year: 1995, participants: 24, remembered: 6, repeatYear: 2023, repeatN: 123, repeatPct: 35, pooledN: 423, pooledPct: 30 };
// [S] Neisser & Harsch 1992: 106 students wrote down how they heard of the Challenger explosion the next
// morning; 44 were asked again two and a half years later. Mean accuracy 2.95 of 7, mean confidence 4.17 of 5.
// [K] Talarico & Rubin 2003 (Psychological Science 14): 54 students; memories of 11 September 2001 and of an
// ordinary event lost detail at the same rate, but the 9/11 memories stayed vivid and confident.
export const FLASHBULB = { year: 1992, first: 106, retested: 44, accuracy: 2.95, outOf: 7, confidence: 4.17, confOf: 5, talaricoYear: 2003 };
// [S] Innocence Project, "DNA Exonerations in the United States (1989-2020)": 375 people cleared by DNA evidence;
// eyewitness misidentification played a part in about 69% of those cases.
export const EXONERATIONS = { country: 'United States', from: 1989, to: 2020, cleared: 375, eyewitnessPct: 69 };
// [K] Wixted & Wells 2017, Psychological Science in the Public Interest 18. Henry Molaison (1926-2008): operation
// in 1953; Milner 1962 showed he improved at mirror drawing over days without remembering the practice.
export const HM = { born: 1926, died: 2008, operation: 1953 };
// [K] Bartlett 1932, Remembering.
export const BARTLETT = { year: 1932 };

export const MEMORY_EFFECTS = {
  misinformation: { name: 'The misinformation effect', what: 'information met after an event gets built into the memory of it' },
  association: { name: 'A false memory by association', what: 'remembering something that was only suggested by related things' },
  flashbulb: { name: 'A flashbulb memory', what: 'a vivid, confident memory of hearing dramatic news, which changes like any other' },
  schema: { name: 'Reconstruction from expectation', what: 'filling gaps with what usually happens, or what makes sense to you' },
};
export const MEMORY_CASES = [
  { effect: 'misinformation', text: 'A witness to a robbery reads in the paper that the thief wore a red cap. A week later she "remembers" the red cap, though at first she had mentioned no cap at all.' },
  { effect: 'misinformation', text: 'After watching a film of a car passing a "give way" sign, viewers are asked, "How fast was the car going when it passed the stop sign?" Many later remember a stop sign.' },
  { effect: 'misinformation', text: 'Two friends see the same accident and talk it over. Each ends up remembering details that only the other one saw.' },
  { effect: 'association', text: 'People study the words *thread, pin, eye, sewing, sharp, point, thimble* and later feel sure that *needle* was on the list.' },
  { effect: 'association', text: 'After hearing *sour, candy, sugar, bitter, taste, honey, cake*, a student writes down *sweet* among the words she heard.' },
  { effect: 'flashbulb', text: 'A man tells, in rich detail and with total confidence, how he heard some shocking news at work. His diary shows he was at home, ill, that day.' },
  { effect: 'flashbulb', text: 'Asked years later where they were when they heard of a disaster, students give vivid stories that do not match what they wrote the morning after.' },
  { effect: 'schema', text: 'People who waited in an office are later asked what was in it. Many "remember" books on the shelves. There were none, but offices usually have them.' },
  { effect: 'schema', text: 'Retelling a folk tale from another culture, readers replace canoes with boats and drop the parts that made no sense to them.' },
];

// Which identification deserves more weight? (Wixted & Wells 2017 [K])
export const ID_PAIRS = [
  { strong: 'picked the suspect within seconds at the first line-up, saying "I am certain", the day after the crime', weak: 'was unsure at the first line-up, then said "I am certain" in court a year later' },
  { strong: 'saw the person in daylight for a minute and, at a first line-up run by an officer who did not know who the suspect was, said at once "that is him, I am sure"', weak: 'said "maybe number 3" at the line-up, and became sure after the detective replied "good, that is our suspect"' },
  { strong: 'identified the person confidently at the first, properly run line-up two days after the event', weak: 'picked nobody from the first line-up, then picked the suspect from a second one in which he was the only face that had appeared before' },
];

/* ------------------------------------------------------------- 5 · thinking */

// [K, certain] Tversky & Kahneman 1974, Science 185: a wheel rigged to stop at 10 or 65; median estimates of the
// percentage of African countries in the United Nations were 25 and 45.
// [K, certain] Today 54 of the 193 member states are African (un.org): 28%.
export const ANCHOR = { year: 1974, low: 10, high: 65, lowMedian: 25, highMedian: 45, african: 54, members: 193 };
// [K] Tversky & Kahneman 1983: 85% of 142 students ranked "bank teller and feminist" above "bank teller".
export const LINDA = { year: 1983, pct: 85 };
// [K, certain] Tversky & Kahneman 1981, Science 211: 72% chose the sure option when it was worded as lives
// saved (152 people), 22% when worded as deaths (155 people).
export const FRAMING = { year: 1981, gainSure: 72, lossSure: 22, people: 600, sure: 200 };
// [K] Kahneman & Tversky 1979 (prospect theory). Tversky & Kahneman 1992 estimated that losses weigh about 2.25
// times as much as gains; a 2024 review of 607 estimates (Brown, Imai, Vieider & Camerer) put the average near 2;
// Gal & Rucker 2018 argue that it is often much smaller. Debated.
export const LOSS_AVERSION = { year: 1979, typical: 2 };
// [K; S supports "about 10%" and "about three in four"] Wason 1966/1968: fewer than one in ten solve the abstract
// four-card task. Griggs & Cox 1982: about three in four solve the same logic as a drinking-age rule.
export const WASON = { abstractPct: 10, socialPct: 75 };
// [K] Frederick 2005 (bat and ball). Kruger & Dunning 1999; Nuhfer et al. 2016 and Gignac & Zajenkowski 2020 on
// the statistical artefact. Gigerenzer & Hoffrage 1995 (natural frequencies).
// [K] Johnson & Goldstein 2003, Science 302: share of people registered as willing donors.
export const DONATION = {
  year: 2003,
  optIn: [['Denmark', 4.25], ['Germany', 12], ['United Kingdom', 17.17], ['Netherlands', 27.5]],
  optOut: [['Sweden', 85.9], ['Belgium', 98], ['Austria', 99.98], ['France', 99.91]],
};
// [S] Mertens et al. 2022 (PNAS): average nudge effect d = 0.43; Maier et al. 2022 (PNAS): no evidence of an
// average effect after correcting for publication bias. [S] DellaVigna & Linos 2022 (Econometrica): 8.7
// percentage points in published papers, 1.4 in all trials run by two government "nudge units".
export const NUDGE = { published: 8.7, allTrials: 1.4, year: 2022 };

export const BIASES = {
  anchoring: { name: 'Anchoring', what: 'an estimate is pulled towards a number met just before, relevant or not' },
  availability: { name: 'The availability shortcut', what: 'judging how common something is by how easily examples come to mind' },
  sunk: { name: 'The sunk-cost trap', what: 'carrying on because of what has already been spent, which cannot be got back' },
  confirmation: { name: 'Confirmation bias', what: 'looking for, and noticing, what agrees with what you already think' },
  framing: { name: 'A framing effect', what: 'the same facts lead to different choices depending on how they are worded' },
};
export const BIAS_CASES = [
  { bias: 'anchoring', text: 'A jacket is labelled "was 300, now 150". It feels like a bargain, though nobody checked what such jackets usually cost.' },
  { bias: 'anchoring', text: 'Asked first whether a tree is taller than 300 metres, people then guess its height far higher than people asked whether it is taller than 20 metres.' },
  { bias: 'anchoring', text: 'In a pay talk, whoever names the first figure finds that the final figure ends up close to it.' },
  { bias: 'availability', text: 'After a week of news about a plane crash, a traveller decides to drive instead, although driving the same distance is far more dangerous.' },
  { bias: 'availability', text: 'People guess that more English words start with K than have K as their third letter, because words starting with K are easier to think of.' },
  { bias: 'availability', text: 'A man who has just watched a programme about shark attacks rates sharks as a bigger danger to swimmers than drowning.' },
  { bias: 'sunk', text: 'Half an hour into a dull film, someone stays to the end "because I paid for the ticket".' },
  { bias: 'sunk', text: 'A company keeps funding a failing project because "we have already put four years into it".' },
  { bias: 'sunk', text: 'A diner who is already full finishes an expensive meal so as not to "waste" it.' },
  { bias: 'confirmation', text: 'Sure that a new neighbour is unfriendly, a woman remembers the two times he did not wave and forgets the many times he did.' },
  { bias: 'confirmation', text: 'To test the idea "this medicine works", a man collects only stories of people who took it and got better.' },
  { bias: 'confirmation', text: 'Two people with opposite views read the same mixed evidence. Each comes away more convinced of the view they started with.' },
  { bias: 'framing', text: 'Shoppers prefer mince labelled "80% lean" to the same mince labelled "20% fat".' },
  { bias: 'framing', text: 'More patients accept an operation described as having a "90% survival rate" than one with a "10% death rate".' },
];

/* ---------------------------------------------------------- 6 · development */

// [K, certain] Piaget's stages with the usual approximate ages. Ages are typical, with wide normal variation.
export const STAGES = [
  { id: 'sensorimotor', name: 'Sensorimotor', ages: 'birth to about 2', mark: 'learns through senses and actions; comes to know that hidden things still exist' },
  { id: 'preoperational', name: 'Preoperational', ages: 'about 2 to 7', mark: 'uses words and pretend play; judges by how things look, from their own point of view' },
  { id: 'concrete', name: 'Concrete operational', ages: 'about 7 to 11', mark: 'reasons logically about real things; knows that pouring does not change an amount' },
  { id: 'formal', name: 'Formal operational', ages: 'about 11 onwards', mark: 'can reason about "what if" and abstract ideas, and test possibilities one by one' },
];
export const STAGE_BEHAVIOURS = {
  sensorimotor: ['A baby shakes a rattle again and again to hear the noise', 'When a toy is covered by a cloth, a young baby stops looking for it', 'A one-year-old lifts a cushion to find the ball hidden under it'],
  preoperational: ['A child says the Moon follows her when she walks', 'A child feeds a doll pretend soup from an empty spoon', 'A child says a row of five coins has "more" once the coins are spread out'],
  concrete: ['A child explains that a flattened ball of clay still has the same amount of clay', 'A child sorts a stamp collection by country and, within each country, by colour', 'A child arranges sticks from shortest to longest without trial and error'],
  formal: ['A student works out which of four liquids make a colour change by testing every combination in turn', 'A teenager argues about what would follow if people had no need for sleep', 'A student solves for an unknown in algebra without needing objects to count'],
};
// [K] Baillargeon, Spelke & Wasserman 1985; Baillargeon 1987: infants of about 3 to 5 months look longer at
// "impossible" events. Piaget & Inhelder 1956 (three mountains). Wimmer & Perner 1983; Baron-Cohen, Leslie &
// Frith 1985 (the Sally-Anne version); Wellman, Cross & Watson 2001 pooled 178 studies.
export const DEV_YEARS = { baillargeon: 1985, mountains: 1956, wimmer: 1983, sallyAnne: 1985, falseBeliefAge: 4 };
// [S, from secondary summaries of Harlow 1958, American Psychologist 13] Infant monkeys spent about 17 to 18 hours
// a day on the cloth "mother" and about 1 hour on the wire one, even when only the wire one gave milk.
export const HARLOW = { year: 1958, cloth: 17, wire: 1 };
// [K] Ainsworth et al. 1978; van IJzendoorn & Kroonenberg 1988 (32 samples from 8 countries): the secure pattern
// was the most common everywhere, and samples differed more within countries than between them.
export const ATTACHMENT = { samples: 32, countries: 8, year: 1988 };
// [K] Werker & Tees 1984. [S] Hartshorne, Tenenbaum & Pinker 2018 (Cognition 177): 669,498 people; the ability
// to learn grammar stays high until about 17, then declines.
export const LANGUAGE = { narrowing: 1984, people: 669498, declineAge: 17 };
// [K] Gardner & Steinberg 2005, Developmental Psychology 41: 306 people; in a driving game, having friends
// watching raised risk-taking sharply in 13-16-year-olds, somewhat in 18-22-year-olds, not in adults.
export const PEERS = { year: 2005 };
// [K, certain] Polderman et al. 2015, Nature Genetics 47: 17,804 traits, 2,748 publications, 14.5 million twin
// pairs; average heritability 49%.
export const TWINS = { year: 2015, traits: 17804, heritability: 49 };
// [S for the sample; K for the wording of the result] Watts, Duncan & Quan 2018, Psychological Science 29:
// 918 children; the link between waiting at age 4 and achievement at 15 was half the size originally reported
// and shrank by about two thirds once family background and early ability were taken into account.
export const MARSHMALLOW = { year: 2018, children: 918, originalYear: 1972 };

// Vygotsky's zone: what a child can do alone, with help, and not yet at all.
export const ZONE_CASES = [
  { child: 'Mei', alone: 'count to 20', helped: 'add two small numbers with someone showing her how to count on', beyond: 'do long division' },
  { child: 'Diego', alone: 'ride a tricycle', helped: 'ride a bicycle while an adult steadies the saddle', beyond: 'ride in traffic and read road signs' },
  { child: 'Amara', alone: 'read single words', helped: 'read a short story with an adult prompting on hard words', beyond: 'read a newspaper article' },
  { child: 'Jonas', alone: 'do a 6-piece jigsaw', helped: 'do a 30-piece jigsaw when someone suggests starting with the edges', beyond: 'do a 1,000-piece jigsaw' },
  { child: 'Leila', alone: 'tie a simple knot', helped: 'tie her shoelaces while someone talks her through the loops', beyond: 'tie a climbing knot from a diagram' },
];
// Heritability figures for the "what does it mean?" question. [K] Typical twin-study estimates in well-fed
// populations (height about 80%; Polderman 2015 for the rest, rounded).
export const HERITABLE = [
  { trait: 'height', pct: 80 },
  { trait: 'reading ability', pct: 60 },
  { trait: 'sociability', pct: 45 },
  { trait: 'blood pressure', pct: 50 },
];

/* --------------------------------------------------------------- 7 · social */

// [S] Asch 1951-1956 (Psychological Monographs 70, 1956): 123 participants; they went along with the wrong
// majority on 36.8% of the critical trials; about three quarters at least once, about a quarter never.
// [K] Alone, people made errors on fewer than 1% of trials; with one partner who answered correctly,
// conformity fell to about a quarter of its usual level (Asch 1955).
export const ASCH = { participants: 123, conformedPct: 36.8, everShare: 75, neverShare: 25, aloneErrorPct: 1 };
// [S] Milgram 1963 (J. Abnormal and Social Psychology 67) and Obedience to Authority (1974): share of
// participants who continued to the 450-volt end of the scale. [K] for the peers figure and the forecast.
// Conditions in the 1974 book: 1 remote 65%, 2 voice feedback 62.5% (not used here), 3 proximity 40%,
// 4 touch-proximity 30%, 7 experimenter absent 20.5%, 10 Bridgeport 47.5%, 17 two peers rebel 10%.
// The telephone figure is printed as 20.5% in the book and in textbooks, although Milgram 1965 gives 9 of 40
// (22.5%); the order of the conditions is the same either way.
// [S, reviewer] Burger 2009: 70% were prepared to go on past 150 volts, against 82.5% in Milgram's comparable version.
// [S, second reviewer] Burger reported that this difference is not statistically significant (American Psychologist 64;
// Time, "Replicating Milgram", December 2008), so the lesson calls it "a gap small enough ... to be chance" and the
// graded statement "about as willing to continue as in Milgram's day" stands.
export const MILGRAM = {
  year: 1963, men: 40, toEnd: 26, volts: 450,
  variations: [
    { id: 'remote', label: 'Victim in another room, heard only pounding on the wall', pct: 65 },
    { id: 'bridgeport', label: 'Run from a shabby office instead of Yale University', pct: 47.5 },
    { id: 'room', label: 'Victim in the same room', pct: 40 },
    { id: 'touch', label: 'Participant had to press the victim\'s hand onto the plate', pct: 30 },
    { id: 'phone', label: 'Experimenter gave his orders by telephone', pct: 20.5 },
    { id: 'peers', label: 'Two other "teachers" refused to go on', pct: 10 },
  ],
  forecastPerThousand: 1,
};
// [K] Burger 2009 (American Psychologist 64) stopped at 150 volts: about 7 in 10 were ready to go on, slightly
// fewer than in Milgram's comparable version. Perry 2013, Behind the Shock Machine (archives).
// Haslam & Reicher 2012 ("engaged followership"). Baumrind 1964 (ethics).
// readyPct, milgramPct: the two shares in the [S, reviewer] note above the MILGRAM table.
export const BURGER = { year: 2009, stopVolts: 150, readyPct: 70, milgramPct: 82.5 };
// [K] Stanford prison experiment, August 1971: planned for two weeks, stopped after six days. Le Texier 2019
// (American Psychologist 74) documents the coaching of the guards from the archives.
export const STANFORD = { year: 1971, plannedDays: 14, ranDays: 6, critique: 2019 };
// [S] Darley & Latané 1968, JPSP 8: 72 students; share who went for help when another student seemed to be
// having a seizure: 85% of those who believed they alone could hear, 62% with one other listener, 31% with four.
export const BYSTANDER = { year: 1968, alone: 85, oneOther: 62, fourOthers: 31 };
// [S] Kitty Genovese was murdered in New York in March 1964; the New York Times story of 38 witnesses who watched
// and did nothing was wrong (Manning, Levine & Collins 2007, American Psychologist 62; the paper itself called
// its reporting "flawed" in 2016).
// [S] Philpot et al. 2020 (American Psychologist 75): 219 street conflicts filmed by cameras in Amsterdam,
// Cape Town and Lancaster; in about nine in ten at least one bystander stepped in.
export const GENOVESE = { year: 1964, claimed: 38, corrected: 2007 };
export const STREET = { year: 2020, conflicts: 219, helpedInTen: 9 };
// [K, certain] Festinger & Carlsmith 1959: 1 dollar or 20 dollars for telling the next person a dull task was fun.
// [K] Tajfel et al. 1971 (Bristol schoolboys); Sherif 1954 (Robbers Cave, 22 boys; see Perry 2018 for the
// earlier, failed attempts); Pettigrew & Tropp 2006 (515 studies of contact between groups).
export const SOCIAL_YEARS = { festinger: 1959, small: 1, large: 20, tajfel: 1971, sherif: 1954, boys: 22, contact: 2006, contactStudies: 515 };

// "You need help in a crowd": scenarios for the practical step.
export const CROWD_CASES = [
  { scene: 'A man collapses on a busy station platform. You kneel beside him; a dozen people are looking on', task: 'call an ambulance', who: 'you, in the green coat' },
  { scene: 'A cyclist has fallen in a crowded street and cannot get up. You are with her; people slow down and stare', task: 'call an ambulance', who: 'you, with the red backpack' },
  { scene: 'At a concert someone near you faints. You are holding her head; a ring of people is watching', task: 'fetch the first-aid staff', who: 'you, in the striped shirt' },
  { scene: 'A child in a shopping centre is lost and crying. You stay with him; shoppers pass on all sides', task: 'fetch a security guard', who: 'you, with the blue umbrella' },
];
// Explanations of someone's behaviour: person or situation?
export const ATTRIBUTION_CASES = [
  { act: 'A driver cuts in sharply in front of you', person: 'He is a selfish, aggressive person', situation: 'He may be rushing someone to hospital, or may not have seen you' },
  { act: 'A new colleague says almost nothing in her first meeting', person: 'She is a shy, unfriendly sort', situation: 'It is her first day and she does not yet know how meetings here work' },
  { act: 'A student hands in an essay two days late', person: 'He is lazy and disorganised', situation: 'He may have been ill, or had three deadlines in the same week' },
  { act: 'A waiter is curt and forgets part of your order', person: 'She is rude and bad at her job', situation: 'The restaurant is short of staff tonight and she is serving twice her usual tables' },
];
// How solid? 0 solid, 1 weaker than its fame.
export const SOCIAL_SOLID = [
  { bucket: 0, short: 'Going along with a wrong group (Asch)', text: 'People sometimes go along with a group that is plainly wrong (Asch)', why: 'Repeated in more than a hundred studies.' },
  { bucket: 0, short: 'The bystander effect in the laboratory', text: 'Each person is slower to help when others could help too (the laboratory bystander effect)', why: 'Repeated many times, though it weakens when the danger is clear.' },
  { bucket: 0, short: 'Contact between groups reduces prejudice', text: 'Contact between groups tends to reduce prejudice', why: 'An analysis of 515 studies (Pettigrew and Tropp, 2006) found this in most of them.' },
  { bucket: 0, short: 'Favouring your own group (Tajfel)', text: 'People favour their own group even when the groups were formed at random (Tajfel)', why: 'The minimal-group effect has been found again and again.' },
  { bucket: 1, short: 'Stanford: "a role alone makes people cruel"', text: 'The Stanford prison experiment proves that a role alone turns ordinary people cruel', why: 'One uncontrolled demonstration in which the guards were coached proves no such thing.' },
  { bucket: 1, short: 'The thirty-eight silent witnesses', text: 'Thirty-eight witnesses watched a murder and did nothing', why: 'The newspaper story was wrong: few saw anything clearly, and some did try to help.' },
  { bucket: 1, short: 'An "implicit bias" test predicts one person', text: 'A quick test of "implicit bias" shows how a particular person will behave', why: 'Scores on the implicit association test predict an individual\'s behaviour only weakly, and the same person\'s score shifts from day to day.' },
  { bucket: 1, short: '"Stereotype threat" reliably lowers scores', text: 'Reminding people of a stereotype reliably lowers their test scores ("stereotype threat")', why: 'Some studies find it, but large pre-registered repeats have often found little or nothing.' },
];

/* ----------------------------------------------------------- 8 · differences */

// [S] Forer 1949, J. Abnormal and Social Psychology 44: 39 students each received the same sketch, assembled
// from a newsstand astrology book, and rated how well it fitted them from 0 to 5. [K] Mean rating 4.26.
// The statements used in the lesson are paraphrases of Forer's.
export const FORER = {
  year: 1949, students: 39, mean: 4.26, outOf: 5,
  statements: [
    'You have a need for other people to like and admire you, and yet you tend to be critical of yourself.',
    'You have a good deal of unused capacity that you have not turned to your advantage.',
    'Disciplined and self-controlled on the outside, you tend to be worried and insecure inside.',
    'At times you have serious doubts about whether you made the right decision.',
    'You prefer a certain amount of change and variety, and become dissatisfied when hemmed in by restrictions.',
    'At times you are outgoing and sociable, while at other times you are wary and reserved.',
  ],
};
// [S that the test exists and failed; K for the details] Carlson 1985, Nature 318: 28 astrologers tried to match
// each birth chart to one of three personality profiles. They expected to be right at least half the time and
// were right about a third of the time, which is what guessing gives.
export const CARLSON = { year: 1985, astrologers: 28, options: 3 };

// The Big Five (Goldberg 1990; Costa & McCrae 1992). [K, certain]
export const BIG_FIVE = [
  ['Openness', 'curious, imaginative, drawn to new ideas and experiences'],
  ['Conscientiousness', 'organised, careful, sticks at tasks'],
  ['Extraversion', 'sociable, talkative, energised by company'],
  ['Agreeableness', 'warm, trusting, ready to cooperate'],
  ['Neuroticism', 'prone to worry and to strong negative feelings'],
];
// One habit of an example person who is high on each trait, in the order of BIG_FIVE.
export const BIG_FIVE_CASES = [
  ['Openness', 'Amara signs up for a course in a subject she knows nothing about, out of curiosity'],
  ['Conscientiousness', 'Kenji finishes his work a day early and checks it twice'],
  ['Extraversion', 'Sofia comes home from a crowded party with more energy than she set out with'],
  ['Agreeableness', 'Ravi takes people at their word and is quick to lend a hand'],
  ['Neuroticism', 'Leila lies awake going over everything that might go wrong tomorrow'],
];
// [S, from secondary summaries of Pittenger 1993 and 2005] As many as half of people get a different four-letter
// type when they retake the test five weeks later. This is Pittenger's summary of earlier retest studies, not a
// figure from one primary study, so the lesson attributes it to "one review".
export const MBTI = { retestWeeks: 5, changeShare: 'as many as half' };
// [K] Mischel 1968: a trait score typically correlates only about 0.3 with behaviour on one occasion;
// Epstein 1979: averaged over many occasions, the prediction is far better.
export const MISCHEL = { year: 1968 };

// [K, certain] IQ scores are scaled so that the mean is 100 and the standard deviation 15. From the normal
// curve: 68.3% of people fall between 85 and 115, 95.4% between 70 and 130, 2.3% above 130.
export const IQ = { mean: 100, sd: 15, within1: 68, within2: 95, above130: 2.3, binet: 1905, spearman: 1904 };
// [K for 3 points and for Pietschnig & Voracek 2015 (about 2.8 points a decade over 1909-2013);
//  S for Bratsberg & Rogeberg 2018, PNAS: in Norway scores fell for men born after about 1975, and the fall
//  shows up between brothers in the same family, so its causes are environmental.]
export const FLYNN = { perDecade: 3, reversalYear: 2018 };
// [K] Haworth et al. 2010 (Molecular Psychiatry 15): heritability of test scores about 41% at age 9, 55% at 12,
// 66% at 17.
export const IQ_HERITABILITY = [[9, 41], [12, 55], [17, 66]];
// [S] Buck v. Bell, US Supreme Court, 1927; more than 60,000 people were sterilised under US state laws.
// [K, certain] US Immigration Act 1924. [K] Germany's 1933 sterilisation law: about 400,000 people.
export const EUGENICS = { buckVBell: 1927, usSterilised: 60000, immigrationAct: 1924, germanLaw: 1933, germanSterilised: 400000 };
// [S] Sisk et al. 2018 (Psychological Science 29): mindset teaching raised achievement by d = 0.08 on average
// across 43 studies. [S] Yeager et al. 2019 (Nature 573): 12,490 ninth-graders in the United States; a one-hour
// online course raised the grades of lower-achieving students by about 0.10 grade points on a 4-point scale.
export const MINDSET = { year: 2019, students: 12490, gain: 0.10, scale: 4 };
// [K] Gardner 1983 (multiple intelligences). Credé, Tynan & Harms 2017 (JPSP 113): grit overlaps very strongly
// with conscientiousness.
// [S] Arnett 2008 (American Psychologist 63): in six leading journals, 2003-2007, 96% of participants came from
// Western industrialised countries (68% from the United States). [K] Those countries hold about 12% of the
// world's people. Henrich, Heine & Norenzayan 2010 named the problem "WEIRD".
export const WEIRD = { year: 2010, westernPct: 96, usPct: 68, worldShare: 12 };

// Reliable? Valid? kind: 'both' | 'reliable' (consistent but measuring the wrong thing) | 'neither'.
export const MEASURE_CASES = [
  { kind: 'reliable', text: 'A bathroom scale shows exactly 3 kg too much, every single time.' },
  { kind: 'reliable', text: 'A quiz sorts people into "leaders" and "followers" by their shoe size. Retaking it always gives the same result.' },
  { kind: 'reliable', text: 'A "creativity test" turns out to measure only how fast people can type. People score almost the same each time they take it.' },
  { kind: 'neither', text: 'A mood ring changes colour with the temperature of the room, and is sold as showing how honest the wearer is.' },
  { kind: 'neither', text: 'A magazine quiz gives a reader a different "love type" each time she takes it, and none of the types predicts anything.' },
  { kind: 'neither', text: 'A cheap thermometer shows a different temperature each time it is put into the same glass of water, none of them close to the true one.' },
  { kind: 'both', text: 'A reading test gives a pupil nearly the same score a week apart, and the scores agree well with teachers\' ratings and later exam results.' },
  { kind: 'both', text: 'A tape measure gives 183 cm for the same door every time, and the door really is 183 cm high.' },
  { kind: 'both', text: 'A kitchen scale shows 500 g each time a 500 g test weight is put on it.' },
];
export const MEASURE_KINDS = {
  both: 'Reliable and valid',
  reliable: 'Reliable, but not valid',
  neither: 'Neither reliable nor valid',
};

// Popular ideas weighed. 0 well supported, 1 real but small or weaker than claimed, 2 little or no good evidence.
export const WEIGHED = [
  { bucket: 0, text: 'Personality can be described by five broad traits, each on a continuous scale', why: 'The Big Five turn up in many languages and predict real outcomes modestly.' },
  { bucket: 0, text: 'IQ scores predict school results moderately well', why: 'One of the most repeated findings in psychology. "Moderately" matters: plenty else counts too.' },
  { bucket: 1, text: 'Teaching a "growth mindset" raises school grades', why: 'Large studies find a real effect, but a small one: about a tenth of a grade point for lower-achieving students.' },
  { bucket: 1, text: '"Grit" is a newly discovered key to success', why: 'It predicts a little, and overlaps very strongly with conscientiousness, which was already known.' },
  { bucket: 2, text: 'There are eight or so separate "intelligences"', why: 'Abilities that are supposed to be separate turn out to be correlated, and no good tests of the separate intelligences exist.' },
  { bucket: 2, text: 'People fall into 16 personality types', why: 'Scores pile up in the middle of each scale, not in two clumps, and many people get a different type on retaking the test.' },
  { bucket: 2, text: 'Star signs describe personality', why: 'In a controlled test astrologers matched charts to people no better than chance.' },
];

/* ------------------------------------------------ smaller facts, all [K] */

// Statements made in lesson text that have no table of their own. None is the key of a graded step.
//   perception   Memmert 2006 (people who missed the gorilla had looked at it for about a second);
//                Brugger & Brugger 1993 (rabbit seen first more often at Easter); Drew, Võ & Wolfe 2013
//                (radiologists and the gorilla in the lung scan); Drews, Pasupathi & Strayer 2008 (passengers
//                are less distracting than phone calls); Segall, Campbell & Herskovits 1966 (the Müller-Lyer
//                illusion varies between societies). Typical size of the Müller-Lyer effect "a tenth to a
//                quarter": textbook range, deliberately loose.
//   memory       Gallo, Roberts & Seamon 1997 (warnings reduce but do not remove false recall); Milner 1962
//                (mirror drawing); Loftus, Miller & Burns 1978 (stop sign / give-way sign).
//   thinking     Tversky & Kahneman 1973 (about two thirds judged K more common in first place); Eddy 1982 and
//                Gigerenzer & Hoffrage 1995 (the screening problem); Goldstein & Gigerenzer 2002 (recognition).
//   development  Hughes 1975 (the policeman task); Petitto & Marentette 1991 (babbling in sign);
//                Kidd, Palmeri & Aslin 2013 (waiting depends on whether promises have been kept);
//                Shoda, Mischel & Peake 1990 (fewer than 100 children in the original follow-up);
//                Hartshorne & Germine 2015 (different abilities peak at different ages).
//   social       Allen & Levine 1971 (any dissenter helps); Burger, Girgis & Manning 2011 (the direct order
//                was the least effective prompt); Reicher & Haslam 2006 (the BBC prison study); Miller 1984,
//                Morris & Peng 1994, Masuda & Kitayama 2004 (attribution across cultures); Vaidis et al. 2024
//                (multi-lab test of the dissonance procedure); Oswald et al. 2013 (implicit association test);
//                Flore, Mulder & Wicherts 2018 (stereotype threat, registered report).
//                Alpert & Raiffa 1982 and later calibration studies ("90% sure" ranges contain the truth far
//                less than 90% of the time).
//   differences  Roberts, Walton & Viechtbauer 2006 (personality change across adult life); Pittenger 1993
//                (the MBTI's types predict little about performance at work).
