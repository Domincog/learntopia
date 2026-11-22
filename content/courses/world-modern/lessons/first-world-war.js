// The Modern World: 1750 to Today · Lesson 4 · The War That Ended Four Empires
import { countryName } from '../../../../src/widgets/world-map.js';
import { PLACES, pic, marker, inOrder, timelineEvents, whichFirst, markerQuiz, countryQuiz, pinCheck } from '../helpers.js';

// The two sides in August 1914, drawn with today's borders (so only roughly).
const ALLIES_1914 = ['FR', 'GB', 'IE', 'BE', 'RS', 'XK', 'MK', 'ME', 'RU', 'FI', 'EE', 'LV', 'LT', 'BY', 'UA', 'MD', 'GE', 'AM', 'AZ', 'KZ'];
const CENTRAL_1914 = ['DE', 'AT', 'HU', 'CZ', 'SK', 'SI', 'HR', 'BA'];
// The lands of the Russian Empire among the Allies of 1914 (today's borders).
const RUSSIAN_EMPIRE = ['RU', 'FI', 'EE', 'LV', 'LT', 'BY', 'UA', 'MD', 'GE', 'AM', 'AZ', 'KZ'];
// States that appeared in Europe between 1917 and 1920, as the lesson names them (today's borders).
const NEW_STATES = ['PL', 'FI', 'EE', 'LV', 'LT', 'AT', 'HU', 'CZ', 'SK', 'SI', 'HR', 'BA', 'RS', 'ME', 'MK', 'XK'];

const FRONTS = [
  { id: 'ypres', clue: 'the Western Front, where the trenches ran from the North Sea to Switzerland', where: 'the corner of Europe where Belgium meets France', more: 'Around Ypres, in Belgium, the armies faced each other for four years and the front barely moved.' },
  { id: 'sarajevo', clue: 'the city where the shots that began the war were fired', where: 'the mountains of the western Balkans', more: 'Archduke Franz Ferdinand was killed in Sarajevo on 28 June 1914.' },
  { id: 'stPetersburg', clue: 'the Russian capital, where revolution broke out in 1917', where: 'the far north, at the eastern end of the Baltic Sea', more: 'St Petersburg, renamed Petrograd during the war, saw the tsar fall in March 1917 and the Bolsheviks take power in November.' },
  { id: 'gallipoli', clue: 'the peninsula where Ottoman troops threw back an Allied landing in 1915', where: 'the narrow strait between the Mediterranean and the Black Sea', more: 'At Gallipoli, British, French, Australian and New Zealand troops failed to force the way to the Ottoman capital, Constantinople (today\'s Istanbul).' },
  { id: 'baghdad', clue: 'the city on the Tigris taken by a British and Indian army in 1917', where: 'the land between the two rivers, north of the Persian Gulf', more: 'Most of the soldiers on the Mesopotamian front came from India. After the war Britain kept control of Iraq.' },
  { id: 'tanga', clue: 'the East African port where the war was fought between colonial armies', where: 'the coast of the Indian Ocean, just south of the equator', more: 'At Tanga, in today\'s Tanzania, a German colonial force beat off a British and Indian landing in 1914. The campaign in East Africa lasted until 1918.' },
];

const FRONTS_VIEW = [-12, -13, 62, 63];

const NEW_MAP = [
  { code: 'PL', view: 'europe', clue: 'Poland, reborn in 1918 after 123 years divided among three empires', hint: 'Look on the south shore of the Baltic Sea, between Germany and Belarus.', more: 'Russia, Prussia and Austria had wiped Poland off the map in 1795. The fall of all three empires brought it back.' },
  { code: 'FI', view: 'europe', clue: 'Finland, which broke away from the Russian Empire in 1917', hint: 'Look in the far north, between Sweden and Russia.', more: 'Finland declared independence in December 1917, weeks after the Bolsheviks took power.' },
  { code: 'EE', view: 'northern-europe', clue: 'Estonia, the northernmost of the three Baltic states that left the Russian Empire in 1918', hint: 'Three small states lie in a row on the east shore of the Baltic. Take the one nearest Finland.', more: 'Estonia, Latvia and Lithuania all declared independence in 1918.' },
  { code: 'LT', view: 'northern-europe', clue: 'Lithuania, the southernmost of the three Baltic states that left the Russian Empire in 1918', hint: 'Three small states lie in a row on the east shore of the Baltic. Take the one nearest Poland.', more: 'Estonia, Latvia and Lithuania all declared independence in 1918.' },
  { code: 'HU', view: 'europe', clue: 'Hungary, left with less than a third of its old territory when Austria-Hungary broke up', hint: 'Look for a landlocked country on the plain of the middle Danube, east of Austria.', more: 'The peace treaty of 1920 left millions of Hungarian speakers outside the new borders.' },
  { code: 'CZ', view: 'europe', clue: 'Czechia, the western half of the new state of Czechoslovakia', hint: 'Look for a landlocked country wedged between Germany, Poland and Austria.', more: 'Czechoslovakia was carved out of Austria-Hungary in 1918. It split peacefully into Czechia and Slovakia in 1993.' },
  { code: 'TR', view: 'middle-east', clue: 'Turkey, the republic founded in 1923 in the heartland of the Ottoman Empire', hint: 'Look for the large peninsula between the Black Sea and the Mediterranean.', more: 'Mustafa Kemal, later called Atatürk, fought off partition by the victors and replaced the sultan with a republic.' },
  { code: 'IQ', view: 'middle-east', clue: 'Iraq, formed from three Ottoman provinces and placed under British control', hint: 'Look for the country of the Tigris and Euphrates, at the head of the Persian Gulf.', more: 'The League of Nations called it a "mandate": in theory a trust, in practice close to a colony. Iraq became formally independent in 1932.' },
  { code: 'SY', view: 'middle-east', clue: 'Syria, placed under French control after the Ottoman defeat', hint: 'Look on the eastern shore of the Mediterranean, south of Turkey.', more: 'Britain and France had secretly agreed in 1916 (the Sykes-Picot agreement) to share out the Ottoman Arab lands. Syria became independent in 1946.' },
];

export default {
  id: 'first-world-war',
  tone: 'sober',          // a lesson about a war and a genocide: plain feedback throughout, no cheering
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Two shots in Sarajevo',
      text: `
        On 28 June 1914, in a provincial town of the Austro-Hungarian Empire, a 19-year-old
        Bosnian Serb named Gavrilo Princip shot the heir to the throne and his wife.

        Europe had six great powers: Austria-Hungary, Germany, Russia, France, Britain and Italy.
        **Six weeks later, how many of them were at war?**
      `,
      shuffle: false,
      options: [
        { text: 'One: Austria-Hungary, against little Serbia' },
        { text: 'Two or three' },
        { text: 'Five of the six', correct: true },
      ],
      explain: `
        **Five**, with only Italy still waiting. Four years later some 9 to 10 million soldiers
        were dead and four empires had collapsed.

        This lesson asks **how a murder in one town became a world war**, and why the peace that
        followed did not last.
      `,
    },
    {
      id: 'powder-keg',
      type: 'info',
      title: 'A continent wired to explode',
      text: `
        Four things made Europe dangerous by 1914:

        - **Alliances.** The powers had bound themselves into two armed camps. A quarrel between
          any two could pull in the rest.
        - **An arms race.** Conscript armies of millions, with railway timetables to move them.
        - **Rival empires**, as in the last lesson.
        - **Nationalism.** In the Balkans, Serbia wanted to unite the South Slavs, millions of
          whom lived under Austria-Hungary.

        The map uses today's borders, so it is only rough. Poland did not exist: three empires
        had divided it.
      `,
      figure: {
        type: 'world-map', view: 'europe',
        regions: [
          { ids: ALLIES_1914, color: 'blue', label: 'Allies: France, Britain, Russia, Serbia, Belgium' },
          { ids: CENTRAL_1914, color: 'red', label: 'Central Powers: Germany, Austria-Hungary' },
          { ids: ['TR', 'BG'], color: 'orange', label: 'Joined the Central Powers later' },
        ],
        markers: [marker('sarajevo', { color: 'ink', shape: 'star' })],
        alt: 'A map of Europe in August 1914 on today\'s borders. France, Britain, Belgium, Serbia and the lands of the Russian Empire are coloured as the Allies; Germany and the lands of Austria-Hungary in the centre as the Central Powers; Turkey and Bulgaria as later members of the Central Powers. Sarajevo is marked with a star.',
      },
    },
    {
      id: 'sarajevo',
      type: 'interact',
      title: 'Where it began',
      text: `
        **Sarajevo** lies in the mountains of Bosnia, in the western Balkans, about 100 km inland
        from the Adriatic Sea. Austria-Hungary had annexed Bosnia in 1908, to Serbia's fury.

        **Place the pin on Sarajevo.** Anywhere within 250 km counts.
      `,
      widget: {
        type: 'world-map', view: 'balkans', mode: 'place', labels: [{ at: [17.2, 42.2], text: 'Adriatic Sea', style: 'water' }],
        pin: { label: 'Sarajevo', color: 'red', start: [27.5, 37.2] }, target: marker('sarajevo').at,
        alt: 'A map of the Balkan peninsula without country names, from the Adriatic Sea in the west to the Black Sea in the east.',
      },
      check: pinCheck('sarajevo', 250),
      solution: { pin: [18.4, 43.9] },
      hints: ['The Adriatic is the long arm of sea between Italy and the Balkans. Go about halfway down its eastern shore, then a little inland.'],
      explain: `
        Sarajevo is the capital of today's Bosnia and Herzegovina. Princip and his friends were
        Bosnian Serbs who wanted their land to join Serbia. Their pistols came from officers in
        the Serbian army.
      `,
    },
    {
      id: 'teach-chain',
      type: 'info',
      title: 'How the alliances pulled',
      text: `
        A month passed after the shots in Sarajevo. Then the alliances pulled the powers in,
        one after another.

        - **28 July.** Austria-Hungary, backed by Germany, declared war on Serbia.
        - **30 July.** Russia mobilised its army to back Serbia.
        - **1 August.** Germany declared war on Russia.
        - **4 August.** Germany's only war plan was to knock out Russia's ally, France, first,
          by marching through neutral Belgium. It invaded, and that brought in Britain.

        Each government believed it was only standing by an ally, or striking before it was struck.
      `,
      figure: {
        type: 'world-map', view: [-9, 39, 42, 61], zoom: false, dots: false,
        regions: [
          { ids: ALLIES_1914, color: 'blue', label: 'Allies' },
          { ids: CENTRAL_1914, color: 'red', label: 'Central Powers' },
        ],
        labels: [{ id: 'GB', text: 'Britain' }, 'FR', 'BE', { id: 'DE', text: 'Germany' }, 'RS',
          { at: [17.5, 47.6], text: 'Austria-Hungary', style: 'area' }, { at: [31, 54], text: 'Russian Empire', style: 'area' }],
        lines: [
          { points: ['Vienna', 'Belgrade'], color: 'ink', arrow: true, label: '28 July: Austria-Hungary attacks Serbia', labelOn: 'legend' },
          { points: [[7.6, 50.9], 'Brussels', 'Paris'], color: 'ink', arrow: true, dashed: true, label: '4 August: Germany marches through Belgium towards France', labelOn: 'legend' },
        ],
        markers: [marker('sarajevo', { color: 'ink', shape: 'star', labelPos: 'bottom' })],
        alt: 'A map of Europe in August 1914 on today\'s borders, with the Allies (France, Britain, Belgium, Serbia and the Russian Empire) in one colour and the Central Powers (Germany and Austria-Hungary) in another. One arrow runs from Vienna to Belgrade in Serbia. A second runs from western Germany through Belgium towards Paris. Sarajevo is marked with a star.',
      },
    },
    {
      id: 'chain',
      type: 'order',
      review: true,
      title: 'Five weeks',
      text: `
        Each government believed it was only standing by an ally, or striking before it was struck.
        **Put the steps to war in order.**
      `,
      items: inOrder(['sarajevo', 'austriaDeclares', 'russiaMobilises', 'germanyDeclares', 'belgiumInvaded']),
      labels: ['28 June 1914', '4 August 1914'],
      explain: `
        Austria-Hungary, backed by Germany, attacked **Serbia**. **Russia** mobilised to protect
        Serbia. Germany's only war plan was to knock out Russia's ally **France** first, by marching
        through neutral **Belgium**, and that brought in **Britain**. Historians still argue about
        how to share out the blame. The alliances turned one quarrel into everyone's war.
      `,
    },
    {
      id: 'trench',
      type: 'choice',
      title: 'Why the plans failed',
      text: `
        Every army expected a short war of sweeping movement. Instead, by the end of 1914 both
        sides had dug in along a line 700 km long, from the North Sea to Switzerland.

        An attack meant walking across open ground into barbed wire, machine guns and shellfire.
        Railways rushed defenders to any gap faster than attackers could advance on foot.
        In this photograph from 1916 a sentry keeps watch while his comrades sleep.

        **Why could neither side break through for nearly four years?**
      `,
      figure: pic('trench-somme', {
        alt: 'A black-and-white photograph of a narrow trench cut into chalky ground. One soldier in a steel helmet crouches on a step, looking over the top with his rifle. Below him his comrades are resting, asleep in the bottom of the trench under coats and groundsheets.',
        caption: 'A sentry keeps watch while his comrades sleep: British soldiers in a captured German trench on the Somme, July 1916',
      }),
      columns: 1,
      options: [
        { text: 'Machine guns, artillery and barbed wire made defending far easier than attacking', correct: true },
        { text: 'The generals refused to order attacks', why: 'They ordered them again and again. On the first day of the Battle of the Somme alone, about 19,000 British soldiers were killed.' },
        { text: 'Both sides ran short of soldiers and shells', why: 'Factories and conscription supplied more of both every year. That is why the killing could go on so long.' },
      ],
      explain: `
        Industry had made killing efficient, and it favoured the defender. Poison gas (1915) and
        tanks (1916) were invented to break the deadlock.

        So the soldiers lived below ground, as in the photograph, and the front barely moved.
      `,
    },
    {
      id: 'empire-troops',
      type: 'choice',
      title: 'A world war',
      text: `
        These cyclists were photographed in France in 1916. They are soldiers of the **Indian Army**,
        thousands of kilometres from home.

        **What does the picture tell you about this war?**
      `,
      figure: pic('indian-troops-somme', {
        alt: 'A black-and-white photograph of three soldiers in turbans standing with loaded bicycles on a dirt road, rifles strapped to the frames. Behind them soldiers on horseback and on foot look on, with open, battered country beyond.',
        caption: 'Indian cyclist troops on the Somme, July 1916',
      }),
      columns: 1,
      options: [
        { text: 'The European powers drew their colonies into the fight', correct: true },
        { text: 'India had declared war on Germany', why: 'India had no government of its own to do so. Britain declared war on its behalf, as it did for the whole empire.' },
        { text: 'The fighting had spread to India', why: 'There was no front in India. Its soldiers were shipped to France, East Africa and the Middle East.' },
      ],
      explain: `
        More than a million Indian soldiers served overseas. France recruited some 200,000 West
        African soldiers, about 140,000 Chinese labourers worked behind the lines, and
        in East Africa the armies relied on about a million African carriers, of whom perhaps
        100,000 died.

        The war was fought in Africa, the Middle East, China and on every ocean. Many who
        served came home asking why the freedom they had fought for did not apply to them.
      `,
    },
    {
      id: 'teach-fronts',
      type: 'info',
      title: 'A war on three continents',
      text: `
        Empires and alliances carried the fighting far beyond France. Six places to know:

        ${FRONTS.map((t) => `- **${PLACES[t.id].name}**: ${t.clue}.`).join('\n        ')}
      `,
      figure: {
        type: 'world-map', view: FRONTS_VIEW, aspect: 1, zoom: false, dots: false,
        markers: FRONTS.map((t) => marker(t.id, { color: 'red' })),
        alt: `A map of Europe, north-east Africa and the Middle East with six places named: ${FRONTS.map((t) => PLACES[t.id].name).join(', ')}.`,
      },
    },
    {
      id: 'fronts',
      type: 'interact',
      review: true,
      gen: (rng) => markerQuiz(rng, {
        items: FRONTS, view: FRONTS_VIEW, aspect: 1,
        lead: 'Six places of the First World War, on three continents.',
        alt: 'A map of Europe, Africa north of Tanzania and the Middle East. Six lettered markers: one in Belgium, one in the western Balkans, one at the eastern end of the Baltic, one at the strait between the Mediterranean and the Black Sea, one in Mesopotamia and one on the coast of East Africa.',
      }),
    },
    {
      id: 'armenian-genocide',
      type: 'info',
      title: 'The Armenian genocide',
      text: `
        The Ottoman Empire joined Germany's side. In 1915 its government, losing to Russia, turned
        on its own Armenian Christian minority. Beginning that April, community leaders were
        arrested and killed, men were shot, and women, children and the old were driven on foot
        into the Syrian desert.

        Between about **600,000 and 1.5 million** Armenians died. Assyrian and Greek Christians
        were also killed. The great majority of historians, and more than thirty countries, call it a **genocide**:
        an attempt to destroy a people. The Republic of Turkey, the empire's successor, rejects that
        word.

        Each 24 April Armenians lay flowers around the flame of this memorial in Yerevan.
      `,
      figure: pic('armenian-memorial', {
        alt: 'A flame burning in a wide, round metal basin set into a stone floor. Behind it, white flowers lie in a row along the top of a low grey stone wall.',
        caption: 'The eternal flame at Tsitsernakaberd, the genocide memorial in Yerevan, Armenia',
      }),
    },
    {
      id: 'teach-1917',
      type: 'info',
      title: 'The year the war turned',
      text: `
        Two events in 1917 decided the war.

        **Russia left.** In March, after bread riots in the capital, St Petersburg, Tsar
        Nicholas II gave up his throne. In November the **Bolsheviks**, a communist party led by
        Lenin, seized power promising "peace, land and bread", and took Russia out of the war.

        **The United States arrived.** German submarines were sinking ships bound for Britain,
        and in April the United States joined the Allies. Two million fresh American soldiers
        reached France.
      `,
      figure: {
        type: 'world-map', view: 'europe', zoom: false, dots: false,
        regions: [
          { ids: ALLIES_1914.filter((id) => !RUSSIAN_EMPIRE.includes(id)), color: 'blue', label: 'Allies, joined by the United States in April 1917' },
          { ids: RUSSIAN_EMPIRE, color: 'teal', label: 'Russian Empire: out of the war after November 1917' },
          { ids: [...CENTRAL_1914, 'TR', 'BG'], color: 'red', label: 'Central Powers' },
        ],
        markers: [marker('stPetersburg', { color: 'ink', shape: 'star', labelPos: 'right' })],
        alt: 'A map of Europe in 1917 on today\'s borders. France, Britain, Belgium and Serbia are coloured as Allies; the lands of the Russian Empire in a third colour, as out of the war after November 1917; Germany, Austria-Hungary, Bulgaria and Turkey as the Central Powers. St Petersburg, the Russian capital, is marked with a star.',
      },
    },
    {
      id: 'year-1917',
      type: 'fill',
      title: '1917: one power leaves, one arrives',
      text: 'Two events in one year decided the war. **Complete the account.**',
      template: `
        In March 1917, after bread riots in the Russian capital, the [[kaiser|sultan|*tsar]] gave up his throne.
        In November the [[Chartists|*Bolsheviks|Jacobins]], led by Lenin, seized power promising "peace, land and bread", and took Russia out of the war.
        Meanwhile German submarines were sinking ships bound for Britain, and in April [[*the United States|Japan|Spain]] joined the Allies.
      `,
      explain: `
        Russia's revolution created the world's first communist state, the Soviet Union, which
        will matter for the rest of this course. In the autumn of 1918 Germany's allies gave up
        one by one, its sailors mutinied and its emperor fled.
      `,
    },
    {
      id: 'cost',
      type: 'info',
      title: 'The eleventh hour',
      text: `
        The guns stopped at 11 a.m. on **11 November 1918**. Many countries still keep that
        day, with silence and with red poppies, the flower of the battlefields of Flanders.

        | | Deaths (estimates) |
        |---|---|
        | Soldiers | 9 to 10 million |
        | Civilians: hunger, disease, massacre | 6 to 13 million |
        | Influenza pandemic, 1918 to 1920 | perhaps 50 million (estimates: 17 to 100 million) |

        The influenza, spread by troop ships and crowded camps, reached almost every part of
        the world and probably killed more people than the war itself.
      `,
      figure: {
        type: 'timeline', from: 1914, to: 1924, step: 2,
        events: timelineEvents(['sarajevo', 'somme', 'usEntersWar', 'armistice', 'versailles', 'turkeyRepublic'], {
          sarajevo: { label: 'Sarajevo', color: 'red' }, somme: { label: 'The Somme' }, usEntersWar: { label: 'USA enters; Russian revolutions' },
          armistice: { label: 'Armistice', color: 'red' }, versailles: { label: 'Treaty of Versailles' }, turkeyRepublic: { label: 'Republic of Turkey' },
        }),
        alt: 'A timeline from 1914 to 1924: Sarajevo in 1914, the Somme in 1916, the United States entering the war and the Russian revolutions in 1917, the armistice in 1918, the Treaty of Versailles in 1919 and the Republic of Turkey in 1923.',
      },
    },
    {
      id: 'teach-peace',
      type: 'info',
      title: 'Four thrones gone',
      text: `
        By 1923 the four emperors of 1914 had all lost their thrones.

        - **Germany.** The emperor fled, and a republic had to sign the **Treaty of Versailles**
          (1919). Germany accepted responsibility for the war, owed reparations, was limited to
          an army of 100,000 men, and gave up its colonies and about an eighth of its territory.
        - **Austria-Hungary** split into Austria, Hungary, Czechoslovakia and more.
        - **Russia**, after revolution and civil war, became the Soviet Union. Finland and the
          three Baltic states broke away, and Poland was reborn.
        - **The Ottoman Empire.** Turkey became a republic in 1923. Britain took control of
          Iraq, and France of Syria.
      `,
      figure: {
        type: 'world-map', view: [-9, 28, 50, 70], zoom: false, dots: false,
        regions: [
          { ids: NEW_STATES, color: 'green', label: 'New states in Europe, 1917 to 1920 (today\'s borders)' },
          { ids: ['TR'], color: 'orange', label: 'Turkey, a republic from 1923' },
          { ids: ['IQ'], color: 'red', label: 'Under British control' },
          { ids: ['SY'], color: 'blue', label: 'Under French control' },
        ],
        labels: NEW_MAP.map((t) => t.code),
        alt: `A map of Europe and the Middle East after the war, on today's borders. The new states of Europe, from Finland and the Baltic states through Poland, Czechoslovakia, Austria and Hungary to Yugoslavia, are in one colour; Turkey in a second; Iraq is marked as under British control and Syria as under French control. Nine countries are named: ${NEW_MAP.map((t) => countryName(t.code)).join(', ')}.`,
      },
    },
    {
      id: 'four-empires',
      type: 'match',
      title: 'Four empires fall',
      text: `
        In 1914 four emperors ruled most of central and eastern Europe and the Middle East.
        By 1923 all four thrones were gone. **Match each empire with what replaced it.**
      `,
      pairs: [
        ['German Empire', 'The emperor fled; a republic signed the peace'],
        ['Austria-Hungary', 'Split into Austria, Hungary, Czechoslovakia and more'],
        ['Russian Empire', 'Revolution, civil war, then the Soviet Union'],
        ['Ottoman Empire', 'Turkey a republic; Arab lands under Britain and France'],
      ],
      explain: `
        Nationalism had won in Europe: Poland, Czechoslovakia, Yugoslavia, Finland and the
        Baltic states appeared on the map. In the Middle East it lost. Britain and France had
        secretly agreed in 1916 to divide the Ottoman Arab lands, and they took them as
        "mandates" of the new League of Nations.
      `,
    },
    {
      id: 'versailles',
      type: 'multi',
      title: 'The peace',
      text: `
        The victors met near Paris in 1919. Germany was not allowed to negotiate. It was handed
        the **Treaty of Versailles** to sign.

        **Which of these did the treaty impose on Germany?**
      `,
      columns: 1,
      options: [
        { text: 'Accepting responsibility for the war', correct: true },
        { text: 'Paying reparations for the damage', correct: true },
        { text: 'An army of no more than 100,000 men', correct: true },
        { text: 'Giving up its colonies and about an eighth of its territory', correct: true },
        { text: 'Division into two separate German states', why: 'That happened after the Second World War, not the First.' },
      ],
      explain: `
        The treaty also founded a **League of Nations** to settle future quarrels, which the
        United States never joined. To many Germans the terms were a humiliation; to many French,
        too mild. Marshal Foch is said to have remarked (the story may be a legend): "This is
        not peace. It is an armistice for twenty years." The next war began twenty years and
        two months later.

        The war changed societies as well as borders. Women had kept the factories and farms
        running, and won the vote in Britain (at first only from the age of 30), Germany and
        Poland in 1918 and across the United States in 1920. New Zealand had led the way in 1893.
      `,
    },
    {
      id: 'new-map',
      type: 'interact',
      review: true,
      gen: (rng) => countryQuiz(rng, NEW_MAP),
    },
    {
      id: 'which-first',
      type: 'choice',
      review: true,
      gen: (rng) => whichFirst(rng, ['germanyUnified', 'nzWomenVote', 'sarajevo', 'armistice', 'turkeyRepublic', 'adwa', 'usWomenVote', 'berlinConference'], { gap: 4 }),
    },
  ],
  recap: [
    'Alliances, an arms race, imperial rivalry and Balkan nationalism turned the **Sarajevo** assassination of 28 June 1914 into a general war within five weeks.',
    'Industrial weapons favoured defence: **trenches**, and slaughter on a scale never seen. Colonies made it a **world** war.',
    'Some 9 to 10 million soldiers and millions of civilians died, among them the victims of the **Armenian genocide**. The fighting ended on **11 November 1918**.',
    'Four empires fell, new nations appeared in Europe, the Middle East went to Britain and France, and the **Treaty of Versailles** left grievances that fed the next war.',
  ],
  next: 'Next: the "armistice for twenty years" runs out. Depression, dictators and a second, far deadlier world war.',
};
