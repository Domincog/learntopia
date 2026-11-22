// Probability & Chance · Lesson 8 · The Monty Hall Problem
import { r } from '../../../kit.js';
import { commas, nearMiss } from '../helpers.js';

const times = (n) => (n === 0 ? 'not at all' : n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);

// Three doors after the host's move: door 1 picked, door 2 still shut, door 3 opened on a goat.
const DOORS = (() => {
  const door = (x, n, open) => `<rect class="${open ? 'fill-sunken stroke-ink-3' : 'fill-blue-soft stroke-ink'}" stroke-width="3"${open ? ' stroke-dasharray="6 5"' : ''} x="${x}" y="12" width="76" height="110" rx="6"/>`
    + (open
      ? `<text class="fig-label" x="${x + 38}" y="74" text-anchor="middle">goat</text>`
      : `<text class="fig-label-lg" x="${x + 38}" y="72" text-anchor="middle">${n}</text><circle class="fill-ink" cx="${x + 62}" cy="70" r="4"/>`);
  const label = (x, text) => `<text class="fig-label" x="${x + 38}" y="146" text-anchor="middle">${text}</text>`;
  return {
    type: 'svg', viewBox: '0 0 330 156', maxWidth: 360,
    alt: 'Three doors. Door 1 is shut and labelled "your pick". Door 2 is shut and labelled "left shut". Door 3 has been opened by the host and shows a goat.',
    content: door(18, 1) + door(127, 2) + door(236, 3, true) + label(18, 'your pick') + label(127, 'left shut') + label(236, 'opened'),
  };
})();

export default {
  id: 'monty-hall',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Three doors',
      text: `
        You are on a game show. Behind one of three doors is a **car**. Behind
        the other two are **goats**. You pick a door: say, door 1.

        The host knows what is behind every door. As he does in every show,
        he now opens one of the *other* doors to reveal a goat: say, door 3.
        Then he asks: *"Do you want to stay with door 1, or switch to door 2?"*

        **What should you do?**
      `,
      shuffle: false,
      options: [
        { text: 'Stay with door 1' },
        { text: 'Switch to door 2', correct: true },
        { text: 'It makes no difference: two doors are left, so it is 50–50' },
      ],
      explain: `
        Switch. It **doubles** your chance of winning the car, from 1 in 3 to
        2 in 3.

        Almost everybody who meets this puzzle for the first time says it
        makes no difference. So do not take anybody's word for it: play.
      `,
    },
    {
      id: 'play',
      type: 'interact',
      graded: false,
      title: 'Play it',
      text: `
        Here are the three doors. Pick one, watch which door the host opens,
        then decide.

        **Play at least six rounds: stay three times and switch three times.**
      `,
      widget: { type: 'monty-hall', auto: false },
      check: (s) => (s.stay.played >= 3 && s.switch.played >= 3)
        || `So far you have stayed ${times(s.stay.played)} and switched ${times(s.switch.played)}. Do each at least three times.`,
      solution: { stay: { played: 3 }, switch: { played: 3 } },
      explain: `
        Six rounds are far too few to settle anything: remember how wildly
        ten coin flips can swing.

        To see the true win rates you need the long run. Let the computer do the playing.
      `,
    },
    {
      id: 'long-run',
      type: 'interact',
      graded: false,
      title: 'A thousand rounds each',
      text: `
        The same game, with the same rules. This time the computer can play for you.

        **Auto-play at least 1000 rounds of each strategy** and compare the two win rates.
      `,
      widget: { type: 'monty-hall', auto: 500 },
      check: (s) => (s.stay.played >= 1000 && s.switch.played >= 1000)
        || `Always stay: ${commas(s.stay.played)} rounds. Always switch: ${commas(s.switch.played)} rounds. Take both to at least 1000.`,
      solution: { stay: { played: 1000 }, switch: { played: 1000 } },
      explain: `
        Staying wins about **one round in three**. Switching wins about
        **two rounds in three**. It is not 50–50, and it is not even close.

        :::fun
        The puzzle is named after Monty Hall, the host of an American TV game
        show. When a magazine columnist, Marilyn vos Savant, printed the
        answer "switch" in 1990, thousands of readers wrote in to say she
        was wrong, many of them with doctorates. She was right.
        :::

        The simulation shows *that* switching is better. Now for *why*.
      `,
    },
    {
      id: 'teach-host',
      type: 'info',
      title: 'What the host must do',
      text: `
        The long run has settled *that* it is not 50–50: staying wins about
        one round in three, switching about two in three. The *why* lies in
        the rules the host plays by:

        - He knows where the car is.
        - He never opens your door.
        - He always opens a door with a **goat** behind it, never the car.
        - Then he always offers you the switch.

        So the host is not free to open any door he likes. Keep that in mind
        for the next three questions.
      `,
      figure: DOORS,
    },
    {
      id: 'why-stay',
      type: 'choice',
      title: 'First, the player who stays',
      text: `
        Think about a player who **always stays**. Whatever the host does,
        this player ends up with the door they picked at the start.

        **How often does that first pick hide the car?**
      `,
      options: [
        { text: r`$\frac{1}{3}$ of the time`, correct: true },
        { text: r`$\frac{1}{2}$ of the time`, why: 'When you chose, there were three doors and you knew nothing. Opening a goat door afterwards does not move the car.' },
        { text: r`$\frac{2}{3}$ of the time`, why: 'That is how often the car is behind one of the *other* two doors.' },
      ],
      explain: r`
        One door out of three: $\frac{1}{3}$. And the host cannot change that.
        Whichever door you picked, he can *always* find a goat to show you,
        so seeing a goat tells you nothing new about your own door.

        A player who stays wins exactly when the first pick was right:
        $\frac{1}{3}$ of the time.
      `,
    },
    {
      id: 'why-switch',
      type: 'fill',
      title: 'Now, the player who switches',
      text: `
        Suppose your first pick was **wrong**: you chose a goat. Then the two
        other doors hide the car and the second goat. The host must open one
        of them, and he must not reveal the car.

        **Complete the argument.**
      `,
      template: `
        The host has to open the door with the [[car|*goat]], so the door he leaves shut hides the [[*car|goat]].

        In that case, switching [[loses|*wins]].

        Your first pick is wrong with probability [[2/3;0.67;0.667;0.6667;0.666]].
      `,
      hints: ['Three doors, one car: how often is a blind first pick wrong?'],
      explain: r`
        When your first pick is wrong, the host has **no choice**. He cannot
        open your door and he cannot open the car door, so he must open the
        one remaining goat door, and the door he leaves shut is the car.

        So switching wins exactly when your first pick was *wrong*:

        $$ P(\text{switching wins}) = \frac{2}{3} $$
      `,
    },
    {
      id: 'three-cases',
      type: 'bucket',
      title: 'All three cases',
      text: `
        Say you always start with **door 1**. The car is equally likely to be
        behind door 1, door 2 or door 3.

        **In which cases does switching win?**
      `,
      buckets: ['Switching wins', 'Switching loses'],
      items: [
        { text: 'Car behind door 1: the host opens door 2 or door 3', bucket: 1, why: 'Here your first pick was right. Whichever goat door the host opens, switching takes you to the other goat.' },
        { text: 'Car behind door 2: the host must open door 3', bucket: 0, why: 'The host cannot open door 2, so he opens door 3. Switching takes you to door 2, and the car.' },
        { text: 'Car behind door 3: the host must open door 2', bucket: 0, why: 'The host cannot open door 3, so he opens door 2. Switching takes you to door 3, and the car.' },
      ],
      explain: `
        Three equally likely cases, and switching wins in two of them.

        Notice the word **must**. In two cases out of three the host is
        forced to leave the car door shut. He is, without wanting to, pointing at the car.
      `,
    },
    {
      id: 'teach-two-doors',
      type: 'info',
      title: 'Two doors, two different stories',
      text: r`
        Put the three cases side by side. You picked door 1.

        | Car is behind | If you stay | If you switch |
        |:---|:---:|:---:|
        | Door 1, your pick | win | lose |
        | Door 2 | lose | **win** |
        | Door 3 | lose | **win** |

        :::key
        Staying wins exactly when your first pick was right: $\frac{1}{3}$.
        Switching wins exactly when it was wrong: $\frac{2}{3}$.
        :::

        At the end two doors are shut, but they got there in different ways.
        Yours was picked blindly, one out of three. The other was left shut
        by a host who knows where the car is and was not allowed to open it.
      `,
    },
    {
      id: 'not-fifty',
      type: 'choice',
      review: true,
      text: `
        In the Monty Hall game, the host has opened a goat door and two doors
        are still shut: yours, and one other. Someone says: *"Two doors, one
        car, so it is 50–50."*

        **What is wrong with that?**
      `,
      options: [
        { text: 'Two possibilities are only 50–50 if they are equally likely, and these two are not', correct: true },
        { text: 'Nothing: with one door open it really is 50–50', why: 'Played over many rounds, switching wins about twice as often as staying. The two doors are not equally good.' },
        { text: 'The host may be lying about the goat', why: 'The open door really does show a goat. The host never lies in this game: he simply knows more than you do.' },
        { text: 'The car may be moved after you have picked', why: 'Nothing is moved. The car stays where it was at the start.' },
      ],
      explain: `
        Counting possibilities only gives a probability when they are
        **equally likely**. The two shut doors got there in different ways:
        yours was picked blindly, one out of three. The other was left shut
        by someone who knows where the car is and was not allowed to open it.

        Your door keeps its 1 in 3. The other door carries the remaining 2 in 3.
      `,
    },
    {
      id: 'hundred',
      type: 'interact',
      graded: false,
      title: 'One hundred doors',
      text: `
        Still uneasy? Make the game bigger: **100 doors**, one car, 99 goats.
        You pick a door. The host, who knows where the car is, opens **98**
        of the others, all goats, and leaves one single door shut.

        **Play a round.** Would you really stay?
      `,
      widget: { type: 'monty-hall', doors: 100, auto: false },
      check: (s) => s.rounds >= 1 || 'Pick a door, then decide: stay or switch.',
      solution: { switch: { played: 1 } },
      explain: r`
        Your first pick had 1 chance in 100. Then the host opened 98 doors,
        carefully stepping around one particular door. Unless you were lucky
        at the very start, that door is where the car is: switching wins
        $\frac{99}{100}$ of the time.

        Nobody calls *this* 50–50. Yet the three-door game is the same game,
        only smaller: there too the host opens every other door but one.
      `,
    },
    {
      id: 'example-many-doors',
      type: 'info',
      title: 'More doors, same argument',
      text: r`
        Nothing in the argument needed exactly three doors. With any number
        of doors, the host opens every other door but one, and switching
        wins whenever your first pick was wrong.

        :::example
        **8 doors**, one car. Your first pick is right with probability
        $\frac{1}{8}$. In every other case the host is forced to leave the
        car's door shut. So switching wins with probability
        $1 - \frac{1}{8} = \frac{7}{8}$.
        :::

        The more doors there are, the worse a blind first pick is, and the
        better the switch.
      `,
    },
    {
      id: 'n-doors',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([3, 4, 5, 10, 20, 50, 100, 1000]);
        return {
          text: `
            A Monty Hall game with **${commas(n)} doors**: one car, and a goat behind
            every other door. You pick a door. The host, who knows where the
            car is, opens all the other doors except one, showing only goats.

            You **switch** to the door he left shut. What is the probability
            that you win the car? Give your answer as a fraction.
          `,
          answer: `${n - 1}/${n}`,
          display: `${n - 1}/${n}`,
          tolerance: 0.0004,
          wrong: [
            [1 / 2, 'Two doors are left, but they are not equally likely. One was picked blindly; the other was left shut by a host who knows where the car is.'],
            [1 / n, 'That is the chance that your *first* pick was right, which is the chance of winning by **staying**.'],
            [1 / (n - 1), 'Think about when switching wins: whenever your first pick was wrong. How likely is that?'],
          ],
          feedback: nearMiss((n - 1) / n),
          hints: [
            `How likely is it that your first pick, one door out of ${commas(n)}, was right?`,
            'Switching wins in every other case: whenever the first pick was wrong.',
          ],
          explain: r`
            Your first pick is right with probability $\frac{1}{${n}}$. In every
            other case the host is forced to leave the car door shut, so
            switching wins with probability $1 - \frac{1}{${n}} = \frac{${n - 1}}{${n}}$.
          `,
        };
      },
    },
    {
      id: 'blind-host',
      type: 'choice',
      stretch: true,
      title: 'A host who does not know',
      text: `
        Change one thing. This host does **not** know where the car is. He
        opens one of the other two doors *at random*, and it happens to show
        a goat. (Had it shown the car, the round would have been void.)

        **Now what is your chance of winning if you switch?** You may let
        the computer play this version first.
      `,
      figure: {
        type: 'monty-hall', host: 'random', auto: 500, manual: false,
        alt: 'Three doors and a tally. Buttons let the computer play 500 rounds of always staying or always switching against a host who opens a door at random.',
        caption: 'This host opens a door blindly. Rounds in which he exposes the car are void and not counted.',
      },
      shuffle: false,
      options: [
        { text: r`$\frac{1}{3}$`, why: 'That would make switching worse than staying. Count the rounds that are *not* void, or let the computer play them.' },
        { text: r`$\frac{1}{2}$`, correct: true },
        { text: r`$\frac{2}{3}$`, why: 'That is the answer for a host who *knows*. A host who opens a door blindly could have hit the car. That he did not is a piece of luck, and it changes the count.' },
      ],
      hints: [
        'Picture 300 rounds in which you pick door 1. In how many is the car behind your door?',
        'In the other 200 rounds the car is behind door 2 or 3, and a blind host opens the car door in half of them. Those rounds are void.',
      ],
      explain: `
        Picture 300 rounds.

        - In **100** of them the car is behind your door, and the host shows a goat every time.
        - In **200** it is behind one of the other doors. A blind host opens the car door in half of these, and those 100 rounds are void. In the other **100** he happens to show a goat.

        So among the 200 rounds in which you see a goat, your door has the
        car in 100 and the other door has it in 100: **50–50**.

        A host who *knows* never spoils a round: all 200 rounds in which your
        first pick was wrong end with the car behind the other door. It is
        not the open door that helps you. It is that the host was **forced
        to avoid the car**.
      `,
    },
    {
      id: 'teach-rules',
      type: 'info',
      title: 'Change the rules, change the answer',
      text: `
        The 2-in-3 answer belongs to one precise game. Change what the host
        knows or does, and the answer changes with it.

        | The host… | Switching wins |
        |:---|:---:|
        | knows where the car is, always shows a goat, always offers the switch | 2 times in 3 |
        | opens a door blindly (rounds that show the car are void) | 1 time in 2 |
        | offers the switch only when you have picked the car | never |

        In that last game the offer itself would be a warning: it only ever
        comes when your door is the right one.
      `,
    },
    {
      id: 'rules',
      type: 'multi',
      review: true,
      text: `
        In the Monty Hall game, "switching wins 2 times in 3" is true only
        because of the way the host behaves.

        **Which of these does that answer depend on?**
      `,
      options: [
        { text: 'The host knows where the car is', correct: true },
        { text: 'The host always opens a door with a goat behind it', correct: true },
        { text: 'The host offers the switch every time, whatever you picked', correct: true },
        { text: 'You pick door 1 first, not door 2 or door 3', why: 'The door numbers are only labels. The argument is the same whichever door you start with.' },
        { text: 'The host wants you to win', why: 'His wishes do not matter, only his rule: always open a goat door, always offer the switch.' },
      ],
      explain: `
        The 2-in-3 answer belongs to one precise game: the host **knows**
        where the car is, **always** opens a goat door, and **always** offers
        the switch.

        Change the rules and the answer changes. A host who opens a door
        blindly gives you 50–50. A host who offered the switch *only* when
        you had picked the car would make switching a certain loss.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend insists: *"Two doors are left, so it is 50–50."*

        **Convince them in two or three sentences.**
      `,
      model: `
        My first pick is right only 1 time in 3, and the host cannot change
        that: he can always find a goat to show me. The other 2 times in 3
        the car is behind one of the other two doors, and the host, who is
        not allowed to reveal it, is forced to leave that very door shut. So
        the door he leaves shut hides the car 2 times in 3.

        And if that does not work: imagine 100 doors. I pick one, the host
        opens 98 goats and leaves one door shut. Still 50–50?
      `,
    },
  ],
  recap: [
    'Staying wins only if your first pick was right: 1 time in 3.',
    'Switching wins whenever your first pick was wrong: 2 times in 3. The host is then forced to leave the car door shut.',
    'Two possibilities are not automatically 50–50. They have to be equally likely.',
    'The answer depends on what the host knows and must do. Change his rules, and the probabilities change.',
  ],
  next: 'That was the last lesson of this course. Your review cards will bring the key ideas back just before you would forget them.',
};
