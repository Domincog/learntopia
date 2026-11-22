// The Modern World: 1750 to Today · Lesson 2 · Liberty, Equality, Independence
import { pic, marker, at, inOrder, timelineEvents, whichFirst, markerQuiz } from '../helpers.js';

// The Americas, and the Atlantic with both shores.
const AMERICAS = [-128, -56, -32, 60];
const ATLANTIC = [-112, -40, 14, 56];

// Free of European rule by 1830, drawn with today's borders.
const FREE_1830 = ['US', 'MX', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'HT', 'DO', 'CO', 'VE', 'EC', 'PE', 'BO', 'CL', 'AR', 'PY', 'UY', 'BR'];

const SCENES = [
  { id: 'philadelphia', clue: 'the city where the American Declaration of Independence was adopted in 1776', where: 'the east coast of North America', more: 'Thirteen British colonies declared themselves a republic there on 4 July 1776.' },
  { id: 'paris', clue: 'the city where a crowd stormed the Bastille in 1789', where: 'Europe, on the right-hand side of the map', more: 'The fall of the Bastille prison on 14 July 1789 is still France\'s national day.' },
  { id: 'capHaitien', clue: 'the colony where enslaved people rose in 1791 and founded a new country', where: 'the islands of the Caribbean', more: 'The rising began on the sugar plain around this port. In 1804 Saint-Domingue became Haiti.' },
  { id: 'caracas', clue: 'the birthplace of Simón Bolívar, where his campaigns began', where: 'the north coast of South America', more: 'From here Bolívar\'s armies freed what are now Venezuela, Colombia and Ecuador.' },
  { id: 'buenosAires', clue: 'the port city whose revolution of 1810 sent San Martín towards the Andes', where: 'the south-east coast of South America, on a wide river mouth', more: 'From the lands of the Río de la Plata, San Martín crossed the Andes to free Chile and then Peru.' },
  { id: 'rio', clue: 'the capital of the Brazilian empire founded in 1822', where: 'the long Atlantic coast of Brazil', more: 'The Portuguese court had fled here from Napoleon. In 1822 the king\'s son stayed and made Brazil independent.' },
  { id: 'dolores', clue: 'the town where the priest Miguel Hidalgo called Mexicans to revolt in 1810', where: 'the highlands of Mexico', more: 'Hidalgo\'s call, the "Grito de Dolores", is re-enacted every year on the eve of Mexico\'s independence day.' },
];

export default {
  id: 'age-of-revolutions',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Fifty years',
      text: `
        In 1775 European maps showed almost every part of the Americas as belonging to a king in
        Europe. (On the ground, much of the interior was still held by Indigenous nations.)

        **Fifty years later, how much of the mainland was still ruled from Europe?**
      `,
      figure: {
        type: 'world-map', view: AMERICAS, aspect: 0.85, zoom: false,
        regions: [{ ids: ['americas', 'FR'], color: 'orange', label: 'Claimed by European crowns in 1775' }],
        alt: 'A map of North and South America, all of it shaded as claimed by European crowns in 1775.',
      },
      shuffle: false,
      columns: 1,
      options: [
        { text: 'Most of it' },
        { text: 'About half' },
        { text: 'Only the far north and a few small corners', correct: true },
      ],
      explain: `
        Only the far north (British Canada, Russian Alaska) and a few small colonies around the
        Caribbean. Nearly everything from the Great Lakes to Cape Horn had broken away within one lifetime.

        This lesson asks **why so many revolutions came so close together**, and who was
        actually included when they promised that all are equal.
      `,
    },
    {
      id: 'chain',
      type: 'info',
      tone: 'sober',
      title: 'One fire lights the next',
      text: `
        Two things met. **Ideas**: the Enlightenment claim, from *One World*, that governments exist
        to protect people's rights. And **grievances**: taxes, debts and distant rulers.

        Then each revolution set off another. Britain taxed its colonists to pay for a war:
        **1776**. France went bankrupt helping the Americans: **1789**. News from Paris reached the
        enslaved of Saint-Domingue: **1791**. Napoleon seized Spain in 1808, and its American
        colonies were left without a king: **1810**.

        [Green]{.green}: free of European rule by 1830, on today's borders.
      `,
      figure: {
        type: 'world-map', view: ATLANTIC,
        regions: [{ ids: FREE_1830, color: 'green', label: 'Independent by 1830 (today\'s borders)' }],
        markers: [
          marker('philadelphia', { label: 'Philadelphia, 1776', color: 'red', labelPos: 'top' }),
          marker('paris', { label: 'Paris, 1789', color: 'red', labelPos: 'top' }),
          marker('capHaitien', { label: 'Saint-Domingue, 1791', color: 'red', labelPos: 'right' }),
          marker('caracas', { label: 'Caracas, 1810', color: 'red', labelPos: 'right' }),
          marker('buenosAires', { label: 'Buenos Aires, 1810', color: 'red', labelPos: 'right' }),
        ],
        lines: [
          { points: ['philadelphia', 'paris'], color: 'red', arrow: true, animate: 'draw' },
          { points: ['paris', 'capHaitien'], color: 'red', arrow: true, animate: 'draw' },
          { points: ['paris', [-30, 30], 'caracas'], color: 'red', arrow: true, animate: 'draw', dashed: true },
          { points: ['paris', [-20, 5], 'buenosAires'], color: 'red', arrow: true, animate: 'draw', dashed: true },
        ],
        alt: 'A map of the Atlantic. Arrows run from Philadelphia (1776) to Paris (1789), from Paris to Haiti (1791), and from Europe to Caracas and Buenos Aires (1810). The United States, Mexico, Central America, Haiti and almost all of South America are shaded as independent by 1830; Canada, Cuba and the Guianas are not.',
      },
    },
    {
      id: 'declaration',
      type: 'multi',
      tone: 'sober',
      title: 'Who is in the room?',
      text: `
        Philadelphia, summer 1776. The committee hands over a text that says "all men are
        created equal". A painter later recorded the scene.

        **Look at the room. Who is missing from it, and was left out of its promise?**
      `,
      figure: pic('trumbull-declaration', {
        alt: 'A painting of a hall full of men in eighteenth-century coats and wigs, all of them white. Five stand before a desk and hand a document to a seated man; about forty others sit or stand watching.',
        caption: 'John Trumbull, Declaration of Independence, painted 1818',
        creditLabel: 'Painting',
      }),
      columns: 1,
      options: [
        { text: 'Women', correct: true },
        { text: 'Enslaved people, about one in five of the population', correct: true },
        { text: 'Native Americans', correct: true },
        { text: 'Lawyers and landowners', why: 'They fill the room: almost every delegate was a lawyer, merchant or planter.' },
      ],
      explain: `
        The new republic gave the vote to men with property, nearly all of them white. Thomas
        Jefferson, who wrote the famous sentence, held more than 600 people in slavery during his
        life. Slavery lasted in the United States until 1865.

        People noticed at the time. That spring Abigail Adams wrote to her husband John, one of
        the five men standing at the desk: "Remember the Ladies."
      `,
    },
    {
      id: 'teach-france',
      type: 'info',
      title: 'Paris, 1789',
      text: `
        France's king was bankrupt. In the summer of 1789 his subjects stopped obeying him.

        - On **14 July** a Paris crowd stormed the **Bastille**, a royal prison. It held only
          seven prisoners, but it stood for the king's power. The day is still France's national day.
        - Deputies from all over France formed a **National Assembly**. "Left" and "right" in
          politics come from where they sat in it.
        - In August the Assembly voted a **Declaration of the Rights of Man and of the Citizen**.

        The line shows what came next: an answer on behalf of women, the Terror, and a general
        who crowned himself emperor.
      `,
      figure: {
        type: 'timeline', from: 1786, to: 1806, step: 2, showYears: true, mode: 'static',
        events: timelineEvents(['bastille', 'rightsOfWoman', 'terror', 'napoleonEmperor'], {
          bastille: { label: 'The Bastille falls', short: 'Bastille', color: 'red' },
          rightsOfWoman: { label: 'Rights of Woman', short: 'Rights of Woman' },
          terror: { label: 'The Terror begins', short: 'Terror' },
          napoleonEmperor: { label: 'Napoleon, emperor', short: 'Napoleon' },
        }),
        alt: 'A timeline from 1786 to 1806: the Bastille falls in 1789, Olympe de Gouges publishes her Declaration of the Rights of Woman in 1791, the Terror begins in 1793 and Napoleon crowns himself emperor in 1804.',
      },
    },
    {
      id: 'rights-of-man',
      type: 'choice',
      title: 'The Declaration, painted',
      text: `
        The first article of the Declaration says: "Men are born and remain free and equal in rights."
        A painter set the whole text out on two tablets. That is how religious paintings showed
        the Ten Commandments, the laws that God gives to Moses in the Bible.

        **Why do you think this artist borrowed that shape?**
      `,
      figure: pic('rights-of-man', {
        alt: 'A painting of a long text in French set out in gold letters on two tall dark tablets with rounded tops, side by side. Above them sit a woman holding broken chains and a winged figure pointing to a shining eye in a triangle; between the tablets stands a pike topped with a red cap.',
        caption: 'Jean-Jacques-François Le Barbier, about 1789',
        creditLabel: 'Painting',
      }),
      columns: 1,
      options: [
        { text: 'To present these rights as a new sacred law, like the Ten Commandments', correct: true },
        { text: 'Because the Assembly had the text carved on stone tablets', why: 'It was printed on paper and posted up across France. The tablets are the painter\'s idea.' },
        { text: 'To show that the rights were a gift from the king', why: 'The Declaration says the opposite: rights belong to people by birth, and power comes from the nation.' },
      ],
      explain: `
        The shape borrows the authority of the Bible for a new idea: rights that no ruler grants
        and none may take away.

        "Men" was meant literally. In 1791 the playwright **Olympe de Gouges** answered with a
        *Declaration of the Rights of Woman*: "Woman is born free and remains equal to man in
        rights." She was guillotined in 1793. French women first voted in 1945.
      `,
    },
    {
      id: 'teach-stories',
      type: 'info',
      title: 'What the records say',
      text: `
        The Revolution made lasting changes. It created the **metric system**. For women it
        changed less: they marched, wrote and organised, but their political clubs were banned
        in 1793, and French women first voted in 1945.

        It also left tall stories. Historians check each one against the records.

        - **"Let them eat cake."** The line is in a book by Rousseau, written when Queen
          Marie Antoinette was a child in Austria, about an unnamed "great princess". No record
          connects it to her.
        - **"Napoleon was tiny."** The general who made himself emperor stood about 1.69 m,
          average or a little above for a Frenchman of his day. British cartoonists drew him small.
      `,
    },
    {
      id: 'myths',
      type: 'bucket',
      title: 'Record or myth?',
      text: `
        The French Revolution left a trail of famous stories. Some are on the record.
        Some were invented later. **Sort them.**
      `,
      buckets: ['On the record', 'Myth'],
      items: [
        { text: 'When the Bastille fell, it held only seven prisoners', bucket: 0 },
        { text: 'The revolutionaries created the metric system', bucket: 0 },
        { text: '"Left" and "right" in politics come from where deputies sat in the French assembly', bucket: 0 },
        { text: 'Queen Marie Antoinette said of the hungry poor, "Let them eat cake"', bucket: 1, why: 'The line appears in a book by Rousseau, written when she was a child in Austria, about an unnamed "great princess". No record connects it to her.' },
        { text: 'Napoleon was unusually short', bucket: 1, why: 'He was about 1.69 m, average or a little above for a Frenchman of his day. French inches were longer than English ones, and British cartoonists did the rest.' },
        { text: 'The Revolution gave French women the vote', bucket: 1, why: 'Women marched, wrote and organised, but their political clubs were banned in 1793.' },
      ],
      explain: `
        The real story needs no decoration. The king was executed in 1793. In the **Terror** that
        followed, about 17,000 people were sentenced to death in little more than a year. In 1804
        a general, **Napoleon**, crowned himself emperor. His armies and his law code carried
        "equality before the law" across Europe, for men.
      `,
    },
    {
      id: 'find-haiti',
      type: 'interact',
      tone: 'sober',
      title: 'The richest colony on Earth',
      text: `
        In 1789 one French colony grew about 40% of the sugar and more than half of the coffee
        that Europe consumed. It was the **western third of an island** shared with a Spanish colony.

        **Tap the country it became.**
      `,
      widget: {
        type: 'world-map', view: [-86, 16, -64, 24], mode: 'pick', answer: 'HT',
        pickable: ['HT', 'DO', 'CU', 'JM', 'PR', 'BS'],
        alt: 'A map of the northern Caribbean without names: one long island in the west, a smaller island south of it, a larger island in the middle divided in two by a border, and a small island further east.',
      },
      check: (s) => s.picked === 'HT'
        || (s.picked === 'DO' ? 'Right island, wrong side: that is the larger, eastern part, today the Dominican Republic.'
          : s.picked === 'CU' ? 'That is Cuba, which stayed Spanish until 1898. Look at the next large island to the east.'
            : s.picked ? `That is ${s.nameThe || s.name}. Look for the island that a border cuts in two.` : false),
      solution: { picked: 'HT' },
      hints: ['Only one island on this map is divided by a border. Take its smaller, western part.'],
      explain: `
        **Haiti**, then called Saint-Domingue. Its wealth was produced by about half a million
        enslaved Africans, nearly nine in every ten people in the colony, worked so hard that
        many died within a few years of arriving.
      `,
    },
    {
      id: 'teach-haiti',
      type: 'info',
      tone: 'sober',
      title: 'Saint-Domingue becomes Haiti',
      text: `
        In August 1791, as news of the revolution in Paris spread, the enslaved people of the
        sugar plain around **Cap-Haïtien** rose.

        Over twelve years their armies defeated French, Spanish and British forces. Their
        ablest general, **Toussaint Louverture**, had been born in slavery. On 1 January **1804**
        the colony declared its independence under a new name: **Haiti**.

        It was the second independent state in the Americas, after the United States. Nowhere
        else have enslaved people freed themselves and founded a country.
      `,
      figure: {
        type: 'world-map', view: [-86, 16, -64, 24], zoom: false, dots: false,
        regions: [{ ids: ['HT'], color: 'green', label: 'Haiti, independent in 1804 (before that, the French colony of Saint-Domingue)' }],
        labels: ['HT', 'DO', 'CU', 'JM'],
        markers: [marker('capHaitien', { color: 'red', labelPos: 'top' })],
        alt: 'A map of the northern Caribbean. Haiti, the western third of the island it shares with the Dominican Republic, is highlighted. Cap-Haïtien is marked on its north coast. Cuba lies to the west and Jamaica to the south-west.',
      },
    },
    {
      id: 'haiti',
      type: 'choice',
      tone: 'sober',
      review: true,
      title: 'The revolution nobody thought possible',
      text: `
        In August 1791 the enslaved people of Saint-Domingue rose. Their ablest general,
        **Toussaint Louverture**, had been born in slavery; the portrait shows him in the uniform
        of a French general. Over twelve years their armies defeated French, Spanish and British
        forces. On 1 January 1804 the colony became **Haiti**.

        **What makes the Haitian Revolution unique in world history?**
      `,
      figure: pic('toussaint', {
        alt: 'A painted portrait of a Black man standing in a dark general\'s uniform with gold epaulettes, red and gold trim and a sash with stars. He holds up a paper in one hand; a sword hangs at his side.',
        caption: 'Toussaint Louverture, in a nineteenth-century portrait',
        creditLabel: 'Painting',
      }),
      columns: 1,
      options: [
        { text: 'It is the only revolt of enslaved people that founded a state', correct: true },
        { text: 'It created the first republic in the Americas', why: 'The United States was a republic first. Haiti was the second independent state in the Americas.' },
        { text: 'It ended slavery throughout the Americas', why: 'It terrified slave owners everywhere and inspired the enslaved, but slavery lasted until 1865 in the United States and 1888 in Brazil.' },
      ],
      explain: `
        Nowhere else did enslaved people free themselves and found a country. Toussaint did not
        see it: captured by Napoleon's troops, he died in a French prison in 1803.

        Haiti paid dearly. In 1825 France, with warships offshore, demanded 150 million francs to
        compensate the former slave owners (later cut to 90 million). The loans taken out to pay it
        burdened Haiti until 1947.
      `,
    },
    {
      id: 'teach-liberators',
      type: 'info',
      title: 'Spain and Portugal lose a continent',
      text: `
        In 1807 and 1808 Napoleon's armies marched into Portugal and Spain. Their American
        colonies were left to themselves.

        - **Mexico.** In 1810 the priest Miguel Hidalgo called Mexicans to revolt in the town of
          **Dolores**. Independence came in 1821.
        - **Spanish South America.** Simón Bolívar, born in **Caracas**, began his campaigns
          there. In **Buenos Aires** a revolution in 1810 sent José de San Martín towards the Andes.
        - **Brazil.** Portugal's royal family fled to **Rio de Janeiro**. When the king went
          home his son Pedro stayed, and in 1822 made Brazil an independent empire, with Rio
          as its capital. Slavery there lasted until 1888.
      `,
      figure: {
        type: 'world-map', view: [-120, -56, -30, 34], aspect: 0.85, zoom: false, dots: false,
        regions: [
          { ids: FREE_1830.filter((id) => !['US', 'HT', 'DO', 'BR'].includes(id)), color: 'orange', label: 'Spanish colonies, independent by 1830 (today\'s borders)' },
          { ids: ['BR'], color: 'green', label: 'Brazil, independent of Portugal in 1822' },
        ],
        markers: ['dolores', 'caracas', 'buenosAires', 'rio'].map((id) => marker(id, { color: 'red' })),
        alt: 'A map of Latin America. Mexico, Central America and the western and southern parts of South America are shaded as former Spanish colonies, independent by 1830; Brazil as independent of Portugal in 1822. Four places are named: Dolores in Mexico, Caracas on the north coast of South America, Rio de Janeiro on the coast of Brazil and Buenos Aires in the south-east.',
      },
    },
    {
      id: 'liberators',
      type: 'interact',
      title: 'Two armies, one continent',
      text: `
        With Spain's king a prisoner of Napoleon, its colonies began to govern themselves, then to fight.
        [Simón Bolívar]{.red} marched from the north. [José de San Martín]{.blue} crossed the Andes
        from the south, then sailed up the coast.

        In 1822 the two met, once, in a port on the Pacific. **Tap the marker where their routes join.**
      `,
      widget: {
        type: 'world-map', view: 'south-america', aspect: 0.85, mode: 'pickMarker', markerLabels: 'after', answer: 'guayaquil',
        markers: ['caracas', 'bogota', 'guayaquil', 'lima', 'santiago', 'buenosAires'].map((id) => marker(id)),
        lines: [
          { points: [at('caracas'), at('bogota'), at('quito'), at('guayaquil')], color: 'red', arrow: true, label: 'Bolívar', curve: 'straight' },
          { points: [at('buenosAires'), at('mendoza'), at('santiago'), [-74, -30], [-79.5, -14], at('lima'), [-81.5, -7], at('guayaquil')], color: 'blue', arrow: true, label: 'San Martín', curve: 'straight' },
        ],
        alt: 'A map of South America with six lettered markers. A red route runs from the north coast south-west through the mountains to a port on the Pacific. A blue route starts on the south-east coast, crosses the continent westwards, then runs north along the Pacific coast to the same port.',
      },
      check: (s) => s.picked === 'guayaquil'
        || (s.picked === 'lima' ? 'That is Lima, where San Martín declared Peru independent. Follow the blue line a little further north.'
          : s.picked ? 'Only one route passes through that city. Find the marker that both lines reach.' : false),
      solution: { picked: 'guayaquil' },
      hints: ['Follow the red line down from the north and the blue line up the coast. They end at the same marker.'],
      explain: `
        **Guayaquil**, in today's Ecuador. Afterwards San Martín withdrew, and Bolívar's general
        Sucre finished the war at Ayacucho in 1824. In Mexico a priest, Miguel Hidalgo, had begun
        a revolt in 1810; independence came in 1821.

        The new republics were led by American-born landowners. Slavery ended only gradually,
        and Indigenous communities often lost land. Bolívar's dream of one great union broke up,
        but **Bolivia** still carries his name.
      `,
    },
    {
      id: 'brazil',
      type: 'fill',
      title: 'Brazil takes another road',
      text: 'Portugal\'s colony became independent with hardly a battle. **Complete the story.**',
      template: `
        In 1807 the Portuguese royal family fled Napoleon's army and moved its court to [[*Rio de Janeiro|Lima|Buenos Aires]].
        When the king went home, his [[general|bishop|*son]] Pedro stayed, and in 1822 declared Brazil independent.
        The new country was not a republic but an [[alliance|*empire|island]], and slavery there lasted until [[1808|1830|*1888]].
      `,
      explain: `
        Brazil kept its prince, its great estates and its unity: Spanish America split into
        many republics, Portuguese America stayed one country. It was the last state in the
        Americas to abolish slavery, in 1888.
      `,
    },
    {
      id: 'order',
      type: 'order',
      review: true,
      text: 'Each of these helped to cause the next. **Put them in order, earliest first.**',
      items: inOrder(['usDeclaration', 'bastille', 'haitiIndependence', 'napoleonSpain', 'ayacucho']),
      labels: ['Earliest', 'Latest'],
      explain: `
        **1776**, **1789**, **1804**, **1808**, **1824**: less than fifty years from Philadelphia to
        the last Spanish army on the mainland.
      `,
    },
    {
      id: 'which-first',
      type: 'choice',
      review: true,
      gen: (rng) => whichFirst(rng, ['usDeclaration', 'bastille', 'haitiIndependence', 'hidalgo', 'brazilIndependence', 'brazilAbolition', 'wattPatent'], { gap: 6 }),
    },
    {
      id: 'find-scene',
      type: 'interact',
      tone: 'sober',
      review: true,
      gen: (rng) => markerQuiz(rng, {
        items: SCENES, view: ATLANTIC,
        lead: 'Seven places of the age of revolutions, 1776 to 1825.',
        alt: 'A map of the Atlantic Ocean with the Americas on the left and western Europe on the right. Seven lettered markers: one on the east coast of North America, one in central Mexico, one in the Caribbean, one on the north coast of South America, two on the east coast of South America and one in France.',
      }),
    },
    {
      id: 'metre',
      type: 'numeric',
      title: 'An echo today',
      text: `
        Revolutionary France wanted measures "for all time, for all people". Surveyors spent
        seven years measuring the line from Dunkirk to Barcelona to fix a new unit: the **metre**,
        one ten-millionth of the distance from the North Pole to the equator.

        So roughly **how far is it all the way round the Earth**, through both poles?
      `,
      answer: 40000, tolerance: 100, unit: 'km',
      wrong: [
        [10000, 'That is the distance from the pole to the equator: a quarter of the way round.'],
        [20000, 'That is from pole to pole: halfway round.'],
        [10000000, 'That is the number of metres from pole to equator. The question asks for kilometres, all the way round.'],
        [40000000, 'Right distance, but in metres. Give it in kilometres.'],
      ],
      hints: ['Ten million metres is 10,000 km. Pole to equator is a quarter of a full circle.'],
      explain: `
        Pole to equator was defined as 10,000 km, so the full circle is **40,000 km**. Almost every
        country now measures in metres. The same decade gave politics its "left" and "right",
        and gave much of the world the idea that a country belongs to its citizens.
      `,
    },
  ],
  recap: [
    'Between 1776 and 1825 revolutions in **North America, France, Haiti and Latin America** ended most European rule in the Americas, each helping to set off the next.',
    'They joined Enlightenment **ideas** about rights to real **grievances**: taxes, debts, slavery, rule from far away.',
    '**Haiti** (1804) is the only state founded by a revolt of enslaved people, and was made to pay for it.',
    '"All men are equal" at first left out women, the enslaved and Indigenous peoples. The promise was larger than the practice, and people have held governments to it ever since.',
  ],
  next: 'Next: the new idea that every people should have its own state redraws Europe, while a few industrial powers carve up Africa and Asia.',
};
