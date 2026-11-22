// The Body I: Fuel, Air and Blood · Lesson 3 · What Blood Carries
//
// Driving question: what is in blood that plain salty water could not do?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/body-systems/index.js';
import { BLOOD, DONATIONS, BLOOD_PARTS, CLOT_STEPS, PEOPLE, say, grouped } from '../helpers.js';
import { TYPES, canGive, clashes, antigens, showType } from '../../../../src/widgets/blood-match.js';

const SPUN = {
  type: 'svg', viewBox: '0 0 600 104', maxWidth: 600,
  content: [
    '<rect class="fill-yellow-soft stroke-ink" stroke-width="2.5" x="20" y="36" width="560" height="34" rx="10"/>',
    '<path class="fill-red stroke-ink" stroke-width="2.5" d="M331 36 H570 a10 10 0 0 1 10 10 V60 a10 10 0 0 1 -10 10 H331 Z"/>',
    '<rect class="fill-surface stroke-ink" stroke-width="2" x="326" y="36" width="5" height="34"/>',
    '<text class="fig-label" x="174" y="24" text-anchor="middle">Plasma: about 55%</text>',
    '<text class="fig-label" x="456" y="24" text-anchor="middle">Red cells: about 45%</text>',
    '<path class="stroke-ink fill-none" stroke-width="2" d="M328.5 72 V84"/>',
    '<text class="fig-label-sm" x="328" y="98" text-anchor="middle">White cells and platelets: under 1%</text>',
  ].join(''),
  alt: 'A bar showing what a sample of blood separates into: a pale yellow liquid, plasma, about 55 per cent; a very thin pale layer of white cells and platelets, under 1 per cent; and red cells, about 45 per cent.',
};

// The same sample as SPUN, drawn as the tube it settles in (narrow, so that the labels stay readable on a phone).
const TUBE = {
  type: 'svg', viewBox: '0 0 340 232', maxWidth: 420,
  content: [
    '<rect class="fill-yellow-soft" x="40" y="14" width="70" height="112"/>',
    '<rect class="fill-surface" x="40" y="124" width="70" height="6"/>',
    '<path class="fill-red" d="M40 130 V185 a35 35 0 0 0 70 0 V130 Z"/>',
    '<path class="stroke-ink fill-none" stroke-width="2.5" stroke-linecap="round" d="M40 8 V185 a35 35 0 0 0 70 0 V8"/>',
    '<path class="stroke-ink fill-none" stroke-width="2" d="M112 70 H126 M112 127 H126 M112 176 H126"/>',
    '<text class="fig-label" x="132" y="66">Plasma:</text>',
    '<text class="fig-label" x="132" y="84">about 55%</text>',
    '<text class="fig-label" x="132" y="123">White cells and platelets:</text>',
    '<text class="fig-label" x="132" y="141">under 1%</text>',
    '<text class="fig-label" x="132" y="172">Red cells:</text>',
    '<text class="fig-label" x="132" y="190">about 45%</text>',
  ].join(''),
  alt: 'A tube of blood that has settled into layers. On top, a pale yellow liquid, plasma, about 55 per cent. Under it, a very thin pale layer of white cells and platelets, under 1 per cent. At the bottom, packed red cells, about 45 per cent.',
};

// A cut vessel being sealed: the plug of platelets in the gap, the mesh of fibrin over it, red cells caught in the mesh.
const CLOT = {
  type: 'svg', viewBox: '0 0 360 222', maxWidth: 460,
  content: [
    // the blood inside the vessel
    '<rect class="fill-red-soft" x="10" y="102" width="340" height="86"/>',
    // red cells in the stream
    '<g class="fill-red stroke-ink" stroke-width="1.5"><ellipse cx="48" cy="150" rx="13" ry="7"/><ellipse cx="92" cy="128" rx="13" ry="7"/><ellipse cx="292" cy="146" rx="13" ry="7"/><ellipse cx="326" cy="168" rx="13" ry="7"/><ellipse cx="110" cy="172" rx="13" ry="7"/><ellipse cx="258" cy="170" rx="13" ry="7"/></g>',
    // the vessel wall, with a gap in its upper side
    '<path class="stroke-ink fill-none" stroke-width="8" stroke-linecap="round" d="M12 100 H126 M234 100 H348 M12 190 H348"/>',
    // platelets filling the gap
    '<g class="fill-yellow stroke-ink" stroke-width="1.5"><circle cx="140" cy="100" r="10"/><circle cx="160" cy="100" r="10"/><circle cx="180" cy="100" r="10"/><circle cx="200" cy="100" r="10"/><circle cx="220" cy="100" r="10"/><circle cx="150" cy="84" r="10"/><circle cx="170" cy="84" r="10"/><circle cx="190" cy="84" r="10"/><circle cx="210" cy="84" r="10"/><circle cx="150" cy="116" r="10"/><circle cx="170" cy="116" r="10"/><circle cx="190" cy="116" r="10"/><circle cx="210" cy="116" r="10"/><circle cx="170" cy="68" r="10"/><circle cx="190" cy="68" r="10"/></g>',
    // two red cells caught at the inner side of the plug
    '<g class="fill-red stroke-ink" stroke-width="1.5"><ellipse cx="158" cy="138" rx="13" ry="7"/><ellipse cx="204" cy="140" rx="13" ry="7"/></g>',
    // threads of fibrin over the plug and the caught cells
    '<path class="stroke-ink fill-none" stroke-width="1.5" stroke-linecap="round" d="M122 58 L238 150 M238 58 L122 150 M118 92 H242 M118 124 H242 M152 50 L212 154 M212 50 L152 154 M180 48 V156"/>',
    // labels
    '<path class="stroke-ink fill-none" stroke-width="2" d="M84 36 L146 78 M272 36 L232 62 M60 204 V195 M252 204 L212 148"/>',
    '<text class="fig-label" x="70" y="28" text-anchor="middle">Platelet plug</text>',
    '<text class="fig-label" x="286" y="28" text-anchor="middle">Fibrin threads</text>',
    '<text class="fig-label" x="60" y="218" text-anchor="middle">Vessel wall</text>',
    '<text class="fig-label" x="264" y="218" text-anchor="middle">Trapped red cells</text>',
  ].join(''),
  alt: 'A blood vessel cut open along its length, with a gap in its upper wall. The gap is filled by a cluster of small round platelets. A mesh of fine threads, fibrin, lies over the cluster, and two red cells are caught in the mesh. Other red cells drift past inside the vessel.',
};

const CLOT_NOTES = [', which slows the leak.', ': a soft plug.', '. The threads form from proteins in the plasma.', '.'];

const MARKER_NAME = { A: 'A marker', B: 'B marker', D: 'D marker' };

export default {
  id: 'blood',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Spin it',
      text: `
        An adult has about **${BLOOD.volume} litres** of blood. Kept from clotting and left to stand
        in a tube, or spun fast in a machine, it separates into layers: a clear, pale yellow liquid on top and
        packed cells below.

        **How much of your blood do you think is liquid?**
      `,
      min: 0, max: 100, step: 5, start: 50, answer: BLOOD.plasmaShare, tolerance: 10, unit: '%',
      explain: `
        A little over half: about **${BLOOD.plasmaShare}%**. The liquid is **plasma**, which is mostly water.
        Nearly all the rest is red cells.

        So blood is a thick crowd of cells in a salty liquid. What can it do that salty
        water alone could not?
      `,
    },
    {
      id: 'teach-parts',
      type: 'info',
      title: 'Four parts, four jobs',
      text: [
        'The layers in the tube hold the four parts of blood.',
        '',
        '| Part | Main job |',
        '|---|---|',
        ...BLOOD_PARTS.map((p) => `| **${p.part}** | ${p.job} |`),
        '',
        'Plasma is mostly water. The other three are cells or pieces of cells, all made in the **bone marrow**, the soft tissue inside your bones.',
        '',
        'Under a microscope a red cell is a disc with a dimple in the middle, and a white cell is a ball. A platelet is only a fragment, smaller than either cell.',
      ].join('\n'),
      figure: TUBE,
    },
    {
      id: 'parts',
      type: 'match',
      review: true,
      title: 'Four parts, four jobs',
      text: `
        Blood has four parts. Three of them are cells or pieces of cells, all made in the
        **bone marrow**, the soft tissue inside your bones.

        **Match each part to its main job.**
      `,
      figure: SPUN,
      pairs: BLOOD_PARTS.map((p) => [p.part, p.job]),
      explain: `
        **Plasma** is the river: water carrying fuel, salts, hormones, wastes and heat.
        **Red cells** carry oxygen. **White cells** are the defence force (their story is in
        *The Body II*). **Platelets**, fragments smaller than a cell, are the repair crew.
      `,
    },
    {
      id: 'cells-photo',
      type: 'interact',
      title: 'Face to face',
      text: `
        Here are three of the four parts of blood, side by side, enlarged several thousand
        times under an electron microscope. (The colours were added afterwards.)

        **Tap the platelet.**
      `,
      widget: photo(MEDIA['blood-cells-sem'], {
        alt: 'Three objects seen under an electron microscope: a smooth disc with a dimple in its middle, a smaller spiky object with several arms, and a round ball covered in small knobs.',
        caption: 'Scanning electron micrograph, with colours added',
        creditLabel: 'Image',
        maxWidth: 440,
        hotspots: [
          { id: 'red', x: 0.27, y: 0.56, r: 0.17, label: 'Red blood cell', alt: 'a smooth disc with a dimple in the middle' },
          { id: 'platelet', x: 0.63, y: 0.7, r: 0.11, label: 'Platelet', alt: 'a small spiky object with several arms' },
          { id: 'white', x: 0.8, y: 0.29, r: 0.16, label: 'White blood cell', alt: 'a round ball covered in small knobs' },
        ],
      }),
      check: (s) => s.picked === 'platelet'
        || (s.picked === 'red' ? 'That dimpled disc is a red blood cell. A platelet is smaller: a fragment, not a whole cell.'
          : s.picked === 'white' ? 'That knobbly ball is a white blood cell. A platelet is smaller than either cell.'
            : false),
      solution: { picked: 'platelet' },
      hints: ['A platelet is a fragment, smaller than a cell.'],
      explain: `
        The small spiky one. A resting platelet is a smooth little disc; this one has been
        switched on, and has thrown out arms that grip other platelets and the edges of a wound.

        The dimpled disc is a red cell: its shape gives it a large surface for oxygen to cross.
        The knobbly ball is a white cell.
      `,
    },
    {
      id: 'oxygen-carrier',
      type: 'choice',
      mode: 'predict',
      title: 'Why bother with red cells?',
      text: `
        Oxygen does dissolve in watery liquids, but poorly: a litre of plasma on its own
        can hold only about **${BLOOD.oxygenDissolved} mL** of oxygen gas.

        **How much oxygen do you think a litre of whole blood carries away from the lungs?**
      `,
      shuffle: false,
      options: [
        { text: `About ${BLOOD.oxygenDissolved} mL: the same` },
        { text: 'About 6 mL' },
        { text: 'About 30 mL' },
        { text: `About ${BLOOD.oxygenPerLitre} mL`, correct: true },
      ],
      explain: `
        About **${BLOOD.oxygenPerLitre} mL**: some seventy times as much. The difference is
        **haemoglobin**, the red protein that fills the red cells.

        Without it, your heart would have to pump seventy times as much liquid.
      `,
    },
    {
      id: 'teach-haemoglobin',
      type: 'info',
      title: 'A cell stripped for cargo',
      text: `
        **Haemoglobin** is a protein built round atoms of **iron**. Each molecule can hold
        four molecules of oxygen, and every red cell is packed with about ${BLOOD.haemPerCell} million of them.

        A red cell is little more than a flexible bag of haemoglobin.

        - It is made in the **bone marrow**: about ${BLOOD.redPerSecond} million new ones every second.
        - As it matures it throws out its own **nucleus**, the control centre of a cell, to make room.
        - Without a nucleus it cannot repair itself, so it wears out after about **${BLOOD.redLife} days**.
        - It is then broken down, and its iron is recycled into new cells.
      `,
      figure: photo(MEDIA['blood-cells-sem'], {
        alt: 'Three objects seen under an electron microscope. On the left a red blood cell: a smooth disc with a dimple in its middle. In the middle a platelet: a smaller spiky object. On the right a white blood cell: a round ball covered in small knobs.',
        caption: 'Left to right: a red cell, a platelet and a white cell (colours added)',
        creditLabel: 'Image',
        maxWidth: 400,
      }),
    },
    {
      id: 'red-cells',
      type: 'fill',
      review: true,
      title: 'A cell stripped for cargo',
      text: `
        A red cell is little more than a flexible bag of haemoglobin. As it matures it
        even throws out its own control centre to make room.

        **Complete the description.**
      `,
      template: `Red cells are made in the [[liver|*bone marrow|heart]]. A mature red cell has no [[*nucleus|outer skin|haemoglobin]]. It wears out after about [[12|*120|1,200]] days, and its haemoglobin needs the metal [[calcium|sodium|*iron]] to hold oxygen.`,
      explain: `
        Made in the **bone marrow**, about ${BLOOD.redPerSecond} million every second. No **nucleus**, so a red
        cell cannot repair itself, and after about **${BLOOD.redLife} days** it is broken down and its
        **iron** is recycled into new cells.
      `,
    },
    {
      id: 'donation-share',
      type: 'numeric',
      gen: (rng) => {
        const d = rng.pick(DONATIONS);
        const [name, their] = rng.pick(PEOPLE);
        const total = d.litres * 1000;
        const answer = Math.round((d.ml / total) * 100);
        return {
          text: `
            Giving blood is safe for a healthy adult because the body soon replaces what is taken.
            How big a share is taken? Divide the part by the whole: 300 mL out of 6,000 mL would be
            300 ÷ 6,000 = 0.05, which is 5%.

            ${name} has about **${say(d.litres)} litres** of blood and donates **${d.ml} mL**.
            **What percentage of ${their} blood is that?** (1 litre = 1,000 mL)
          `,
          answer,
          unit: '%',
          wrong: [
            [Math.round((total / d.ml) * 10) / 10, `That is how many donations would fit into ${their} blood. For a percentage, divide the part by the whole: ${d.ml} ÷ ${grouped(total)}.`],
            [d.ml / d.litres, 'Change the litres into millilitres first, so that both amounts are in the same unit.'],
          ],
          hints: [`${say(d.litres)} litres is ${grouped(total)} mL.`, `${d.ml} ÷ ${grouped(total)} = ${say(d.ml / total, 3)}. Multiply by 100 for a percentage.`],
          explain: `
            ${d.ml} ÷ ${grouped(total)} = ${say(d.ml / total, 3)}, which is **${answer}%**: under a tenth. The plasma is replaced
            within a day or two, the red cells over several weeks. That is why blood services set a
            minimum gap between donations (the length differs from country to country).
          `,
        };
      },
    },
    {
      id: 'anaemia',
      type: 'choice',
      title: 'Too little haemoglobin',
      text: `
        In **anaemia** the blood has too little haemoglobin. A person with anaemia often
        feels tired, and gets out of breath on the stairs although their lungs are
        perfectly healthy.

        **Why?**
      `,
      options: [
        { text: 'Each litre of blood delivers less oxygen to the muscles', correct: true },
        { text: 'The blood has become too thin to flow properly', why: 'It still flows well. The problem is its cargo: less haemoglobin means less oxygen in every litre.' },
        { text: 'The lungs can no longer take in enough air', why: 'The lungs are working normally. There are simply fewer carriers to load.' },
        { text: 'There are too few white cells', why: 'White cells fight infection. Anaemia is about haemoglobin, the oxygen carrier.' },
      ],
      explain: `
        Less haemoglobin means less oxygen per litre, so the heart and lungs must work harder
        for the same delivery. The commonest cause worldwide is a **shortage of iron**; others
        include too little vitamin B12 or folate, blood loss, long illness and inherited conditions.

        The World Health Organization estimates that anaemia affects about 30% of women aged 15 to 49.
        A simple blood test finds it. The right treatment depends on the cause, so it is something
        to raise with a doctor, not to guess at or to treat on your own with iron tablets.
      `,
    },
    {
      id: 'co',
      type: 'choice',
      tone: 'sober',
      title: 'The haemoglobin thief',
      text: `
        **Carbon monoxide** is a gas with no smell and no colour, given off when fuel burns
        badly: a faulty boiler or heater, an engine in a closed space, a fire. Haemoglobin
        grips it more than ${BLOOD.coAffinity} times as tightly as it grips oxygen.

        **What does that do to someone breathing a little of it?**
      `,
      options: [
        { text: 'It takes the places on haemoglobin, so the blood carries less and less oxygen', correct: true },
        { text: 'Nothing much: there is far more oxygen than carbon monoxide in the air', why: `Because haemoglobin holds it more than ${BLOOD.coAffinity} times as tightly, even a small amount in the air ends up occupying a large share of the haemoglobin.` },
        { text: 'It blocks the airways, so the person notices at once', why: 'Breathing feels normal, which is the danger: nothing warns the person.' },
      ],
      explain: `
        The gas occupies the places meant for oxygen and lets go only slowly. The lungs
        work, the heart works, and the blood arrives at the tissues short of oxygen.

        Warning signs are headache, dizziness, nausea and sleepiness, especially when several
        people in one building feel ill and feel better outdoors. **Get everyone into fresh air
        and call your emergency number.** A carbon monoxide alarm is the reliable protection.
      `,
    },
    {
      id: 'teach-clot',
      type: 'info',
      title: 'The repair crew',
      text: [
        'A system under pressure needs a way to seal leaks. When you cut a finger, the bleeding stops by itself within minutes, in four moves.',
        '',
        ...CLOT_STEPS.map((step, i) => `${i + 1}. ${step}${CLOT_NOTES[i]}`),
        '',
        'On the skin the clot dries to a scab, and new cells grow underneath.',
      ].join('\n'),
      figure: CLOT,
    },
    {
      id: 'clot',
      type: 'order',
      title: 'Sealing a cut',
      text: `
        A small vessel in a finger has just been cut.

        **Put the steps that seal it in order.**
      `,
      items: CLOT_STEPS,
      labels: ['First', 'Last'],
      explain: `
        The vessel tightens, **platelets** pile into the gap, and threads of **fibrin**
        bind the plug into a clot. Each move prepares the next.

        Platelets last only about a week, so the marrow makes them constantly.
      `,
    },
    {
      id: 'groups-explore',
      type: 'interact',
      graded: false,
      title: 'Not all blood mixes',
      text: `
        Red cells carry **markers**. Group A has marker A, group B has B, group AB has both and
        group O has neither. The **+** or **−** says whether they also carry a marker called
        **D** (the Rh factor). Your plasma holds **antibodies** against the A or B marker you
        do *not* have.

        This patient is group B+. **Try donors until you have found one that clashes and
        two that are safe.**
      `,
      widget: { type: 'blood-match', mode: 'pair', donor: 'A+', recipient: 'B+', lockRecipient: true, alt: 'A donor red cell with its markers on the left and a group B positive patient with anti-A antibodies on the right. Eight buttons choose the donor\'s blood group.' },
      check: (s) => {
        if (s.triedClash >= 1 && s.triedSafe >= 2) return true;
        if (s.triedSafe === 0) return 'So far every donor has clashed. Look for a donor whose cells carry no marker the patient lacks.';
        if (s.triedSafe === 1) return 'One safe donor found. There are more: try another group.';
        return 'Now find a donor that would clash, and read why.';
      },
      solution: { tried: [{ donor: 'A+', recipient: 'B+' }, { donor: 'B+', recipient: 'B+' }, { donor: 'O-', recipient: 'B+' }], donor: 'O-' },
      explain: `
        A group B+ patient has **anti-A** antibodies. Any donor cell with an A marker (groups A
        and AB) is attacked: the antibodies stick the cells into clumps that block small
        vessels. Donors of group B or O carry nothing this patient's blood objects to.
      `,
    },
    {
      id: 'rule',
      type: 'info',
      title: 'The rule',
      text: `
        For a transfusion of red cells, one rule covers all eight groups:

        :::key
        The donor's cells must carry **no marker that the patient lacks**.
        :::

        Group **O−** cells carry none of the three markers, so they can be given to anyone:
        the "universal donor". Group **AB+** people have all three markers and can receive
        any group.

        Blood groups were discovered by Karl Landsteiner in 1901. Before that, transfusions
        often killed. Today a hospital also checks that the patient's and the donor's blood
        are compatible before every transfusion.
      `,
    },
    {
      id: 'who-can-give',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const recipient = rng.pick(TYPES.filter((t) => t !== 'AB+'));
        const safe = TYPES.filter((t) => canGive(t, recipient));
        const lacks = ['A', 'B', 'D'].filter((m) => !antigens(recipient).includes(m));
        return {
          text: `
            A patient with blood group **${showType(recipient)}** needs red cells.

            **Select every donor group that would be safe.** The rule: the donor's cells must
            carry no marker (A, B or D) that the patient lacks. A **+** means the D marker is present.
          `,
          widget: { type: 'blood-match', mode: 'donors', recipient, alt: `Eight red cells, one for each blood group, with their markers, and a patient of group ${showType(recipient)} with the antibodies in their plasma. Buttons select donor groups.` },
          check: (s) => {
            if (!s.count) return 'Select at least one donor group.';
            if (s.unsafe.length) {
              const bad = s.unsafe[0];
              const marks = clashes(bad, recipient).map((m) => MARKER_NAME[m]).join(' and the ');
              return `Group ${showType(bad)} cells carry the ${marks}, which a group ${showType(recipient)} patient does not have.`;
            }
            if (s.missed.length) return `Everything you chose is safe, but ${s.missed.length === 1 ? 'one more group' : `${s.missed.length} more groups`} would be safe too. Check each cell for markers the patient lacks.`;
            return true;
          },
          solution: { selected: safe },
          hints: [`A group ${showType(recipient)} patient lacks: ${lacks.map((m) => `the ${MARKER_NAME[m]}`).join(', ')}.`, 'Group O− cells carry no marker at all, so they are always on the list.'],
          explain: `
            Group ${showType(recipient)} lacks ${lacks.map((m) => `the ${MARKER_NAME[m]}`).join(' and ')}, so every donor carrying ${lacks.length > 1 ? 'any of those' : 'it'} is ruled out.
            That leaves **${safe.map(showType).join(', ')}**.
          `,
        };
      },
    },
    {
      id: 'can-give',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const recipient = rng.pick(TYPES.filter((t) => TYPES.filter((d) => !canGive(d, t)).length >= 3));
        const good = rng.pick(TYPES.filter((d) => canGive(d, recipient)));
        const bad = rng.sample(TYPES.filter((d) => !canGive(d, recipient)), 3);
        return {
          text: `
            A patient with blood group **${showType(recipient)}** needs red cells urgently. The hospital
            fridge holds four units.

            **Which one can be given?**
          `,
          options: rng.shuffle([
            { text: `Group ${showType(good)}`, correct: true },
            ...bad.map((d) => ({ text: `Group ${showType(d)}`, why: `Group ${showType(d)} cells carry the ${clashes(d, recipient).map((m) => MARKER_NAME[m]).join(' and the ')}, which a group ${showType(recipient)} patient lacks.` })),
          ]),
          shuffle: false,
          hints: ['The donor\'s cells must carry no marker (A, B or D) that the patient lacks.'],
          explain: `
            Group ${showType(good)} cells carry ${antigens(good).length ? `only the ${antigens(good).map((m) => MARKER_NAME[m]).join(' and the ')}, which the patient has too` : 'none of the three markers'}.
            Each of the other three has at least one marker that a group ${showType(recipient)} patient lacks.
          `,
        };
      },
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to find out',
      text: `
        An invitation, if you are curious: many people do not know their own blood group.
        It may be written in old medical papers, and a blood donor service tells every donor theirs.

        Donated blood cannot be manufactured, and a unit of red cells keeps for only a few
        weeks. If you ever think about giving, your national blood service explains who can
        donate: the rules differ between countries.

        :::note
        This lesson covered red-cell transfusion only. Plasma follows the opposite rule, and
        there are many rarer blood groups besides A, B and D.
        :::
      `,
    },
  ],
  recap: [
    `Blood is about **55% plasma** (mostly water, carrying fuel, salts, wastes and heat) and about 45% red cells, with under 1% white cells and platelets.`,
    '**Haemoglobin**, an iron-containing protein in red cells, lets blood carry about seventy times more oxygen than plasma could. Too little of it is **anaemia**.',
    'Red cells are made in the bone marrow, have no nucleus and last about **120 days**. Platelets and fibrin seal leaks.',
    'Red cells carry markers A, B and D. A donor\'s cells must carry **no marker the patient lacks**: O− can be given to anyone.',
  ],
  next: 'Next: where the oxygen gets on board. Follow one breath down to an air sac.',
};
