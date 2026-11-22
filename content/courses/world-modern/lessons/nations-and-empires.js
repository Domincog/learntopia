// The Modern World: 1750 to Today · Lesson 3 · Flags and Empires
import { countryName } from '../../../../src/widgets/world-map.js';
import { pic, marker, inOrder, countryQuiz } from '../helpers.js';

// Who ruled where in 1914. Only cases that are beyond dispute (no protectorates in name only, no shared rule).
export const RULED_1914 = [
  { code: 'NG', by: 'Britain', view: 'africa', note: 'Britain joined its northern and southern territories into one colony, Nigeria, in 1914. It became independent in 1960.' },
  { code: 'KE', by: 'Britain', view: 'africa', note: 'It was British East Africa, where settlers took the best highland farms. Kenya became independent in 1963.' },
  { code: 'GH', by: 'Britain', view: 'west-africa', note: 'The British called it the Gold Coast. As Ghana it became independent in 1957.' },
  { code: 'IN', by: 'Britain', view: 'south-asia', note: 'After the uprising of 1857 the British Crown ruled India directly: the Raj. It lasted until 1947.' },
  { code: 'SN', by: 'France', view: 'west-africa', note: 'Dakar was the capital of all French West Africa. Senegal became independent in 1960.' },
  { code: 'DZ', by: 'France', view: 'africa', note: 'France invaded in 1830 and later declared Algeria part of France itself. Independence came in 1962, after a long war.' },
  { code: 'MG', by: 'France', view: 'africa', note: 'France conquered the island\'s kingdom in the 1890s. Madagascar became independent in 1960.' },
  { code: 'VN', by: 'France', view: 'southeast-asia', note: 'With Laos and Cambodia it formed French Indochina. French rule ended in 1954.' },
  { code: 'CD', by: 'Belgium', view: 'africa', note: 'King Leopold II\'s private "Congo Free State" was taken over by the Belgian state in 1908. Independence came in 1960.' },
  { code: 'AO', by: 'Portugal', view: 'africa', note: 'Portugal had held ports on this coast since the 1500s. Angola became independent in 1975.' },
  { code: 'MZ', by: 'Portugal', view: 'africa', note: 'Portugal was the first European empire in Africa and one of the last to leave: Mozambique became independent in 1975.' },
  { code: 'NA', by: 'Germany', view: 'africa', note: 'In German South West Africa, German troops killed most of the Herero people and about half of the Nama in 1904 to 1908, a genocide Germany has since acknowledged. Namibia became independent in 1990.' },
  { code: 'CM', by: 'Germany', view: 'africa', note: 'German Kamerun was divided between France and Britain after the First World War. Cameroon became independent in 1960.' },
  { code: 'LY', by: 'Italy', view: 'africa', note: 'Italy took it from the Ottoman Empire in 1911 and 1912. Libya became independent in 1951.' },
  { code: 'ID', by: 'the Netherlands', view: 'southeast-asia', note: 'The Dutch East Indies grew out of the spice trade you met in *One World*. Indonesia declared independence in 1945.' },
  { code: 'PH', by: 'the United States', view: 'southeast-asia', note: 'Spain ruled the Philippines for over 300 years, until the United States took them in 1898. Independence came in 1946.' },
  { code: 'KR', by: 'Japan', view: 'east-asia', note: 'Japan, itself newly industrial, annexed Korea in 1910 and ruled it until 1945.' },
];
const POWERS = ['Britain', 'France', 'Germany', 'Portugal', 'Belgium', 'Italy', 'the Netherlands', 'Japan', 'the United States', 'Spain'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const ASIA_1910 = [
  { ids: ['IN', 'PK', 'BD', 'MM', 'LK', 'MY', 'BN'], color: 'red', label: 'British' },
  { ids: ['VN', 'LA', 'KH'], color: 'blue', label: 'French' },
  { ids: ['ID'], color: 'orange', label: 'Dutch' },
  { ids: ['PH'], color: 'teal', label: 'United States' },
  { ids: ['JP', 'KR', 'KP', 'TW'], color: 'violet', label: 'Japan and its colonies' },
];
// The Asian countries of RULED_1914: named on the map of Asia, so that "who ruled it in 1914?" asks nothing unseen.
const ASIA_NAMED = RULED_1914.filter((t) => !t.view.includes('africa')).map((t) => (t.code === 'KR' ? { id: 'KR', text: 'Korea' } : t.code));
// The African countries of RULED_1914, grouped by ruler, for the teaching map of the Scramble.
const AFRICA_1914 = RULED_1914.filter((t) => t.view.includes('africa'));
const POWER_COLORS = { Britain: 'red', France: 'blue', Germany: 'orange', Portugal: 'green', Belgium: 'violet', Italy: 'teal' };
const AFRICA_GROUPS = Object.keys(POWER_COLORS).map((by) => ({ ids: AFRICA_1914.filter((t) => t.by === by).map((t) => t.code), color: POWER_COLORS[by], label: by }));

const FIND = [
  { code: 'IT', view: 'europe', clue: 'Italy, a single kingdom from 1861', hint: 'Look for the long boot-shaped peninsula in the Mediterranean.', more: 'Before 1861 the peninsula was a patchwork of kingdoms, duchies and lands of the Pope.' },
  { code: 'DE', view: 'europe', clue: 'Germany, proclaimed an empire in 1871', hint: 'Look in the middle of Europe, between France and Poland.', more: 'Prussia united some two dozen German states by diplomacy and three short wars.' },
  { code: 'JP', view: 'east-asia', clue: 'Japan, which industrialised after 1868 so as not to be colonised', hint: 'Look for the chain of islands off the east coast of Asia.', more: 'Within forty years of the Meiji Restoration Japan had railways, a constitution and a navy that beat Russia\'s.' },
  { code: 'ET', view: 'africa', clue: 'Ethiopia, which defeated an Italian army at Adwa in 1896', hint: 'Look in the Horn of Africa, the highlands inland from the Red Sea.', more: 'Ethiopia stayed independent through the whole Scramble for Africa.' },
  { code: 'LR', view: 'west-africa', clue: 'Liberia, the republic founded by freed African Americans', hint: 'Look on the Atlantic coast of West Africa, just where the coast turns east.', more: 'Independent since 1847, Liberia was one of only two African states not under European rule in 1914.' },
  { code: 'CD', view: 'africa', clue: 'the Democratic Republic of the Congo, once King Leopold\'s "Congo Free State"', hint: 'Look for the very large country in the middle of Africa that has only a sliver of coast.', more: 'It is about 76 times the size of Belgium, the country whose king once owned it.' },
  { code: 'TH', view: 'southeast-asia', clue: 'Thailand (Siam), the one country of Southeast Asia that was never colonised', hint: 'Look on the mainland, between Myanmar on the west and Laos and Cambodia on the east.', more: 'Its kings modernised the state and played Britain and France off against each other.' },
];

export default {
  id: 'nations-and-empires',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Forty-four years',
      text: `
        In 1870 Europeans ruled only about **a tenth** of Africa: Algeria, the far south and
        strips of coast. The interior was ruled by African kingdoms, empires and communities.

        **What share of Africa do you think was under European rule by 1914?**
      `,
      min: 0, max: 100, step: 5, start: 10, answer: 90, tolerance: 10, unit: '%',
      explain: `
        About **nine-tenths**. In one generation, seven European states divided almost a whole
        continent among themselves.

        This lesson asks **how a handful of industrial countries came to rule so much of the
        world**, and how a few places escaped. It starts in Europe, with a new and powerful idea.
      `,
    },
    {
      id: 'nation',
      type: 'choice',
      mode: 'predict',
      title: 'Making a nation',
      text: `
        The idea: every **nation**, a people with a shared language and history, should have its own
        state. In 1861 a patchwork of kingdoms and duchies became [Italy]{.green}. In 1871 Prussia welded
        some two dozen states into [Germany]{.orange}.

        **When Italy was unified, about how many of its people spoke Italian?**
      `,
      figure: {
        type: 'world-map', view: 'europe', zoom: false,
        regions: [
          { ids: ['IT'], color: 'green', label: 'Italy, unified 1861' },
          { ids: ['DE'], color: 'orange', label: 'Germany, unified 1871' },
        ],
        alt: 'A map of Europe with two countries highlighted: Italy, unified in 1861, and Germany, unified in 1871 (both with today\'s borders).',
        caption: 'Today\'s borders',
      },
      shuffle: false,
      options: [
        { text: 'Nearly all of them' },
        { text: 'About half' },
        { text: 'One in ten at most', correct: true },
      ],
      explain: `
        Estimates run from about 2.5% to 10%. Everyone else spoke regional languages, from
        Sicilian to Venetian. A saying of those years, later credited to the statesman Massimo
        d'Azeglio, put it like this: "We have made Italy. Now we must make Italians."

        Nations were **built**: by schools teaching one language, by conscript armies, railways,
        newspapers, flags and anthems. The idea could unite, as here, or tear apart the
        many-peopled Austrian and Ottoman empires. Keep that in mind for the next lesson.
      `,
    },
    {
      id: 'teach-opium',
      type: 'info',
      title: 'China is forced open',
      text: `
        Britain bought mountains of Chinese tea, but China wanted little that Britain made. So
        British merchants sold **opium**, grown in India and illegal in China.

        In 1839 the official Lin Zexu seized and destroyed more than a thousand tonnes of it at
        [Guangzhou]{.red}. Britain chose war. In the **First Opium War** (1839 to 1842) its iron
        steamships beat China's wooden junks.

        By the **Treaty of Nanjing**, China gave up Hong Kong, opened five ports such as
        [Shanghai]{.blue} and paid for the destroyed opium. More "unequal treaties" with other
        powers followed. China was never made a colony, but foreigners now had privileges on its soil.
      `,
      figure: {
        type: 'world-map', view: { center: [114, 30], span: 34 }, zoom: false,
        regions: [{ ids: ['CN'], color: 'yellow', tone: 'soft' }],
        markers: [
          marker('guangzhou', { label: 'Guangzhou (Canton)', color: 'red', labelPos: 'left' }),
          marker('shanghai', { color: 'blue', shape: 'square' }),
          marker('nanjing', { color: 'blue', shape: 'square', labelPos: 'left' }),
        ],
        alt: 'A map of eastern China. Guangzhou is marked on the south coast; Shanghai and Nanjing are marked further north, near the mouth of the Yangtze.',
      },
    },
    {
      id: 'opium',
      type: 'choice',
      title: 'Britain\'s answer',
      text: `
        In 1839 Lin Zexu destroyed the British merchants' opium at Guangzhou.

        **What did Britain do?**
      `,
      columns: 1,
      options: [
        { text: 'Sent steam-powered warships and forced China to open its ports', correct: true },
        { text: 'Accepted the ban and stopped the opium trade', why: 'The trade was too profitable: it paid for Britain\'s tea. The government chose war.' },
        { text: 'Conquered China and ruled it as a colony', why: 'China was never made a colony. It was forced into treaties that gave foreigners privileges on its soil.' },
      ],
      explain: `
        War, and then a treaty signed under the guns. China stayed independent, but on other
        people's terms. Chinese writers call the years from 1839 to 1949 the "century of humiliation".
      `,
    },
    {
      id: 'japan',
      type: 'choice',
      title: 'Japan answers',
      text: `
        In 1853 American warships arrived to force Japan to open its ports. Japan's leaders had watched
        China being humbled. In 1868 a new government took power in the emperor's name, the
        **Meiji Restoration**, with a slogan: "rich country, strong army".

        This Japanese print was made three years later. **What is it evidence of?**
      `,
      figure: pic('meiji-train', {
        alt: 'A colourful Japanese woodblock print in three panels. A steam locomotive puffing black smoke pulls bright carriages along a causeway beside the sea. In the foreground a crowd in kimono and in Western coats and hats watches, among rickshaws and a horse-drawn carriage; sailing boats and tall-masted ships fill the bay.',
        caption: 'Utagawa Hiroshige III, Steam Train on the Takanawa Coast, Tokyo, 1871',
        creditLabel: 'Print',
      }),
      columns: 1,
      options: [
        { text: 'Japan was taking up Western technology on its own terms', correct: true },
        { text: 'Britain had conquered Japan and built railways there', why: 'Japan was never colonised. It hired foreign engineers, paid them, and sent them home when its own were trained.' },
        { text: 'Japan was keeping foreign inventions out', why: 'The opposite: the train is the proud subject of the picture, drawn in the style of a traditional print.' },
      ],
      explain: `
        An old art form celebrates a new machine. The artist drew it a year before Japan's first
        railway actually opened, in 1872: Tokyo could hardly wait. Schools for all, a conscript
        army, factories and a constitution followed within a generation.

        It worked, and it had a darker side. Japan defeated China (1895) and Russia (1905), and
        then built an empire of its own, taking Taiwan and Korea.
      `,
    },
    {
      id: 'siam',
      type: 'interact',
      tone: 'sober',
      title: 'Asia about 1910',
      text: `
        By 1910 most of South and Southeast Asia was coloured in on some empire's map. Five
        colonies are named on this one: **India** was British (ruled directly since a great
        uprising was crushed in 1857), **Vietnam** French, **Indonesia** Dutch (ruled from the Netherlands), the
        **Philippines** American and **Korea** Japanese.

        One kingdom on the mainland of Southeast Asia kept its independence, squeezed between
        the British and the French. **Tap it.**
      `,
      widget: {
        type: 'world-map', view: [66, -11, 142, 40], mode: 'pick', answer: 'TH', dim: false,
        regions: ASIA_1910,
        labels: ASIA_NAMED,
        pickable: ['TH', 'MM', 'VN', 'LA', 'KH', 'MY', 'IN', 'ID', 'PH', 'CN', 'NP', 'BD'],
        alt: 'A map of South, Southeast and East Asia about 1910, with today\'s borders. India, Pakistan, Bangladesh, Myanmar, Sri Lanka and Malaysia are coloured as British; Vietnam, Laos and Cambodia as French; Indonesia as Dutch; the Philippines as American; Japan, Korea and Taiwan as Japanese. China and a few other countries are not coloured.',
      },
      check: (s) => s.picked === 'TH'
        || (s.picked === 'CN' ? 'China was not a colony, but it is not in Southeast Asia. Look between the red and the blue.'
          : s.picked === 'NP' ? 'Nepal did stay independent, but it lies in the Himalaya. Look further south-east, on the mainland between the red and the blue.'
            : s.picked ? `That is ${s.nameThe || s.name}, which is coloured: it was under foreign rule. Look for the uncoloured country between the red and the blue.` : false),
      solution: { picked: 'TH' },
      hints: ['Find the red (British) and blue (French) areas on the mainland. What lies between them?'],
      explain: `
        **Siam**, today's Thailand. Its kings modernised the army and the government, gave up
        border provinces, and played Britain and France off against each other.

        In British India the uprising of 1857 began among Indian soldiers and spread across the
        north. Afterwards the Crown ruled 250 million people through railways, the telegraph and
        a small corps of officials. In the famine of 1876 to 1878 more than five million died
        while grain was still being exported.
      `,
    },
    {
      id: 'teach-tools',
      type: 'info',
      title: 'Tools of empire',
      text: `
        For 400 years Europeans in Africa had clung to the coasts. Fevers killed newcomers,
        rivers could not be sailed upstream, and African armies were a match for them.

        After about 1850, four products of the Industrial Revolution tipped the balance:

        - **Quinine**, a medicine that wards off malaria, let outsiders survive.
        - **Steamboats** carried them inland, up the rivers.
        - **The machine gun** (the Maxim gun, 1884) let a few hundred soldiers defeat thousands.
        - **The telegraph**, and the Suez Canal (1869), tied the conquests to the capitals.
      `,
    },
    {
      id: 'tools',
      type: 'multi',
      title: 'What tipped the balance?',
      text: `
        For 400 years Europeans in Africa had clung to the coasts.

        **Which inventions changed that after about 1850?**
      `,
      options: [
        { text: 'Quinine, to ward off malaria', correct: true },
        { text: 'Steamboats that could go upriver', correct: true },
        { text: 'The machine gun', correct: true },
        { text: 'The telegraph', correct: true },
        { text: 'The aeroplane', why: 'The first powered flight was in 1903, when the conquest was nearly complete.' },
        { text: 'The magnetic compass', why: 'Sailors had used it for centuries. It got Europeans to the coast, not inland.' },
      ],
      explain: `
        Quinine, steamboats, the machine gun and the telegraph: all four are children of the
        Industrial Revolution. The balance of power had tipped, for a time.
      `,
    },
    {
      id: 'berlin',
      type: 'choice',
      title: 'Berlin, winter 1884',
      text: `
        As rival expeditions raced inland, the German chancellor Bismarck called a conference to
        set the rules for claiming African land. A magazine artist drew the scene.

        **Look at who is at the table, and at the wall. Who is missing?**
      `,
      figure: pic('berlin-conference', {
        alt: 'A black-and-white engraving of a grand room. About twenty men in dark formal coats, all European in appearance, sit and stand around a long curved table covered with papers. Behind them one man points at a very large map of Africa that covers the wall.',
        caption: 'The Berlin Conference, drawn for a German magazine, 1884',
        creditLabel: 'Engraving',
      }),
      columns: 1,
      options: [
        { text: 'Anyone from Africa', correct: true },
        { text: 'The United States', why: 'It sent delegates, as did twelve European governments and the Ottoman Empire.' },
        { text: 'Britain and France', why: 'They were the largest claimants and sat at the table.' },
      ],
      explain: `
        Fourteen governments met for three months. **Not one African was invited.** The conference
        did not draw the borders itself. It agreed that a claim counted only if a power actually
        occupied the land, which turned a race into a stampede: the **Scramble for Africa**.

        Many of the lines drawn in those years are borders today, as you saw in *The World at a Glance*.
      `,
    },
    {
      id: 'teach-scramble',
      type: 'info',
      title: 'Africa in 1914',
      text: `
        By 1914 seven European states had divided almost the whole continent. The map
        colours twelve of today's countries by the power that ruled them then.

        Only two African countries were still independent:

        - **Ethiopia**, an ancient empire in the highlands of the Horn of Africa, inland from the Red Sea.
        - **Liberia**, a small republic on the Atlantic coast of West Africa, founded by freed
          African Americans and independent since 1847.

        Neither is coloured here. You will be asked to find them.
      `,
      figure: {
        type: 'world-map', view: 'africa', zoom: false, dots: false,
        regions: AFRICA_GROUPS,
        labels: AFRICA_1914.map((t) => t.code),
        alt: `A map of Africa with today's borders. Twelve countries are coloured and named by the power that ruled them in 1914: ${AFRICA_GROUPS.map((g) => `${g.label}: ${g.ids.map((id) => countryName(id)).join(', ')}`).join('. ')}.`,
      },
    },
    {
      id: 'two-free',
      type: 'interact',
      title: 'The two exceptions',
      text: `
        By 1914 only **two** African countries were still independent: an ancient mountain empire
        in the east, and a small republic on the west coast founded by freed African Americans.

        **Tap both.**
      `,
      widget: {
        type: 'world-map', view: 'africa', mode: 'pickMany', max: 2, answer: ['ET', 'LR'], pickable: ['africa'],
        alt: 'A map of Africa without names.',
      },
      check: (s) => {
        if (s.picked.join() === 'ET,LR') return true;
        if (s.count < 2) return 'There are two of them: one in the eastern highlands, one on the west coast.';
        const names = s.picked.filter((id) => id !== 'ET' && id !== 'LR').map((id) => countryName(id));
        const got = s.picked.filter((id) => id === 'ET' || id === 'LR').length;
        return `${got ? 'One of those is right. ' : ''}${names.join(' and ')} ${names.length > 1 ? 'were' : 'was'} under European rule in 1914.`;
      },
      solution: { picked: ['ET', 'LR'] },
      hints: ['The empire is in the Horn of Africa, inland from the Red Sea.', 'The republic is small, on the Atlantic coast where West Africa\'s shoreline turns east.'],
      explain: `
        **Ethiopia** and **Liberia**. Liberia, independent since 1847, was sheltered by its ties to
        the United States. Ethiopia kept its freedom on the battlefield.
      `,
    },
    {
      id: 'teach-adwa',
      type: 'info',
      title: 'Adwa, 1 March 1896',
      text: `
        Italy held [Eritrea]{.red}, on the Red Sea, and claimed that a treaty made Ethiopia its
        protectorate. Emperor **Menelik II** replied that the version in his own language,
        Amharic, said no such thing.

        Menelik prepared. He bought tens of thousands of modern rifles from rival powers,
        France and Russia among them. The regional lords united behind him in an army of about
        100,000, and Empress **Taytu** led troops of her own.

        In 1896 an Italian army of about 17,000, with modern rifles and artillery, marched
        south. On 1 March, at Adwa, it was routed. Italy had to recognise Ethiopia's independence.
      `,
      figure: {
        type: 'world-map', view: [31, 2, 50, 19], zoom: false,
        regions: [
          { ids: ['ET'], color: 'green', label: 'Ethiopia' },
          { ids: ['ER'], color: 'red', label: 'Eritrea, an Italian colony from 1890' },
        ],
        markers: [marker('adwa', { shape: 'star', color: 'ink', labelPos: 'bottom' })],
        lines: [{ points: [marker('asmara').at, [39.0, 14.75], marker('adwa').at], color: 'ink', arrow: true, curve: 'straight' }],
        labels: [{ at: [40.6, 17.6], text: 'Red Sea', style: 'water' }],
        alt: 'A map of the Horn of Africa. Ethiopia, a large highland country, is highlighted; Eritrea, the strip of Red Sea coast to its north, is marked as an Italian colony. An arrow runs from Eritrea south to Adwa, just inside northern Ethiopia.',
      },
    },
    {
      id: 'adwa',
      type: 'multi',
      title: 'Why Ethiopia won',
      text: `
        At Adwa, in 1896, Ethiopia routed an invading Italian army.

        **Which of these help to explain the victory?**
      `,
      columns: 1,
      options: [
        { text: 'Menelik had bought tens of thousands of modern rifles', correct: true },
        { text: 'Regional lords united behind him in an army of about 100,000', correct: true },
        { text: 'The Italians had no firearms', why: 'They had modern rifles and artillery. What they lacked was numbers, good maps and respect for their opponent.' },
        { text: 'Other European powers sent armies to help Ethiopia', why: 'No army came. Menelik did buy weapons from rival powers, France and Russia among them.' },
      ],
      explain: `
        Menelik and Taytu met industrial weapons with industrial weapons, in overwhelming numbers.

        News of Adwa travelled the world: a European army could be beaten. Resistance was
        everywhere, from the Zulu victory at Isandlwana (1879) to the Maji Maji rising in East
        Africa (1905), but few had Ethiopia's rifles.
      `,
    },
    {
      id: 'congo',
      type: 'info',
      tone: 'sober',
      title: 'The Congo Free State',
      text: `
        The Berlin Conference recognised one claim that belonged to no country: a territory 76
        times the size of Belgium became the personal property of the Belgian king, **Leopold II**.

        To gather wild rubber, his agents set each village a quota. Soldiers took women and
        children hostage, burned villages that fell short, killed, and cut off hands. There was no
        census, so the toll is uncertain: the population fell by several million, and some
        historians estimate as many as ten million.

        Witnesses made it known: the African American writer George Washington Williams,
        missionaries with cameras, the shipping clerk E. D. Morel and the diplomat Roger
        Casement. In 1908 an international outcry forced Leopold to hand the colony to the Belgian state.
      `,
      figure: {
        type: 'world-map', view: 'africa', zoom: false,
        regions: [
          { ids: ['CD'], color: 'red', label: 'Congo Free State, 1885 to 1908' },
          { ids: ['BE'], color: 'red' },
        ],
        alt: 'A map of Africa with the Democratic Republic of the Congo highlighted: a very large country in the centre of the continent.',
      },
    },
    {
      id: 'who-ruled',
      type: 'choice',
      tone: 'sober',
      review: true,
      gen: (rng) => {
        const t = rng.pick(RULED_1914);
        // Korea was one country in 1914: name it so and tint the whole peninsula, not today's South Korea alone
        const korea = t.code === 'KR';
        const name = korea ? 'Korea' : countryName(t.code);
        const others = rng.sample(POWERS.filter((p) => p !== t.by), 3);
        return {
          text: `The highlighted country is **${name}**. Which power ruled it in **1914**?`,
          figure: {
            type: 'world-map', view: t.view, zoom: false,
            regions: [{ ids: korea ? ['KR', 'KP'] : [t.code], color: 'orange', label: name }],
            alt: `A map with ${name} highlighted.`,
          },
          options: rng.shuffle([t.by, ...others]).map((p) => ({ text: cap(p), correct: p === t.by })),
          explain: `**${cap(t.by)}.** ${t.note}`,
        };
      },
    },
    {
      id: 'teach-migration',
      type: 'info',
      tone: 'sober',
      title: 'A world on the move',
      text: `
        Steamships and empires moved people as never before, some by choice and many without much of one.

        - **Europeans.** More than 50 million left between 1815 and 1930, most of them across
          the Atlantic to the Americas: Irish, Italians, Poles and many others.
        - **Indians.** Over a million went overseas on five-year contracts, to sugar fields in
          Mauritius, Trinidad and Fiji. They replaced enslaved labour.
        - **Chinese labourers** dug tin in Malaya and built railways in North America.
        - **British settlers** took land from Aboriginal peoples in Australia and from Māori in
          New Zealand. Lands settled like this are called **settler colonies**.
      `,
      figure: {
        type: 'world-map', zoom: false, dots: false,
        lines: [
          { points: ['Naples', [-30, 42], 'New York'], color: 'blue', arrow: true, label: 'Europeans to the Americas', labelOn: 'legend' },
          { points: ['Kolkata', [88, 5], 'Port Louis'], color: 'orange', arrow: true, label: 'Indian contract workers to Mauritius and Fiji', labelOn: 'legend' },
          { points: ['Kolkata', [95, 2], [125, -12], [160, -20], 'Suva'], color: 'orange', arrow: true },
          { points: ['Guangzhou', [110, 12], 'Kuala Lumpur'], color: 'red', arrow: true, label: 'Chinese labourers to Malaya', labelOn: 'legend' },
          { points: ['London', [-14, 40], [-20, 5], [0, -30], [20, -40], [80, -45], [130, -42], 'Sydney'], color: 'violet', arrow: true, label: 'British settlers to Australia and New Zealand', labelOn: 'legend' },
        ],
        alt: 'A world map with four streams of migration drawn as arrows: Europeans across the Atlantic to the Americas, Indian contract workers to Mauritius and to Fiji, Chinese labourers to Malaya, and British settlers round Africa to Australia and New Zealand.',
      },
    },
    {
      id: 'migration',
      type: 'match',
      tone: 'sober',
      title: 'Who went where?',
      text: `
        **Match each group with where its journey led.**
      `,
      pairs: [
        ['Irish, Italians, Poles', 'Across the Atlantic to the Americas'],
        ['Indians on five-year contracts', 'Sugar fields in Mauritius, Trinidad and Fiji'],
        ['Chinese labourers', 'Tin mines in Malaya, railways in North America'],
        ['British settlers', 'Land taken from Aboriginal and Māori peoples'],
      ],
      explain: `
        The traces are everywhere today: about two-thirds of Mauritians have Indian ancestors,
        and Buenos Aires is full of Italian surnames. For Indigenous peoples from Australia to
        the American plains, the newcomers meant the loss of land and, often, of life.
      `,
    },
    {
      id: 'order',
      type: 'order',
      review: true,
      text: '**Put these in order, earliest first.**',
      items: inOrder(['opiumWar', 'indianUprising', 'meiji', 'germanyUnified', 'berlinConference', 'adwa']),
      labels: ['Earliest', 'Latest'],
      explain: `
        **1839**, **1857**, **1868**, **1871**, **1884**, **1896**. Empire in Asia came first. The carving-up
        of Africa came late and fast, once steam, quinine and the machine gun were all in hand.
      `,
    },
    {
      id: 'find-country',
      type: 'interact',
      review: true,
      gen: (rng) => countryQuiz(rng, FIND),
    },
  ],
  recap: [
    'A **nation** is a people who feel they belong together. In the 1800s states worked to create that feeling, and Italy (1861) and Germany (1871) were unified in its name.',
    'Industrial tools (steamships, quinine, machine guns, the telegraph) let a few powers conquer most of **Africa** and much of **Asia** between 1840 and 1914.',
    'Some escaped: **Japan** by industrialising, **Ethiopia** by winning at Adwa, **Siam** by diplomacy. **China** kept its independence but lost control of its ports.',
    'Colonial rule could be murderous, as in Leopold\'s Congo. Its borders, languages and migrations still shape the map.',
  ],
  next: 'Next: in 1914 the rival empires and the restless nations of Europe collide, and drag the world in with them.',
};
