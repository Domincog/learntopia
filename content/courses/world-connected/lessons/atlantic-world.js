// One World: 1450 to 1800 · Lesson 6 · Sugar, Silver and Chains
//
// Driving question: how did Europe's taste for sugar lead to the forced transport of twelve
// and a half million Africans, and how did those people endure, resist and shape the Americas?
//
// Tone: sober. No timed, scored-for-fun or drag-and-drop interactions on this material: maps,
// data, documents and the voices of people who lived through it.
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-connected/index.js';
import { EVENTS, DESTINATIONS, EMBARKED, LANDED, ABOLITION_EVENTS, ROUTES, at, marker, firstOfThree, whereMostStep } from '../helpers.js';

const AREA = (text, lon, lat) => ({ at: [lon, lat], text, style: 'area' });
const SEA = (text, lon, lat) => ({ at: [lon, lat], text, style: 'water' });

// Sugar's road west: where cane was grown for Europe, and from about when.
const SUGAR_STOPS = [
  { id: 'madeira', label: 'Madeira, 1450s', labelPos: 'top' },
  { id: 'saoTome', label: 'São Tomé, 1500s', labelPos: 'bottom' },
  { id: 'salvador', label: 'Brazil, from the 1530s', labelPos: 'left' },
  { id: 'barbados', label: 'Barbados, 1640s', labelPos: 'right' },
  { id: 'saintDomingue', label: 'Jamaica and Saint-Domingue, 1700s', labelPos: 'top' },
];

const note = (id, text) => ({ id, year: EVENTS[id].year, label: EVENTS[id].short, note: text });

export default {
  id: 'atlantic-world',
  tone: 'sober',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Twelve and a half million',
      text: `
        Between the early 1500s and the 1860s, about **12.5 million** African
        men, women and children were forced onto ships and carried across the
        Atlantic to be sold. It was the largest forced migration in history.

        Out of every 100 who survived the crossing,
        **about how many do you think were landed in what became the United States?**
      `,
      min: 0, max: 100, step: 1, answer: 4, tolerance: 3, unit: ' in 100', start: 50,
      explain: `
        **About 4 in 100.** Most people guess far higher. Nearly half were
        taken to Brazil, and most of the rest to the islands of the Caribbean.

        To understand why, follow one crop: sugar.
      `,
    },
    {
      id: 'sugar',
      type: 'info',
      title: 'Why sugar',
      text: `
        Europeans had tasted sugar and wanted more. Sugar cane needs heat,
        rain and a great deal of brutal work: the cane must be cut, crushed and
        boiled within hours, day and night, at harvest.

        Portuguese planters first grew it with enslaved workers on Atlantic
        islands, then carried the system to Brazil. English, French and Dutch
        planters copied it in the Caribbean. This was the **plantation**: one
        crop, grown for export, by people who were owned.
      `,
      figure: {
        type: 'world-map', view: [-95, -30, 25, 45],
        lines: ROUTES.sugar.legs.map((points) => ({ points, color: 'orange', width: 2.5, curve: 'straight', arrow: true })),
        markers: SUGAR_STOPS.map((stop) => ({ at: at(stop.id), label: stop.label, labelPos: stop.labelPos, color: 'orange' })),
        labels: [SEA('Atlantic Ocean', -35, 28)],
        legend: false,
        alt: 'A map of the Atlantic. Arrows trace sugar planting from Madeira, off north-west Africa, to the island of São Tomé on the equator, across to the coast of Brazil, north to Barbados and on to Jamaica and Saint-Domingue in the Caribbean.',
        caption: 'Sugar plantations move west, 1450 to 1700',
      },
    },
    {
      id: 'teach-why',
      type: 'info',
      title: 'Who was made to do the work',
      text: `
        Planters wanted workers they could force. Within a century they had
        turned almost entirely to people brought from Africa. Historians give
        four reasons.

        - The colonists first enslaved Native peoples. Disease, war and
          forced labour killed most of them.
        - A trade in captives already existed on the African coast, and
          Europeans could buy into it.
        - A person carried across an ocean had no home to flee to, and no
          ruler nearby to protect them.
        - Europeans would not enslave other Europeans. They drew no such line
          for Africans.

        Slave-owners gave another reason: that Africans were fitted "by
        nature" for such work. It was an excuse, and it is false.
      `,
    },
    {
      id: 'why',
      type: 'multi',
      title: 'Why Africans?',
      text: `
        Within a century the planters of the Americas had turned almost
        entirely to people brought from Africa.
        **Which of these reasons do historians give?**
      `,
      options: [
        { text: 'Disease, war and forced labour had killed most of the Native peoples the colonists first enslaved', correct: true },
        { text: 'A trade in captives already existed on the African coast, and Europeans could buy into it', correct: true },
        { text: 'People taken across an ocean had no home to flee to and no ruler nearby to protect them', correct: true },
        { text: 'Europeans would not enslave other Europeans, but drew no such line for Africans', correct: true },
        { text: 'Africans were fitted by nature for such work, as slave-owners claimed', why: 'Slave-owners said so to excuse themselves, and it is false: no historian gives it as a reason. So many people died on the sugar estates that planters depended on a constant supply of new captives.' },
      ],
      explain: `
        Slavery was old, and existed in Europe, Africa and Asia. What grew up
        in the Americas was new in scale and in kind. People were **chattel**:
        property, to be bought, sold and inherited. The status passed from a
        mother to her children for ever. And it was tied to skin colour: ideas
        of "race" were built up to justify it.
      `,
    },
    {
      id: 'numbers',
      type: 'info',
      title: 'The numbers',
      text: `
        Historians have traced more than 36,000 slaving voyages in ships'
        papers, port books and insurance records. Their best estimates:

        - about **${EMBARKED} million** people were put aboard in Africa;
        - about **${LANDED} million** were alive when the ships arrived. Almost
          two million died at sea, on a crossing known as the **Middle Passage**;
        - more than half of them crossed in the 1700s.

        The chart shows where the survivors were landed.
      `,
      figure: {
        type: 'bars', yMax: 5, yStep: 1, yLabel: 'millions of people', unit: ' m',
        data: DESTINATIONS.map((d, i) => ({ label: d.short || d.name, value: d.millions, color: i === 0 ? 'orange' : 'gray' })),
        alt: `Bar chart of where enslaved Africans were landed: ${DESTINATIONS.map((d) => `${d.name} ${d.millions} million`).join(', ')}.`,
        caption: 'Estimates for 1501 to 1867, from the SlaveVoyages database',
      },
    },
    {
      id: 'where-most',
      type: 'choice',
      review: true,
      gen: (rng) => whereMostStep(rng),
    },
    {
      id: 'coast',
      type: 'info',
      title: 'On the coast',
      text: `
        Outside Angola, Europeans rarely marched inland to seize people. They
        waited in ships and in forts like this one, **Elmina**, which Portugal
        built in 1482 to trade for gold. African rulers and merchants brought
        captives to the coast, prisoners of war and people who had been
        kidnapped, and sold them for cloth, iron, guns and shells.

        The demand, the ships and the plantations belonged to Europeans and
        their colonies. As the price of captives rose, wars and raids
        multiplied, and no one far from a strong ruler was safe.

        Books often draw a neat "triangular trade": goods to Africa, people to
        the Americas, sugar home to Europe. It was messier than that. The
        busiest route of all ran straight between Brazil and Angola.
      `,
      figure: photo(MEDIA.elmina, {
        alt: 'A large whitewashed fortress with thick walls, arched galleries and red-tiled roofs, standing among palm trees on a low headland where the beach meets the sea.',
        caption: 'Elmina Castle, Ghana: today a World Heritage Site and a place of remembrance',
      }),
    },
    {
      id: 'where-from',
      type: 'interact',
      review: true,
      title: 'Where the ships loaded',
      text: `
        Captives were embarked along the whole Atlantic coast of Africa, from
        Senegal to Angola. But nearly half of them, about 5.7 million people,
        left from one stretch: **West Central Africa**, the lands of Kongo and
        Angola, around and south of the mouth of the River Congo.

        **Tap the present-day country on that coast** whose capital, Luanda,
        was the busiest slaving port of all.
      `,
      widget: {
        type: 'world-map', view: [-20, -20, 32, 20], mode: 'pick', answer: 'AO',
        pickable: ['west-africa', 'central-africa', 'NA', 'ZM'],
        rivers: ['Congo'],
        labels: [AREA('Senegambia', -13.5, 16.5), AREA('Gold Coast', -1.5, 8.6), AREA('Bight of Benin', 3.5, 3.6), AREA('Bight of Biafra', 7.3, 1.8)],
        alt: 'A map of West and Central Africa without country names. Four stretches of coast are labelled: Senegambia, the Gold Coast, the Bight of Benin and the Bight of Biafra. The River Congo is drawn and named.',
      },
      check: (s) => {
        if (s.picked === 'AO') return true;
        if (!s.picked) return 'Tap a country.';
        if (s.picked === 'CD' || s.picked === 'CG') return `That is ${s.nameThe || s.name}. Many captives came from here too. Luanda, the busiest port, lies in the next country to the south.`;
        if (s.picked === 'NA') return `That is ${s.nameThe || s.name}. Luanda lies in the next country to the north.`;
        if (['NG', 'BJ', 'GH', 'TG'].includes(s.picked)) return `That is ${s.nameThe || s.name}, on the Gulf of Guinea. Very many people were taken from here too, but the largest number left from further south.`;
        return `That is ${s.nameThe || s.name}. Follow the coast south until you pass the mouth of the River Congo.`;
      },
      solution: { picked: 'AO' },
      hints: ['Find the mouth of the River Congo on the coast, then look just south of it.'],
      explain: `
        **Angola.** The north of this coast belonged to the kingdom of Kongo,
        whose Christian king Afonso I wrote to the king of Portugal in 1526. Traders,
        he complained, were seizing his subjects every day, even nobles and his
        own relatives, and his country was being "completely depopulated".
        The trade went on. Some African states grew rich and powerful by it;
        many more communities were ruined.
      `,
    },
    {
      id: 'equiano',
      type: 'choice',
      title: 'A voice',
      text: `
        **Olaudah Equiano** wrote that he was born about 1745 in what is now
        Nigeria, kidnapped at eleven and carried to the coast. Of the ship he
        wrote: "I was soon put down under the decks, and there I received such a
        salutation in my nostrils as I had never experienced in my life."

        Sold in the Americas, he worked as a sailor, bought his freedom in
        1766, and in 1789 published his life story in London. This portrait
        opened the book. **What is it telling its readers?**
      `,
      figure: photo(MEDIA.equiano, {
        alt: 'An engraved oval portrait of a Black man in a dark coat with large buttons, a waistcoat and a white ruffled cravat. He looks straight at the viewer and holds an open book. Beneath is written: Olaudah Equiano, or Gustavus Vassa, the African.',
        caption: 'Olaudah Equiano, from the first edition of his book, 1789',
        creditLabel: 'Engraving', credit: 'Daniel Orme, after William Denton (1789)',
      }),
      options: [
        { text: 'That the author is a thinking, believing man, the equal of any reader', correct: true },
        { text: 'That slavery had treated him well', why: 'His book describes its cruelty in detail. The fine clothes are those of a free man who earned them.' },
        { text: 'That he had become a priest', why: 'He holds a Bible as a Christian reader, not as a clergyman.' },
        { text: 'That he wished to hide where he came from', why: 'The title page names him "Olaudah Equiano, or Gustavus Vassa, the African".' },
      ],
      explain: `
        Defenders of slavery claimed that Africans were not fully human.
        Equiano answered with his own face, a gentleman's coat, an open Bible
        and a steady look at the reader. His book went through nine editions in
        his lifetime. (Some records suggest he may have been born in South
        Carolina; historians disagree. Either way, he gave readers the voice of
        the enslaved.) Others spoke too: Ottobah Cugoano, Phillis Wheatley,
        Mary Prince.
      `,
    },
    {
      id: 'brookes',
      type: 'choice',
      title: 'A diagram that changed minds',
      text: `
        In 1788 campaigners against the slave trade published this plan of the
        Liverpool slave ship *Brookes*. It shows, deck by deck, how 454 people
        could be stowed: the number that a new British law allowed the ship to
        carry. On earlier voyages it had carried more than 600.

        The print shows no whips and no chains. **Why did it persuade so many people?**
      `,
      figure: photo(MEDIA.brookes, {
        alt: 'A printed plan headed "Stowage of the British slave ship Brookes under the regulated slave trade, Act of 1788". A side view and two deck plans of a ship are filled with rows of small human figures lying side by side, in sections marked women, boys and men. Small cross-sections show figures lying on shelves one above another.',
        caption: 'Plan of the slave ship Brookes, published by British abolitionists, 1788 to 1789',
        creditLabel: 'Print',
      }),
      options: [
        { text: 'It used the ship\'s real measurements and the law\'s own figure, so it could not be waved away as exaggeration', correct: true },
        { text: 'It was drawn by the most famous artist of the day', why: 'It was drawn by campaigners few people had heard of. Its force came from its plainness.' },
        { text: 'It showed the worst voyage ever recorded', why: 'The opposite: it showed what was legal and normal. That was the point.' },
        { text: 'It was kept secret, which made people curious', why: 'It was printed by the thousand and hung in homes, taverns and meeting rooms.' },
      ],
      explain: `
        Abolitionists in Plymouth and London printed it by the thousand for
        walls, pamphlets and Parliament. A plain, measured drawing let people
        work out the horror for themselves, and it became one of the most
        influential images any campaign has produced.

        One thing it cannot show: the people in it never stopped resisting.
        Captives rose in revolt on perhaps one voyage in ten.
      `,
    },
    {
      id: 'resistance',
      type: 'interact',
      title: 'Those who freed themselves',
      text: `
        On land, too, people resisted: they slowed their work, kept their
        families and faiths together, ran, and sometimes rose in arms. Those
        who escaped built free settlements in hills, swamps and forests,
        called *maroon* communities.

        The largest, **Palmares**, held perhaps 10,000 or more people and
        defended itself for almost a century in the hills of north-east
        Brazil. **Tap it.**
      `,
      widget: {
        type: 'world-map', view: [-95, -25, -28, 30], mode: 'pickMarker', markerLabels: 'after', answer: 'palmares',
        markers: [
          marker('jamaica', { label: 'Jamaica\'s Maroons' }),
          marker('saintDomingue', { label: 'Saint-Domingue (Haiti)' }),
          marker('palenque', { label: 'San Basilio de Palenque' }),
          marker('suriname', { label: 'Suriname\'s Maroons' }),
          marker('palmares'),
        ],
        alt: 'A map of the Caribbean and the northern half of South America with five lettered markers: two on Caribbean islands, one in northern Colombia, one in the Guianas and one near the eastern tip of Brazil.',
      },
      check: (s) => {
        if (s.picked === 'palmares') return true;
        if (!s.picked) return 'Tap one of the five markers.';
        if (s.picked === 'suriname') return 'That marker is in the Guianas, on the north coast of South America, where maroon communities still live. North-east Brazil is the bulge that reaches furthest towards Africa.';
        if (s.picked === 'palenque') return 'That marker is in Colombia. Brazil is the largest country of South America; look at its eastern tip.';
        return 'That marker is on a Caribbean island. Palmares was on the mainland of South America, in Brazil.';
      },
      solution: { picked: 'palmares' },
      hints: ['North-east Brazil is the part of South America that reaches furthest east, towards Africa.'],
      explain: `
        Palmares fell to a colonial army in 1694, and its last leader, Zumbi,
        was killed on 20 November 1695. Brazil now keeps that date as a national
        holiday, Black Consciousness Day. In Jamaica the Maroons fought the
        British to a treaty in 1739. San Basilio de Palenque in Colombia is
        still there, with its own language. And in Saint-Domingue in 1791 the
        enslaved began a revolution that created Haiti: a story for
        *The Modern World*.
      `,
    },
    {
      id: 'teach-culture',
      type: 'info',
      title: 'What crossed with them',
      text: `
        People were forced aboard with nothing. What they knew crossed with
        them: skills, beliefs, music and words. From these they and their
        children made new cultures in the Americas.

        - **Music.** The banjo grew out of West African lutes, and the
          rhythms of samba, rumba, blues and jazz have African roots.
        - **Words.** "Okra", "yam" and "gumbo" came from African languages.
        - **Faiths.** Vodou in Haiti, Candomblé in Brazil and Santería blend
          West and Central African beliefs with Catholic ones.
        - **Languages.** New **creole** languages arose where peoples mixed.
          Haitian Creole has more than ten million speakers.
      `,
    },
    {
      id: 'culture',
      type: 'multi',
      review: true,
      title: 'What they carried',
      text: `
        The enslaved were allowed to bring nothing. They carried knowledge,
        beliefs, music and words all the same, and from these they made new
        cultures in the Americas. **Which of these have roots in Africa?**
      `,
      options: [
        { text: 'The banjo', correct: true },
        { text: 'The words "okra", "yam" and "gumbo"', correct: true },
        { text: 'Religions such as Vodou in Haiti and Candomblé in Brazil', correct: true },
        { text: 'The rhythms of samba, rumba, blues and jazz', correct: true },
        { text: 'The word "sugar"', why: '"Sugar" travelled west with the crop itself: from Sanskrit through Persian and Arabic into the languages of Europe.' },
      ],
      explain: `
        The banjo grew out of West African lutes. "Gumbo" comes from a
        Central African word for okra. Vodou and Candomblé blend West and
        Central African beliefs with Catholic ones. Much of the music the
        world now listens to began here.
      `,
    },
    {
      id: 'abolition',
      type: 'interact',
      graded: false,
      title: 'How it ended',
      text: `
        The Atlantic slave system was not reformed away from above. It was
        fought: by the enslaved themselves, by Black writers such as Equiano,
        by religious groups such as the Quakers, and by ordinary people.
        In the 1790s, by one campaigner's count, some 300,000 people in Britain
        gave up slave-grown sugar.

        **Tap the landmarks on the line to read what happened.**
      `,
      widget: {
        type: 'timeline', from: 1780, to: 1900, step: 20, mode: 'explore',
        events: [
          note('equiano', 'Equiano\'s book and the *Brookes* print reach a wide public in Britain.'),
          note('haitiRevolt', 'The enslaved of Saint-Domingue rise. In 1804 they found Haiti, the first state to end slavery for good.'),
          note('britainTradeBan', 'Britain, the largest carrier of the 1700s, outlaws its slave trade. The United States follows in 1808. Illegal voyages go on for sixty years.'),
          note('britainAbolition', 'Britain abolishes slavery in most of its empire from 1834. It pays 20 million pounds in compensation to the owners, and nothing to the freed.'),
          note('franceAbolition', 'France abolishes slavery in its colonies. It had first done so in 1794, and Napoleon had brought it back.'),
          note('usAbolition', 'After a civil war, the United States abolishes slavery. About four million people are freed.'),
          note('brazilAbolition', 'Brazil, which received more enslaved Africans than any other country, is the last in the Americas to abolish slavery.'),
        ],
        alt: 'A timeline from 1780 to 1900 with seven events: Equiano 1789, the Haitian Revolution 1791, Britain bans the trade 1807, the British abolition act 1833, France 1848, the United States 1865, Brazil 1888.',
      },
      check: (s) => s.seenCount >= 1 || 'Tap a landmark on the line to read its note.',
      solution: { selected: 'brazilAbolition' },
      explain: `
        From Britain's law against the trade to the last abolition took most
        of a century: the trade ban in 1807, Brazil's abolition in
        **1888**. Freedom came without land or compensation for the freed, and
        the idea of "race" that slavery had built did not end with it. Those
        are threads to follow in *The Modern World*.
      `,
    },
    {
      id: 'abolition-order',
      type: 'choice',
      review: true,
      gen: (rng) => firstOfThree(rng, ABOLITION_EVENTS, { minGap: 15, intro: 'Three landmarks in the long fight against Atlantic slavery.' }),
    },
    {
      id: 'reflect',
      type: 'reflect',
      title: 'Words matter',
      text: `
        Historians now usually write "enslaved people" where older books wrote
        "slaves".

        **Why do you think they make that change?**
      `,
      model: `
        "Slave" names a person by what was done to them, as if it were what
        they were. "Enslaved person" puts the person first and makes clear that
        slavery was something other people did to them, by force. It keeps in
        view what this lesson has tried to show: that these were farmers,
        smiths, parents, musicians and believers, who resisted, remembered and
        built new cultures.
      `,
    },
  ],
  recap: [
    'Sugar plantations created a huge demand for forced labour; about 12.5 million Africans were embarked for the Americas and about 10.7 million survived the crossing.',
    'Nearly half of the survivors were landed in Brazil and most of the rest in the Caribbean; about 4 in 100 in mainland North America.',
    'Atlantic slavery was chattel slavery: people as inherited property, justified by ideas of race.',
    'The enslaved resisted, from shipboard revolts to Palmares and Haiti, and created cultures that shape the Americas today. Abolition took from 1807 to 1888.',
  ],
  next: 'You have followed three and a half centuries in which the oceans joined the world: its crops, its silver, its faiths, its science, and its crimes. Next in the World path, *The Modern World: 1750 to Today*: coal, revolutions, empires and the planet we share now.',
};
