// First Aid: When Minutes Matter · the facts of the course, in one place.
//
// Every table below feeds figures, generated questions and feedback, so a correction is made once.
// tests/first-aid-course.test.mjs holds an independently typed copy of the key numbers and orders
// and fails if the two disagree.
//
// ------------------------------------------------------------------------------------------------
// WHAT EACH BODY SAYS (lay rescuers; compiled in November 2026: see "How far this was checked" below)
//
//   ERC 2025   European Resuscitation Council Guidelines 2025: Adult Basic Life Support
//              (Resuscitation 2025;215 Suppl 1:110771) and First Aid (…:110752); the lay summary
//              "Guidelines 2025 on Resuscitation for Everyone". Resuscitation Council UK 2025 adapts them.
//   AHA 2025   2025 American Heart Association Guidelines for CPR and ECC, Part 7: Adult Basic Life
//              Support (Circulation 2025;152 suppl 2), with the 2025 Highlights.
//   AHA/ARC 2024  2024 American Heart Association and American Red Cross Guidelines for First Aid
//              (Circulation 2024;150:e519). The current American first-aid guideline.
//   ILCOR 2025 the 2025 International Consensus on CPR and ECC Science (CoSTR) on which both rest.
//   National   NHS (nhs.uk), St John Ambulance and British Red Cross first-aid advice pages; IFRC
//              International First Aid, Resuscitation and Education Guidelines 2020 (latest edition found).
//
//   Topic                     ERC 2025 / RCUK 2025                 AHA 2025, AHA/ARC 2024                 What the course teaches
//   ------------------------  -----------------------------------  -------------------------------------  -------------------------------------------
//   First steps               safe? · responsive? · unresponsive:  scene safety · responsiveness · shout,  danger, response, call (speaker), breathing,
//                             CALL at once (new in 2025: no need   activate emergency response, get AED ·  then CPR or the recovery position. Says that
//                             to confirm breathing first) ·        look for no breathing / only gasping ·  older leaflets put the call after the
//                             breathing on speaker · CPR           CPR                                     breathing check.
//   Breathing check           look, listen, feel, max 10 s; slow,  no breathing or only gasping = arrest;  10 seconds at most; gasping is not breathing;
//                             laboured, gasping = arrest           no more than 10 s                       if unsure, treat as not breathing normally
//   Compressions              centre of chest (lower half of       lower half of breastbone; at least      centre of the chest, 5 to 6 cm, 100 to 120
//                             sternum), 5–6 cm, 100–120 /min,      5 cm (2 in), avoid more than 6 cm       a minute, full recoil, minimal pauses
//                             full recoil, minimise pauses         (2.4 in); 100–120 /min; pauses < 10 s
//   Breaths                   30:2 if trained and able; otherwise  all lay rescuers: compressions; it is   compressions for everyone; 30:2 if trained
//                             compressions only; call-taker gives  reasonable for trained lay rescuers to  and willing; the call-taker coaches
//                             compression-only instructions        add breaths (30:2)                      compression-only CPR
//   AED                       switch on, follow prompts, pads on   same; a bra may be moved aside rather   switch on, follow the voice, pads on bare
//                             bare chest, nobody touching during   than removed (2025)                     skin, stand clear, shock if told, resume
//                             analysis and shock, resume CPR                                               compressions at once
//   Recovery position         side-lying for reduced               reasonable for a person with decreased  unresponsive + breathing normally + no
//                             responsiveness NOT meeting CPR       alertness, non-traumatic, breathing     serious injury suspected: on the side,
//                             criteria; not for agonal breathing   normally; not if CPR is needed or       head tilted, keep checking breathing
//                             or trauma                            spine/hip/pelvis injury is likely
//   Chain of survival         early recognition and call · early   one chain for all ages (2025):          recognise and call · CPR · defibrillation ·
//                             CPR · early defibrillation ·         recognition and activation · CPR ·      professional care (the shared first three
//                             advanced and post-resuscitation care defibrillation · advanced care ·        links are the bystander's)
//                                                                  post-arrest care · recovery
//   Minutes                   (RCUK / BHF: up to 10% a minute)     7–10% a minute without CPR and shock;   "about 10% a minute", stated as a rule of
//                                                                  3–4% a minute with bystander CPR        thumb; the model in `rescue-clock` uses it
//
// HOW FAR THIS WAS CHECKED. The session's web-search budget (shared with the other authors) ran out
// while lesson 2 was being written, and the guideline sites themselves could not be opened. So:
//
//   [S] confirmed by web search in this session:
//       ERC 2025: call for any unresponsive person, breathing checked on speaker, the three steps
//       "check, call, CPR", 100–120 a minute, 5–6 cm, centre of the chest, 30:2 for those who give
//       breaths, call-takers coach compression-only CPR, slow or gasping breathing counts as arrest,
//       breathing check of at most 10 s (First Aid chapter), recovery position and its limits.
//       AHA 2025: unresponsive with absent or abnormal breathing is treated as cardiac arrest;
//       compressions from every lay rescuer, breaths as well from trained ones, 30:2; depth at least
//       5 cm and not more than 6 cm; 100–120 a minute; lower half of the breastbone; pauses under
//       10 s; a bra may be moved aside; one chain of survival for all ages. AHA/ARC 2024: the
//       recovery position recommendation. AHA: 7–10% a minute; about 1 in 10 survive out of hospital;
//       about 40% receive bystander CPR. Agonal breathing in about 40% of arrests. NHS England:
//       category 1 mean response of about 8 minutes in 2026. St John Ambulance and British Red
//       Cross: recovery-position steps; look, listen and feel for no more than ten seconds. The
//       emergency numbers of the table below.
//   [K] from the author's knowledge of the named documents, NOT re-checked in this session:
//       the exact order of the AHA lay-rescuer algorithm; "3–4% a minute with CPR"; the links of the
//       two chains of survival; the steps of using an AED and that it shocks only a shockable rhythm;
//       swapping rescuers every two minutes; the IFRC 2020 guidelines.
//   The sections for lessons 3 to 6 mark each row [S] or [K] in the same way.
//
// INDEPENDENT REVIEW (November 2026). The rows marked [K] were re-checked by web search, each against two
// bodies where the search allowed. Confirmed: aspirin 300 mg (ERC/RCUK 2025) and 162–325 mg, "if unsure, wait
// without it" (AHA/ARC 2024); FAST or a similar scale (AHA/ARC 2024); nothing by mouth in a stroke (St John
// Ambulance; Stroke Foundation); a passing attack still needs 999 (NHS; Stroke Association); 1.9 million
// neurons a minute (Saver, Stroke 2006); choking: up to 5 back blows, then up to 5 abdominal thrusts, no
// blind finger sweeps (RCUK 2025), cycles of 5 and 5, infants 5 back blows and 5 chest thrusts and never
// abdominal thrusts (AHA 2025), chest thrusts in Australia (ANZCOR, via Queensland Ambulance); second
// adrenaline dose after 5 minutes (ERC and RCUK 2025; MHRA: 5 to 15), lying flat with legs raised and never
// standing (UK anaphylaxis bodies; St John Australia); asthma: 1 puff every 30 to 60 seconds up to 10 (NHS,
// Asthma + Lung UK), 4 puffs, 4 breaths, wait 4 minutes (National Asthma Council Australia); drowning: breaths
// for trained rescuers, compressions alone if not (AHA/AAP 2024); bleeding: direct pressure, then tourniquet
// or haemostatic dressing (ERC/RCUK 2025), tourniquet or wound packing (AHA/ARC 2024), 5 to 7 cm or 2 to 3
// inches above the wound and not over a joint (Stop the Bleed; TCCC), "high and tight" taught by some
// courses for a wound that cannot be found; nosebleed: lean forward, pinch the soft part, 10 minutes, help
// after 30 (British Red Cross; St John) or after 10 to 15 (NHS); burns: 20 minutes (NHS trusts, British Burn
// Association, British and Australian Red Cross), 10 to 20 (American Red Cross advisory), hospital criteria
// (NHS); seizures (AHA/ARC 2024; NHS; Epilepsy Society); fainting (St John Ambulance); hypoglycaemia 15–20 g,
// repeat after 15 minutes, and heatstroke: cold-water immersion from the neck down (ERC 2025); hypothermia
// do-nots (Mayo Clinic by search; NHS from knowledge); poisoning: no vomiting (British Red Cross; St John), 1-800-222-1222
// (HRSA), 13 11 26 (healthdirect), 111 (NHS); naloxone by lay rescuers, never in place of CPR (AHA 2025),
// virtually no effect without opioids (WHO); 988 in the United States and in Canada, 116 123, 13 11 14;
// "3–4% a minute with CPR" (ERC 2015 text; AHA 2005); the emergency numbers of the table below.
// Still from knowledge only, and therefore taught without a graded figure: the AHA/ARC 2024 wording on
// fractures, sprains and spinal injury; the cooling rates of the heatstroke graph (shown as rough figures).
//
// The later lessons add their own rows at the head of their sections below.
// ------------------------------------------------------------------------------------------------

/** Numbers of adult chest compressions. ERC 2025 Adult BLS; AHA 2025 Part 7; ILCOR 2025. */
export const CPR = {
  rate: [100, 120],          // compressions a minute (ERC 2025, AHA 2025)
  depthCm: [5, 6],           // adults: ERC 2025 "5–6 cm"; AHA 2025 "at least 5 cm (2 inches), avoid more than 6 cm (2.4 inches)"
  ratio: [30, 2],            // compressions : rescue breaths, for rescuers trained and willing (ERC 2025, AHA 2025)
  breathCheckSeconds: 10,    // the breathing check takes no more than this (ERC 2025 First Aid; AHA; British Red Cross)
  pauseSeconds: 10,          // keep any pause in compressions shorter than this (AHA 2025; ERC 2025: "minimise pauses")
  swapMinutes: 2,            // swap rescuers about every two minutes if someone else can take over (ERC, AHA)
};

/** The rule of thumb behind the `rescue-clock` model: survival falls 7–10% a minute without CPR (AHA), 3–4% a minute with it (ERC 2015; AHA 2005). */
export const ARREST_MODEL = { lossNoCpr: 10, lossWithCpr: 3.5 };

/** Normal resting breathing in an adult, breaths a minute (taught in body-systems `breathing`). */
export const BREATHS_PER_MINUTE = [12, 20];

/**
 * Emergency telephone numbers. A country-specific fact, so it is practised, never graded.
 * Sources: the EU's 112 pages (112 works in every EU country, free, from any phone); national
 * government and ambulance-service pages; ITU. Checked November 2026.
 */
export const EMERGENCY_NUMBERS = [
  { number: '112', places: ['France', 'Germany', 'Spain', 'Italy', 'Poland', 'Sweden', 'India'], note: 'every country of the European Union, and many others' },
  { number: '911', places: ['the United States', 'Canada', 'Mexico'], note: 'most of North America' },
  { number: '999', places: ['the United Kingdom'], note: '112 works there too' },
  { number: '000', places: ['Australia'], note: 'said "triple zero"' },
  { number: '111', places: ['New Zealand'], note: '' },
  { number: '119', places: ['Japan'], note: 'ambulance and fire' },
  { number: '192', places: ['Brazil'], note: 'the ambulance service' },
  { number: '120', places: ['China'], note: 'the ambulance service' },
];

/** The first steps, in the order of the 2025 guidelines (ERC 2025, AHA 2025). */
export const FIRST_STEPS = [
  'Check for danger to yourself',
  'Check for a response: tap the shoulders, speak loudly',
  'No response: call the emergency number, phone on speaker',
  'Open the airway and check breathing, 10 seconds at most',
  'Not breathing normally: start chest compressions',
];

/** Getting someone into the recovery position (NHS; St John Ambulance; British Red Cross). */
export const RECOVERY_STEPS = [
  'Kneel beside them and straighten their legs',
  'Place the arm nearest you out at a right angle',
  'Bring the far hand across, its back against their near cheek',
  'Pull the far knee up, foot flat on the floor',
  'Pull on the knee to roll them towards you, onto their side',
  'Tilt the head back a little; keep checking the breathing',
];

/**
 * What the two checks lead to. The durable core of lesson 1 (ERC 2025 First Aid and Adult BLS;
 * AHA 2025; AHA/ARC 2024 First Aid, "Positioning").
 */
export const DECISIONS = {
  responsive: { label: 'Stay with them, ask what happened, and get help if they need it', short: 'stay, ask, get help if needed' },
  recovery: { label: 'Call the emergency number, place them on their side in the recovery position, and keep checking their breathing', short: 'call, recovery position, keep checking' },
  cpr: { label: 'Call the emergency number and start chest compressions', short: 'call and start chest compressions' },
};

/** Example people for the decision practice of lesson 1. `finding` is what the two checks show. */
export const CHECK_CASES = [
  { who: 'Amara', where: 'on a park bench', finding: 'opens her eyes and answers when you speak, but seems dazed', decision: 'responsive',
    why: 'She responds, so she is conscious. Stay, ask what happened and what she needs, and call if you are worried.' },
  { who: 'Tomás', where: 'on a kitchen floor', finding: 'does not respond when you tap his shoulders and speak loudly; his chest rises and falls steadily, about three times in ten seconds', decision: 'recovery',
    why: 'Unresponsive but breathing normally: his airway is the danger. On his side, with the head tilted, it stays open and fluid can drain.' },
  { who: 'Mei', where: 'at a bus stop', finding: 'does not respond; in ten seconds you see one sudden, snoring gasp and then nothing', decision: 'cpr',
    why: 'A lone gasp is not normal breathing. Unresponsive and not breathing normally means cardiac arrest until proved otherwise.' },
  { who: 'Olu', where: 'in a corridor at work', finding: 'does not respond; you watch for ten seconds and his chest does not move at all', decision: 'cpr',
    why: 'Unresponsive and not breathing: this is cardiac arrest. Compressions keep blood moving until a defibrillator arrives.' },
  { who: 'Ingrid', where: 'on a living-room sofa', finding: 'does not respond to your voice or your touch; she is breathing quietly and regularly', decision: 'recovery',
    why: 'Unresponsive but breathing normally: protect her airway by turning her onto her side, and keep watching her breathing.' },
  { who: 'Rafael', where: 'beside a football pitch', finding: 'does not respond; you cannot tell whether the odd movements of his chest are breathing or not', decision: 'cpr',
    why: 'If you are not sure the breathing is normal, treat it as not normal. Compressions on a heart that is still beating do far less harm than no compressions on one that has stopped.' },
  { who: 'Priya', where: 'in a supermarket aisle', finding: 'groans and pushes your hand away when you tap her shoulder', decision: 'responsive',
    why: 'She reacts to you, so she is responsive, though clearly unwell. Stay with her, find out what you can, and call for help.' },
];

/* ------------------------------------------------------------------------------------ lesson 2: cpr */

/** The chain of survival: the links every version shares (ERC 2025: four links; AHA 2025: six, ending in recovery). */
export const CHAIN = [
  'Recognise the cardiac arrest and call for help',
  'Chest compressions (CPR)',
  'A shock from a defibrillator',
  'Care from the ambulance crew and the hospital',
];

/** Using an automated external defibrillator (ERC 2025 Adult BLS; AHA 2025 Part 7; British Heart Foundation). */
export const AED_STEPS = [
  'Switch it on, or open the lid',
  'Stick the two pads on the bare chest, as their pictures show',
  'Stand clear while it checks the heart',
  'If it tells you to, press the shock button',
  'Start compressions again straight away',
];

/** Cardiac arrest and heart attack are different things (AHA; British Heart Foundation; ERC). */
export const ARREST_OR_ATTACK = [
  { text: 'The heart has stopped pumping blood', bucket: 0 },
  { text: 'The person is unresponsive and not breathing normally', bucket: 0 },
  { text: 'Needs chest compressions and a defibrillator at once', bucket: 0 },
  { text: 'A blocked artery is starving part of the heart muscle of blood', bucket: 1 },
  { text: 'The person is usually awake, often with pain or pressure in the chest', bucket: 1 },
  { text: 'The heart is still beating', bucket: 1 },
];

/**
 * What stops bystanders, and what the guidelines answer. ERC 2025 and AHA 2025: start CPR for anyone
 * unresponsive and not breathing normally; the risk of harm from compressions on someone who turns out
 * not to be in cardiac arrest is low (ILCOR). An AED analyses the rhythm and delivers a shock only for
 * a rhythm that a shock can correct.
 */
export const WORRIES = [
  { id: 'rib', worry: 'I might break one of his ribs.',
    right: 'Ribs can crack during CPR, and they heal. A heart that is not pumping is fatal within minutes. Keep going.',
    wrong: [
      ['Then press only lightly: a centimetre or two is safer.', 'Shallow pushes do not move enough blood. The guideline depth for an adult is 5 to 6 cm.'],
      ['If you feel a crack, stop and wait for the ambulance.', 'Stopping takes away the only blood flow the brain has. A cracked rib is the smaller harm by far.'],
    ],
    why: 'Effective compressions are deep, and cracked ribs are a known and accepted price.' },
  { id: 'gasp', worry: 'She takes a gasp now and then, so she must be breathing.',
    right: 'Occasional gasps are not normal breathing. She is unresponsive, so start compressions.',
    wrong: [
      ['Gasps show the heart is beating. Put her in the recovery position.', 'Gasping is common in the first minutes after the heart stops. It is a sign of cardiac arrest, not of recovery.'],
      ['Wait a minute or two and see whether the gasps become regular.', 'Each minute without compressions costs roughly a tenth of her chance.'],
    ],
    why: 'Gasping is the commonest reason bystanders fail to recognise a cardiac arrest.' },
  { id: 'untrained', worry: 'I have never been trained in any of this.',
    right: 'Push hard and fast in the centre of the chest. The call-taker will talk you through it.',
    wrong: [
      ['Untrained people should stand back and wait for the ambulance.', 'Waiting is what does the harm. Compressions from an untrained person are far better than none.'],
      ['Without mouth-to-mouth breaths, compressions achieve nothing.', 'In the first minutes the blood still carries oxygen; what is missing is something to move it.'],
    ],
    why: 'Guidelines ask every bystander for compressions. Call-takers are trained to coach them over the phone.' },
  { id: 'aed', worry: 'What if the defibrillator shocks him and he did not need it?',
    right: 'It checks the heart\'s rhythm itself and gives a shock only if a shock is needed.',
    wrong: [
      ['Only a trained first-aider is allowed to open a public defibrillator.', 'Public defibrillators are made for anyone to use. They speak their instructions aloud.'],
      ['Leave it for the crew: a mistaken shock would stop a beating heart.', 'The machine will not shock a rhythm that does not need it, whatever button is pressed.'],
    ],
    why: 'An automated defibrillator makes the decision. The bystander only has to switch it on and follow the voice.' },
  { id: 'beating', worry: 'What if her heart is actually still beating?',
    right: 'If she is unresponsive and not breathing normally, start anyway. The risk of harm is small; the risk of waiting is not.',
    wrong: [
      ['Find a pulse first, however long that takes.', 'Guidelines dropped the pulse check for bystanders: it is unreliable and it costs time.'],
      ['Compressions on a beating heart are usually fatal, so be certain first.', 'Serious harm from compressions on someone who was not in cardiac arrest is rare.'],
    ],
    why: 'The two checks, response and breathing, are all the evidence a bystander needs.' },
];

/* --------------------------------------------------------------------------- lesson 3: heart-stroke */
//
//   Topic            ERC 2025 First Aid / RCUK 2025              AHA/ARC 2024 First Aid; AHA/ASA               What the course teaches
//   ---------------  ------------------------------------------  --------------------------------------------  ----------------------------------------
//   Chest pain       call; comfortable position; help the        activate EMS; alert adults with non-traumatic  call first; rest; an adult who is awake,
//                    person take 300 mg aspirin, chewable or     chest pain may chew and swallow 162–325 mg     not allergic and not told to avoid it
//                    dissolvable, unless allergic  [S]           aspirin unless allergic or told not to  [S]    may chew aspirin; the dose is given as
//                                                                                                               "differs: 300 mg / 162–325 mg", never graded
//   Stroke           use a stroke scale such as FAST; call;      use a stroke recognition scale (FAST, CPSS);   FAST; BE-FAST named as a variant; call;
//                    note time of onset  [K]                     call; note the time  [K]                       note the time; nothing by mouth
//   Nothing by mouth NHS, St John Ambulance, Stroke Association: do not give food, drink or medicines in a suspected stroke  [K]
//   TIA              NHS / NICE; AHA/ASA: symptoms that pass still need emergency assessment  [K]
//   Time is brain    Saver JL, Stroke 2006;37:263: about 1.9 million neurons lost a minute in a typical large untreated stroke  [K]
//   Clot treatment   clot-dissolving medicine within about 4.5 hours of onset [S]; mechanical clot removal later in selected people  [K]
//
//   [S] confirmed by web search in this session.  [K] from the author's knowledge of the named document:
//   the session's shared search budget ran out before it could be re-checked. See the course report.

/** Aspirin for a suspected heart attack: the two guideline doses, in mg. They differ, so no step grades them. */
export const ASPIRIN_MG = { erc: 300, ahaArc: [162, 325] };

/** "Time is brain" (Saver, Stroke 2006): nerve cells lost per minute in a typical large untreated stroke, in millions. */
export const NEURONS_PER_MINUTE_MILLION = 1.9;

/** The clot-dissolving medicine for a stroke is given within about this many hours of the first symptom. */
export const STROKE_WINDOW_HOURS = 4.5;

/** The FAST check (stroke associations; ERC 2025 and AHA/ARC 2024 recommend a scale of this kind for first aiders). */
export const FAST = [
  { letter: 'F', word: 'Face', check: 'Ask for a smile: does one side droop?' },
  { letter: 'A', word: 'Arms', check: 'Both arms raised: does one drift down?' },
  { letter: 'S', word: 'Speech', check: 'A simple sentence: slurred or jumbled?' },
  { letter: 'T', word: 'Time', check: 'Call now, and note when it began' },
];

/** The three emergencies of lessons 2 and 3, and the first aid for each. Every one begins with the call. */
export const EMERGENCIES = {
  attack: 'Suspected heart attack: call the emergency number, help them sit and rest, and stay with them',
  stroke: 'Suspected stroke: call the emergency number, note when the symptoms began, and give nothing to eat or drink',
  arrest: 'Cardiac arrest: call the emergency number and start chest compressions',
};

/**
 * Example people for the "which emergency?" practice. Signs from NHS, AHA and British Heart Foundation
 * descriptions of heart attack; stroke-association descriptions of stroke.
 */
export const EMERGENCY_CASES = [
  { who: 'Jorge, 58,', story: 'stops on the stairs, pale and sweating. He says his chest feels as if a weight is sitting on it, and the ache is spreading into his left arm', kind: 'attack',
    why: 'Pressure in the chest that spreads to an arm, with sweating: the classic picture of a heart attack. He is awake, so there is no CPR, but he needs an ambulance now.' },
  { who: 'Elena, 67,', story: 'has felt sick and short of breath for twenty minutes, with an ache in her jaw and upper back. She says she has no chest pain and is "just tired"', kind: 'attack',
    why: 'Breathlessness, nausea and an ache in the jaw or back can be a heart attack even without chest pain. That is commoner in women, in older people and in people with diabetes.' },
  { who: 'Daniel, 71,', story: 'drops his cup at breakfast. The right side of his mouth sags, and when he tries to explain, his words come out slurred', kind: 'stroke',
    why: 'A drooping face and slurred speech that come on suddenly are signs of a stroke. The treatments work only in the first hours, so the time it began matters.' },
  { who: 'Rosa, 49,', story: 'suddenly cannot lift her left arm, and for ten minutes her speech is jumbled. Then it all passes and she says she feels fine', kind: 'stroke',
    why: 'Signs of a stroke that pass may be a "mini-stroke" (a transient ischaemic attack). The risk of a full stroke is highest in the hours and days that follow, so it is still an emergency.' },
  { who: 'Henrik, 63,', story: 'slumps in his seat on the bus. He does not respond when you tap his shoulders and shout, and in ten seconds you see one snoring gasp', kind: 'arrest',
    why: 'Unresponsive and not breathing normally is a cardiac arrest, whatever caused it. Compressions start at once.' },
  { who: 'Amina, 55,', story: 'was describing a crushing pain in her chest a minute ago. Now she has collapsed, does not respond, and is not breathing', kind: 'arrest',
    why: 'A heart attack can turn into a cardiac arrest. Once she is unresponsive and not breathing normally, the first aid changes to compressions.' },
  { who: 'Li Wei, 74,', story: 'cannot keep his left arm raised when asked, although his smile is even and his speech is clear', kind: 'stroke',
    why: 'One sign is enough. An arm that sinks when both are raised is reason to call at once.' },
  { who: 'Marta, 61,', story: 'has had a tight, heavy feeling across her chest for fifteen minutes. It has not eased with rest, and she feels faint and clammy', kind: 'attack',
    why: 'Chest tightness that lasts and does not ease with rest, with faintness and clammy skin, is treated as a heart attack until a hospital says otherwise.' },
];

/** Example people for the FAST practice: every row has at least one sign, because a clear FAST never rules a stroke out. */
export const FAST_PEOPLE = ['Rosa', 'Daniel', 'Li Wei', 'Marta', 'Henrik', 'Amina', 'Yusuf', 'Greta'];

/* ---------------------------------------------------------------------- lesson 4: choking-breathing */
//
//   Topic            ERC 2025 First Aid / RCUK 2025              AHA 2025 (Part 7), AHA/ARC 2024                What the course teaches
//   ---------------  ------------------------------------------  ---------------------------------------------  ---------------------------------------
//   Choking, adult   encourage coughing; if the cough fails:     severe obstruction: cycles of 5 back blows     cough if they can; if not: back blows,
//   and child > 1    up to 5 back blows, then up to 5 abdominal  then 5 abdominal thrusts (new in 2025: back    then abdominal thrusts, alternating;
//                    thrusts, alternating; unresponsive: CPR;    blows first; before, abdominal thrusts only);  unresponsive: CPR. "Up to 5" / "5 and 5"
//                    see a health professional afterwards  [S]   chest thrusts in late pregnancy  [S]           is noted as a difference of wording.
//   Elsewhere        Australia and New Zealand (ANZCOR): back blows, then CHEST thrusts; abdominal thrusts are not taught  [K]
//   Infants          5 back blows and 5 chest thrusts; never abdominal thrusts (AHA 2025 [S]; ERC paediatric [S]): the course says only that it differs
//   Anaphylaxis      adrenaline by auto-injector into the outer  epinephrine auto-injector at once; a second    auto-injector into the outer mid-thigh at
//                    thigh as early as possible; second dose if  dose if symptoms persist after 5 to 10         once; call; lie flat, legs raised (sit up
//                    no better after 5 minutes  [S]; lie flat,   minutes and help is not yet there  [K]         if breathing is easier); second dose after
//                    legs raised; sit up if breathing is hard                                                   about 5 minutes if no better
//   Order            UK charities: inject, then call; Australia (ASCIA): lay flat, inject, then call  [K]: so no step grades the order of these three
//   Asthma           help the person use their own reliever      assist with the person's own prescribed        sit upright, own reliever inhaler (with a
//                    inhaler, with a spacer if there is one [S]  inhaler  [K]                                   spacer), call if it is not helping
//   Puffs            UK (Asthma + Lung UK): 1 puff every 30–60 s, up to 10; Australia (National Asthma Council): 4 puffs, 4 breaths each, wait 4 minutes  [K]:
//                    stated as an example of how plans differ, never graded
//   Drowning         ERC 2025; AHA 2024 update on drowning: rescue breaths matter; do not enter the water untrained (reach or throw)  [K]

/** First aid for an adult or a child over one year who is choking (ERC 2025 First Aid; AHA 2025). */
export const CHOKING_STEPS = [
  'Ask "Are you choking?" If they can cough, encourage them to cough',
  'They cannot cough or speak: have someone call, and give up to 5 back blows',
  'Still blocked: up to 5 abdominal thrusts',
  'Keep alternating back blows and abdominal thrusts',
  'If they become unresponsive: lower them to the ground and start CPR',
];
export const BACK_BLOWS = 5;
export const ABDOMINAL_THRUSTS = 5;

/** What to do for a person who is choking, by how they are. */
export const CHOKING_ACTIONS = {
  cough: 'Encourage them to keep coughing, and stay close',
  blows: 'Have the emergency number called, and give back blows, then abdominal thrusts',
  cpr: 'Call the emergency number and start CPR',
};
export const CHOKING_CASES = [
  { who: 'Kwame, 34,', story: 'is coughing hard at a barbecue, red in the face, eyes watering. Asked if he is choking, he gasps, "Went down the wrong way."', action: 'cough',
    why: 'He can cough and speak, so air is moving. A strong cough is more effective than anything a bystander can do, and interfering could make things worse.' },
  { who: 'Sofia, 9,', story: 'is coughing loudly in the school canteen and crying between coughs.', action: 'cough',
    why: 'Loud coughing and crying both need air. Encourage her to keep coughing, and watch in case the cough weakens.' },
  { who: 'Ines, 52,', story: 'stands up from her meal with a hand at her throat. She cannot make a sound, and shakes her head when asked whether she can breathe.', action: 'blows',
    why: 'She cannot speak or cough: the airway is blocked. Back blows come first, then abdominal thrusts if they fail.' },
  { who: 'Arjun, 41,', story: 'is making weak, silent attempts to cough. His lips are turning blue and he cannot answer.', action: 'blows',
    why: 'A silent, ineffective cough means almost no air is moving. This is severe choking.' },
  { who: 'Tom, 27,', story: 'was coughing strongly a minute ago. Now the cough has faded to a faint wheeze and he can no longer speak.', action: 'blows',
    why: 'Mild choking can turn severe. Once the cough stops working, back blows start.' },
  { who: 'Greta, 70,', story: 'was choking on a piece of meat. She has now slumped to the floor and does not respond.', action: 'cpr',
    why: 'An unresponsive person who was choking needs CPR. Compressions may also push the blockage out.' },
  { who: 'Mateo, 16,', story: 'choked on a sweet during a film. He went silent, then collapsed across the seats, and does not react when shaken.', action: 'cpr',
    why: 'Unresponsive after choking: call, and start CPR.' },
];

/** The second auto-injector: after about this many minutes with no improvement (ERC/RCUK 2025: 5; AHA/ARC: 5 to 10; MHRA: 5 to 15). */
export const SECOND_DOSE_MINUTES = 5;

/** The three breathing emergencies of lesson 4 and their first aid. */
export const BREATHING_ACTIONS = {
  choking: 'Severe choking: back blows, then abdominal thrusts, with the emergency number called',
  anaphylaxis: 'Anaphylaxis: adrenaline auto-injector into the outer thigh without delay, emergency number called, lying down',
  asthma: 'Asthma attack: sitting upright, their own reliever inhaler, and the emergency number if it is not helping',
};
export const BREATHING_CASES = [
  { story: 'Minutes after a wasp sting, Hana\'s lips and tongue swell, her voice turns hoarse and she says she feels faint. She carries an auto-injector.', kind: 'anaphylaxis',
    why: 'Swelling of the tongue, a hoarse voice and faintness, minutes after a sting: a severe allergic reaction. Adrenaline is the treatment, and it works best early.' },
  { story: 'Ben has a nut allergy. Ten minutes into a meal he is wheezing, covered in raised itchy patches, and feels he may pass out.', kind: 'anaphylaxis',
    why: 'Breathing trouble and faintness, coming on fast after a food he is allergic to, with a rash: anaphylaxis.' },
  { story: 'Lucía has asthma. After running in cold air she is wheezing and coughing, breathless but able to talk, and her inhaler is in her bag.', kind: 'asthma',
    why: 'A known asthma, a familiar trigger, a wheeze, and no swelling, rash or faintness: an asthma attack. Her own reliever inhaler is the first step.' },
  { story: 'At a dinner, Ines suddenly stands up clutching her throat. She cannot speak and cannot cough.', kind: 'choking',
    why: 'Sudden, silent, in the middle of eating, hand at the throat: something is blocking her airway.' },
  { story: 'Omar, 12, has had asthma for years. A chest cold has left him tight-chested and wheezy tonight, and his reliever inhaler is beside him.', kind: 'asthma',
    why: 'His asthma, set off by a cold. Sitting upright and using his reliever inhaler come first; if it does not help, call.' },
  { story: 'A man eating alone at the next table goes silent and grabs at his neck. His face is darkening and no sound comes out.', kind: 'choking',
    why: 'He was eating, and now he cannot make a sound: severe choking.' },
  { story: 'Fifteen minutes after the first dose of a new medicine, Noor has a tight throat and noisy breathing, a rash spreading over her body, and feels dizzy. She has an auto-injector in her bag.', kind: 'anaphylaxis',
    why: 'Medicines are a common trigger. Throat tightness, noisy breathing and dizziness coming on within minutes, with a rash, are anaphylaxis.' },
];

/* ------------------------------------------------------------------------- lesson 5: bleeding-burns */
//
//   Topic            ERC 2025 First Aid / RCUK 2025              AHA/ARC 2024 First Aid                         What the course teaches
//   ---------------  ------------------------------------------  ---------------------------------------------  ---------------------------------------
//   Severe bleeding  escalate: firm direct manual pressure,      direct pressure first; for life-threatening    press hard and keep pressing; call;
//                    then a haemostatic dressing and/or a        bleeding a tourniquet, or wound packing where  tourniquet above the wound for a limb
//                    tourniquet  [S]                             a tourniquet cannot go  [S]                    that pressure cannot control; packing
//                                                                                                               is named, and left to a class
//   Tourniquet       a manufactured one, a few centimetres (5 to 7) above the wound, not over a joint, tightened until the bleeding stops,
//                    time noted, left on (ERC 2021 First Aid; Stop the Bleed, American College of Surgeons; St John Ambulance)  [K]
//   Soaked dressing  bodies differ on whether to add a pad on top or to replace it  [K]: the course teaches neither, only "do not lift to look"
//   Embedded object  do not pull it out; press on either side (St John Ambulance; British and American Red Cross)  [K]
//   Nosebleed        sit, lean forward, pinch the soft part of the nose for 10 to 15 minutes (NHS; AHA/ARC 2024; St John: 10 minutes at a time)  [K]
//   Burns            cool with running water, 20 minutes         cool at once with clean running water; the     cool running water, 20 minutes ("some
//                    (ERC 2021 [S]; NHS, British Burn            Red Cross advisory supports 10 to 20 minutes   guidelines accept 10 as a minimum");
//                    Association, St John, British Red Cross:    at least  [S]; IFRC 2020: at least 10,         no step turns on 10 versus 20
//                    20 minutes  [S])                            ideally 20  [K]
//   After cooling    remove jewellery; cover loosely with cling film or a clean non-fluffy dressing; no ice, butter, toothpaste; leave blisters (NHS; BBA)  [S/K]
//   Needs hospital   NHS: bigger than the person's hand; deep (white or charred); on the face, hands, feet, joints or genitals; chemical or
//                    electrical; any burn in a young child  [K]
//   Fractures        support in the position found; do not straighten; call for the thigh, hip, back, an open fracture or a cold, blue limb
//                    (AHA/ARC 2024; St John Ambulance)  [K]
//   Sprains          rest from what hurt it; a wrapped cold pack for up to 20 minutes eases pain (AHA/ARC 2024); "RICE" (NHS) versus early
//                    movement ("PEACE and LOVE", Br J Sports Med 2019): the evidence on ice and rest for healing is thin  [K]
//   Head injury      NHS; Concussion in Sport Group (Amsterdam 2022): red flags mean call; watch for 24 to 48 hours; no return to play the same day  [K]
//   Spine            do not move the person unless they are in danger; keep the head still (ERC 2025; AHA/ARC 2024; St John)  [K]

/** How long to cool a burn under running water: the figure most guidelines give, and the minimum some accept. */
export const BURN_COOL_MINUTES = { usual: 20, minimum: 10 };
/** How long to pinch the nose for a nosebleed, in minutes (NHS: 10 to 15; British Red Cross and St John Ambulance: 10 at a time). */
export const NOSE_PINCH_MINUTES = [10, 15];
/** A tourniquet goes this many centimetres above the wound (ERC 2021 First Aid; Stop the Bleed: 2 to 3 inches). */
export const TOURNIQUET_ABOVE_CM = [5, 7];
/** Unbroken minutes in the `press-hold` model before the bleeding is controlled: an illustration, not a guideline figure. */
export const PRESS_MODEL_MINUTES = 10;

export const BLEED_ACTIONS = {
  press: 'Press firmly and directly on the wound, and keep pressing',
  object: 'Leave the object in place and press firmly on either side of it',
  tourniquet: 'Put the tourniquet on the limb, a few centimetres above the wound, and tighten it until the bleeding stops',
  nose: 'Sit them leaning forward and pinch the soft part of the nose',
};
export const BLEED_CASES = [
  { story: 'Chidi has a deep cut across his forearm from a broken window. No glass is left in the wound, and blood is running steadily down his arm. Someone is calling the emergency number.', action: 'press',
    why: 'Firm, direct pressure is the first answer to almost all bleeding. It squeezes the cut vessels shut so that a clot can form.' },
  { story: 'A chisel has slipped and Ana\'s palm is cut and bleeding fast. A colleague is already on the phone to the emergency number.', action: 'press',
    why: 'Press straight onto the wound, with a clean cloth if one is to hand and a bare hand if not, and do not let go.' },
  { story: 'A shard of glass as long as a finger is sticking out of Marek\'s thigh, and blood is welling up around it. Help has been called.', action: 'object',
    why: 'The object may be plugging the vessel it cut. Pulling it out can turn a slow bleed into a fast one, so the pressure goes on either side.' },
  { story: 'A long nail has gone through the edge of Dev\'s hand and is still in place. The wound is bleeding around it. Help has been called.', action: 'object',
    why: 'Leave it where it is: removing it is a job for a hospital. Press beside it and pad around it.' },
  { story: 'After a chainsaw accident Viktor\'s lower leg is bleeding in spurts. Two people have pressed hard on it and the blood still pours out. The emergency number has been called, and the site\'s bleeding-control kit holds a tourniquet.', action: 'tourniquet',
    why: 'Life-threatening bleeding from a limb that pressure cannot control is what a tourniquet is for. It goes above the wound, between the wound and the heart, never over a joint.' },
  { story: 'In a road accident Lena\'s forearm has been badly crushed, and firm pressure is not stopping the heavy bleeding. The emergency number has been called. The car\'s first-aid kit includes a tourniquet.', action: 'tourniquet',
    why: 'When direct pressure fails on a limb, a tourniquet can save a life. Note the time it went on, and leave it on.' },
  { story: 'Sam, 11, has a nosebleed that started while he was reading. He is otherwise well.', action: 'nose',
    why: 'Leaning forward lets the blood run out of the nose and not down the throat. The pinch is held for 10 to 15 minutes without letting go to check.' },
  { story: 'On a hot, dry afternoon Mrs Okafor\'s nose starts to bleed. She feels fine otherwise.', action: 'nose',
    why: 'Sit, lean forward, pinch the soft part just above the nostrils, and breathe through the mouth.' },
];

export const BURN_LEVELS = {
  home: 'Cool it for 20 minutes, cover it loosely, and look after it at home',
  help: 'Cool it for 20 minutes, cover it loosely, and get medical help',
};
/** Which burns need medical attention after first aid (NHS). */
export const BURN_CASES = [
  { story: 'An adult touches a hot oven tray. There is a red, sore patch the size of a coin on her forearm, with no blister.', level: 'home',
    why: 'Small, shallow and away from the face, hands and joints: after cooling and covering, this one usually heals by itself.' },
  { story: 'An adult spills coffee on his thigh. The skin is red over an area smaller than a bank card, and unbroken.', level: 'home',
    why: 'A small, superficial scald. Cool it, cover it, and seek advice if it blisters badly or looks infected later.' },
  { story: 'A pan of boiling water tips over an adult\'s forearm. Most of the forearm is red and blistering.', level: 'help',
    why: 'A burn bigger than the person\'s own hand needs medical attention, however well the first aid goes.' },
  { story: 'Hot oil spits from a pan and leaves a blistered burn the size of a coin on a cook\'s cheek.', level: 'help',
    why: 'Burns on the face need to be seen, whatever their size. So do burns on the hands, feet, joints and genitals.' },
  { story: 'A rider\'s shin touches a hot exhaust pipe. The patch is small, but it looks waxy white and hardly hurts.', level: 'help',
    why: 'White or charred skin with little pain is a sign of a deep burn: the nerve endings themselves are damaged.' },
  { story: 'A two-year-old pulls a mug of hot tea over herself. The skin of her chest is red and beginning to blister.', level: 'help',
    why: 'Burns in babies and young children should always be seen by a health professional.' },
  { story: 'A man grabs the handle of a pan straight from the oven. His palm and fingers are red and blistered.', level: 'help',
    why: 'Burns on the hands need medical attention: swelling and scarring there can limit movement.' },
];

/* ------------------------------------------------------------------- lesson 6: everyday-emergencies */
//
//   Topic            ERC 2025 First Aid / RCUK 2025              AHA/ARC 2024 First Aid; AHA 2025               What the course teaches
//   ---------------  ------------------------------------------  ---------------------------------------------  ---------------------------------------
//   Fainting         lie down; raise the legs; physical counter-pressure for someone who feels faint (ERC 2021; AHA/ARC 2019 and 2024; NHS; St John)  [K]
//                    NHS: call if not awake after 1 minute, not fully recovered, chest pain, a seizure, injury, fainted during exercise  [K]
//   Seizures         protect from injury; do not restrain;       stay; help to the ground; clear the area; on   cushion the head, time it, nothing in the
//                    nothing in the mouth; recovery position     the side afterwards; call for a first          mouth, no restraint, recovery position
//                    afterwards  [K]                             seizure, one over 5 minutes, repeated          afterwards; call for more than 5 minutes,
//                                                                seizures, a seizure in water, injury, or no    a repeat, a first seizure, water, injury,
//                                                                return to normal within 5 to 10 minutes  [S]   pregnancy, or slow recovery
//   Low blood sugar  awake and able to swallow: 15–20 g glucose  awake and able to swallow: oral glucose,       fast sugar (15 to 20 g: stated, not
//                    by mouth; repeat after 15 minutes if no     20 g or more; glucose tablets preferred  [S]   graded), wait 10 to 15 minutes, repeat,
//                    better; unresponsive: nothing by mouth,                                                    then a snack; unresponsive: nothing by
//                    call, recovery position  [S]                                                               mouth, call
//   Heat             heat exhaustion: cool place, simple         heatstroke (heat illness with altered mental   exhaustion versus heatstroke decided by
//                    cooling, fluids; heatstroke: the fastest    state): call; cool-to-cold water immersion     confusion or collapse; heatstroke: call
//                    cooling available, such as cold-water       from the neck down for 15 minutes or until     and cool fast, immersion if possible
//                    immersion  [S]                              symptoms resolve  [S]
//   Cooling rates    cold-water immersion about 0.2 °C a minute; water spray and fanning well under 0.1; shade alone about 0.03 (sports-medicine
//                    reviews: Casa and others 2007; McDermott and others 2009)  [K]: used for the cooling model, labelled as typical figures
//   Core temperature normal about 36.5–37.5 °C; hypothermia below 35 °C; heatstroke about 40 °C or more with confusion or collapse (textbook definitions)  [K]
//   Hypothermia      shelter, remove wet clothing, insulate, warm gradually, warm sweet drinks only if fully awake, handle gently, no alcohol,
//                    no rubbing, no hot bath (NHS; AHA/ARC 2024; St John)  [K]
//   Poisoning        call a poison centre or the emergency number; do not make the person vomit; nothing by mouth unless told; keep the
//                    container (NHS; AHA/ARC 2024; poison centres)  [K]
//   Opioid overdose  AHA 2025: lay rescuers may give naloxone; unresponsive and not breathing normally: CPR with breaths  [S];
//                    naloxone can wear off before the opioid does, so an ambulance is still needed (WHO; NHS)  [K]
//   Crisis lines     988 (United States and Canada), Samaritans 116 123 (United Kingdom and Ireland), Lifeline 13 11 14 (Australia),
//                    findahelpline.com (as listed in the authors' brief)  [K]: not re-checked by search in this session

/** Core body temperature in °C: the normal band and the two emergency thresholds (textbook definitions). */
export const CORE_TEMP = { normal: [36.5, 37.5], hypothermiaBelow: 35, heatstrokeFrom: 40 };

/** Fast sugar for low blood sugar, in grams of glucose (ERC/RCUK 2025: 15 to 20; AHA/ARC 2024: 20 or more). Stated, never graded. */
export const SUGAR_GRAMS = [15, 20];
/** Minutes to wait before giving sugar again (ERC/RCUK 2025: 15; Diabetes UK: 10 to 15). */
export const SUGAR_WAIT_MINUTES = [10, 15];
/** A seizure that lasts longer than this many minutes needs an ambulance (AHA/ARC 2024; NHS; epilepsy charities). */
export const SEIZURE_CALL_MINUTES = 5;
/** Heat exhaustion should ease within about this many minutes of rest and cooling (NHS). */
export const HEAT_EXHAUSTION_MINUTES = 30;

/** The cooling model of lesson 6: a person at `start` °C, and typical cooling rates in °C a minute. */
export const COOLING = { start: 41.5, aim: 39, immersion: 0.2, sprayFan: 0.08, shade: 0.03 };

/** The steps for low blood sugar in someone with diabetes. */
export const SUGAR_STEPS = [
  'Check that they are awake and able to swallow',
  'Give fast sugar: glucose tablets, fruit juice or a sugary drink',
  'Wait 10 to 15 minutes; if they are no better, give sugar again',
  'Once they feel better, a longer-lasting snack, such as a sandwich',
];

export const SEIZURE_OPTIONS = {
  call: 'Call the emergency number',
  stay: 'No ambulance is needed: stay with them until they are fully recovered',
};
/** When a seizure needs an ambulance (AHA/ARC 2024 First Aid; NHS; epilepsy charities). */
export const SEIZURE_CASES = [
  { story: 'Marta falls and her limbs jerk. You time it: after 7 minutes the jerking is still going on.', call: true,
    why: 'A seizure that lasts more than 5 minutes may not stop by itself and needs emergency treatment.' },
  { story: 'Zofia, 19, has a seizure that stops after 2 minutes. Her friends say she has never had one before.', call: true,
    why: 'A first seizure always needs to be assessed, however short it was.' },
  { story: 'Anton\'s seizure stops after 3 minutes. Before he has come round, a second one begins.', call: true,
    why: 'Seizures that follow one another without the person waking in between are an emergency.' },
  { story: 'Bea has a 1-minute seizure in a swimming pool and is lifted out by the lifeguard.', call: true,
    why: 'After a seizure in water the person may have breathed water in, even if they seem to recover.' },
  { story: 'Farid\'s seizure lasts 2 minutes. As he fell he struck his head hard on a stone step.', call: true,
    why: 'An injury during the seizure, a blow to the head above all, needs to be checked.' },
  { story: 'Noa\'s seizure lasted 2 minutes. A quarter of an hour later she still does not respond to her name.', call: true,
    why: 'Drowsiness for a few minutes afterwards is usual. Not coming round after 5 to 10 minutes is not.' },
  { story: 'Carmen, who is seven months pregnant, has a seizure lasting 1 minute.', call: true,
    why: 'A seizure in pregnancy is an emergency for two.' },
  { story: 'Your colleague Sami has epilepsy, and has told you that his seizures last a minute or two. Today his seizure stops after 2 minutes. He has not hurt himself, and a few minutes later he is awake, tired, and knows where he is.', call: false,
    why: 'A short seizure in someone known to have epilepsy, with no injury and a normal recovery, usually needs no ambulance. Stay until he is fully himself again.' },
  { story: 'Jo has had epilepsy for years. She has a seizure of 90 seconds at her desk, and a colleague who knows her says this is how her seizures go. She has not hurt herself, and five minutes later she is talking normally.', call: false,
    why: 'This is her usual pattern, she is not hurt, and she has recovered as usual. Company and a quiet place to rest are what she needs.' },
];

export const HEAT_OPTIONS = {
  exhaustion: 'Heat exhaustion: a cool place, lying down, cooling the skin, and water to drink',
  stroke: 'Heatstroke: call the emergency number now, and cool them as fast as you can',
};
/** Heat exhaustion or heatstroke? The dividing line is the brain: confusion, collapse or a seizure (AHA/ARC 2024; NHS). */
export const HEAT_CASES = [
  { story: 'After two hours of gardening in the sun, Walter is pale and sweating heavily, with a headache and a feeling of sickness. He answers questions normally.', kind: 'exhaustion',
    why: 'He is thinking clearly, so this is heat exhaustion. With rest, cooling and water he should feel better within about half an hour; if he does not, call.' },
  { story: 'At a summer fun run Aiko stops, dizzy and cramping, her skin cool and clammy. She knows where she is and what day it is.', kind: 'exhaustion',
    why: 'Dizzy and cramping but clear-headed: heat exhaustion. Cool her down before it becomes something worse.' },
  { story: 'During a heatwave Mr Petrov, 81, is found in his flat, hot to the touch, muddled, and unable to say where he is.', kind: 'stroke',
    why: 'Hot and muddled: the brain is affected. That is heatstroke, and it is life-threatening.' },
  { story: 'At a festival on a hot afternoon Dani collapses. Her skin is hot, she is talking nonsense, and then she has a seizure.', kind: 'stroke',
    why: 'Collapse, confused speech and a seizure in the heat mean heatstroke. Call, and cool her fast.' },
  { story: 'A roofer working in 38 °C heat becomes aggressive and confused, and staggers when he walks. His skin is hot and dry.', kind: 'stroke',
    why: 'A sudden change of behaviour in the heat is a warning sign of heatstroke, whether the skin is dry or still sweating.' },
  { story: 'After a long hike on a hot day Ingrid feels weak and thirsty, and has a pounding headache. She is sweating a great deal and talks normally.', kind: 'exhaustion',
    why: 'Heavy sweating, headache and weakness with a clear head: heat exhaustion.' },
];

export const EVERYDAY_OPTIONS = {
  faint: 'A faint: lay them flat and raise their legs',
  seizure: 'A seizure: protect the head, time it, and put nothing in the mouth',
  sugar: 'Low blood sugar: something sugary to eat or drink, as they are awake and can swallow',
  cold: 'Hypothermia: shelter, dry layers, and gentle, gradual warming, with help called',
};
export const EVERYDAY_CASES = [
  { story: 'In a hot, crowded train Emil turns pale, says he feels dizzy, and slides to the floor. He opens his eyes within seconds.', kind: 'faint',
    why: 'A brief drop in the blood supply to the brain. Flat on the floor with the legs up, the blood returns, and so does he.' },
  { story: 'At the sight of a needle Tess goes white, sways, and crumples to the ground. She is breathing normally and starts to stir almost at once.', kind: 'faint',
    why: 'A faint. Raising her legs brings her round faster; then she should sit up slowly.' },
  { story: 'Leila has diabetes and takes insulin. She missed lunch, and now she is shaky, sweating and snapping at people, which is not like her. She is awake and can swallow.', kind: 'sugar',
    why: 'Shaky, sweaty and out of character in someone who takes insulin: her blood sugar is low. Sugar by mouth works within minutes.' },
  { story: 'Ravi wears a diabetes alert bracelet. At the end of a long football match he is pale, trembling and confused, though he can still drink.', kind: 'sugar',
    why: 'Exercise uses up glucose. While he can still swallow, a sugary drink or glucose tablets are the treatment.' },
  { story: 'Marta suddenly stiffens and falls, and her arms and legs jerk in rhythm. She does not respond to her name.', kind: 'seizure',
    why: 'Stiffening, then rhythmic jerking: a seizure. Keep her from hurting herself, and time it.' },
  { story: 'A man in a queue cries out, drops to the ground and shakes all over, his jaw clenched.', kind: 'seizure',
    why: 'A seizure. Nothing goes into the mouth: he cannot swallow his tongue, and fingers and teeth get broken.' },
  { story: 'A walker who has been out in cold rain for hours is shivering hard, fumbling with his zip and slurring his words.', kind: 'cold',
    why: 'Shivering, clumsiness and slurred speech after hours of cold and wet: his core temperature is falling.' },
  { story: 'In winter an elderly neighbour is found in her unheated house, cold to the touch, drowsy and muddled.', kind: 'cold',
    why: 'Hypothermia often happens indoors, to older people in cold homes. Warm her gradually, and get help.' },
];

/** Where to find help in a mental-health crisis. The numbers are those named in the authors' brief. */
export const CRISIS_LINES = [
  { place: 'the United States and Canada', contact: 'call or text **988**' },
  { place: 'the United Kingdom and Ireland', contact: 'call Samaritans on **116 123**' },
  { place: 'Australia', contact: 'call Lifeline on **13 11 14**' },
];
export const CRISIS_DIRECTORY = 'findahelpline.com';

/** What a basic home first-aid kit holds (British Red Cross; St John Ambulance; NHS). */
export const KIT = ['plasters in several sizes', 'sterile dressings and a roll of bandage', 'a triangular bandage', 'disposable gloves', 'scissors and tape', 'cling film', 'a foil blanket'];

/* ------------------------------------------------------------------------------------ small tools */

/** "a", "b and c", "a, b and c". */
export const listOf = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/** Capitalise the first letter of a sentence fragment. */
export const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);
