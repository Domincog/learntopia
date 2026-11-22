// The Modern World: 1750 to Today · Lesson 1 · Coal, Steam and Cotton
import { pic, marker, timelineEvents, whichFirst, markerQuiz } from '../helpers.js';

// Great Britain, tall enough to hold Glasgow and London, narrow enough to keep Liverpool and Manchester apart.
const BRITAIN = [-5.7, 50.0, 1.9, 57.4];
const COALFIELDS = [
  { circle: [-3.45, 51.68], km: 42, color: 'gray', label: 'Coalfields (roughly)', labelAt: [-3.45, 51.05] },
  { circle: [-1.6, 54.85], km: 38, color: 'gray' },
  { circle: [-2.4, 53.6], km: 24, color: 'gray' },
  { circle: [-1.35, 53.55], km: 36, color: 'gray' },
  { circle: [-2.0, 52.62], km: 32, color: 'gray' },
  { circle: [-3.9, 55.88], km: 46, color: 'gray' },
];
const TOWNS = [
  { id: 'manchester', clue: 'the cotton-mill town nicknamed "Cottonopolis"', where: 'a town a short way inland from the west-coast port, beside a coalfield', more: 'Damp air, coal underfoot and a port 50 km away made Manchester the centre of the world\'s cotton industry.' },
  { id: 'liverpool', clue: 'the Atlantic port where the bales of raw cotton came ashore', where: 'a port on the west coast, facing the Atlantic', more: 'Liverpool faced the Americas. Cotton came in and finished cloth went out through its docks.' },
  { id: 'newcastle', clue: 'the coal port on the River Tyne, in the north-east', where: 'the north-east coast of England', more: 'Ships had carried Newcastle coal down the coast to London\'s fireplaces since the Middle Ages.' },
  { id: 'birmingham', clue: 'the metal-working town in the Midlands where Boulton and Watt built their engines', where: 'the middle of England, far from any coast', more: 'At the Soho works near Birmingham, Matthew Boulton\'s money and James Watt\'s design turned steam into a business from 1775.' },
  { id: 'glasgow', clue: 'the Scottish city where James Watt was repairing a model engine when he had his idea', where: 'Scotland, on the western side', more: 'Watt made instruments for the University of Glasgow. Mending its model Newcomen engine in the 1760s set him thinking.' },
  { id: 'london', clue: 'the capital, already Europe\'s largest city, with about a million people in 1800', where: 'the south-east, on the River Thames', more: 'London was the great market: a million customers, banks to lend money and a port trading with the world.' },
];
// The six dated milestones of the lesson: the timeline that teaches them and the "which came first?" step share this list.
export const MILESTONES = ['newcomen', 'wattPatent', 'cottonGin', 'lmRailway', 'atlanticCable', 'japanRailway'];

export default {
  id: 'industrial-revolution',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The best cloth in the world',
      text: `
        It is 1750. Merchants from Lisbon to Jakarta want one kind of cloth above all:
        light, washable, brightly printed **cotton**.

        **Where do you think most of it was made?**
      `,
      figure: {
        type: 'world-map', zoom: false,
        regions: [
          { ids: ['GB'], color: 'blue', label: 'Britain' },
          { ids: ['EG'], color: 'green', label: 'Egypt' },
          { ids: ['IN'], color: 'orange', label: 'India' },
          { ids: ['CN'], color: 'red', label: 'China' },
        ],
        alt: 'A world map with four places highlighted: Britain, Egypt, India and China.',
      },
      options: [
        { text: 'India', correct: true },
        { text: 'Britain' },
        { text: 'China' },
        { text: 'Egypt' },
      ],
      explain: `
        **India.** Its spinners and weavers clothed much of the world, and English still carries
        the labels: *calico* (from the port of Calicut) and *chintz* (from a Hindi word).

        A century later the flow had reversed. Cloth spun by steam in the north of England was
        on sale in Indian markets. This lesson asks **how a damp island that cannot grow cotton
        became the world's workshop**, and what that did to everyone else.
      `,
    },
    {
      id: 'speed-limit',
      type: 'info',
      title: 'A world with a speed limit',
      text: `
        Before 1750 almost all energy was this year's sunshine: food for the **muscles** of people,
        horses and oxen, **firewood** for heat, **wind** and **running water** for sails and mills.
        All of it had to grow or flow afresh each year, so a country's energy was capped by its land.

        Coal is different. It is ancient forest, pressed underground for some 300 million years:
        a savings account of sunlight. Britain began to spend it.

        :::key
        Fossil fuel lifted the limit that land had set on every earlier society.
        :::
      `,
      figure: {
        type: 'bars',
        data: [
          { label: '1700', value: 3, color: 'gray' },
          { label: '1800', value: 15, color: 'gray' },
          { label: '1900', value: 225, color: 'orange' },
        ],
        yMax: 250, yStep: 50, yLabel: 'million tonnes a year',
        alt: 'Bar chart of coal mined in Britain each year: about 3 million tonnes in 1700, about 15 million in 1800 and about 225 million in 1900.',
        caption: 'Coal mined in Britain each year (rounded estimates)',
      },
    },
    {
      id: 'cottonopolis',
      type: 'interact',
      title: 'Why there?',
      text: `
        Raw cotton came by ship from the Americas, most of it to the north-west of England.
        Turning it into cloth by machine needed three things close together: **an Atlantic port,
        coal, and damp air** (dry cotton thread snaps).

        The grey patches are Britain's main coalfields. Rain blows in from the west.
        **Tap the marker where you would build your mills.**
      `,
      widget: {
        type: 'world-map', view: BRITAIN, aspect: 0.82, mode: 'pickMarker', markerLabels: 'after', answer: 'manchester',
        areas: COALFIELDS,
        markers: TOWNS.map((t) => marker(t.id, { color: 'red' })),
        alt: 'A map of Great Britain. Six grey patches mark coalfields in central Scotland, north-east England, Lancashire, Yorkshire, the Midlands and south Wales. Six lettered markers show towns.',
      },
      check: (s) => s.picked === 'manchester'
        || (s.picked === 'liverpool' ? 'That is the port itself, Liverpool: perfect for landing cotton, but the coal lies a little inland.'
          : s.picked === 'london' ? 'That is London: a huge market, but far from any coalfield and on the drier side of the island.'
            : s.picked === 'newcastle' ? 'Plenty of coal there (it is Newcastle), but it is on the drier east coast, facing away from the Atlantic.'
              : s.picked === 'glasgow' ? 'That is Glasgow, in Scotland. It had coal, rain and a port of its own, and it did become a cotton town. But most of the cotton landed in north-west England: look there.'
                : s.picked ? 'Coal is close by there, but it is far from the sea. Look for the spot nearest to a west-coast port.' : false),
      solution: { picked: 'manchester' },
      hints: ['Find the west-coast marker that sits on the sea. Then look just inland from it, at the nearest coalfield.'],
      explain: `
        **Manchester**: on the Lancashire coalfield, on the rainy side of the Pennine hills, 50 km
        from the port of **Liverpool**. In 1750 it was a market town. A century later people called it
        "Cottonopolis".
      `,
    },
    {
      id: 'teach-why-britain',
      type: 'info',
      title: 'An island with advantages',
      text: `
        Coal, cotton and clever mechanics existed in other countries too. Historians give
        several reasons why the breakthrough came in Britain, around 1780:

        - **Coal near water.** It lay near the surface, close to rivers and the sea. Ships had
          carried coal from **Newcastle**, on the River Tyne, to London's fireplaces since the Middle Ages.
        - **High wages, cheap fuel.** A machine that saved labour paid for itself.
        - **Trade.** Colonies and Atlantic trade supplied raw cotton and customers.
        - **A great market.** **London**, the capital, had about a million people in 1800. It was
          Europe's largest city, with banks to lend money.
      `,
      figure: {
        type: 'world-map', view: BRITAIN, aspect: 0.82,
        areas: COALFIELDS,
        markers: TOWNS.map((t) => marker(t.id, { color: 'red' })),
        alt: 'A map of Great Britain. Six grey patches mark coalfields. Six towns are named: Glasgow in Scotland, Newcastle in the north-east, Liverpool and Manchester close together in the north-west, Birmingham in the Midlands and London in the south-east.',
      },
    },
    {
      id: 'why-britain',
      type: 'multi',
      title: 'Why Britain first?',
      text: `
        Historians still argue about why the breakthrough came in Britain and not somewhere else.

        **Which of these are among the reasons they give?**
      `,
      columns: 1,
      options: [
        { text: 'Coal lay near the surface, close to rivers and the sea', correct: true },
        { text: 'Wages were high and coal was cheap, so a machine that saved labour paid for itself', correct: true },
        { text: 'Colonies and Atlantic trade supplied raw cotton and customers', correct: true },
        { text: 'Only the British understood science', why: 'Science was international: France led in chemistry, and China had smelted iron with coal 700 years earlier.' },
        { text: 'Britain had more people than any other country', why: 'England had about 6 million people in 1750. China had around 200 million.' },
      ],
      explain: `
        Historians weigh the true ones differently. Some stress **cheap coal and dear labour**, some
        **colonies and slave-grown cotton**, some **laws, banks and patents** that rewarded inventors.
        Most agree it took several at once, which is why it happened in one place first.
      `,
    },
    {
      id: 'engine',
      type: 'choice',
      text: `
        The first working steam engine, Thomas Newcomen's of 1712, burned mountains of coal just to
        rock a beam up and down.

        **Where would such a hungry, clumsy machine be worth using?**
      `,
      columns: 1,
      options: [
        { text: 'At a coal mine, pumping out water', correct: true },
        { text: 'In a cotton mill, turning the spindles', why: 'An up-and-down beam cannot turn a shaft smoothly. Mills ran on water wheels until Watt\'s rotary engines of the 1780s.' },
        { text: 'On a ship crossing the Atlantic', why: 'It would have needed more coal than the ship could carry. Ocean steamships came a century later.' },
      ],
      explain: `
        At the pit, where fuel cost almost nothing and flooding stopped work. For sixty years steam
        engines did little else.
      `,
    },
    {
      id: 'teach-watt',
      type: 'info',
      title: 'Watt\'s engine',
      text: `
        **James Watt** changed that. He made instruments for the University of **Glasgow**, and
        mending its model of Newcomen's engine in the 1760s set him thinking. His separate
        condenser, patented in **1769**, cut the coal needed by well over half.

        From 1775, at the Soho works near **Birmingham**, Matthew Boulton's money and Watt's
        design turned steam into a business. By the 1780s their engines turned a **wheel**,
        like the one on the right of the photo. Now an engine could stand anywhere and drive anything.
      `,
      figure: pic('watt-engine', {
        alt: 'A large green steam engine on a plinth in a hall: an upright cylinder on the left, a frame of columns carrying a rocking beam across the top, and on the right a huge spoked flywheel with a toothed gear.',
        caption: 'A steam engine of James Watt\'s design, built in 1859',
      }),
    },
    {
      id: 'mule',
      type: 'interact',
      tone: 'sober',
      title: 'Inside the mill',
      text: `
        A cotton mill in 1835. After the spinning jenny and the water frame came the **mule**,
        the long machine shown here: each does the work of hundreds of hand spinners.

        Three workers tend them. **Tap the one whose job is to crawl under the moving machine and
        sweep up loose cotton.**
      `,
      widget: pic('mule-spinning', {
        alt: 'An engraving of a long factory room under a glass roof. Rows of spinning machines stretch into the distance. A man leans over one machine, a boy stands at another, and a small figure lies on the floor underneath the threads.',
        creditLabel: 'Engraving',
        hotspots: [
          { id: 'spinner', x: 0.445, y: 0.6, r: 0.06, label: 'The spinner, an adult', alt: 'a man in shirtsleeves leaning over a machine' },
          { id: 'piecer', x: 0.645, y: 0.7, r: 0.06, label: 'A piecer, who joins broken threads', alt: 'a boy standing at the edge of a machine' },
          { id: 'scavenger', x: 0.875, y: 0.82, r: 0.065, label: 'A scavenger, the youngest worker', alt: 'a small figure lying on the floor under the threads' },
        ],
      }),
      check: (s) => s.picked === 'scavenger'
        || (s.picked === 'spinner' ? 'He is the spinner, the skilled adult in charge of the machine. Look lower down.'
          : s.picked === 'piecer' ? 'That boy is a piecer: he twists broken threads together. Someone smaller is beneath the machine.' : false),
      solution: { picked: 'scavenger' },
      hints: ['Look at the floor on the right-hand side.'],
      explain: `
        The **scavenger** was usually the youngest child in the room, small enough to work
        beneath the threads while the machine ran. Days of twelve hours or more were normal.

        Protest, strikes and inquiries slowly brought rules. The Factory Act of 1833 banned
        mill work for children under nine and sent out the first inspectors.
      `,
    },
    {
      id: 'manchester',
      type: 'slider',
      mode: 'predict',
      title: 'The first factory city',
      text: `
        This is Manchester, painted from the fields outside it in 1852. Count the chimneys.

        In the census of 1801 the town had about **75,000** people. **How many do you think it had
        fifty years later?**
      `,
      figure: pic('manchester-kersal', {
        alt: 'A painting: in the foreground a green hillside with resting country people and goats; in the distance a city under a yellow-grey haze, bristling with dozens of tall smoking chimneys.',
        caption: 'William Wyld, Manchester from Kersal Moor, 1852',
        creditLabel: 'Painting',
      }),
      min: 50, max: 500, step: 10, start: 80, answer: 300, tolerance: 50, unit: 'thousand',
      explain: `
        About **300,000**: four times as many in fifty years, most of them newcomers from the
        countryside and from Ireland.

        The city grew faster than its drains and houses. An official report of 1842 found that
        in Manchester's labouring families the average age at death was **17**, because so many
        babies and children died. Out of such streets came trade unions, and the idea of a
        **working class** with interests of its own.
      `,
    },
    {
      id: 'teach-timeline',
      type: 'info',
      title: 'A century and a half',
      text: `
        None of this happened overnight. Follow it along the line:

        - **1712** and **1769**: the two engines you have met, Newcomen's mine pump and Watt's patent.
        - **1793**: Eli Whitney's cotton gin, a machine for cleaning raw cotton. You will meet it again.
        - **1830**: the Liverpool and Manchester Railway, the first railway between two cities.
        - **1866**: a telegraph cable under the Atlantic that lasted.
        - **1872**: Japan's first railway. Industry had spread beyond Europe.
      `,
      figure: {
        type: 'timeline', from: 1700, to: 1880, step: 20, showYears: true, mode: 'static',
        events: timelineEvents(MILESTONES, {
          newcomen: { label: 'Newcomen\'s pump', short: 'Pump' },
          wattPatent: { label: 'Watt\'s patent', short: 'Watt' },
          cottonGin: { label: 'Cotton gin', short: 'Gin' },
          lmRailway: { label: 'Liverpool–Manchester railway', short: 'Railway' },
          atlanticCable: { label: 'Atlantic cable', short: 'Cable' },
          japanRailway: { label: 'Japan\'s first railway', short: 'Japan' },
        }),
        alt: 'A timeline from 1700 to 1880: Newcomen\'s mine pump in 1712, Watt\'s patent in 1769, the cotton gin in 1793, the Liverpool and Manchester Railway in 1830, the Atlantic telegraph cable in 1866 and Japan\'s first railway in 1872.',
      },
    },
    {
      id: 'when',
      type: 'interact',
      title: 'How fast did it happen?',
      text: `
        **Drag each card to its place.** Anywhere within 25 years counts.

        Two clues: the mine pump came long before the improved engine, and railways came before
        cables under the ocean.
      `,
      widget: {
        type: 'timeline', from: 1700, to: 1880, step: 20, snap: 5, showYears: true,
        events: timelineEvents(['usDeclaration', 'greatExhibition'], { usDeclaration: { color: 'gray', label: 'American independence' }, greatExhibition: { color: 'gray', label: 'Great Exhibition' } }),
        place: [
          { id: 'newcomen', label: 'Newcomen\'s mine pump', answer: 1712 },
          { id: 'wattPatent', label: 'Watt\'s patent', answer: 1769 },
          { id: 'lmRailway', label: 'Liverpool–Manchester railway', answer: 1830 },
          { id: 'atlanticCable', label: 'Atlantic telegraph cable', answer: 1866 },
        ],
        alt: 'A timeline from 1700 to 1880 with two fixed events, the American Declaration of Independence in 1776 and the Great Exhibition in London in 1851, and four cards to place.',
      },
      check: (s) => {
        if (!s.complete) return 'Place all four cards on the line.';
        const p = s.placed;
        if (Math.abs(p.newcomen - 1712) > 25) return 'Newcomen\'s pump is the oldest of the four: it belongs near the start of the 1700s.';
        if (Math.abs(p.wattPatent - 1769) > 25) return 'Watt took out his patent a few years before the American Declaration of Independence.';
        if (Math.abs(p.lmRailway - 1830) > 25) return 'The railway opened about twenty years before the Great Exhibition.';
        return Math.abs(p.atlanticCable - 1866) <= 25 || 'The cable came last, after the Great Exhibition.';
      },
      solution: { placed: { newcomen: 1710, wattPatent: 1770, lmRailway: 1830, atlanticCable: 1865 } },
      explain: `
        Not overnight: **1712**, **1769**, **1830**, **1866**. More than a century lies between the
        first mine pump and the first railway between two cities. Coal smelted the iron, too:
        cheap iron made the engines, the rails and the bridges.

        After that, change sped up. Steamships and the telegraph shrank the world: around 1800 news
        from India reached London in about five months, and by 1870 in a few hours.
      `,
    },
    {
      id: 'teach-spread',
      type: 'info',
      title: 'It spreads',
      text: `
        Britain tried to keep its machines secret, and failed. Mechanics emigrated, with the
        designs in their heads.

        **Belgium** was first. An English mechanic, William Cockerill, built spinning machines
        there from 1799, and his son John founded a great ironworks on the coalfield near Liège.

        Then came **Germany**, **France** and the **United States**, and after 1868 **Japan**,
        whose first railway opened in 1872. Wherever there was coal, capital and a government
        that wanted factories, the pattern repeated.
      `,
      figure: {
        type: 'world-map', zoom: false,
        regions: [
          { ids: ['GB'], color: 'blue', label: 'Britain, from about 1780' },
          { ids: ['BE', 'DE', 'FR', 'US'], color: 'orange', label: 'Belgium, then Germany, France and the United States', mainBodyOnly: true },
          { ids: ['JP'], color: 'red', label: 'Japan, after 1868' },
        ],
        alt: 'A world map. Britain is highlighted as the first industrial country; Belgium, Germany, France and the United States as the next; Japan as the first in Asia, after 1868.',
      },
    },
    {
      id: 'belgium',
      type: 'interact',
      title: 'First on the Continent',
      text: `
        The first country on the Continent to build factories and railways was small, close to
        Britain, and sat on thick seams of coal. **Tap it.**
      `,
      widget: {
        type: 'world-map', view: ['FR', 'DE', 'BE', 'NL', 'CH'], mode: 'pick', answer: 'BE',
        pickable: ['FR', 'DE', 'BE', 'NL', 'CH', 'LU', 'AT', 'IT', 'ES', 'DK', 'CZ', 'PL', 'GB'],
        alt: 'A map of western Europe without names, from Spain to Poland.',
      },
      check: (s) => s.picked === 'BE'
        || (s.picked === 'NL' ? 'That is the Netherlands: rich from trade, but with very little coal. Look just to its south.'
          : s.picked === 'FR' ? 'That is France: it industrialised more slowly, with coal that was scarcer and scattered. The answer is a small neighbour.'
            : s.picked === 'DE' ? 'That is Germany: its Ruhr coalfield boomed, but mostly after 1850. A smaller neighbour got there first.'
              : s.picked ? `That is ${s.nameThe || s.name}. Look for a small country across the sea from south-east England.` : false),
      solution: { picked: 'BE' },
      hints: ['It lies between France, Germany and the Netherlands.'],
      explain: `
        **Belgium**, wedged between France, Germany and the Netherlands, a short sea crossing
        from south-east England. The Cockerills' machines and ironworks stood on its coalfield.
      `,
    },
    {
      id: 'teach-chain',
      type: 'info',
      tone: 'sober',
      title: 'One chain, two oceans',
      text: `
        A Manchester mill was one link in a chain.

        - **The American South** grew the raw cotton. Enslaved people planted and picked it.
          After 1793 the cotton gin, which pulls the seeds out of the fibre, made the crop pay
          far better. The number of enslaved people in the United States grew from about
          700,000 in 1790 to nearly 4 million in 1860.
        - **Liverpool** landed the bales.
        - **Manchester** spun and wove them by steam.
        - **India**, once the world's weaver, became a huge market. Machine-made cloth
          undersold its hand weavers.
      `,
      figure: {
        type: 'world-map', view: [-105, -42, 95, 62], zoom: false, dots: false,
        regions: [
          { ids: ['US'], color: 'orange', tone: 'soft', mainBodyOnly: true },
          { ids: ['IN'], color: 'green', tone: 'soft' },
        ],
        markers: [
          { id: 'south', at: 'New Orleans', label: 'The American South', color: 'orange', labelPos: 'bottom' },
          marker('liverpool', { label: 'Liverpool and Manchester', color: 'red', labelPos: 'top' }),
          { id: 'india', at: 'Mumbai', label: 'India', color: 'green', labelPos: 'top' },
        ],
        lines: [
          { points: ['south', [-70, 33], [-40, 45], 'liverpool'], color: 'orange', arrow: true, label: 'Raw cotton', labelOn: 'legend' },
          { points: ['liverpool', [-13, 44], [-21, 15], [-8, -15], [14, -36], [24, -37], [48, -20], [62, 5], 'india'], color: 'red', arrow: true, label: 'Cotton cloth', labelOn: 'legend' },
        ],
        alt: 'A map of the Atlantic and Indian Oceans. One arrow, raw cotton, runs from the south of the United States across the Atlantic to Liverpool and Manchester. A second arrow, cotton cloth, runs from there round the south of Africa to India.',
      },
    },
    {
      id: 'follow-cotton',
      type: 'match',
      tone: 'sober',
      title: 'Follow the cotton',
      text: `
        A Manchester mill was one link in a chain that crossed two oceans.
        **Match each place with its part in the chain.**
      `,
      pairs: [
        ['The American South', 'Raw cotton, grown and picked by enslaved people'],
        ['Liverpool', 'The port where the bales came ashore'],
        ['Manchester', 'Spinning and weaving by steam'],
        ['India', 'A huge market, whose hand weavers were undersold'],
      ],
      explain: `
        By the 1850s about three-quarters of Britain's raw cotton came from the United States.
        Factory and plantation were parts of one system, and at the far end India's weavers
        lost their markets. Industrialisation had losers as well as winners.
      `,
    },
    {
      id: 'divergence',
      type: 'choice',
      review: true,
      title: 'The great divergence',
      text: `
        The chart shows estimated shares of **everything manufactured in the world**, before and
        after the Industrial Revolution.

        **What does it show?**
      `,
      figure: {
        type: 'bars',
        categories: ['China', 'India', 'Britain', 'United States'],
        series: [
          { name: '1750', color: 'gray', values: [33, 25, 2, 0.1] },
          { name: '1900', color: 'orange', values: [6, 2, 19, 24] },
        ],
        yMax: 40, yStep: 10, yLabel: '% of world manufacturing', unit: '%',
        alt: 'Grouped bar chart of shares of world manufacturing. China: 33% in 1750, 6% in 1900. India: 25%, then 2%. Britain: 2%, then 19%. United States: almost nothing, then 24%.',
        caption: 'Estimates by the economic historian Paul Bairoch (rounded)',
      },
      columns: 1,
      options: [
        { text: 'Manufacturing moved from Asia to the countries with factories', correct: true },
        { text: 'China and India made less because their populations shrank', why: 'Both populations grew. Their share fell because factory output elsewhere exploded, and because machine-made imports undercut their own craft industries.' },
        { text: 'By 1900 Britain made most of the world\'s goods', why: 'Britain\'s share peaked at about a fifth, and by 1900 the United States had overtaken it.' },
      ],
      explain: `
        In 1750 most of the world's goods were made in Asia, by hand. By 1900 most were made by
        machines in Europe and North America, and average incomes had pulled far apart. Historians
        call this the **great divergence**. The figures are rough estimates, but the direction is
        not in doubt.
      `,
    },
    {
      id: 'which-first',
      type: 'choice',
      review: true,
      gen: (rng) => whichFirst(rng, MILESTONES),
    },
    {
      id: 'find-town',
      type: 'interact',
      review: true,
      gen: (rng) => markerQuiz(rng, {
        items: TOWNS, view: BRITAIN, aspect: 0.82,
        lead: 'Six towns of Britain\'s Industrial Revolution. The grey patches are coalfields.',
        alt: 'A map of Great Britain with grey patches for coalfields and six lettered markers: one in Scotland, one in north-east England, two close together in the north-west, one in the Midlands and one in the south-east.',
        extra: { areas: COALFIELDS },
      }),
    },
    {
      id: 'watt-unit',
      type: 'short',
      title: 'An echo today',
      text: `
        Look at any light bulb, kettle or phone charger. Its power is given in a unit named after
        the engineer who made steam engines practical.

        **What is the unit called?**
      `,
      answers: ['watt', 'watts', 'the watt', 'W', /^(a |the )?(kilo)?watts?$/i],
      wrong: [
        ['horsepower', 'Close. He invented "horsepower" as well, to tell mine owners how many horses an engine would replace. The modern unit carries his own name.'],
        ['newcomen', 'Newcomen built the first engine, but the unit is named after the man who improved it.'],
        ['volt', 'The volt honours Alessandro Volta and measures electrical "push". Power has a different unit.'],
      ],
      hints: ['His separate condenser was patented in 1769.'],
      explain: `
        The **watt**, after James Watt. The coal his engines burned left another trace as well:
        carbon dioxide that is still in the air. The last lesson of this course picks up that story.
      `,
    },
  ],
  recap: [
    'Before 1750 energy came from muscle, wood, wind and water. **Coal**, burned in **steam engines**, lifted that limit.',
    'It began in **Britain** about 1780: coal near water, high wages, cheap fuel, and cotton and customers from colonies and Atlantic trade.',
    'Factories made new cities such as **Manchester**, child labour, a working class, and in time laws to protect workers.',
    'Industry spread to Belgium, Germany, the United States and Japan, and shifted wealth away from Asia: the **great divergence**.',
  ],
  next: 'Next: while the first mills were going up, people in Philadelphia, Paris and Haiti were tearing down something much older than the water wheel.',
};
