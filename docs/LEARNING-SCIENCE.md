# The learning science behind Learntopia

Learntopia is built around a small set of findings about how people learn that have been replicated many times, in laboratories and in classrooms. This document lists each principle, the evidence for it, and exactly where it shows up in the product, so that contributors can keep the design honest and so that anyone can check our reasoning.

Two cautions up front. First, the size of every effect below depends on the learner, the material and the delay before testing; none of them is magic. Second, where a popular idea rests on weaker evidence (learning styles, for example, or large claims for mindset interventions), we have deliberately not built on it.

| # | Principle | Where it lives in the app |
|---|-----------|---------------------------|
| 1 | [Learn by doing](#1-learn-by-doing) | Almost every step is a question or an interactive |
| 2 | [Retrieval practice](#2-retrieval-practice) | Reviews; questions instead of summaries |
| 3 | [Spacing](#3-spacing) | The review scheduler |
| 4 | [Interleaving and variation](#4-interleaving-and-variation) | Mixed review sessions; generated problems |
| 5 | [Guess before you are told](#5-guess-before-you-are-told) | "Make a prediction" steps |
| 6 | [Feedback that explains](#6-feedback-that-explains) | `explain`, per-option `why`, diagnostic checks, hints |
| 7 | [Errors are information](#7-errors-are-information-not-failures) | No lives; "second look"; missed items return sooner |
| 8 | [Manage cognitive load](#8-manage-cognitive-load) | One idea per screen; concrete before abstract |
| 9 | [Words and pictures together](#9-words-and-pictures-together) | Figures next to text, colour-linked |
| 10 | [Explain it yourself](#10-explain-it-yourself) | `reflect` steps |
| 11 | [Know what you know](#11-know-what-you-know) | Confidence ratings and the calibration chart |
| 12 | [Desirable difficulty](#12-desirable-difficulty-and-the-sweet-spot) | Authoring target of roughly 85% success |
| 13 | [Motivation without manipulation](#13-motivation-without-manipulation) | Short lessons, rest days, no dark patterns |

---

## 1. Learn by doing

**The finding.** Learners who actively work with material — solving, predicting, explaining — outperform those who read or listen. A meta-analysis of 225 studies of undergraduate science, engineering and mathematics courses found higher exam scores and substantially lower failure rates with active learning than with lecturing (Freeman et al., 2014).

**In Learntopia.** A lesson is a sequence of 12–18 short steps. Each new idea is shown on a short teaching screen and then used at once: answer, drag, sort, build, estimate. Teaching screens are brief and usually carry something to operate or look at closely (a balance scale for equations, a forgetting curve you can add reviews to), and the validator objects to three in a row. Active learning does not mean leaving beginners to work things out unaided: see section 8.

## 2. Retrieval practice

**The finding.** Recalling information strengthens memory more than studying it again — the *testing effect*. In a classic experiment, students who read a passage once and then recalled it three times remembered far more a week later than students who read it four times, although the re-readers did slightly better on an immediate test and felt more confident (Roediger & Karpicke, 2006). Retrieval practice has also beaten elaborate study techniques such as concept mapping (Karpicke & Blunt, 2011), and meta-analyses confirm the effect across materials and ages (Rowland, 2014; Dunlosky et al., 2013).

**In Learntopia.** Questions are how a lesson makes what it has just taught stick; they are not an assessment bolted on at the end, and they are not a substitute for teaching. Every lesson marks two to four key steps for later review; those reviews require the learner to produce an answer, never just to re-read. Lessons also re-ask earlier ideas a few screens later. And when a learner opens a lesson while earlier ideas from the same course are due, up to two of them come first as a short **warm-up**: cumulative retrieval that reactivates the prerequisites for what follows (it can be switched off in Settings).

## 3. Spacing

**The finding.** Practice spread over time produces much more durable learning than the same practice massed together — one of the oldest and most reliable results in psychology (Ebbinghaus, 1885; Cepeda et al., 2006). The best gap grows with how long you want to remember (Cepeda et al., 2008), and each successful recall lets the next gap be longer.

**In Learntopia.** Each saved review item carries a small memory model: a *stability* (how slowly it is fading) and a *difficulty*. After every review both are updated, and the item is scheduled for the moment its predicted probability of recall falls to the learner's target (90% by default, adjustable in Settings). The model is a compact implementation of the open **FSRS** algorithm (Ye, Su & Cao, 2022; see `src/core/srs.js`). Two consequences worth knowing:

- reviewing something *before* it is due adds almost nothing, so the app says so instead of encouraging extra review for its own sake;
- an item answered correctly but with a hint, or flagged as a guess, is scheduled sooner than one answered confidently.

The course page shows the predicted memory strength of each finished lesson, which makes forgetting visible rather than a surprise.

## 4. Interleaving and variation

**The finding.** Mixing different kinds of problem during practice improves later performance compared with practising one kind at a time, even though mixed practice feels harder and produces more errors while it is happening (Rohrer & Taylor, 2007; Rohrer, Dedrick & Stershic, 2015). Interleaving forces the learner to decide *which* idea applies, and learners reliably misjudge it as less effective than blocking (Kornell & Bjork, 2008).

**In Learntopia.** Review sessions draw items from every course and order them so that neighbouring items come from different lessons where possible (`interleave()` in `src/core/srs.js`). Numeric and symbolic practice is produced by small generators (`gen(rng)`), so a returning question has new numbers and often a new context: the learner practises the method, not the memory of a particular answer.

## 5. Guess before you are told

**The finding.** Attempting to answer a question *before* being taught the answer improves learning of that answer, even when the attempt is wrong (Richland, Kornell & Kao, 2009; Kornell, Hays & Bjork, 2009). Letting learners struggle productively with a problem before instruction can deepen conceptual understanding (Kapur, 2008).

**In Learntopia.** Most lessons open with one step in `predict` mode: a question about something not yet taught, labelled as a guess. Predictions are never marked wrong and do not affect accuracy; the answer and explanation follow immediately. The effect is real but it is a seasoning, not a method: the benefit of attempting before instruction is clearest for conceptual understanding and transfer, and a meta-analysis found little or none for procedural knowledge or for younger learners (Sinha & Kapur, 2021). So a lesson guesses once, then teaches.

## 6. Feedback that explains

**The finding.** Feedback is among the strongest influences on learning, but its effect depends on its content: feedback that explains *why* helps more than feedback that only says right or wrong (Hattie & Timperley, 2007; Shute, 2008).

**In Learntopia.** Every graded step carries an `explain` shown after the answer, whether right or wrong. Wrong options that correspond to a known misconception have their own `why`. Interactive steps return diagnostic messages for particular wrong states ("the first review comes too late"). Hints are graduated, from a nudge to nearly the answer, and are requested by the learner rather than imposed.

## 7. Errors are information, not failures

**The finding.** Errors followed by corrective feedback are not harmful and are often helpful; errors made with *high confidence* are, once corrected, remembered especially well (Butterfield & Metcalfe, 2001).

**In Learntopia.** There are no lives, hearts, timers or penalties. A missed step returns once at the end of the lesson as a "second look" (a retrieval after a short gap). In reviews, a miss simply shortens the next interval. Confidence ratings let the scheduler use the difference between a lucky guess and a secure answer.

## 8. Manage cognitive load

**The finding.** Working memory is small. Instruction that overloads it with extraneous detail or with too many new elements at once impairs learning (Sweller, 1988). Novices learn efficiently from worked examples and from problems with built-in support, which should be withdrawn as competence grows (Sweller & Cooper, 1985; Kalyuga et al., 2003). Starting with a concrete representation and fading toward the abstract one helps ideas transfer (Fyfe et al., 2014).

**Teach before you ask.** For people new to a subject, explicit instruction beats being left to discover: unguided discovery leads to less learning than clear explanation with worked examples, while discovery with strong guidance can do well (Kirschner, Sweller & Clark, 2006; Alfieri et al., 2011). Effective teachers present new material in small steps, model it, and check understanding after each step (Rosenshine, 2012). The advantage of worked examples fades as expertise grows, which is why support is withdrawn within a lesson (Kalyuga et al., 2003).

**In Learntopia.** One idea per step. A graded question may only ask for what the lesson has already shown; the authoring guide calls this *teach before you ask*, and `tools/outline.mjs` prints any lesson as a beginner meets it so that the rule can be checked. Lessons follow a fixed arc: one prediction as a hook, then rounds of a short teaching screen followed by a check, then practice with fading support and one stretch problem. Procedures are introduced by a worked example before the learner tries one. The balance scale precedes the equation; the scale then disappears. For programming, novices order shuffled lines of code (Parsons problems) and fill in blanks before writing programs from scratch, which gives much of the benefit of writing code in less time (Parsons & Haden, 2006; Ericson, Margulieux & Rick, 2017), and a step-through tracer makes the machine's behaviour visible.

## 9. Words and pictures together

**The finding.** People learn better from words and relevant pictures than from words alone, provided the two are placed together, irrelevant decoration is removed and the important parts are signalled (Mayer, 2009). For probability, presenting cases as counts of people rather than as percentages dramatically improves reasoning (Gigerenzer & Hoffrage, 1995).

**In Learntopia.** Figures sit between the question and the answer area, not on another screen. Text can be colour-matched to parts of a figure. Decoration inside lessons is minimal by design, and the mascot stays out of the working area. Explanations appear directly under the question they explain.

## 10. Explain it yourself

**The finding.** Prompting learners to explain material to themselves improves understanding (Chi et al., 1994), and people consistently overestimate how well they understand everyday mechanisms until they try to explain them (Rozenblit & Keil, 2002).

**In Learntopia.** `reflect` steps ask for a sentence or two in the learner's own words, then show a model answer for comparison and ask for a self-rating. They are not machine-graded; the value is in producing the explanation.

## 11. Know what you know

**The finding.** Learners' judgements of their own learning are systematically biased: fluent re-reading feels like knowing (Koriat & Bjork, 2005). Because those judgements drive study decisions, improving them improves learning.

**In Learntopia.** During reviews the learner can mark an answer as a guess, fairly sure or certain before checking. The Progress page then plots stated confidence against actual accuracy. The first course, *How to Learn Anything*, teaches these ideas directly and lets learners test their own calibration.

## 12. Desirable difficulty and the sweet spot

**The finding.** Conditions that make practice feel harder — spacing, retrieval, interleaving, generating answers — often produce better long-term learning: "desirable difficulties" (Bjork, 1994; Bjork & Bjork, 2011). Difficulty is only desirable when the learner can still succeed with effort; in some formal models of learning the optimal error rate is around 15% (Wilson et al., 2019).

**In Learntopia.** Authors are asked to aim for roughly 85% first-attempt success, using hints to make hard steps reachable. The end-of-lesson summary frames a difficult lesson as a productive one.

## 13. Motivation without manipulation

**The finding.** Lasting motivation is supported by a sense of competence, autonomy and relatedness (Ryan & Deci, 2000). Plans that specify *when and where* are much more likely to be carried out (Gollwitzer, 1999). Reward mechanics can increase use without increasing learning, and can create anxiety.

**In Learntopia.**

- **Competence:** visible progress, memory strength that grows, praise aimed at the work rather than the person.
- **Autonomy:** nothing is locked; every lesson can be started at any time; hints and answers are always available; reviews are offered, not forced.
- **Humane streaks:** a streak counts days with any practice; rest days are earned automatically and spent automatically, so one missed day does not erase weeks of effort. There are no countdown timers, no guilt-inducing notifications, no leaderboards and no purchasable anything.
- **Honest numbers:** XP reflects answering questions, and the app tells you when further review today would add little.
- **A plan:** onboarding asks for a small daily goal, and the first course has the learner attach practice to an existing daily routine (an if-then plan; Gollwitzer, 1999) and finishes with a study system written in their own words.
- **Permission to stop:** after about half an hour of focused work in a day, the app suggests a break, once. Sessions are meant to be short.

---

## What we deliberately do not do

- **Learning styles.** Tailoring instruction to "visual" or "auditory" learners is not supported by the evidence. We use the best representation for the *content*.
- **Speed pressure.** Timed drills favour fluency over understanding and raise anxiety. Nothing in Learntopia is timed, with two deliberate exceptions inside *How to Learn Anything*, where time is the thing being studied: a memory-span demonstration shows digits for a few seconds, and an experiment lets learners measure their own cost of switching between tasks. Neither is graded.
- **Engagement for its own sake.** No infinite feeds, variable-reward loops or artificial scarcity.
- **Data collection.** There is no telemetry. This also means we cannot run large-scale experiments on learners; improvements have to come from the published literature and from people reading the lessons carefully.

---

## The course that teaches all this

The first course in the catalog, *How to Learn Anything*, hands these ideas to the learner directly, so that they are useful away from Learntopia too. Each lesson is built around an experiment the learner runs on themselves.

| Lesson | Idea | Main sources |
|--------|------|--------------|
| Why We Forget | The forgetting curve; expanding gaps between reviews | Ebbinghaus (1885); Cepeda et al. (2006, 2008) |
| Pull, Don't Push | Retrieval practice; the illusion of fluency | Roediger & Karpicke (2006); Kornell et al. (2009) |
| Mix It Up | Interleaving; desirable difficulties | Rohrer & Taylor (2007); Kornell & Bjork (2008); Bjork (1994) |
| Know What You Know | Calibration; the illusion of explanatory depth | Koriat & Bjork (2005); Rozenblit & Keil (2002) |
| Ask Why | Elaboration, self-explanation, prior knowledge, learning by teaching | Pressley et al. (1987); Bransford & Johnson (1972); McWeeny et al. (1987); Chi et al. (1994); Nestojko et al. (2014) |
| The Narrow Doorway | Working memory, chunking, cognitive load, worked examples | Miller (1956); Cowan (2001); Chase & Simon (1973); Sweller & Cooper (1985); Kalyuga et al. (2003) |
| One Thing at a Time | Task switching, distraction, breaks and sleep | Rogers & Monsell (1995); Sana et al. (2013); Jenkins & Dallenbach (1924) |
| Build Your System | Myths about learning; planning backwards from a deadline; habits | Pashler et al. (2008); Dunlosky et al. (2013); Lally et al. (2010); Gollwitzer (1999) |

Where the lessons quote a number ("about twice as many", "66 days on average"), it comes from the source named in that lesson. Where the evidence is thinner, the lessons say so: the 25-minutes-then-a-break routine, for example, is presented as a common habit, not as a research finding.

---

## References

- Alfieri, L., Brooks, P. J., Aldrich, N. J., & Tenenbaum, H. R. (2011). Does discovery-based instruction enhance learning? *Journal of Educational Psychology, 103*.
- Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. Shimamura (Eds.), *Metacognition: Knowing about knowing*. MIT Press.
- Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning. In *Psychology and the real world*. Worth.
- Bransford, J. D., & Johnson, M. K. (1972). Contextual prerequisites for understanding: Some investigations of comprehension and recall. *Journal of Verbal Learning and Verbal Behavior, 11*.
- Butterfield, B., & Metcalfe, J. (2001). Errors committed with high confidence are hypercorrected. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 27*.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*.
- Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science, 19*.
- Chase, W. G., & Simon, H. A. (1973). Perception in chess. *Cognitive Psychology, 4*.
- Chi, M. T. H., De Leeuw, N., Chiu, M.-H., & LaVancher, C. (1994). Eliciting self-explanations improves understanding. *Cognitive Science, 18*.
- Cowan, N. (2001). The magical number 4 in short-term memory: A reconsideration of mental storage capacity. *Behavioral and Brain Sciences, 24*.
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques. *Psychological Science in the Public Interest, 14*.
- Ebbinghaus, H. (1885). *Über das Gedächtnis* [Memory: A contribution to experimental psychology].
- Ericson, B. J., Margulieux, L. E., & Rick, J. (2017). Solving Parsons problems versus fixing and writing code. *Proceedings of Koli Calling 2017*.
- Freeman, S., Eddy, S. L., McDonough, M., Smith, M. K., Okoroafor, N., Jordt, H., & Wenderoth, M. P. (2014). Active learning increases student performance in science, engineering, and mathematics. *Proceedings of the National Academy of Sciences, 111*.
- Fyfe, E. R., McNeil, N. M., Son, J. Y., & Goldstone, R. L. (2014). Concreteness fading in mathematics and science instruction: A systematic review. *Educational Psychology Review, 26*.
- Gigerenzer, G., & Hoffrage, U. (1995). How to improve Bayesian reasoning without instruction: Frequency formats. *Psychological Review, 102*.
- Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. *American Psychologist, 54*.
- Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research, 77*.
- Jenkins, J. G., & Dallenbach, K. M. (1924). Obliviscence during sleep and waking. *American Journal of Psychology, 35*.
- Kalyuga, S., Ayres, P., Chandler, P., & Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist, 38*.
- Kirschner, P. A., Sweller, J., & Clark, R. E. (2006). Why minimal guidance during instruction does not work. *Educational Psychologist, 41*.
- Kapur, M. (2008). Productive failure. *Cognition and Instruction, 26*.
- Karpicke, J. D., & Blunt, J. R. (2011). Retrieval practice produces more learning than elaborative studying with concept mapping. *Science, 331*.
- Koriat, A., & Bjork, R. A. (2005). Illusions of competence in monitoring one's knowledge during study. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 31*.
- Kornell, N., & Bjork, R. A. (2008). Learning concepts and categories: Is spacing the "enemy of induction"? *Psychological Science, 19*.
- Kornell, N., Hays, M. J., & Bjork, R. A. (2009). Unsuccessful retrieval attempts enhance subsequent learning. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 35*.
- Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. *European Journal of Social Psychology, 40*.
- Mayer, R. E. (2009). *Multimedia learning* (2nd ed.). Cambridge University Press.
- McWeeny, K. H., Young, A. W., Hay, D. C., & Ellis, A. W. (1987). Putting names to faces. *British Journal of Psychology, 78*.
- Miller, G. A. (1956). The magical number seven, plus or minus two: Some limits on our capacity for processing information. *Psychological Review, 63*.
- Nestojko, J. F., Bui, D. C., Kornell, N., & Bjork, E. L. (2014). Expecting to teach enhances learning and organization of knowledge in free recall of text passages. *Memory & Cognition, 42*.
- Parsons, D., & Haden, P. (2006). Parson's programming puzzles: A fun and effective learning tool for first programming courses. *Proceedings of the 8th Australasian Computing Education Conference*.
- Pashler, H., McDaniel, M., Rohrer, D., & Bjork, R. (2008). Learning styles: Concepts and evidence. *Psychological Science in the Public Interest, 9*.
- Pressley, M., McDaniel, M. A., Turnure, J. E., Wood, E., & Ahmad, M. (1987). Generation and precision of elaboration: Effects on intentional and incidental learning. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 13*.
- Richland, L. E., Kornell, N., & Kao, L. S. (2009). The pretesting effect: Do unsuccessful retrieval attempts enhance learning? *Journal of Experimental Psychology: Applied, 15*.
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*.
- Rogers, R. D., & Monsell, S. (1995). Costs of a predictable switch between simple cognitive tasks. *Journal of Experimental Psychology: General, 124*.
- Rohrer, D., Dedrick, R. F., & Stershic, S. (2015). Interleaved practice improves mathematics learning. *Journal of Educational Psychology, 107*.
- Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional Science, 35*.
- Rosenshine, B. (2012). Principles of instruction: Research-based strategies that all teachers should know. *American Educator, 36*(1).
- Rowland, C. A. (2014). The effect of testing versus restudy on retention: A meta-analytic review of the testing effect. *Psychological Bulletin, 140*.
- Rozenblit, L., & Keil, F. (2002). The misunderstood limits of folk science: An illusion of explanatory depth. *Cognitive Science, 26*.
- Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist, 55*.
- Sana, F., Weston, T., & Cepeda, N. J. (2013). Laptop multitasking hinders classroom learning for both users and nearby peers. *Computers & Education, 62*.
- Shute, V. J. (2008). Focus on formative feedback. *Review of Educational Research, 78*.
- Sinha, T., & Kapur, M. (2021). When problem solving followed by instruction works: Evidence for productive failure. *Review of Educational Research, 91*.
- Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. *Cognitive Science, 12*.
- Sweller, J., & Cooper, G. A. (1985). The use of worked examples as a substitute for problem solving in learning algebra. *Cognition and Instruction, 2*.
- Wilson, R. C., Shenhav, A., Straccia, M., & Cohen, J. D. (2019). The Eighty Five Percent Rule for optimal learning. *Nature Communications, 10*.
- Ye, J., Su, J., & Cao, Y. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. *Proceedings of the 28th ACM SIGKDD Conference on Knowledge Discovery and Data Mining*. See also the FSRS documentation at https://github.com/open-spaced-repetition.

If you believe a claim here is wrong or overstated, please open an issue. Getting this right matters more than sounding confident.
