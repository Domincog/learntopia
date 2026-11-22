// The Modern World: 1750 to Today · Lesson 5 · A World in Flames
//
// The whole lesson is tone: 'sober' (plain feedback, no cheering). The steps on the Holocaust and
// on the atomic bombings go further: text, a timeline, a photograph of a memorial, and a
// reflection. Nothing about them is generated, and they are in no quiz pool. One fixed, plain
// question near the end ('holocaust-remember', added in review) asks what the Holocaust was, so
// that its central facts come back in spaced review; to keep the lesson at four review cards,
// the 'road' step is no longer one.
import { PLACES, pic, marker, inOrder, timelineEvents, whichFirst, markerQuiz, pinCheck } from '../helpers.js';

// The greatest extent of Axis control, 1942, on today's borders (so only roughly).
const AXIS_EUROPE = ['DE', 'AT', 'IT', 'FR', 'BE', 'NL', 'LU', 'DK', 'NO', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'RS', 'BA', 'SI', 'ME', 'MK', 'AL', 'XK', 'GR', 'FI', 'EE', 'LV', 'LT', 'BY', 'UA', 'MD', 'LY', 'TN'];
const AXIS_ASIA = ['JP', 'KR', 'KP', 'TW', 'VN', 'LA', 'KH', 'TH', 'MM', 'MY', 'SG', 'BN', 'ID', 'PH', 'TL'];
const OCCUPIED_RUSSIA = [[28, 59.8], [31, 60.1], [34, 57.5], [36.5, 55.8], [38.5, 52.5], [40, 50.5], [44.4, 49], [46, 47], [45, 44.5], [43, 43.4], [40, 43.6], [37, 45.2], [38.3, 47.1], [40, 49.5], [35.5, 50.4], [34, 52.3], [31.5, 53.1], [31, 55], [28.3, 56], [27.6, 57.6]];
// Crimea, occupied in 1941 and 1942. (The map data draws it apart from Ukraine, so it needs its own patch.)
const OCCUPIED_CRIMEA = [[33.6, 46.15], [35.0, 46.1], [36.6, 45.45], [35.4, 44.95], [33.7, 44.4], [32.5, 45.35]];
const OCCUPIED_CHINA = [[117, 40], [122, 40], [131, 43], [135, 48], [127, 53], [120, 52], [116, 47], [112, 42], [112, 38], [114, 33], [112, 30], [113, 23], [117, 23.6], [121, 29], [122, 32], [119, 35], [122, 37], [117.8, 39]];
const WAR_VIEW = [-15, -14, -150, 66];
const AXIS_LAYERS = {
  regions: [
    { ids: AXIS_EUROPE, color: 'red', label: 'Germany, Italy, their allies and conquests, 1942' },
    { ids: AXIS_ASIA, color: 'orange', label: 'Japan and its conquests, 1942' },
  ],
  areas: [
    { polygon: OCCUPIED_RUSSIA, color: 'red', outline: false },
    { polygon: OCCUPIED_CRIMEA, color: 'red', outline: false },
    { polygon: OCCUPIED_CHINA, color: 'orange', outline: false },
  ],
};

const TURNING = [
  { id: 'stalingrad', clue: 'Stalingrad, where a whole German army was surrounded in the winter of 1942 to 1943', where: 'the great river that flows south through Russia to the Caspian Sea', more: 'After Stalingrad the Soviet army advanced, with terrible losses, all the way to Berlin.' },
  { id: 'midway', clue: 'Midway, where the American navy sank four Japanese aircraft carriers in June 1942', where: 'the middle of the North Pacific, between Asia and America', more: 'Six months after Pearl Harbor, Japan lost the core of its fleet in one day and never recovered the initiative.' },
  { id: 'elAlamein', clue: 'El Alamein, where British and Commonwealth forces stopped the Axis advance on the Suez Canal in 1942', where: 'the coast of Egypt, west of the Nile delta', more: 'Victory in the desert kept the canal and the oil of the Middle East out of Axis hands.' },
  { id: 'normandy', clue: 'Normandy, where the Allies landed on D-Day, 6 June 1944', where: 'the north coast of France, across the Channel from England', more: 'About 156,000 American, British and Canadian troops landed on the first day, opening a second front in the west.' },
  { id: 'pearlHarbor', clue: 'Pearl Harbor, the American base attacked by Japan in December 1941', where: 'the islands of Hawaii, far out in the Pacific', more: 'The attack brought the United States, the world\'s largest industrial economy, into the war.' },
];

// The six steps of the "road to war" order step; the timeline that teaches them uses the same list.
const ROAD = ['manchuria', 'hitlerChancellor', 'ethiopiaInvaded', 'chinaWar', 'munich', 'polandInvaded'];
// The turning points in the order in which they happened, for the screen that teaches them.
const TURNING_IN_ORDER = ['pearlHarbor', 'midway', 'elAlamein', 'stalingrad', 'normandy'].map((id) => TURNING.find((t) => t.id === id));

export default {
  id: 'second-world-war',
  tone: 'sober',          // war, the Holocaust and the atomic bombings: plain feedback throughout, no cheering
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Three years',
      text: `
        Germany, 1928. Ten years after the First World War the economy has recovered. In that
        year's election a small, violent party led by Adolf Hitler wins **2.6%** of the vote.

        Then, in 1929, the world economy collapses. **What share of the vote do you think the
        Nazi party won in July 1932?**
      `,
      min: 0, max: 80, step: 1, start: 3, answer: 37, tolerance: 7, unit: '%',
      explain: `
        **37%**: from a fringe group to Germany's largest party in four years. In
        January 1933 Hitler was made chancellor. Within months Germany was a dictatorship.

        This lesson asks **how the world slid into a second, far deadlier war only twenty years
        after the first**, and what the survivors built to prevent a third.
      `,
    },
    {
      id: 'crash',
      type: 'info',
      title: 'Depression and dictators',
      text: `
        After the **Wall Street crash** of 1929, banks failed, world trade shrank by about two-thirds
        and factories closed everywhere. In Germany the number of unemployed rose from
        1.4 million (1928) to nearly 6 million (1932).

        Desperate people turned to leaders who promised order, jobs and national glory, and who
        blamed minorities and foreigners. **Fascists** already ruled Italy under Mussolini. In
        Germany the **Nazis** added a murderous racism, aimed above all at Jews. In Japan,
        army officers pushed the government towards conquest.
      `,
      figure: {
        type: 'bars',
        data: [
          { label: '1928', value: 2.6, color: 'gray' },
          { label: '1930', value: 18.3, color: 'gray' },
          { label: 'July 1932', value: 37.3, color: 'red' },
        ],
        yMax: 50, yStep: 10, yLabel: '% of the vote', unit: '%',
        alt: 'Bar chart of the Nazi party\'s share of the vote in German national elections: 2.6% in 1928, 18.3% in 1930 and 37.3% in July 1932.',
        caption: 'Nazi share of the vote in German national elections',
      },
    },
    {
      id: 'teach-road',
      type: 'info',
      title: 'The road to war',
      text: `
        The dictators tested the world step by step. The League of Nations protested at each
        invasion, and stopped none of them.

        - **Asia.** Japan seized Manchuria in 1931, and in 1937 began a full-scale war in China.
        - **Africa.** Italy invaded Ethiopia in 1935.
        - **Europe.** Hitler became chancellor in 1933. At Munich in 1938 Britain and France
          let him take part of Czechoslovakia, hoping he would stop: a policy called
          **appeasement**. He did not. In August 1939 he made a pact with the Soviet leader
          Stalin, and on 1 September 1939 he invaded Poland.
      `,
      figure: {
        type: 'timeline', from: 1928, to: 1940, step: 2, showYears: true, mode: 'static',
        events: timelineEvents(['wallStreet', ...ROAD], {
          wallStreet: { label: 'Wall Street crash', short: 'Crash', color: 'gray' },
          manchuria: { label: 'Japan seizes Manchuria', short: 'Manchuria' },
          hitlerChancellor: { label: 'Hitler chancellor', short: 'Hitler' },
          ethiopiaInvaded: { label: 'Italy invades Ethiopia', short: 'Ethiopia' },
          chinaWar: { label: 'Japan\'s war in China', short: 'China' },
          munich: { label: 'Munich', short: 'Munich' },
          polandInvaded: { label: 'Germany invades Poland', short: 'Poland', color: 'red' },
        }),
        alt: 'A timeline from 1928 to 1940: the Wall Street crash in 1929, Japan seizes Manchuria in 1931, Hitler becomes chancellor in 1933, Italy invades Ethiopia in 1935, Japan begins full-scale war in China in 1937, the Munich Agreement in 1938 and Germany invades Poland in 1939.',
      },
    },
    {
      id: 'road',
      type: 'order',
      title: 'Step by step',
      text: `
        The League of Nations protested at each invasion, and stopped none of them.
        **Put the steps in order, earliest first.**
      `,
      items: inOrder(ROAD),
      labels: ['1931', '1939'],
      explain: `
        The war began in **Asia**: Japan took Manchuria in 1931 and invaded the rest of China
        in 1937, killing civilians in vast numbers in cities such as Nanjing.

        In Europe each unopposed step was followed by another, until the invasion of Poland on
        **1 September 1939**.
      `,
    },
    {
      id: 'reach',
      type: 'info',
      title: 'The war\'s reach',
      text: `
        By 1942 [Germany and its allies]{.red} held Europe from the Atlantic to the gates of
        Moscow, and [Japan]{.orange} held East and Southeast Asia and half the Pacific.

        Against them stood the **Allies**: Britain and its empire, the Soviet Union (invaded in
        June 1941), the United States (attacked in December 1941), China, and many more. Two and
        a half million Indians volunteered. The fighting reached North Africa, the Arctic and
        every ocean.

        The shading follows today's borders, so it is approximate.
      `,
      figure: {
        type: 'world-map', view: WAR_VIEW, ...AXIS_LAYERS,
        markers: TURNING.map((t) => marker(t.id, { color: 'ink', size: 's' })),
        alt: 'A map from western Europe across Asia to Hawaii, showing the greatest extent of Axis control in 1942. Most of Europe, western Russia, Libya and Tunisia are shaded for Germany, Italy and their allies. Japan, Korea, eastern China, Southeast Asia and Indonesia are shaded for Japan. Markers show Normandy, El Alamein, Stalingrad, Midway and Pearl Harbor.',
      },
    },
    {
      id: 'stalingrad',
      type: 'interact',
      title: 'The Eastern Front',
      text: `
        In June 1941 Hitler sent three million soldiers into the Soviet Union, the largest
        invasion in history. They were stopped outside Moscow. In 1942 they drove south-east,
        towards the oilfields, and reached a city on the **Volga**, 900 km from Moscow.

        **Place the pin on Stalingrad.** Anywhere within 400 km counts.
      `,
      widget: {
        type: 'world-map', view: [18, 40, 62, 62], mode: 'place', rivers: ['Volga'],
        markers: [marker('moscow', { color: 'ink' })],
        labels: [{ at: [34.5, 43.3], text: 'Black Sea', style: 'water' }, { at: [50.5, 42], text: 'Caspian Sea', style: 'water' }],
        pin: { label: 'Stalingrad', color: 'red', start: [24, 58.5] }, target: marker('stalingrad').at,
        alt: 'A map of eastern Europe and western Russia without country names. Moscow is marked. The Volga river is drawn, flowing east and then south to the Caspian Sea. The Black Sea is in the south-west.',
      },
      check: pinCheck('stalingrad', 400),
      solution: { pin: [44.5, 48.7] },
      hints: ['Follow the Volga downstream from the region of Moscow. Where it bends towards the Caspian Sea, it comes closest to the Black Sea.'],
      explain: `
        Stalingrad (now Volgograd) was fought for street by street for five months. In February
        1943 the surrounded German army surrendered. It was the turning point of the war in Europe.

        The Soviet Union carried the largest share of the fighting and the dying: about
        **24 to 27 million** of its people were killed, most of them civilians, and roughly four
        out of five German soldiers who died in the war fell on the Eastern Front.
      `,
    },
    {
      id: 'teach-turning',
      type: 'info',
      title: 'Where the war turned',
      text: `
        In 1942 the Axis reached its limit. Five places mark how the war turned:

        ${TURNING_IN_ORDER.map((t) => `- **${PLACES[t.id].name}**${t.clue.slice(PLACES[t.id].name.length)}.`).join('\n        ')}

        Germany surrendered in May 1945.
      `,
      figure: {
        type: 'timeline', from: 1939, to: 1946, step: 1, showYears: true, mode: 'static',
        events: timelineEvents(['polandInvaded', 'pearlHarbor', 'midway', 'stalingradEnds', 'dDay', 'germanySurrenders'], {
          polandInvaded: { label: 'Poland invaded', short: 'Poland', color: 'gray' },
          pearlHarbor: { label: 'Pearl Harbor', short: 'Pearl Harbor' },
          midway: { label: 'Midway; El Alamein', short: 'Midway' },
          stalingradEnds: { label: 'Stalingrad', short: 'Stalingrad' },
          dDay: { label: 'D-Day, Normandy', short: 'D-Day' },
          germanySurrenders: { label: 'Germany surrenders', short: 'Surrender', color: 'gray' },
        }),
        alt: 'A timeline from 1939 to 1946: Germany invades Poland in 1939, Japan attacks Pearl Harbor in 1941, the battles of Midway and El Alamein in 1942, the German surrender at Stalingrad in 1943, the D-Day landings in Normandy in 1944 and Germany\'s surrender in 1945.',
      },
    },
    {
      id: 'turning-points',
      type: 'interact',
      review: true,
      gen: (rng) => markerQuiz(rng, {
        items: TURNING, view: WAR_VIEW,
        lead: 'The shaded areas show the greatest extent of Axis control, in 1942. The markers are five places where the war turned.',
        alt: 'A map from western Europe across Asia to Hawaii with the Axis-held areas of 1942 shaded. Five lettered markers: one on the north coast of France, one on the coast of Egypt, one in southern Russia, one in the middle of the North Pacific and one in Hawaii.',
        extra: AXIS_LAYERS,
      }),
    },
    {
      id: 'teach-why',
      type: 'info',
      title: 'A war of factories',
      text: `
        Battles turned the war. Three things behind the battles decided it.

        - **The Eastern Front.** The Soviet Union absorbed and then broke most of the German army.
        - **Production.** American factories out-produced all the Axis powers put together. The
          United States alone built about 300,000 aircraft.
        - **Shortages.** Germany and Japan ran short of oil, steel and men for a long war.

        The Axis powers also barely worked together: Japan never attacked the Soviet Union, and
        Germany was not told about Pearl Harbor in advance. Even so, the fighting lasted three
        and a half years after the United States joined in.
      `,
    },
    {
      id: 'why-allies',
      type: 'multi',
      title: 'Why the Allies won',
      text: `
        In 1942 the Axis powers seemed unstoppable. Three years later both Germany and Japan
        lay in ruins. **Which of these help to explain why?**
      `,
      columns: 1,
      options: [
        { text: 'The Soviet Union absorbed and then broke most of the German army', correct: true },
        { text: 'American factories out-produced all the Axis powers put together', correct: true },
        { text: 'The Axis ran short of oil, steel and men for a long war', correct: true },
        { text: 'Germany and Japan planned every campaign together', why: 'They barely co-ordinated. Japan never attacked the Soviet Union, and Germany was not told about Pearl Harbor in advance.' },
        { text: 'The Axis gave up as soon as the United States joined in', why: 'The fighting lasted three and a half more years.' },
      ],
      explain: `
        It was a war of **factories and populations** as much as of generals: the Industrial
        Revolution turned to destruction. Women ran much of that production, codebreakers read enemy signals, and resistance
        movements tied down occupying troops from France to the Philippines.
      `,
    },
    {
      id: 'holocaust',
      type: 'info',
      title: 'The Holocaust',
      text: `
        The Nazis taught that Germans were a "master race" and that Jews were its chief enemy.
        From 1933 German Jews were stripped of jobs, rights and citizenship.

        With the war came mass murder. In occupied Poland Jews were sealed into ghettos. After
        the invasion of the Soviet Union, killing squads shot men, women and children beside
        pits. From late 1941 the regime built death camps such as Auschwitz-Birkenau and
        Treblinka, where people brought by train from all over Europe were murdered with gas.

        **Six million Jews** were killed, about two-thirds of the Jews of Europe, among them
        some 1.5 million children. The Nazis and their helpers also murdered hundreds of
        thousands of Roma, about 250,000 disabled people, some three million Soviet prisoners
        of war, and many others.
      `,
      figure: {
        type: 'timeline', from: 1932, to: 1946, step: 2, mode: 'static',
        events: timelineEvents(['hitlerChancellor', 'nurembergLaws', 'novemberPogrom', 'massShootings', 'deathCamps', 'auschwitzLiberated'], {
          hitlerChancellor: { label: 'Hitler takes power', short: '1933', color: 'gray' },
          nurembergLaws: { label: 'Jews lose citizenship', short: '1935', color: 'gray' },
          novemberPogrom: { label: 'Synagogues burned', short: '1938', color: 'gray' },
          massShootings: { label: 'Mass shootings begin', short: '1941', color: 'gray' },
          deathCamps: { label: 'Death camps', short: '1942', color: 'gray' },
          auschwitzLiberated: { label: 'Auschwitz liberated', short: '1945', color: 'gray' },
        }),
        alt: 'A timeline from 1932 to 1946: Hitler takes power in 1933; Jews lose their citizenship in 1935; synagogues are burned in 1938; mass shootings begin in 1941; the death camps are in full operation in 1942; Auschwitz is liberated in January 1945.',
      },
    },
    {
      id: 'stolpersteine',
      type: 'reflect',
      title: 'An echo today',
      text: `
        Since the 1990s the artist Gunter Demnig has set more than 100,000 small brass plates
        like these into pavements across Europe. Each *Stolperstein*, or "stumbling stone", lies
        outside the last home a victim of the Nazis chose freely.

        These three are in Berlin. The one on the right reads: "Here lived Gertrud Zeiz, née
        Segall, born 1890. Fled 1935, Austria. Arrested 8.8.1943. Deported 7.10.1943, Auschwitz.
        Murdered 4.11.1943." Beside it are the stones of her husband and her son, who survived.

        **Why do you think the stones are set in ordinary streets, one for each person, rather
        than gathered into one great monument?**
      `,
      figure: pic('stolpersteine', {
        alt: 'Three small square brass plates set among cobblestones and fallen leaves. Each is engraved in German with the words "Here lived", a name of the Zeiz family, a year of birth, and a few short lines on what happened to that person.',
        caption: 'Stolpersteine for the Zeiz family, Wittelsbacherstrasse, Berlin',
      }),
      model: `
        There is no single right answer. Some thoughts people have offered:

        Six million is a number too large to feel. One name outside one door is a neighbour.
        The stones show that the victims were taken from ordinary streets, in front of ordinary
        people. And to read one, you have to stop and bow your head.
      `,
    },
    {
      id: 'hiroshima',
      type: 'info',
      title: 'Hiroshima and Nagasaki',
      text: `
        In the Pacific, the Allies fought back from 1942, island by island. By 1945 American
        bombers were burning Japan's cities, and Japan's rulers still refused to surrender.

        On 6 August 1945 a single **atomic bomb** destroyed Hiroshima. On 9 August a second fell
        on Nagasaki. By the end of the year about 140,000 people had died in Hiroshima and about
        70,000 in Nagasaki, most of them civilians (estimates vary, from about 110,000 to 210,000
        for the two cities together). The Soviet Union attacked
        Japan in the same week, and on 15 August Japan surrendered. Historians still debate
        whether the bombs were needed to end the war.

        The hall in the photograph stood almost directly beneath the explosion. Hiroshima has
        kept its ruin as a memorial. The war had killed **70 to 85 million** people, about 3 in
        every 100 alive, most of them civilians.
      `,
      figure: pic('genbaku-dome', {
        alt: 'The ruin of a brick and concrete building behind a low fence, under a clear sky: roofless walls with empty windows, topped by the bare steel skeleton of a dome.',
        caption: 'The Atomic Bomb Dome, Hiroshima Peace Memorial',
      }),
    },
    {
      id: 'teach-after',
      type: 'info',
      title: 'Built from the ruins',
      text: `
        The survivors tried to make rules for a world in which this could not happen again.

        - **The United Nations**, founded by 51 states in 1945: a permanent meeting-place of
          states, to keep the peace.
        - **The Nuremberg trials**, 1945 to 1946: Nazi leaders answered in court for **crimes
          against humanity**. "I was following orders" was no defence.
        - **The Genocide Convention**, 1948: destroying a people became a crime in
          international law. The word **genocide** had been coined in 1944 by Raphael Lemkin, a
          Polish-Jewish lawyer who lost 49 relatives in the Holocaust.
        - **The Universal Declaration of Human Rights**, 1948: a list of rights that belong to
          every person.
      `,
    },
    {
      id: 'after',
      type: 'match',
      title: 'Four answers',
      text: `
        **Match each with its purpose.**
      `,
      pairs: [
        ['United Nations, 1945', 'A permanent meeting-place of states, to keep the peace'],
        ['Nuremberg trials, 1945 to 1946', 'Leaders answer in court for crimes against humanity'],
        ['Genocide Convention, 1948', 'Destroying a people becomes a crime in international law'],
        ['Universal Declaration, 1948', 'A list of rights that belong to every person'],
      ],
      explain: `
        A meeting-place, a court, a law and a list of rights. Raphael Lemkin had begun his
        campaign for a law against genocide years before the war, moved by the fate of the
        Armenians you met in the last lesson.
      `,
    },
    {
      id: 'udhr',
      type: 'choice',
      review: true,
      title: 'All human beings',
      text: `
        In December 1948 the United Nations adopted the **Universal Declaration of Human Rights**.
        Here Eleanor Roosevelt, who chaired the drafting committee, holds a printed copy. Article 1
        begins: "All human beings are born free and equal in dignity and rights."

        Compare the declarations of 1776 and 1789, which spoke of "all men".
        **What is new in 1948?**
      `,
      figure: pic('udhr-roosevelt', {
        alt: 'A black-and-white photograph of a woman in a dark dress holding up a poster-sized sheet of closely printed text, headed "Universal Declaration of Human Rights", and looking at it.',
        caption: 'Eleanor Roosevelt with the Declaration, 1949',
      }),
      columns: 1,
      options: [
        { text: 'The rights are claimed for every person on Earth, women and men of every nation', correct: true },
        { text: 'It is a law that every government is forced to obey', why: 'It is a declaration, not an enforceable law. Its power is as a standard: later treaties and many constitutions are built on it.' },
        { text: 'It was written by the winners of the war for themselves', why: 'Its drafters came from China, Lebanon, France, Canada, India and elsewhere, and it was adopted without a single vote against.' },
      ],
      explain: `
        The earlier declarations left out women, the enslaved and the colonised. This one says
        "human beings" on purpose: the Indian delegate Hansa Mehta insisted on changing the
        draft's "all men". It was also the first to claim rights for everyone, everywhere.

        Governments have broken it constantly. People have used it ever since to hold them to account.
      `,
    },
    {
      id: 'holocaust-remember',
      type: 'choice',
      review: true,
      title: 'To remember',
      text: `
        During the Second World War, Nazi Germany and its helpers carried out the crime now
        called the **Holocaust**.

        **Which of these describes it accurately?**
      `,
      columns: 1,
      options: [
        { text: 'The planned murder of about six million Jews, two-thirds of the Jews of Europe', correct: true },
        { text: 'The deaths of civilians in the bombing of cities during the war', why: 'Bombing killed civilians in great numbers on every side. The Holocaust was something else: a deliberate attempt to kill every Jew in Europe.' },
        { text: 'The forced labour of prisoners of war in German factories', why: 'Millions were forced to work, and many died of it. The Holocaust means the murder of the Jews of Europe: shot beside pits, or killed with gas in death camps.' },
      ],
      explain: `
        About **six million Jews** were murdered between 1941 and 1945, about 1.5 million of
        them children: two in every three Jews of Europe. The Nazis and their helpers also
        murdered Roma, disabled people, Soviet prisoners of war and many others.

        These facts rest on the killers' own records, on the camps and mass graves, and on the
        testimony of survivors.
      `,
    },
    {
      id: 'which-first',
      type: 'choice',
      review: true,
      gen: (rng) => whichFirst(rng, ['versailles', 'wallStreet', 'hitlerChancellor', 'polandInvaded', 'pearlHarbor', 'dDay', 'udhr', 'manchuria'], { gap: 3 }),
    },
  ],
  recap: [
    'The **Depression** of the 1930s brought dictators to power. Japan (from 1931), Italy and Germany attacked their neighbours, and the war in Europe began on **1 September 1939**.',
    'It was fought across Europe, Asia, Africa and the Pacific. The **Soviet Union** and **China** suffered the greatest losses, and the turning points came in 1942 and 1943 at Midway, El Alamein and Stalingrad.',
    'In the **Holocaust**, Nazi Germany murdered six million Jews, and millions of others. The war ended in August 1945 after atomic bombs destroyed Hiroshima and Nagasaki. In all, 70 to 85 million people died.',
    'From the ruins came the **United Nations**, the Nuremberg trials and the **Universal Declaration of Human Rights**, and a world led by two superpowers.',
  ],
  next: 'Next: the two strongest victors, the United States and the Soviet Union, face each other across a divided world, while the old empires come apart.',
};
