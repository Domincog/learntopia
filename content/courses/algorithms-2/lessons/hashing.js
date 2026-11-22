// Algorithms II · Lesson 5 · Find It in One Step
import { r, plural, num } from '../../../kit.js';
import { CROWD, FIRST_WORDS, HASHES, MORE_WORDS, WORD_POOL, group, hashAll, letterNumber, letterSum, listAnd } from '../helpers.js';

const M = 7;
const slotOf = (word) => HASHES.sum(word, M);
const sumLine = (word) => `${[...word].map(letterNumber).join(' + ')} = ${letterSum(word)}`;
const CROWD_FIRST = hashAll(CROWD, M, 'first');
const CROWD_SUM = hashAll(CROWD, M, 'sum');
const longest = (table) => Math.max(...table.map((chain) => chain.length));
const PILE = CROWD_FIRST.findIndex((chain) => chain.length === longest(CROWD_FIRST));
const ANAGRAMS = CROWD_SUM.find((chain) => chain.includes('BAD'));
/** The worked example of the rule: a word that is not in WORD_POOL, so the generated step can never ask it. */
const SHOW_WORD = 'HIDE';
const SHOW_SUM = letterSum(SHOW_WORD);
const TIMES_WORD = ['no times', 'once', 'twice', 'three times', 'four times', 'five times'];
/** The cloakroom after all eight words: the picture of the first collision. */
const ALL_WORDS = [...FIRST_WORDS, ...MORE_WORDS];
const FULL = hashAll(ALL_WORDS, M, 'sum');
const CLASH = FULL.find((chain) => chain.length > 1);

export default {
  id: 'hashing',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      shuffle: false,
      title: 'Faster than halving?',
      text: `
        A million names in a sorted list: binary search finds any one of them in at most 20 looks. That felt unbeatable in the first course.

        There is a way of storing the same million names so that finding one takes far fewer looks on average. **How many, do you think?**
      `,
      options: [
        { text: 'About 1 or 2', correct: true },
        { text: 'About 10' },
        { text: 'About 20: nothing beats halving' },
      ],
      explain: `
        **One or two**, and it stays that way whether there are a thousand names or a billion.

        The trick is not to search faster. It is to stop searching: work out where the item must be, and go straight there.
      `,
    },
    {
      id: 'teach-rule',
      type: 'info',
      title: 'A cloakroom that calculates',
      text: `
        A cloakroom has **${M} hooks**, numbered 0 to ${M - 1}. The attendant never looks for a free hook. She *calculates* where each word belongs:

        1. Add up the numbers of its letters (A = 1, B = 2, C = 3 …).
        2. Divide by ${M} and keep the **remainder**: what is left over. That is the hook.

        :::example ${SHOW_WORD}
        ${sumLine(SHOW_WORD)}. Seven goes into ${SHOW_SUM} ${TIMES_WORD[Math.floor(SHOW_SUM / M)]}, which makes ${Math.floor(SHOW_SUM / M) * M}, and **${slotOf(SHOW_WORD)}** is left over. ${SHOW_WORD} goes on hook ${slotOf(SHOW_WORD)}.
        :::

        A sum smaller than ${M} is its own remainder: a word with the sum 4 goes on hook 4.
      `,
      figure: { type: 'hash-table', mode: 'view', slots: M, keys: [SHOW_WORD], find: SHOW_WORD, alt: `A row of ${M} hooks, numbered 0 to ${M - 1}. The word ${SHOW_WORD} hangs on hook ${slotOf(SHOW_WORD)}. The other hooks are empty.` },
    },
    {
      id: 'place-keys',
      type: 'interact',
      auto: true,
      attempts: 8,
      title: 'Your turn at the cloakroom',
      text: r`
        The same cloakroom: **7 hooks**, numbered 0 to 6.

        **Hang up the five words** by tapping the right hook for each. For every word, add up the numbers of its letters (they are printed under the letters), divide by 7 and keep the **remainder**.
      `,
      widget: { type: 'hash-table', mode: 'place', slots: M, keys: FIRST_WORDS },
      check: (s) => s.done || `${plural(s.waiting, 'word is', 'words are')} still waiting. Work out the hook for the word at the top.`,
      solution: { done: true },
      hints: [
        'The first word is CAB: 3 + 1 + 2 = 6. Six is less than 7, so the remainder is 6 itself.',
        'BED: 2 + 5 + 4 = 11. Seven goes into 11 once, and 4 is left over.',
      ],
      explain: `
        ${FIRST_WORDS.map((w) => `${w}: ${sumLine(w)}, remainder ${slotOf(w)}`).join('. ')}.

        Now someone asks for BED. You do not look along the hooks. You repeat the sum, get ${slotOf('BED')}, and go straight there.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Hash functions and hash tables',
      text: `
        A rule that turns a key into a slot number is called a **hash function**. A table that files its entries by such a rule is a **hash table**.

        Storing and finding work the same way:

        1. Compute the hash of the key.
        2. Go to that slot.

        No comparing along the way, no halving, and the size of the table does not matter. The work is one small calculation.

        The cloakroom's hash function is "sum of the letter numbers, remainder on division by 7". Real ones are more thorough, but they do the same job.
      `,
    },
    {
      id: 'which-slot',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const word = rng.pick(WORD_POOL);
        const m = rng.pick([5, 7, 9, 11]);
        const sum = letterSum(word);
        const slot = sum % m;
        const times = Math.floor(sum / m);
        return {
          text: `
            A hash table has **${m} slots**, numbered 0 to ${m - 1}. Its hash function adds up the alphabet numbers of a word's letters (A = 1, B = 2, C = 3 …) and takes the remainder on division by ${m}.

            **Which slot does the word ${word} go to?**
          `,
          answer: slot,
          prefix: 'Slot',
          wrong: [
            [sum, `${sum} is the sum of the letters. The slot is the remainder when ${sum} is divided by ${m}.`],
            ...(times >= 1 ? [[times, `${m} goes into ${sum} ${times === 1 ? 'once' : `${times} times`}, but the slot is what is left over.`]] : []),
          ],
          hints: [
            `${[...word].map((ch) => `${ch} = ${letterNumber(ch)}`).join(', ')}.`,
            `The sum is ${sum}. What is left over when ${sum} is divided by ${m}?`,
          ],
          explain: times === 0
            ? `${word}: ${sumLine(word)}. That is less than ${m}, so it is its own remainder: slot **${slot}**.`
            : r`${word}: ${sumLine(word)}, and $${sum} = ${times} \times ${m} + ${slot}$. The remainder is the slot: **${slot}**.`,
        };
      },
    },
    {
      id: 'collisions',
      type: 'interact',
      auto: true,
      attempts: 8,
      title: 'Eight words, seven hooks',
      text: `
        The five words are on their hooks. Now three more arrive: ${listAnd(MORE_WORDS)}. That makes **8 words for 7 hooks**.

        **Hang them up** by the same rule.
      `,
      widget: { type: 'hash-table', mode: 'place', slots: M, placed: FIRST_WORDS, keys: MORE_WORDS },
      check: (s) => s.done || `${plural(s.waiting, 'word is', 'words are')} still waiting. Work out the hook for the word at the top.`,
      solution: { done: true },
      hints: [`${MORE_WORDS[0]}: ${sumLine(MORE_WORDS[0])}. What is left over when that is divided by 7?`],
      explain: `
        ${MORE_WORDS.slice(0, 2).join(' and ')} took the last two free hooks. Then came DIG: ${sumLine('DIG')}, remainder ${slotOf('DIG')}, and hook ${slotOf('DIG')} already held CAB.

        Hook ${slotOf('DIG')} now holds two words, and that was bound to happen: 8 words cannot each have one of 7 hooks to themselves.
      `,
    },
    {
      id: 'teach-collisions',
      type: 'info',
      title: 'Collisions and chains',
      text: `
        Two keys that land in the same slot are a **collision**. The usual cure is **chaining**: each slot holds a short list, and a newcomer joins the end.

        To find ${CLASH[1]} later, the computer works out its slot, ${slotOf(CLASH[1])}, goes there and compares along the chain: first ${CLASH[0]}, then ${CLASH[1]}. That is **${CLASH.length} comparisons**, and the other ${ALL_WORDS.length - CLASH.length} words are never touched.

        Collisions cannot be avoided for ever. With 3 slots, three keys may be lucky and get a slot each, but a fourth has nowhere new to go. More keys than slots always means a collision: the **pigeonhole principle**.
      `,
      figure: { type: 'hash-table', mode: 'view', slots: M, keys: ALL_WORDS, find: CLASH[1], alt: `The cloakroom with all eight words. ${FULL.map((c, i) => `Hook ${i}: ${c.join(', ')}`).join('. ')}. Hook ${slotOf(CLASH[1])} and its chain of two words are highlighted.` },
    },
    {
      id: 'pigeonhole',
      type: 'numeric',
      gen: (rng) => {
        const m = rng.pick([7, 10, 12, 31, 50, 100, 365, 1000]);
        return {
          text: `
            A hash table has **${group(m)} slots**. Its hash function may be as clever as you like.

            **What is the smallest number of keys that makes a collision certain?**
          `,
          answer: m + 1,
          unit: 'keys',
          wrong: [
            [m, `${group(m)} keys could still get a slot each, if the hash function happens to spread them perfectly. One more key cannot.`],
            [2, 'Two keys *can* collide, but they do not have to. The question asks when a collision becomes unavoidable.'],
            [2 * m, `That is far more than needed. Think about what happens to the key that arrives when all ${group(m)} slots are taken.`],
          ],
          hints: [`Imagine the luckiest case: every key so far has a slot of its own. When does the luck have to run out?`],
          explain: `
            With ${group(m)} keys, each could still sit alone in its slot. Key number **${group(m + 1)}** finds every slot taken and has to share.

            That is the pigeonhole principle: more things than boxes means some box holds two. No hash function can get around it, so every hash table needs a plan for collisions.
          `,
        };
      },
    },
    {
      id: 'lookup-cost',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        let words;
        let table;
        let long;
        for (let attempt = 0; attempt < 200; attempt++) {
          words = rng.sample(WORD_POOL, 10);
          table = hashAll(words, M, 'sum');
          long = table.filter((chain) => chain.length >= 2);
          if (long.length >= 2 && longest(table) <= 4) break;
        }
        const chain = rng.pick(long);
        const place = rng.int(2, chain.length);
        const word = chain[place - 1];
        const slot = table.indexOf(chain);
        return {
          text: `
            This hash table uses chaining. To find a word, the computer works out its slot, goes there, and compares the word with the entries of that chain one after another, from the left, until it matches.

            **How many comparisons does it make to find ${word}?** Count the one that matches too.
          `,
          figure: {
            type: 'hash-table', mode: 'view', slots: M, keys: words,
            alt: `A hash table with 7 slots. ${table.map((c, i) => `Slot ${i}: ${c.length ? c.join(', ') : 'empty'}`).join('. ')}.`,
          },
          answer: place,
          wrong: [
            [words.length, `It never searches all ${words.length} words. Only the chain in slot ${slot} is looked at.`],
            [chain.length, `The search stops as soon as ${word} is found. The ${chain.length - place === 1 ? 'word' : 'words'} after it in the chain ${chain.length - place === 1 ? 'is' : 'are'} never looked at.`],
            [place - 1, `Count ${word} itself as well: the comparison that matches is still a comparison.`],
            [slot, `${slot} is the number of the slot. Count the words in that chain up to and including ${word}.`],
          ].filter(([value], i, all) => all.findIndex(([other]) => other === value) === i),
          hints: [
            `Find ${word} in the picture. Which slot is it in?`,
            `It is in slot ${slot}. Count along that chain from the left until you reach ${word}.`,
          ],
          explain: `
            ${word} hashes to slot ${slot}, whose chain is ${chain.join(' → ')}. The computer compares with ${listAnd(chain.slice(0, place))}: **${plural(place, 'comparison')}**.

            The other ${words.length - chain.length} words in the table are never touched.
          `,
        };
      },
    },
    {
      id: 'bad-hash',
      type: 'interact',
      attempts: 5,
      title: 'A good hash and a bad one',
      text: `
        Twelve words, seven slots, and two hash functions to choose from:

        - **First letter only**: the number of the first letter, remainder on division by 7.
        - **Sum of the letters**: the rule you know.

        **Switch between them, and leave the table on the function that keeps every chain at 2 words or fewer.**
      `,
      widget: { type: 'hash-table', mode: 'compare', slots: M, fns: ['first', 'sum'], keys: CROWD },
      check: (s) => s.longest <= 2 || `With "${s.fn === 'first' ? 'First letter only' : 'this function'}" the longest chain holds ${s.longest} words. Try the other function.`,
      solution: { fn: 'sum' },
      explain: `
        ${CROWD_FIRST[PILE].length} of the twelve words begin with B, and "first letter only" sends them all to slot ${PILE}. Finding ${CROWD_FIRST[PILE][CROWD_FIRST[PILE].length - 1]} there takes ${CROWD_FIRST[PILE].length} comparisons: the table has turned back into a list.

        The letter sum spreads the same words so that no slot holds more than ${longest(CROWD_SUM)}. A good hash function uses **the whole key** and spreads keys **evenly**. (Even the sum is only a toy: ${ANAGRAMS.join(' and ')} have the same letters, so they always collide. Real hash functions also mix in where each letter stands.)
      `,
    },
    {
      id: 'load-factor',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const slots = rng.pick([8, 16, 20, 40, 100, 200, 1000]);
        const factor = rng.pick([0.25, 0.5, 0.75, 1.5, 2, 2.5]);
        const keys = slots * factor;
        return {
          text: `
            The **load factor** of a hash table is the number of keys divided by the number of slots. It says how many keys a slot holds on average. For example, 12 keys in 60 slots give 12 ÷ 60 = 0.2.

            A table with **${group(slots)} slots** holds **${group(keys)} keys**. What is its load factor?
          `,
          answer: factor,
          tolerance: 0.001,
          wrong: [
            [slots / keys, `That is slots ÷ keys. The load factor is keys ÷ slots: ${group(keys)} ÷ ${group(slots)}.`],
            [keys - slots, 'Divide, do not subtract: the load factor is an average per slot.'],
          ],
          hints: [`Divide ${group(keys)} by ${group(slots)}.`],
          explain: `
            ${group(keys)} ÷ ${group(slots)} = **${num(factor)}**.

            With a good hash function, a chain holds about ${num(factor)} ${factor === 1 ? 'key' : 'keys'} on average. That is all a look-up has to go through, whether the table holds a hundred keys or a hundred million.
          `,
        };
      },
    },
    {
      id: 'worst-case',
      type: 'choice',
      title: 'Average is not a promise',
      text: `
        A hash table has a load factor of 1: on average, one key per slot.

        **Is a look-up guaranteed to take about one comparison?**
      `,
      options: [
        { text: 'No: many keys can still land in the same slot, and a look-up there has to walk along the whole chain', correct: true },
        { text: 'Yes: an average of one means every slot holds exactly one key', why: 'An average of one allows empty slots and crowded ones. Eight words on seven hooks already left some hooks fuller than others.' },
        { text: 'Yes: below a load factor of 2, collisions cannot happen', why: 'Two keys can share a slot even in a nearly empty table. It only takes two keys with the same hash.' },
        { text: 'No: a look-up always has to visit every slot', why: 'A look-up visits one slot only: the one the hash function names.' },
      ],
      explain: `
        With a good hash function and a modest load factor, a look-up takes about one step **on average**. But nothing rules out an unlucky pile-up: in the very worst case all $n$ keys share one slot, and finding one of them takes $n$ comparisons.

        That is the bargain. Binary search guarantees about $\\log_2 n$ steps every time. A hash table is faster on average, with no guarantee for the unluckiest key.
      `,
    },
    {
      id: 'regrow',
      type: 'choice',
      stretch: true,
      title: 'Growing the table',
      text: `
        When a hash table gets crowded, it is replaced by a bigger one. Suppose the cloakroom grows from 7 hooks to 14, with the rule "letter sum, remainder on division by the number of hooks".

        **Why does every word have to be hung up again, instead of staying where it was?**
      `,
      options: [
        { text: 'A word\'s hook is a remainder on division by the number of hooks, and dividing by 14 gives different remainders', correct: true },
        { text: 'Words do not have to move: look-ups would still find them on their old hooks', why: 'A look-up uses the new rule. It would look for BED on hook 11 and never see it on hook 4.' },
        { text: 'A bigger table is not allowed to have chains', why: 'Chains are always allowed. A bigger table simply needs them less often.' },
        { text: 'The letter sums of the words change', why: 'The sums stay the same: BED is still 11. Only the number they are divided by changes.' },
      ],
      explain: `
        BED has the letter sum 11. With 7 hooks its place is 4, because $11 = 1 \\times 7 + 4$. With 14 hooks it is 11. A look-up will calculate with the new size, so the words must be where the new rule says.

        Re-filing everything costs time, but it happens rarely, and afterwards the chains are short again.
      `,
    },
    {
      id: 'in-the-wild',
      type: 'info',
      title: 'Where you have met this',
      text: `
        Hash tables are everywhere in software. If you have used Python: its **dictionaries** and **sets** are hash tables. That is why checking whether a word is in a set of a million words takes about as long as in a set of ten.

        They look after their own load factor: when the table is about two-thirds full, Python moves everything into a bigger one. (It also settles collisions a little differently, by trying further slots instead of keeping chains. The idea is the same.)

        :::note
        You may have heard of *cryptographic* hash functions, used for passwords and digital signatures. They must meet a different and much harder demand: nobody should be able to construct two inputs with the same hash on purpose. That is a subject of its own.
        :::
      `,
    },
    {
      id: 'tradeoffs',
      type: 'bucket',
      review: true,
      text: 'A hash table finds one exact key very fast, but it keeps its keys in no useful order. A sorted list is slower to search, but it is in order. **Which structure suits each job better?**',
      buckets: ['Hash table', 'Sorted list'],
      items: [
        { text: 'Check whether a username is already taken', bucket: 0, why: 'One exact key, yes or no: compute the hash and look in one slot.' },
        { text: 'Count how often each word occurs in a book', bucket: 0, why: 'Each word is looked up by its exact spelling, again and again. That is what a hash table is best at.' },
        { text: 'Look up the price for a product code', bucket: 0, why: 'An exact key leads straight to its entry.' },
        { text: 'List all names in alphabetical order', bucket: 1, why: 'A hash function scatters the keys on purpose. Alphabetical order is lost.' },
        { text: 'Find every name between "Da" and "Dm"', bucket: 1, why: 'Neighbouring names end up in unrelated slots of a hash table. In a sorted list they sit side by side.' },
        { text: 'Find the name that comes just before a given one', bucket: 1, why: 'A hash table has no "before" and "after". A sorted list does.' },
      ],
      explain: `
        Hashing wins when you know the exact key. It scatters keys deliberately, so anything that depends on **order** (ranges, neighbours, alphabetical lists) needs a sorted structure instead.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend says: *"Finding one name among a million must take at least twenty steps. You showed me that with binary search."*

        **Explain how a hash table does it in about one step, and what the catch is.**
      `,
      model: `
        Binary search compares its way towards the name. A hash table does not compare at all at first: it runs the name through a hash function, which turns it into a slot number, and looks only in that slot. The size of the table plays no part.

        The catch: different names can get the same slot, so each slot holds a short chain that has to be checked. With a good hash function and enough slots the chains stay short, so it is about one step on average. But that is an average, not a guarantee, and the table cannot give you the names in order.
      `,
    },
  ],
  recap: [
    'A **hash function** turns a key into a slot number, so an item is found by calculating, not by searching.',
    '**Collisions** are unavoidable (more keys than slots forces one) and are handled by **chaining**.',
    'A good hash function uses the whole key and spreads keys evenly. The **load factor**, keys ÷ slots, is the average chain length.',
    'Look-ups take about one step on average, but not in the worst case, and a hash table keeps no order.',
  ],
  next: 'Next: the last lesson. Some problems have resisted every clever strategy, and nobody knows whether a fast method exists.',
};
