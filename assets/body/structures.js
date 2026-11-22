/**
 * The body-map tables: every structure and every anchor point the widget knows, with its plain English name,
 * its scientific name where that differs, the system(s) it belongs to and a one-sentence note.
 *
 * The notes are health information that learners read. Each is one plain sentence that a physiology textbook
 * would agree with; when in doubt they say less. Change them with the same care.
 *
 * STRUCTURES  id → [name, scientific name or '', system (first is the main one; more after a space), note]
 * ANCHORS     id → [name, scientific name or '', system, note]   points, not shapes: joints, pulse points, places on the skin
 * ALIASES     a short name for several ids ('lungs', 'kidneys', 'spine', 'cerebrum' …)
 *
 * Where each one is drawn is in the artwork modules next to this file (front.js, back.js, head.js …).
 */

export const SYSTEMS = {
  skin: 'Skin',
  skeleton: 'Skeleton',
  muscles: 'Muscles',
  circulatory: 'Circulatory system',
  respiratory: 'Respiratory system',
  digestive: 'Digestive system',
  urinary: 'Urinary system',
  nervous: 'Nervous system',
  endocrine: 'Endocrine system',
  immune: 'Immune and lymphatic system',
  reproductive: 'Reproductive system',
  cell: 'Cell',
  surface: 'Body surface',
};

export const STRUCTURES = {
  /* ------------------------------------------------------------------ skin */
  skin: ['Skin', '', 'skin', 'The skin is the body\'s largest organ; it keeps water in and germs out and helps to control body temperature.'],
  epidermis: ['Outer skin layer', 'epidermis', 'skin', 'The epidermis is the thin outer layer of the skin; its surface is made of dead, toughened cells that are constantly shed and replaced.'],
  dermis: ['Inner skin layer', 'dermis', 'skin', 'The dermis is the thicker layer under the epidermis that holds blood vessels, nerve endings, sweat glands and hair roots.'],
  'fat-layer': ['Fat layer', 'subcutaneous tissue', 'skin', 'The layer of fat under the skin stores energy, cushions the body and helps to keep heat in.'],
  hair: ['Hair', '', 'skin', 'Each hair grows from a follicle in the skin; the part you can see is made of dead cells.'],
  'hair-follicle': ['Hair follicle', '', 'skin', 'A hair follicle is the tiny pit in the skin from which a hair grows.'],
  'sweat-gland': ['Sweat gland', '', 'skin', 'Sweat glands release sweat onto the skin, and the body cools as the sweat evaporates.'],
  'sweat-pore': ['Sweat pore', '', 'skin', 'A sweat pore is the opening on the surface of the skin through which sweat leaves a sweat gland.'],
  'oil-gland': ['Oil gland', 'sebaceous gland', 'skin', 'Oil glands release an oily substance that keeps the skin and hair supple.'],
  'skin-vessels': ['Blood vessels of the skin', '', 'skin circulatory', 'Blood vessels in the dermis widen to let heat escape and narrow to keep it in.'],
  'nerve-endings': ['Nerve endings', 'sensory receptors', 'skin nervous', 'Nerve endings in the skin sense touch, pressure, temperature and pain.'],

  /* -------------------------------------------------------------- skeleton */
  skull: ['Skull', 'cranium', 'skeleton', 'The skull is the bony case that protects the brain and gives the face its shape.'],
  jaw: ['Lower jaw', 'mandible', 'skeleton', 'The lower jaw is hinged to the skull in front of each ear and moves when you chew and speak.'],
  'cervical-spine': ['Neck vertebrae', 'cervical spine', 'skeleton', 'Seven vertebrae form the neck part of the spine and carry the head.'],
  'thoracic-spine': ['Chest vertebrae', 'thoracic spine', 'skeleton', 'Twelve vertebrae form the chest part of the spine, and each one carries a pair of ribs.'],
  'lumbar-spine': ['Lower-back vertebrae', 'lumbar spine', 'skeleton', 'Five large vertebrae form the lower back and bear much of the weight of the upper body.'],
  sacrum: ['Sacrum', '', 'skeleton', 'The sacrum is a triangle of fused vertebrae that joins the spine to the hip bones.'],
  tailbone: ['Tailbone', 'coccyx', 'skeleton', 'The tailbone is a few small fused vertebrae at the very bottom of the spine.'],
  ribs: ['Ribs', '', 'skeleton', 'Twelve pairs of ribs curve round the chest and protect the heart and lungs.'],
  breastbone: ['Breastbone', 'sternum', 'skeleton', 'The breastbone is the flat bone down the middle of the chest, which most of the ribs join at the front.'],
  collarbone: ['Collarbone', 'clavicle', 'skeleton', 'The collarbone links the breastbone to the shoulder blade and props the shoulder out to the side.'],
  'shoulder-blade': ['Shoulder blade', 'scapula', 'skeleton', 'The shoulder blade is a flat triangular bone on the upper back that carries the socket of the shoulder joint.'],
  humerus: ['Upper arm bone', 'humerus', 'skeleton', 'The humerus runs from the shoulder to the elbow.'],
  radius: ['Radius', '', 'skeleton', 'The radius is the forearm bone on the thumb side.'],
  ulna: ['Ulna', '', 'skeleton', 'The ulna is the forearm bone on the little-finger side, and its upper end forms the point of the elbow.'],
  'hand-bones': ['Hand bones', 'carpals, metacarpals and phalanges', 'skeleton', 'Each hand and wrist has 27 bones: 8 in the wrist, 5 in the palm and 14 in the fingers and thumb.'],
  pelvis: ['Pelvis', '', 'skeleton', 'The pelvis is the ring of bone that joins the spine to the legs and supports the organs of the lower abdomen.'],
  femur: ['Thigh bone', 'femur', 'skeleton', 'The femur is the longest and strongest bone in the body.'],
  kneecap: ['Kneecap', 'patella', 'skeleton', 'The kneecap is a small bone in the tendon at the front of the knee that protects the joint.'],
  tibia: ['Shin bone', 'tibia', 'skeleton', 'The tibia is the larger of the two lower-leg bones and carries most of the body\'s weight.'],
  fibula: ['Calf bone', 'fibula', 'skeleton', 'The fibula is the thin bone on the outer side of the lower leg.'],
  'foot-bones': ['Foot bones', 'tarsals, metatarsals and phalanges', 'skeleton', 'Each foot and ankle has 26 bones, arranged in arches that spread the body\'s weight.'],

  /* --------------------------------------------------------------- muscles */
  deltoid: ['Shoulder muscle', 'deltoid', 'muscles', 'The deltoid caps the shoulder and lifts the arm away from the body.'],
  pectorals: ['Chest muscles', 'pectoralis major', 'muscles', 'The chest muscles pull the arms forwards and across the body, as in a push-up.'],
  biceps: ['Biceps', 'biceps brachii', 'muscles', 'The biceps bends the elbow and turns the palm upwards.'],
  triceps: ['Triceps', 'triceps brachii', 'muscles', 'The triceps, at the back of the upper arm, straightens the elbow.'],
  'forearm-muscles': ['Forearm muscles', '', 'muscles', 'The forearm muscles move the wrist and fingers and give the hand its grip.'],
  abdominals: ['Abdominal muscles', 'rectus abdominis', 'muscles', 'The abdominal muscles run down the front of the abdomen and bend the trunk forwards.'],
  obliques: ['Side abdominal muscles', 'obliques', 'muscles', 'The obliques lie at the sides of the abdomen and twist and bend the trunk.'],
  quadriceps: ['Front thigh muscles', 'quadriceps', 'muscles', 'The quadriceps is a group of four muscles at the front of the thigh that straightens the knee.'],
  hamstrings: ['Back thigh muscles', 'hamstrings', 'muscles', 'The hamstrings are three muscles at the back of the thigh that bend the knee.'],
  glutes: ['Buttock muscles', 'gluteal muscles', 'muscles', 'The gluteal muscles straighten the hip when you stand up, climb or run.'],
  calves: ['Calf muscles', 'gastrocnemius and soleus', 'muscles', 'The calf muscles pull on the heel through the Achilles tendon and push the foot off the ground.'],
  trapezius: ['Trapezius', '', 'muscles', 'The trapezius spreads from the neck across the upper back and moves and steadies the shoulder blades.'],
  latissimus: ['Broad back muscle', 'latissimus dorsi', 'muscles', 'The latissimus dorsi is the broadest muscle of the back and pulls the arm down and backwards.'],
  diaphragm: ['Diaphragm', '', 'respiratory muscles', 'The diaphragm is the dome of muscle under the lungs; when it contracts it flattens and air is drawn into the lungs.'],
  'heart-muscle': ['Heart muscle', 'myocardium', 'circulatory muscles', 'The wall of the heart is cardiac muscle, a kind found nowhere else in the body, which contracts without conscious control.'],

  /* ----------------------------------------------------------- circulatory */
  heart: ['Heart', '', 'circulatory', 'The heart is a muscular pump about the size of a fist that drives blood round the body.'],
  aorta: ['Aorta', '', 'circulatory', 'The aorta is the largest artery; it carries oxygen-rich blood from the left ventricle to the body.'],
  arteries: ['Main arteries', '', 'circulatory', 'Arteries carry blood away from the heart under high pressure.'],
  veins: ['Main veins', '', 'circulatory', 'Veins carry blood back to the heart.'],
  'superior-vena-cava': ['Upper main vein', 'superior vena cava', 'circulatory', 'The superior vena cava returns blood from the head, arms and chest to the right atrium.'],
  'inferior-vena-cava': ['Lower main vein', 'inferior vena cava', 'circulatory', 'The inferior vena cava returns blood from the abdomen and legs to the right atrium.'],
  'pulmonary-artery': ['Lung artery', 'pulmonary artery', 'circulatory', 'The pulmonary artery carries oxygen-poor blood from the right ventricle to the lungs.'],
  'pulmonary-veins': ['Lung veins', 'pulmonary veins', 'circulatory', 'The pulmonary veins carry oxygen-rich blood from the lungs to the left atrium.'],
  'right-atrium': ['Right atrium', '', 'circulatory', 'The right atrium receives oxygen-poor blood from the body.'],
  'right-ventricle': ['Right ventricle', '', 'circulatory', 'The right ventricle pumps oxygen-poor blood to the lungs.'],
  'left-atrium': ['Left atrium', '', 'circulatory', 'The left atrium receives oxygen-rich blood from the lungs.'],
  'left-ventricle': ['Left ventricle', '', 'circulatory', 'The left ventricle has the thickest wall of the four chambers and pumps oxygen-rich blood to the whole body.'],
  septum: ['Septum', '', 'circulatory', 'The septum is the muscular wall that separates the right side of the heart from the left.'],
  'tricuspid-valve': ['Tricuspid valve', '', 'circulatory', 'The tricuspid valve lets blood pass from the right atrium to the right ventricle and stops it flowing back.'],
  'pulmonary-valve': ['Pulmonary valve', '', 'circulatory', 'The pulmonary valve lets blood leave the right ventricle for the lungs and stops it flowing back.'],
  'mitral-valve': ['Mitral valve', '', 'circulatory', 'The mitral valve lets blood pass from the left atrium to the left ventricle and stops it flowing back.'],
  'aortic-valve': ['Aortic valve', '', 'circulatory', 'The aortic valve lets blood leave the left ventricle into the aorta and stops it flowing back.'],
  'lung-capillaries': ['Lung capillaries', 'pulmonary capillaries', 'circulatory respiratory', 'Tiny blood vessels wrap each air sac; oxygen passes into the blood here and carbon dioxide passes out.'],

  /* ----------------------------------------------------------- respiratory */
  nose: ['Nose', 'nasal cavity', 'respiratory', 'The nose warms, moistens and filters the air you breathe in.'],
  throat: ['Throat', 'pharynx', 'respiratory digestive', 'The throat is the passage behind the nose and mouth that both air and food pass through.'],
  epiglottis: ['Epiglottis', '', 'respiratory digestive', 'The epiglottis is a flap that folds over the voice box when you swallow, so that food goes down the food pipe and not the windpipe.'],
  'voice-box': ['Voice box', 'larynx', 'respiratory', 'The voice box sits at the top of the windpipe and holds the vocal cords.'],
  windpipe: ['Windpipe', 'trachea', 'respiratory', 'The windpipe is a tube held open by rings of cartilage that carries air to and from the lungs.'],
  bronchi: ['Bronchi', '', 'respiratory', 'The windpipe divides into two bronchi, one for each lung, which branch into ever smaller airways.'],
  bronchioles: ['Small airways', 'bronchioles', 'respiratory', 'Bronchioles are the smallest airways and end in clusters of air sacs.'],
  'right-lung': ['Right lung', '', 'respiratory', 'The right lung has three lobes and is slightly larger than the left.'],
  'left-lung': ['Left lung', '', 'respiratory', 'The left lung has two lobes and a notch that makes room for the heart.'],
  'air-sacs': ['Air sacs', 'alveoli', 'respiratory', 'Air sacs are tiny thin-walled pockets where oxygen enters the blood and carbon dioxide leaves it.'],

  /* ------------------------------------------------------------- digestive */
  mouth: ['Mouth', 'oral cavity', 'digestive', 'Digestion begins in the mouth, where the teeth break food up and saliva moistens it.'],
  teeth: ['Teeth', '', 'digestive', 'Teeth cut and grind food into pieces small enough to swallow.'],
  tongue: ['Tongue', '', 'digestive', 'The tongue is a muscle that moves food around the mouth, helps you swallow and carries the taste buds.'],
  'salivary-glands': ['Salivary glands', '', 'digestive', 'The salivary glands make saliva, which moistens food and begins to break down starch.'],
  'food-pipe': ['Food pipe', 'oesophagus', 'digestive', 'The food pipe is a muscular tube that squeezes swallowed food down to the stomach.'],
  stomach: ['Stomach', '', 'digestive', 'The stomach churns food and mixes it with acid and enzymes that begin to digest protein.'],
  liver: ['Liver', '', 'digestive', 'The liver makes bile, stores nutrients and clears many harmful substances from the blood.'],
  gallbladder: ['Gallbladder', '', 'digestive', 'The gallbladder stores bile from the liver and releases it into the small intestine.'],
  pancreas: ['Pancreas', '', 'digestive endocrine', 'The pancreas makes digestive enzymes and the hormones insulin and glucagon, which control blood sugar.'],
  'small-intestine': ['Small intestine', '', 'digestive', 'Most digestion and almost all absorption of nutrients take place in the small intestine.'],
  'large-intestine': ['Large intestine', 'colon', 'digestive', 'The large intestine absorbs water and salts and forms the remaining waste into stool.'],
  appendix: ['Appendix', '', 'digestive', 'The appendix is a small pouch attached to the first part of the large intestine.'],
  rectum: ['Rectum', '', 'digestive', 'The rectum is the last part of the large intestine, where stool is held before it leaves the body.'],

  /* --------------------------------------------------------------- urinary */
  'right-kidney': ['Right kidney', '', 'urinary', 'The right kidney filters blood to make urine; it sits slightly lower than the left because the liver lies above it.'],
  'left-kidney': ['Left kidney', '', 'urinary', 'The left kidney filters blood to make urine, removing wastes and surplus water.'],
  ureters: ['Ureters', '', 'urinary', 'The ureters are two narrow tubes that carry urine from the kidneys to the bladder.'],
  bladder: ['Bladder', '', 'urinary', 'The bladder is a stretchy muscular bag that stores urine until it is passed.'],

  /* --------------------------------------------------------------- nervous */
  brain: ['Brain', '', 'nervous', 'The brain receives information from the senses and controls thought, memory, movement and the workings of the body.'],
  'frontal-lobe': ['Frontal lobe', '', 'nervous', 'The frontal lobe is involved in planning, decision-making, speech and voluntary movement.'],
  'parietal-lobe': ['Parietal lobe', '', 'nervous', 'The parietal lobe processes touch and the sense of where the body is in space.'],
  'temporal-lobe': ['Temporal lobe', '', 'nervous', 'The temporal lobe processes hearing and plays a major part in memory and in understanding language.'],
  'occipital-lobe': ['Occipital lobe', '', 'nervous', 'The occipital lobe, at the back of the brain, processes vision.'],
  cerebellum: ['Cerebellum', '', 'nervous', 'The cerebellum coordinates movement and balance.'],
  brainstem: ['Brainstem', '', 'nervous', 'The brainstem links the brain to the spinal cord and controls breathing, heart rate and other vital functions.'],
  hypothalamus: ['Hypothalamus', '', 'nervous endocrine', 'The hypothalamus regulates body temperature, hunger, thirst and sleep and controls the pituitary gland.'],
  'spinal-cord': ['Spinal cord', '', 'nervous', 'The spinal cord runs inside the spine and carries signals between the brain and the rest of the body.'],
  nerves: ['Main nerves', '', 'nervous', 'Nerves carry signals between the brain and spinal cord and every part of the body.'],
  eye: ['Eye', '', 'nervous', 'The eye focuses light onto the retina, which turns it into nerve signals for the brain.'],
  ear: ['Ear', '', 'nervous', 'The ear turns sound into nerve signals, and the inner ear also senses balance.'],

  /* ------------------------------------------------------------- endocrine */
  pituitary: ['Pituitary gland', '', 'endocrine', 'The pituitary is a pea-sized gland under the brain whose hormones control growth and many other glands.'],
  thyroid: ['Thyroid gland', '', 'endocrine', 'The thyroid, in the front of the neck, makes hormones that set the rate at which the body uses energy.'],
  adrenals: ['Adrenal glands', '', 'endocrine', 'The adrenal glands sit on top of the kidneys and make hormones including adrenaline and cortisol.'],

  /* ---------------------------------------------------------------- immune */
  tonsils: ['Tonsils', '', 'immune', 'The tonsils are patches of lymphatic tissue at the back of the throat that help to trap germs entering through the mouth and nose.'],
  thymus: ['Thymus', '', 'immune endocrine', 'The thymus, behind the breastbone, is where the white blood cells called T cells mature; it is most active in childhood.'],
  spleen: ['Spleen', '', 'immune', 'The spleen filters the blood, removes worn-out red blood cells and helps to fight infection.'],
  'lymph-nodes-neck': ['Neck lymph nodes', '', 'immune', 'Lymph nodes filter lymph and house white blood cells; those in the neck often swell during a throat infection.'],
  'lymph-nodes-armpit': ['Armpit lymph nodes', '', 'immune', 'Lymph nodes in the armpit filter lymph draining from the arm and the chest wall.'],
  'lymph-nodes-groin': ['Groin lymph nodes', '', 'immune', 'Lymph nodes in the groin filter lymph draining from the leg.'],

  /* ---------------------------------------------------------- reproductive */
  ovaries: ['Ovaries', '', 'reproductive endocrine', 'The ovaries store and release eggs and make the hormones oestrogen and progesterone.'],
  uterus: ['Womb', 'uterus', 'reproductive', 'The uterus is the muscular organ in which a baby develops during pregnancy.'],
  testes: ['Testicles', 'testes', 'reproductive endocrine', 'The testes make sperm and the hormone testosterone.'],
  prostate: ['Prostate gland', '', 'reproductive', 'The prostate is a small gland below the bladder that adds fluid to semen.'],

  /* ------------------------------------------------------------------ cell */
  'cell-membrane': ['Cell membrane', '', 'cell', 'The cell membrane surrounds the cell and controls what enters and leaves it.'],
  cytoplasm: ['Cytoplasm', '', 'cell', 'The cytoplasm is the jelly-like material that fills the cell, in which the organelles sit and many chemical reactions take place.'],
  nucleus: ['Nucleus', '', 'cell', 'The nucleus holds most of the cell\'s DNA.'],
  mitochondria: ['Mitochondria', '', 'cell', 'Mitochondria release energy from nutrients in a form the cell can use.'],
  ribosomes: ['Ribosomes', '', 'cell', 'Ribosomes build proteins by following instructions copied from DNA.'],
  'endoplasmic-reticulum': ['Endoplasmic reticulum', '', 'cell', 'The endoplasmic reticulum is a network of membranes where proteins and fats are made and moved around the cell.'],
  golgi: ['Golgi apparatus', '', 'cell', 'The Golgi apparatus modifies, sorts and packages proteins for delivery inside or outside the cell.'],
  lysosomes: ['Lysosomes', '', 'cell', 'Lysosomes contain enzymes that break down worn-out cell parts and material the cell has taken in.'],
};

/** Which reproductive layer a structure belongs to (both layers are off unless asked for). */
export const LAYERS = { ovaries: 'female', uterus: 'female', testes: 'male', prostate: 'male' };

/**
 * Points with a name. `paired` ones exist on both sides of the body: 'pulse-wrist' means either side,
 * 'pulse-wrist:left' and 'pulse-wrist:right' one of them (the person's own left and right).
 * id → [name, scientific name or '', system, note, paired]
 */
export const ANCHORS = {
  /* joints */
  'shoulder-joint': ['Shoulder joint', '', 'skeleton', 'The shoulder is a ball-and-socket joint and the most mobile joint in the body.', 1],
  'elbow-joint': ['Elbow joint', '', 'skeleton', 'The elbow works as a hinge that bends and straightens the arm.', 1],
  'wrist-joint': ['Wrist joint', '', 'skeleton', 'The wrist joint lets the hand bend up and down and from side to side.', 1],
  'hip-joint': ['Hip joint', '', 'skeleton', 'The hip is a ball-and-socket joint between the thigh bone and the pelvis.', 1],
  'knee-joint': ['Knee joint', '', 'skeleton', 'The knee is the largest joint in the body and works mainly as a hinge.', 1],
  'ankle-joint': ['Ankle joint', '', 'skeleton', 'The ankle joint lets the foot point up and down.', 1],
  'bone-marrow': ['Bone marrow', '', 'immune skeleton', 'Bone marrow, the soft tissue inside bones, makes red blood cells, white blood cells and platelets.', 1],

  /* pulse points */
  'pulse-neck': ['Neck pulse', 'carotid pulse', 'circulatory', 'The carotid pulse is felt in the groove beside the windpipe.', 1],
  'pulse-arm': ['Upper-arm pulse', 'brachial pulse', 'circulatory', 'The brachial pulse is felt on the inner side of the upper arm.', 1],
  'pulse-wrist': ['Wrist pulse', 'radial pulse', 'circulatory', 'The radial pulse is felt on the thumb side of the wrist.', 1],
  'pulse-groin': ['Groin pulse', 'femoral pulse', 'circulatory', 'The femoral pulse is felt in the crease of the groin.', 1],
  'pulse-foot': ['Foot pulse', 'dorsalis pedis pulse', 'circulatory', 'This pulse is felt on the top of the foot.', 1],

  /* places on the surface: front */
  forehead: ['Forehead', '', 'surface', 'The forehead is the part of the face above the eyebrows.'],
  temple: ['Temple', '', 'surface', 'The temple is the flat area at the side of the head, between the eye and the ear.', 1],
  chin: ['Chin', '', 'surface', 'The chin is the front point of the lower jaw.'],
  'neck-front': ['Front of the neck', '', 'surface', 'The windpipe and the voice box can be felt at the front of the neck.'],
  shoulder: ['Shoulder', '', 'surface', 'The shoulder is where the arm joins the trunk.', 1],
  armpit: ['Armpit', 'axilla', 'surface', 'The armpit is the hollow under the shoulder joint.', 1],
  breast: ['Breast', '', 'surface', 'The breast lies on the front of the chest, over the chest muscles.', 1],
  'chest-centre': ['Centre of the chest', '', 'surface', 'The centre of the chest, on the lower half of the breastbone, is where the hands are placed for chest compressions.'],
  'right-upper-chest': ['Right upper chest', '', 'surface', 'This spot is on the person\'s right, just below the collarbone.'],
  'left-side-chest': ['Left side of the chest', '', 'surface', 'This spot is on the person\'s left side, below the armpit.'],
  'upper-abdomen': ['Upper abdomen', '', 'surface', 'This spot is in the midline, between the navel and the lower end of the breastbone.'],
  navel: ['Navel', 'umbilicus', 'surface', 'The navel marks where the umbilical cord was attached before birth.'],
  'lower-abdomen': ['Lower abdomen', '', 'surface', 'This spot is in the midline, below the navel.'],
  'upper-arm': ['Upper arm', '', 'surface', 'The upper arm runs from the shoulder to the elbow.', 1],
  'inner-elbow': ['Inner elbow', '', 'surface', 'The inner elbow is the crease on the front of the elbow.', 1],
  forearm: ['Forearm', '', 'surface', 'The forearm runs from the elbow to the wrist.', 1],
  wrist: ['Wrist', '', 'surface', 'The wrist joins the forearm to the hand.', 1],
  palm: ['Palm', '', 'surface', 'The palm is the inner surface of the hand.', 1],
  fingertip: ['Fingertip', '', 'surface', 'The fingertips are among the most touch-sensitive areas of the skin.', 1],
  hip: ['Hip', '', 'surface', 'The hip is where the leg joins the trunk.', 1],
  groin: ['Groin', '', 'surface', 'The groin is the crease where the thigh meets the abdomen.', 1],
  thigh: ['Thigh', '', 'surface', 'The thigh runs from the hip to the knee.', 1],
  knee: ['Knee', '', 'surface', 'The knee joins the thigh to the lower leg.', 1],
  shin: ['Shin', '', 'surface', 'The shin is the front of the lower leg, where the shin bone lies just under the skin.', 1],
  ankle: ['Ankle', '', 'surface', 'The ankle joins the lower leg to the foot.', 1],
  'foot-top': ['Top of the foot', '', 'surface', 'The top of the foot is the upper surface between the ankle and the toes.', 1],
  toes: ['Toes', '', 'surface', 'The toes help with balance and push off the ground when you walk.', 1],

  /* places on the surface: back */
  'back-of-head': ['Back of the head', '', 'surface', 'The back of the head covers the part of the brain that processes vision.'],
  nape: ['Back of the neck', 'nape', 'surface', 'The back of the neck covers the neck vertebrae.'],
  'between-shoulder-blades': ['Between the shoulder blades', '', 'surface', 'The area between the shoulder blades is where back blows are given to a person who is choking.'],
  'upper-back': ['Upper back', '', 'surface', 'The upper back covers the ribs and the shoulder blades.', 1],
  'lower-back': ['Lower back', '', 'surface', 'The lower back is the part of the back between the ribs and the pelvis.'],
  elbow: ['Elbow', '', 'surface', 'The point of the elbow is the upper end of the ulna.', 1],
  'back-of-hand': ['Back of the hand', '', 'surface', 'The back of the hand is the surface opposite the palm.', 1],
  buttock: ['Buttock', '', 'surface', 'The buttock is formed mainly by the gluteal muscles.', 1],
  'back-of-thigh': ['Back of the thigh', '', 'surface', 'The back of the thigh holds the hamstring muscles.', 1],
  'back-of-knee': ['Back of the knee', '', 'surface', 'The hollow at the back of the knee is where the leg bends.', 1],
  calf: ['Calf', '', 'surface', 'The calf is the back of the lower leg.', 1],
  heel: ['Heel', '', 'surface', 'The heel is the back of the foot, where the Achilles tendon attaches.', 1],
};

/** Short names for several structures at once; usable wherever a list of ids is. */
export const ALIASES = {
  lungs: ['right-lung', 'left-lung'],
  kidneys: ['right-kidney', 'left-kidney'],
  spine: ['cervical-spine', 'thoracic-spine', 'lumbar-spine', 'sacrum', 'tailbone'],
  cerebrum: ['frontal-lobe', 'parietal-lobe', 'temporal-lobe', 'occipital-lobe'],
  'venae-cavae': ['superior-vena-cava', 'inferior-vena-cava'],
  'heart-chambers': ['right-atrium', 'right-ventricle', 'left-atrium', 'left-ventricle'],
  'heart-valves': ['tricuspid-valve', 'pulmonary-valve', 'mitral-valve', 'aortic-valve'],
  'lymph-nodes': ['lymph-nodes-neck', 'lymph-nodes-armpit', 'lymph-nodes-groin'],
  intestines: ['small-intestine', 'large-intestine', 'appendix', 'rectum'],
  airways: ['nose', 'throat', 'voice-box', 'windpipe', 'bronchi'],
  'arm-bones': ['humerus', 'radius', 'ulna', 'hand-bones'],
  'leg-bones': ['femur', 'kneecap', 'tibia', 'fibula', 'foot-bones'],
  female: ['ovaries', 'uterus'],
  male: ['testes', 'prostate'],
  /** The organs a first picture of the inside of the body usually shows. */
  organs: ['brain', 'windpipe', 'bronchi', 'right-lung', 'left-lung', 'heart', 'diaphragm', 'liver', 'gallbladder', 'stomach', 'spleen', 'pancreas',
    'small-intestine', 'large-intestine', 'appendix', 'rectum', 'right-kidney', 'left-kidney', 'bladder'],
};

/** The natural colour of each structure: [hue, 'soft' | '' (vivid)] by system, with exceptions by id. */
export const TONES = {
  system: {
    skin: ['gray', 'soft'], skeleton: ['bone', ''], muscles: ['red', 'soft'], circulatory: ['red', ''], respiratory: ['blue', 'soft'],
    digestive: ['orange', 'soft'], urinary: ['violet', 'soft'], nervous: ['yellow', 'soft'], endocrine: ['teal', 'soft'], immune: ['green', 'soft'],
    reproductive: ['pink', 'soft'], cell: ['blue', 'soft'],
  },
  id: {
    veins: ['blue', ''], 'superior-vena-cava': ['blue', ''], 'inferior-vena-cava': ['blue', ''], 'pulmonary-artery': ['blue', ''], 'pulmonary-veins': ['red', ''],
    'right-atrium': ['blue', 'soft'], 'right-ventricle': ['blue', 'soft'], 'left-atrium': ['red', 'soft'], 'left-ventricle': ['red', 'soft'],
    'heart-muscle': ['red', ''], septum: ['red', ''], heart: ['red', ''], 'lung-capillaries': ['violet', ''],
    'tricuspid-valve': ['yellow', ''], 'pulmonary-valve': ['yellow', ''], 'mitral-valve': ['yellow', ''], 'aortic-valve': ['yellow', ''],
    'right-lung': ['pink', 'soft'], 'left-lung': ['pink', 'soft'], 'air-sacs': ['pink', 'soft'], diaphragm: ['red', 'soft'],
    liver: ['orange', ''], gallbladder: ['green', ''], stomach: ['pink', ''], pancreas: ['yellow', ''], 'small-intestine': ['pink', 'soft'],
    'large-intestine': ['orange', 'soft'], appendix: ['orange', 'soft'], rectum: ['orange', 'soft'], 'food-pipe': ['pink', 'soft'], mouth: ['pink', 'soft'],
    tongue: ['pink', ''], teeth: ['bone', ''], 'salivary-glands': ['yellow', 'soft'], throat: ['red', 'soft'], epiglottis: ['green', ''],
    'right-kidney': ['violet', ''], 'left-kidney': ['violet', ''], bladder: ['yellow', 'soft'], ureters: ['violet', 'soft'],
    brain: ['pink', 'soft'], 'frontal-lobe': ['blue', 'soft'], 'parietal-lobe': ['yellow', 'soft'], 'temporal-lobe': ['green', 'soft'], 'occipital-lobe': ['pink', 'soft'],
    cerebellum: ['violet', 'soft'], brainstem: ['orange', 'soft'], hypothalamus: ['teal', ''], pituitary: ['teal', ''], 'spinal-cord': ['yellow', ''], nerves: ['yellow', ''],
    eye: ['surface', ''], ear: ['gray', 'soft'], thyroid: ['teal', ''], adrenals: ['teal', ''], thymus: ['green', 'soft'], spleen: ['violet', 'soft'],
    tonsils: ['green', ''], ovaries: ['pink', ''], uterus: ['pink', 'soft'], testes: ['pink', ''], prostate: ['pink', 'soft'],
    epidermis: ['orange', 'soft'], dermis: ['pink', 'soft'], 'fat-layer': ['yellow', 'soft'], hair: ['ink-2', ''], 'hair-follicle': ['gray', 'soft'],
    'sweat-gland': ['blue', 'soft'], 'sweat-pore': ['blue', ''], 'oil-gland': ['yellow', ''], 'skin-vessels': ['red', ''], 'nerve-endings': ['yellow', ''],
    'cell-membrane': ['blue', ''], cytoplasm: ['blue', 'soft'], nucleus: ['violet', ''], mitochondria: ['orange', ''], ribosomes: ['ink-2', ''],
    'endoplasmic-reticulum': ['teal', 'soft'], golgi: ['green', ''], lysosomes: ['pink', ''],
  },
};
