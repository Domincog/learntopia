// The Body I: Fuel, Air and Blood · Lesson 4 · Every Breath
//
// Driving question: air is only a fifth oxygen, and you breathe most of that straight back out.
// So how does enough get into your blood?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/body-systems/index.js';
import { BREATH, AIRWAY, PEOPLE, grouped, say } from '../helpers.js';

const SAC_ALT = 'A cross-section of one air sac of the lung. Oxygen molecules float in the sac. Under its thin wall runs a capillary in which red blood cells pass from left to right, turning from blue to red as they load oxygen. Controls change the oxygen in the sac, the thickness of the wall, the share of the surface that still works and the speed of the blood.';

const HEALTHY = { oxygen: 100, thickness: 1, area: 100, exercise: false };
const differs = (s) => Object.keys(HEALTHY).filter((k) => s[k] !== HEALTHY[k]);

export default {
  id: 'breathing',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'In and out',
      text: `
        The air you breathe in is about **${BREATH.oxygenIn}% oxygen**. Nearly all the rest is nitrogen,
        which your body ignores.

        **What percentage of the air you breathe *out* do you think is oxygen?**
      `,
      min: 0, max: BREATH.oxygenIn, step: 1, start: 10, answer: BREATH.oxygenOut, tolerance: 2, unit: '%',
      explain: `
        About **${BREATH.oxygenOut}%**. You take only about a quarter of the oxygen out of each breath and
        send the rest back. (That is why a rescuer's breath can keep another person alive.)

        So each breath delivers surprisingly little. How does enough oxygen reach thirty
        trillion cells?
      `,
    },
    {
      id: 'teach-airway',
      type: 'info',
      title: 'Down the airway',
      text: `
        Follow one breath in. The airway is a tree turned upside down: one trunk that
        divides, again and again, into millions of twigs.

        Air enters through the **nose or mouth** and passes down the **throat** (pharynx),
        through the voice box (larynx), into the **windpipe** (trachea). The windpipe splits
        into two **bronchi**, one to each lung. These branch about twenty more times into
        ever finer **bronchioles**, each ending in a cluster of tiny **air sacs** (alveoli),
        like a bunch of grapes.

        Nothing is exchanged on the way down. Only in the air sacs does oxygen enter
        the blood.
      `,
      figure: photo(MEDIA.airways, {
        alt: 'The upper body seen from the front and drawn see-through, with the head turned to the side and cut open. Air spaces behind the nose lead down the throat into the windpipe, a ringed tube in the neck. In the chest it divides into two branches, one for each lung, which split into a tree of ever finer branches tipped with tiny clusters. A dome of muscle lies under the lungs. Labels name the parts.',
        caption: 'The airway, from the nose to the air sacs',
        creditLabel: 'Illustration',
      }),
    },
    {
      id: 'airway',
      type: 'order',
      review: true,
      title: 'One breath in',
      text: `
        Follow one breath in. The airway is a tree turned upside down: one trunk that
        divides, again and again, into millions of twigs.

        **Put the stops in order, from the outside world to the place where oxygen
        enters the blood.**
      `,
      items: AIRWAY,
      labels: ['Outside air', 'Into the blood'],
      explain: `
        Nose or mouth, throat, then the **windpipe** (trachea), which splits into two
        **bronchi**. These branch into ever finer **bronchioles**, each ending in a
        cluster of tiny **air sacs** (alveoli).

        Nothing is exchanged on the way down. All the business is done in the air sacs.
      `,
    },
    {
      id: 'teach-bellows',
      type: 'info',
      title: 'What moves the air?',
      text: `
        Lungs have no muscle to move themselves. They are stretchy bags in a closed box,
        the chest, whose floor is a dome of muscle: the **diaphragm**.

        - **Breathing in.** The diaphragm tightens and flattens downward, while muscles
          between the ribs lift the rib cage. The chest gets bigger, the pressure inside
          drops just below that of the air outside, and **air flows in**.
        - **Breathing out.** The muscles relax, and the lungs spring back.

        If you like, rest a hand on your belly and breathe in gently: it moves out as
        the diaphragm pushes down.
      `,
      figure: {
        type: 'body-map', view: 'torso', bounds: [90, 150, 310, 370], show: ['lungs', 'windpipe', 'bronchi', 'diaphragm', 'ribs', 'breastbone'], ghost: ['ribs', 'breastbone'],
        labels: [{ id: 'right-lung', text: 'Lungs' }, 'diaphragm', 'ribs'],
        alt: 'The chest seen from the front. The two lungs fill the rib cage, which is drawn faintly. Under the lungs a band of muscle, the diaphragm, arches across the body like the floor of the chest.',
      },
    },
    {
      id: 'bellows',
      type: 'interact',
      title: 'On an X-ray',
      text: `
        Here is a real chest. On this X-ray, air looks dark and denser tissue looks pale.
        You are facing the person: "Dx" marks their right side and "Sin" their left.

        The diaphragm is the dome of muscle that forms the floor of the chest. **Tap the diaphragm.**
      `,
      widget: photo(MEDIA['chest-xray'], {
        alt: 'An X-ray of a chest seen from the front. Two large dark areas, crossed by pale curved ribs, lie on either side of a pale column in the middle. In the lower middle a pale shape bulges towards the side marked Sin. At the bottom, each dark area ends in a curved edge above paler tissue.',
        creditLabel: 'X-ray',
        hotspots: [
          { id: 'lung', x: 0.25, y: 0.48, r: 0.08, label: 'Right lung', alt: 'the middle of the large dark area on the side marked Dx' },
          { id: 'heart', x: 0.57, y: 0.71, r: 0.08, label: 'Heart', alt: 'a pale shape in the lower middle, bulging towards the side marked Sin' },
          { id: 'diaphragm', x: 0.27, y: 0.845, r: 0.06, label: 'Diaphragm', alt: 'the curved lower edge of the dark area on the side marked Dx' },
          { id: 'collarbone', x: 0.8, y: 0.135, r: 0.05, label: 'Collarbone', alt: 'a pale bar running across the top on the side marked Sin' },
          { id: 'windpipe', x: 0.485, y: 0.16, r: 0.05, label: 'Windpipe', alt: 'a darker stripe in the middle at the top' },
        ],
      }),
      check: (s) => s.picked === 'diaphragm'
        || (s.picked === 'lung' ? 'That dark area is a lung, full of air. The diaphragm is the dome of muscle underneath the lungs.'
          : s.picked === 'heart' ? 'That pale shape is the heart, with its tip towards the person\'s left. The diaphragm lies under the heart and the lungs.'
            : s.picked === 'collarbone' ? 'That is a collarbone. The diaphragm is at the bottom of the chest, not the top.'
              : s.picked === 'windpipe' ? 'That darker stripe is the windpipe, full of air. The diaphragm is the floor of the chest.'
                : false),
      solution: { picked: 'diaphragm' },
      hints: ['It is the floor of the chest: look where the dark, air-filled lungs end.'],
      explain: `
        The curved edge under each lung is the **diaphragm**. Each time it tightens and
        flattens, the chest gets bigger and air flows in. When it relaxes, the lungs
        spring back.
      `,
    },
    {
      id: 'surface',
      type: 'info',
      title: 'Hundreds of millions of sacs',
      text: `
        A pair of adult lungs holds about **${BREATH.airSacs} million** air sacs (more in bigger lungs), each a
        fraction of a millimetre across and wrapped in **capillaries**, the finest blood vessels.
        In this thin slice of lung, the tiny red dots inside the walls are red blood cells.

        Spread out flat, their walls would cover about **${BREATH.surface} square metres**: the floor of a
        small flat, folded into your chest. (Estimates run from about 50 to over 100 square
        metres, depending on the person and on how it is measured.)

        Across the whole of that surface, air and blood are less than a thousandth of a
        millimetre apart.
      `,
      figure: photo(MEDIA['lung-tissue'], {
        alt: 'A thin slice of lung under a microscope, stained pink and purple: large pale empty spaces, separated by walls as thin as threads. Inside one of the walls lies a column of tiny red dots.',
        caption: 'A thin slice of healthy lung under a microscope',
        creditLabel: 'Micrograph',
        mode: 'label',
        hotspots: [
          { id: 'sac', x: 0.33, y: 0.43, r: 0.06, label: 'Air sac', alt: 'a large pale space' },
          { id: 'blood', x: 0.525, y: 0.46, r: 0.05, label: 'Red cells in a capillary', alt: 'a column of tiny red dots inside a wall' },
          { id: 'wall', x: 0.645, y: 0.355, r: 0.05, label: 'Thin wall', alt: 'a strand between two pale spaces' },
        ],
      }),
    },
    {
      id: 'explore-sac',
      type: 'interact',
      graded: false,
      title: 'One air sac',
      text: `
        Here is one air sac. Blood arrives from the body dark and **75% loaded** with
        oxygen, and has less than a second to fill up as it passes under the wall.
        Oxygen simply drifts from where there is more of it to where there is less: this
        is **diffusion**.

        **Try every control.** Which changes make the blood leave less than full?
      `,
      widget: { type: 'air-sac', alt: SAC_ALT },
      check: (s) => s.changed.length >= 4 || `You have tried ${s.changed.length} of the 4 controls. Try the others too${s.changed.includes('exercise') ? '' : ', including the blood-flow button'}.`,
      solution: { oxygen: 70, thickness: 4, area: 50, exercise: true },
      explain: `
        Loading slows when the air holds **less oxygen**, when the wall is **thicker**, and when
        **less surface** is working. Faster blood has less time to fill.

        Notice how much it takes to matter. Healthy lungs fill the blood in about a third of
        the time available: a large reserve.

        (A model of one sac leaves things out: real lungs must also match air flow to blood flow
        across millions of sacs, and in thin air the blood arrives less than 75% loaded.)
      `,
    },
    {
      id: 'fick',
      type: 'fill',
      review: true,
      title: 'Three things set the speed',
      text: `
        Oxygen crosses from the air sacs into the blood by diffusion, and carbon dioxide
        crosses the other way.

        **Complete the rule.** The model is here if you want to check.
      `,
      figure: { type: 'air-sac', alt: SAC_ALT },
      template: 'A gas crosses faster when the surface is [[smaller|*larger]], when the wall is [[*thinner|thicker]], and when the difference between the two sides is [[*bigger|smaller]].',
      explain: `
        **Large surface, thin wall, big difference.** Lungs are built for all three: about ${BREATH.surface}
        square metres of wall, about ${say(BREATH.wall)} micrometres thick, with breathing and blood flow
        constantly renewing the difference.

        The same rule explains the gut, the kidneys and every capillary in the body.
      `,
    },
    {
      id: 'altitude',
      type: 'interact',
      title: 'Thin air',
      text: `
        Start from healthy lungs at rest. **Change one control only, so that the blood
        leaves less than 90% loaded.**

        (A finger-clip oxygen meter reads this number. In healthy people at sea level it is
        usually 95% or more.)
      `,
      widget: { type: 'air-sac', alt: SAC_ALT },
      check: (s) => {
        const d = differs(s);
        if (!d.length) return 'These are healthy lungs at rest: 97% loaded. Change one of the controls.';
        if (d.length > 1) return `You have changed ${d.length} controls. Put all but one back to healthy.`;
        if (s.saturation < 90) return true;
        const what = { oxygen: 'With a little less oxygen in the air sac', thickness: 'Even with a much thicker wall', area: 'Even with much of the surface lost', exercise: 'Even with the blood rushing through' }[d[0]];
        const tail = d[0] === 'oxygen' ? '. Lower it further.' : d[0] === 'exercise' ? ': healthy lungs have a big reserve. Try a different control.' : ': at rest, healthy lungs have a big reserve. Try a different control.';
        return `${what}, the blood still leaves ${s.saturation}% loaded${tail}`;
      },
      solution: { oxygen: 50 },
      hints: ['Three of the controls only slow the loading down, and at rest there is time to spare.', 'One control lowers the level the blood is trying to reach.'],
      explain: `
        Only **less oxygen in the air sac** does it. A thick wall or a lost surface slows the
        loading, but at rest there is time to spare. Less oxygen in the air lowers the level the
        blood can reach at all.

        That is what happens at **high altitude**. The air is still ${BREATH.oxygenIn}% oxygen, but all of
        it is thinner. Over days and weeks the body adapts, by breathing faster and making more red cells.
      `,
    },
    {
      id: 'oxygen-used',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const out = rng.pick([16, 17]);
        const breath = rng.pick(out === 16 ? [400, 500, 600, 800, 1000, 2000] : [500, 1000, 1500, 2000]);
        const kept = BREATH.oxygenIn - out;
        const answer = (breath * kept) / 100;
        return {
          text: `
            Air goes in with **${BREATH.oxygenIn}% oxygen** and comes out with **${out}%**.
            The difference stayed in the body. (If the difference were 3%, a breath of 300 mL
            would leave 300 × 3 ÷ 100 = 9 mL behind.)

            A breath of **${grouped(breath)} mL** of air goes in and out.
            **How many millilitres of oxygen stayed in the body?**
          `,
          answer,
          unit: 'mL',
          wrong: [
            [(breath * BREATH.oxygenIn) / 100, `That is all the oxygen in the breath. Only the difference between ${BREATH.oxygenIn}% and ${out}% stayed behind.`],
            [(breath * out) / 100, 'That is the oxygen that came back out. The question asks for the part that stayed.'],
            [kept, `That is the difference in per cent. Take ${kept}% of ${grouped(breath)} mL.`],
          ],
          hints: [`The share that stayed is ${BREATH.oxygenIn}% − ${out}% = ${kept}% of the breath.`, `${kept}% of ${grouped(breath)} mL is ${grouped(breath)} × ${kept} ÷ 100.`],
          explain: `
            ${BREATH.oxygenIn}% − ${out}% = ${kept}% of the breath stayed, and ${kept}% of ${grouped(breath)} mL is **${say(answer)} mL**.
            Breath after breath, a resting adult takes up something like a quarter to a third of a
            litre of oxygen every minute.
          `,
        };
      },
    },
    {
      id: 'air-per-minute',
      type: 'numeric',
      gen: (rng) => {
        const [name] = rng.pick(PEOPLE);
        const [rate, ml] = rng.pick([[12, 500], [14, 500], [16, 500], [18, 500], [20, 400], [15, 400], [15, 600], [12, 600], [20, 500]]);
        const answer = (rate * ml) / 1000;
        return {
          text: `
            Resting in a chair, ${name} breathes **${rate} times a minute**, moving about **${ml} mL**
            of air each time.

            **How many litres of air is that in a minute?** (1 litre = 1,000 mL, so
            10 breaths of 300 mL would be 3,000 mL, or 3 litres.)
          `,
          answer,
          unit: 'litres',
          wrong: [
            [rate * ml, 'That is the answer in millilitres. Divide by 1,000 for litres.'],
            [(rate * ml) / 100, 'A litre is 1,000 mL, not 100.'],
          ],
          hints: [`${rate} breaths of ${ml} mL each: multiply.`, `${rate} × ${ml} = ${grouped(rate * ml)} mL. Now change it to litres.`],
          explain: `
            ${rate} × ${ml} mL = ${grouped(rate * ml)} mL = **${say(answer)} litres a minute**: thousands of litres a day.
            Adults at rest usually take ${BREATH.rate[0]} to ${BREATH.rate[1]} breaths a minute; children breathe faster. In
            hard exercise both the rate and the size of each breath rise several times over.
          `,
        };
      },
    },
    {
      id: 'drive',
      type: 'choice',
      mode: 'predict',
      title: 'What says "breathe"?',
      text: `
        You do not decide to take each breath, and if you stop on purpose, the urge to
        breathe soon becomes impossible to ignore.

        **What mainly creates that urge?**
      `,
      options: [
        { text: 'Oxygen running low in the blood' },
        { text: 'Carbon dioxide building up in the blood', correct: true },
        { text: 'The lungs feeling empty' },
        { text: 'Habit: the body breathes on a fixed timer' },
      ],
      explain: `
        **Carbon dioxide.** Breathing is steered mainly by the waste going out, not by
        the supply coming in. The next screen shows how.
      `,
    },
    {
      id: 'teach-drive',
      type: 'info',
      title: 'Steered by the waste',
      text: `
        Your cells make **carbon dioxide** constantly, and it turns the blood slightly
        more acidic. Sensors in the **brainstem** notice quickly and call for the next
        breath. The more carbon dioxide, the stronger the urge.

        Oxygen sensors exist too, but in healthy people they only cut in when oxygen has
        fallen a long way.

        Extra breaths add almost no oxygen, because blood leaving healthy lungs is already
        about 97% loaded. What they do is wash carbon dioxide out, and with it the signal
        that says "breathe".
      `,
      figure: {
        type: 'body-map', view: 'head',
        groups: [{ ids: ['brainstem'], color: 'orange', label: 'Brainstem: senses carbon dioxide and sets the pace of breathing' }],
        labels: ['brainstem', 'windpipe'],
        alt: 'The head and neck cut open down the middle and seen from the side. The brainstem, at the base of the brain where it joins the spinal cord, is highlighted. The windpipe runs down the front of the neck.',
      },
    },
    {
      id: 'blackout',
      type: 'choice',
      tone: 'sober',
      title: 'A warning that can be switched off',
      text: `
        Some swimmers breathe fast and deep many times before swimming a long distance
        underwater, believing that it "loads up" oxygen.

        **Why is this dangerous?**
      `,
      options: [
        { text: 'It flushes out carbon dioxide, so the urge to breathe comes too late', correct: true },
        { text: 'It fills the blood with too much oxygen', why: 'Blood leaving healthy lungs is already about 97% loaded, so over-breathing adds almost nothing.' },
        { text: 'It tires the breathing muscles', why: 'The real danger is different: the alarm that should force the swimmer to the surface is delayed.' },
      ],
      explain: `
        Over-breathing adds almost no oxygen, but it washes out carbon dioxide, the signal
        that says "breathe". Oxygen can then fall low enough to cause a blackout **before** any
        urge to breathe arrives, and a person who passes out underwater drowns silently.

        Lifesaving organisations warn against it plainly: **never over-breathe before
        swimming underwater, and never practise breath-holding in water alone.**
      `,
    },
    {
      id: 'slows',
      type: 'multi',
      review: true,
      title: 'When exchange gets harder',
      text: `
        A gas crosses faster with a **large surface**, a **thin wall** and a **big difference**
        between the two sides.

        **Which of these would make it harder for oxygen to reach the blood?** Choose all that apply.
      `,
      options: [
        { text: 'Years of smoke breaking down the walls between air sacs', correct: true },
        { text: 'Fluid collecting in the walls of the air sacs during an infection', correct: true },
        { text: 'Climbing to 4,000 metres, where the air is thinner', correct: true },
        { text: 'Breathing through the mouth instead of the nose', why: 'Both lead to the same windpipe. The nose warms, moistens and filters the air better, but the exchange surface is unchanged.' },
        { text: 'Slow, relaxed breathing while resting', why: 'At rest, slow breathing still renews the air in the sacs fast enough to keep the difference up.' },
      ],
      explain: `
        Smoke damage merges many small sacs into fewer large ones: **less surface**
        (emphysema). Fluid makes the **wall thicker** (as in pneumonia). Altitude shrinks the
        **difference**. Because lungs have a big reserve, such problems often show first as
        breathlessness during effort.

        New or unexplained breathlessness is always worth having checked, and
        **severe difficulty breathing is an emergency: call your emergency number.**
      `,
    },
    {
      id: 'airways-care',
      type: 'choice',
      title: 'The self-cleaning airway',
      text: `
        Every day you breathe in thousands of litres of air, with its dust and germs. The
        airways are lined with sticky **mucus** that traps them, and with millions of tiny
        beating hairs, the **cilia**, that sweep the mucus up to the throat to be swallowed.

        Tobacco smoke stops the cilia beating and in time destroys them. **What follows?**
      `,
      options: [
        { text: 'Mucus, dirt and germs stay in the lungs: more coughing and more infections', correct: true },
        { text: 'The airways stay cleaner, because smoke kills the germs', why: 'Smoke does not disinfect the lungs. It disables the cleaning system that removes germs.' },
        { text: 'Nothing: the air sacs clean themselves', why: 'The air sacs depend on the airways above them being swept clear.' },
      ],
      explain: `
        With the sweepers out of action, coughing is the only way left to clear the mucus:
        the "smoker's cough". Polluted air harms the same lining: the World Health Organization
        links air pollution to about 7 million early deaths a year. After someone stops smoking,
        the cilia begin to recover within months.

        In **asthma** the airways are easily irritated and tighten, causing wheezing and
        breathlessness. It is common and treatable with inhalers. (What to do in an asthma
        attack is covered in *First Aid*.)
      `,
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to notice this week',
      text: `
        An invitation: next time you are sitting quietly, count your breaths for 30 seconds
        without trying to change them, and feel what your belly and ribs are doing.

        Then notice your breathing after climbing stairs. Nobody told your lungs to speed up:
        your brainstem did it unasked, in step with your working muscles, fast enough to carry
        away the extra carbon dioxide they made.

        There is nothing to record and no right number.
      `,
    },
  ],
  recap: [
    `Air goes in with about 21% oxygen and comes out with about 16%. The **diaphragm** and ribs work the lungs like bellows.`,
    `The airway branches from the windpipe down to about ${BREATH.airSacs} million **air sacs**, where blood and air are a fraction of a micrometre apart.`,
    'Gases cross by **diffusion**: faster with a large surface, a thin wall and a big difference. Healthy lungs have a large reserve.',
    'The urge to breathe comes mainly from **rising carbon dioxide**, not falling oxygen. Never over-breathe before swimming underwater.',
  ],
  next: 'Next: the other supply line. What happens to lunch on its way from plate to bloodstream?',
};
