// Sleep, Stress and Mental Health · Lesson 5 · How Your Mind Works on You
// Driving question: why can the same event leave two people feeling completely different, and where in that chain can a person step in?
// Every example is an invented person. Nothing here asks the learner to disclose or rate anything about themselves.
import { TRAPS, TRAP_THOUGHTS, INNER_TALK, FEAR, MINDFULNESS } from '../helpers.js';

const ANA = {
  type: 'thought-loop',
  situation: 'Ana waves at a friend across the street. Her friend walks on without waving back.',
  ask: 'what does Ana tell herself?',
  thoughts: [
    { id: 'upset', text: '"She saw me and ignored me. I must have upset her."', feeling: 'Hurt and worried', level: 80, body: 'A tight chest and a sinking stomach', action: 'Keeps away from her friend all week', next: 'With no contact, nothing can show the thought to be wrong. The worry grows.' },
    { id: 'missed', text: '"She probably did not see me."', feeling: 'Calm, a little curious', level: 15, body: 'Nothing much', action: 'Sends her friend a message that evening', next: 'Her friend replies: "Sorry, I was miles away!"' },
    { id: 'rude', text: '"How rude. She thinks she is too good for me."', feeling: 'Angry', level: 70, body: 'A hot face and a clenched jaw', action: 'Is cold with her friend when they next meet', next: 'Her friend, puzzled, pulls back too. Now there really is a problem between them.' },
  ],
  alt: 'A chain of boxes: situation, thought, feeling, action and what happens next. Three thoughts can be chosen for the same situation.',
};
const JOMO = {
  type: 'thought-loop',
  situation: 'It is the evening before Jomo\'s driving test.',
  ask: 'which thought fits the evidence?',
  thoughts: [
    { id: 'doom', text: '"I am going to fail. I always mess up when it matters."', feeling: 'Dread', level: 85, body: 'A racing heart', action: 'Lies awake for hours, then drives stiffly', next: 'Tired and tense, he makes slips, which seem to prove the thought right.' },
    { id: 'rosy', text: '"Nothing can go wrong. I am certain to pass."', feeling: 'Carefree, for now', level: 10, body: 'Relaxed', action: 'Skips his last practice', next: 'The first surprise on the road shakes him badly: the thought had no room for it.' },
    { id: 'balanced', text: '"I am nervous, and I did stall on Tuesday. But I passed the mock test, and my instructor says I am ready."', feeling: 'Nervous but steady', level: 40, body: 'A few butterflies', action: 'Goes over the awkward junction once more, then sleeps', next: 'He drives much as he did in the mock test.' },
  ],
  alt: 'A chain of boxes: situation, thought, feeling, action and what happens next, for a learner driver on the evening before his test. Three thoughts can be chosen.',
};
const trapOption = (key) => `${TRAPS[key].name}: ${TRAPS[key].gist}`;
// The teaching list of the three traps: name and gist from the table the generated question uses, each with an
// example thought that appears in no question (the second is one of Ana's, from the exploration).
const TRAP_EXAMPLES = {
  catastrophe: '"My friend is late. There has been an accident."',
  mindreading: '"She thinks she is too good for me." (Ana, about the friend who did not wave)',
  allornothing: '"I burnt the rice. The whole dinner is ruined."',
};
const TRAP_LINES = ['catastrophe', 'mindreading', 'allornothing'].map((key) => `- **${TRAPS[key].name}**: ${TRAPS[key].gist}. *${TRAP_EXAMPLES[key]}*`).join('\n        ');

export default {
  id: 'emotions-mind',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'One message, two evenings',
      text: `
        Two colleagues, Rin and Zara, each get the same message from their
        manager: *"Can we talk tomorrow?"* Rin spends the evening in dread.
        Zara is merely curious.

        The message is identical. **What most directly makes the
        difference?**
      `,
      columns: 1,
      options: [
        { text: 'The message itself' },
        { text: 'What each of them tells herself the message means', correct: true },
        { text: 'Nothing: feelings come and go at random' },
      ],
      explain: 'What each takes it to mean. Rin has heard "I am in trouble"; Zara has heard "something to discuss". Between an event and a feeling sits a **thought**, usually so quick that it goes unnoticed. This lesson slows that step down.',
    },
    {
      id: 'loop-explore',
      type: 'interact',
      graded: false,
      title: 'Three thoughts',
      text: `
        Here is one small event in Ana's day, and three things she might
        tell herself about it.

        **Try all three thoughts**, and follow each one down the chain.
      `,
      widget: ANA,
      check: (s) => s.seenCount >= 3 || `You have followed ${s.seenCount} of the 3 thoughts. Try ${s.seenCount === 2 ? 'the last one' : 'the others'}.`,
      solution: { seen: ['upset', 'rude', 'missed'] },
      explain: `
        One situation, three thoughts, three different days. And notice the
        last box: what Ana **does** changes what happens next. Avoiding her
        friend, or snapping at her, helps to make the gloomy thought come
        true.

        The thought comes first and fast, and feels like a fact. It is a
        guess.
      `,
    },
    {
      id: 'the-loop',
      type: 'order',
      review: true,
      text: 'Put the links of the chain **in order**, starting with what happens in the world.',
      items: [
        'Situation: something happens',
        'Thought: what you tell yourself it means',
        'Feeling: an emotion, with changes in the body',
        'Action: what you do because of it',
      ],
      labels: ['First', 'Last'],
      explain: `
        Situation → thought → feeling → action, and the action shapes the
        next situation, so the chain closes into a **loop**. This is the
        model behind **cognitive behavioural therapy (CBT)**, worked out by
        the psychiatrist Aaron Beck in the 1960s and tested in hundreds of
        trials since.

        The useful news: a loop can be interrupted at more than one place.
      `,
    },
    {
      id: 'teach-emotions',
      type: 'info',
      title: 'A fast verdict',
      text: `
        The third link of the chain is the feeling. An **emotion** is a
        fast verdict on a situation, and it readies the body to act.

        | Emotion | Its verdict | The body gets ready to |
        |---|---|---|
        | **Fear** | danger | escape: the heart races |
        | **Anger** | a wrong, or an obstacle | push back: heat and tension |
        | **Sadness** | a loss | slow down, and draw others near |
        | **Disgust** | something harmful | pull away: nausea |

        None of these is a fault. Emotions are an old, quick guidance
        system, and each has a use. They become a problem only when the
        verdict is wrong for the situation, or far too loud, or never
        switches off.
      `,
    },
    {
      id: 'emotions',
      type: 'match',
      title: 'What feelings are for',
      text: 'An emotion is a fast verdict on a situation, and it readies the body to act. **Match each emotion with what it is a verdict about.**',
      pairs: [
        ['Fear', 'Danger: the heart races, ready to escape'],
        ['Anger', 'A wrong or an obstacle: heat, tension, ready to push back'],
        ['Sadness', 'A loss: heaviness, slowing down, drawing others near'],
        ['Disgust', 'Something harmful: nausea, pulling away'],
      ],
      explain: 'Fear answers danger, anger a wrong, sadness a loss, disgust something harmful. Each verdict arrives with a body made ready to act on it, which is why a feeling is felt in the body as well as in the mind.',
    },
    {
      id: 'teach-traps',
      type: 'info',
      title: 'Three thinking traps',
      text: `
        The second link, the thought, comes fast, and fast thoughts go
        wrong in a few well-worn ways. They are sometimes called
        **thinking traps**. Three common ones:

        ${TRAP_LINES}

        Everyone's mind does all three, most of all when tired or
        stressed.
      `,
    },
    {
      id: 'traps',
      type: 'match',
      title: 'Thinking traps',
      text: 'Fast thoughts go wrong in a few well-worn ways, sometimes called **thinking traps**. **Match each trap with an example.**',
      pairs: [
        [TRAPS.catastrophe.name, '"A headache before the exam. I will fail, and my whole year is wasted."'],
        [TRAPS.mindreading.name, '"He did not laugh at my joke. He thinks I am an idiot."'],
        [TRAPS.allornothing.name, '"I got one answer wrong, so the whole test was a failure."'],
      ],
      explain: `
        The headache thought leaps to the worst outcome. The joke thought
        treats a guess about someone else's mind as a fact. The test
        thought sees only perfect or failed.
      `,
    },
    {
      id: 'which-trap',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const item = rng.pick(TRAP_THOUGHTS);
        const notes = {
          catastrophe: 'Catastrophising predicts a disastrous future. Is that what this thought does?',
          mindreading: 'Mind-reading claims to know what another person is thinking. Is anyone else\'s mind involved here?',
          allornothing: 'All-or-nothing thinking allows only two verdicts, perfect or failed. Is that the pattern here?',
        };
        return {
          text: `${item.scene} The thought that comes: *"${item.thought}"*\n\n**Which thinking trap is this?**`,
          shuffle: false,
          columns: 1,
          options: ['catastrophe', 'mindreading', 'allornothing'].map((key) => ({ text: trapOption(key), correct: key === item.trap, why: key === item.trap ? undefined : notes[key] })),
          explain: `**${TRAPS[item.trap].name}**: ${TRAPS[item.trap].gist}. ${item.why}`,
        };
      },
    },
    {
      id: 'evidence',
      type: 'bucket',
      title: 'Check the thought',
      text: `
        A thought can be tested like any other claim. Jomo's thought, the
        evening before his driving test: *"I am going to fail."*

        What counts as evidence is a fact about the thing itself: here,
        how Jomo drives. **Sort the facts.**
      `,
      buckets: ['Evidence for the thought', 'Evidence against it', 'Not evidence either way'],
      items: [
        { text: 'He stalled twice in Tuesday\'s lesson', bucket: 0 },
        { text: 'He failed his first test, a year ago', bucket: 0, why: 'It is weak evidence, and a year old, but it does count on this side.' },
        { text: 'He passed a full mock test last week', bucket: 1 },
        { text: 'His instructor says he is ready', bucket: 1 },
        { text: 'He has driven the test routes many times', bucket: 1 },
        { text: 'He feels sick when he thinks about it', bucket: 2, why: 'The feeling is real, but it is a result of the thought, not a fact about his driving.' },
        { text: 'His cousin failed her test last month', bucket: 2, why: 'Another person\'s result says nothing about Jomo\'s driving.' },
      ],
      explain: 'The trap is to count the **feeling** as evidence: "I feel sure I will fail, so I will." A strong feeling shows how loud the alarm is, not whether there is a fire.',
    },
    {
      id: 'balanced',
      type: 'interact',
      title: 'A thought that fits',
      text: `
        With the evidence laid out, Jomo can choose what to tell himself.

        **Pick the thought that fits the evidence best**, and see where it
        leads.
      `,
      widget: JOMO,
      check: (s) => {
        if (s.thought === 'balanced') return true;
        if (s.thought === 'doom') return 'That thought ignores everything on the other side: the mock test, the instructor, the practice. Look for one that takes in both sides.';
        if (s.thought === 'rosy') return 'Cheerful, but it does not fit the evidence either: he did stall on Tuesday, and nobody is certain to pass. A checked thought is accurate, not just pleasant.';
        return 'Choose one of the three thoughts.';
      },
      solution: { thought: 'balanced' },
      explain: `
        The balanced thought is not "positive thinking". It admits the
        nerves and the stalling, and sets them beside the rest of the
        evidence. Jomo is still nervous: at 40, not at 85, and that is
        about the right amount for a driving test.

        Checking a thought does not make feelings vanish. It brings them
        back into proportion.
      `,
    },
    {
      id: 'avoid-predict',
      type: 'choice',
      mode: 'predict',
      title: 'An alarm set too sensitive',
      text: `
        Malik was bitten by a dog as a child. Now, whenever he sees any
        dog, his heart pounds, and he crosses the road at once. The fear
        drops away within seconds.

        **What do you think this habit does to his fear over the months?**
      `,
      columns: 1,
      options: [
        { text: 'It slowly fades, because he is never frightened for long' },
        { text: 'It stays, or grows', correct: true },
        { text: 'It makes no difference either way' },
      ],
      explain: 'It stays, or grows. Each escape is followed by relief, and the relief teaches his brain: "that was dangerous, and running saved me." He never gets the chance to learn that most dogs are harmless. Try it on the next screen.',
    },
    {
      id: 'face-it',
      type: 'interact',
      attempts: 6,
      title: 'Leave or stay?',
      text: `
        A calm old dog has moved in next door, always on a lead. Malik will
        meet it five times. Each time, choose for him: **leave at once**, or
        **stay** at a distance he can bear until the fear settles.

        **Get his next peak below the dashed line** by the end.
      `,
      widget: { type: 'fear-curve', start: FEAR.start, encounters: FEAR.encounters, stay: FEAR.stay, leave: FEAR.leave, goal: FEAR.goal, goalLabel: 'barely a flutter', alt: 'A graph of Malik\'s fear over five meetings with a dog. Each meeting is a peak. After each one, buttons let him leave at once or stay until the fear settles.' },
      check: (s) => {
        if (!s.done) return `That is ${s.choices.length} of 5 meetings. Keep going.`;
        if (s.next < FEAR.goal) return true;
        if (s.leaves === 5) return `He left every time, and his fear has grown from 80 to ${Math.round(s.next)}. Press "Start again" and let him stay.`;
        return `He stayed ${s.stays === 1 ? 'once' : `${s.stays} times`} and left ${s.leaves === 1 ? 'once' : `${s.leaves} times`}: his next peak would be ${Math.round(s.next)}, not yet under ${FEAR.goal}. Press "Start again" and let him stay more often.`;
      },
      solution: { choices: ['stay', 'stay', 'stay', 'stay', 'stay'] },
      hints: ['Leaving feels better now and costs later. Staying is the other way round.'],
      explain: `
        When Malik stays, the fear peaks and then comes down **by itself**,
        and his brain learns something new: nothing bad happened. The next
        peak is lower. This is the idea behind **exposure**, the
        best-tested treatment for phobias and many anxiety problems.

        Real progress is bumpier than this model, the steps are chosen to
        be manageable, and for strong fears the work is done with a
        trained therapist. Nobody should be forced.
      `,
    },
    {
      id: 'ruminate',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const wantSolving = rng.bool();
        const right = rng.pick(INNER_TALK.filter((x) => (x.kind === 'solving') === wantSolving));
        const others = rng.sample(INNER_TALK.filter((x) => (x.kind === 'solving') !== wantSolving), 3);
        return {
          text: wantSolving
            ? 'After a bad day, thinking can go two ways. **Rumination** circles the same painful questions without arriving anywhere. **Problem-solving** looks for a next step.\n\n**Which of these is problem-solving?**'
            : 'After a bad day, thinking can go two ways. **Rumination** circles the same painful questions without arriving anywhere. **Problem-solving** looks for a next step.\n\n**Which of these is rumination?**',
          columns: 1,
          options: [right, ...others].map((x) => ({
            text: `"${x.text}"`,
            correct: x === right,
            why: x === right ? undefined : (x.kind === 'solving' ? 'This one points towards something that can be done: problem-solving.' : 'This one has no answer that leads anywhere, so the mind goes round it again: rumination.'),
          })),
          explain: wantSolving
            ? `"${right.text}" has an answer that can be acted on. The others are "why" and "if only" questions that only lead back to themselves. Studies link a habit of rumination with low mood that lasts longer.`
            : `"${right.text}" has no answer that leads anywhere, so the mind circles it. The others each point to something that can be done. A useful test: has this thinking produced a next step in the last ten minutes?`,
        };
      },
    },
    {
      id: 'teach-naming',
      type: 'info',
      title: 'Put it into words',
      text: `
        There is a quieter way into the loop: **putting a feeling into
        words**.

        :::example
        "I am anxious about tomorrow."
        :::

        Saying or writing a sentence like that seems to engage the brain's
        planning regions, and to turn the alarm down a little. The effect
        is modest, but it is one reason that talking, and writing things
        down, can help.

        The alarm has an address: the **amygdala**, the small region deep
        in the brain that raised it in Lesson 4. So the idea can be
        tested in a brain scanner.
      `,
    },
    {
      id: 'naming',
      type: 'choice',
      title: 'Name it',
      text: `
        In brain-scanning experiments, volunteers looked at photographs of
        angry and frightened faces. Sometimes they just looked. Sometimes
        they chose a word for the emotion they saw: "angry", "afraid".

        **What happened in the amygdala, the brain's alarm centre, when
        they put a name to the feeling?**
      `,
      columns: 1,
      options: [
        { text: 'Its response became smaller', correct: true },
        { text: 'Its response became larger', why: 'It is a natural guess that dwelling on a feeling feeds it. But putting it briefly into words did the opposite.' },
        { text: 'Nothing changed', why: 'There was a clear difference: the alarm centre was quieter when the feeling was named.' },
      ],
      explain: `
        Smaller. The alarm centre was quieter when the volunteers named the
        emotion than when they only looked.
      `,
    },
    {
      id: 'teach-mindfulness',
      type: 'info',
      title: 'Mindfulness, and what trials show',
      text: `
        **Mindfulness** means paying attention to the present moment, on
        purpose, without judging it. Practising it trains the skill used
        all through this lesson: noticing a thought as a thought, instead
        of as a fact.

        It is widely promoted, and it has been tested:

        - A review of ${MINDFULNESS.goyalTrials} trials found that courses of it eased anxiety
          and low mood by a small to moderate amount. That was about as
          helpful as other active approaches, such as exercise or
          therapy. Not better.
        - In ${MINDFULNESS.myriadSchools} British schools (${MINDFULNESS.myriadYear}), pupils given mindfulness lessons
          did no better than those given normal lessons.
      `,
    },
    {
      id: 'mindfulness',
      type: 'multi',
      title: 'What about mindfulness?',
      text: '**Mindfulness** is widely promoted. **Which of these statements does the evidence support?**',
      options: [
        { text: 'It means paying attention to the present moment, on purpose, without judging it', correct: true },
        { text: 'In trials, courses of it have eased anxiety and low mood by a small to moderate amount', correct: true },
        { text: 'It has been shown to work better than other treatments', why: 'A review of 47 trials found it about as helpful as other active approaches, such as exercise or therapy. Not better.' },
        { text: 'The largest trial in schools found clear benefits for pupils\' mental health', why: `It found none. In ${MINDFULNESS.myriadSchools} British schools (${MINDFULNESS.myriadYear}), pupils given mindfulness lessons did no better than those given normal lessons.` },
      ],
      explain: `
        For adults who choose it, courses help modestly. It is not a
        cure-all, it does not suit everyone, and the claims made for it
        often run ahead of the evidence.
      `,
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to try',
      text: `
        The loop has one more way in: **the body**. Short sleep, days
        without movement or daylight, missed meals and alcohol all tilt
        thoughts towards the gloomy side.

        If you like, the next time a thought stings, try asking of it:
        **"Is that a fact, or a guess?"**

        :::note
        These are everyday skills borrowed from therapy. They are not
        treatment. When worries or low mood take over daily life for
        weeks, that is a reason to talk to a doctor: see the next lesson.
        :::
      `,
    },
  ],
  recap: [
    'Between a situation and a feeling sits a **thought**. Situation → thought → feeling → action, and the action shapes what happens next.',
    'Fast thoughts fall into traps: catastrophising, mind-reading, all-or-nothing thinking. A thought can be **checked against evidence**; a feeling is not evidence.',
    'Avoiding a fear feeds it; approaching it in manageable steps shrinks it. Rumination circles, problem-solving looks for a next step.',
    'Naming a feeling quietens it a little. Mindfulness helps some people modestly and is not a cure-all. These are skills, not treatment.',
  ],
  next: 'Next: when a low mood or a worry is more than a bad day. What mental health conditions are, and what really helps.',
};
