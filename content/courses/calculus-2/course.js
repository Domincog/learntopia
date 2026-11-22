export default {
  id: 'calculus-2',
  title: 'Calculus II: The Toolkit',
  tagline: 'The rules and methods that make calculus a working tool.',
  category: 'math',
  level: 'Advanced',
  color: 'pink',
  cover: 'integral',
  requires: ['calculus', 'functions', 'trigonometry'],
  description: 'Calculus in Pictures showed you what a derivative and an integral are. This course gives you the toolkit: rules for functions built from other functions, the calculus of waves, integration run backwards, equations that describe change itself, and polynomials that imitate any smooth curve.',
  outcomes: [
    'Differentiate functions inside functions with the chain rule',
    'Differentiate products and quotients',
    'Find the derivatives of sine and cosine and use them to describe oscillation',
    'Reverse the chain rule to integrate by substitution',
    'Read a differential equation, sketch its solutions and step along them numerically',
    'Approximate a function near a point with a Taylor polynomial',
  ],
  chapters: [
    {
      title: 'New rules for slopes',
      lessons: [
        { id: 'chain-rule', title: 'Functions Inside Functions', summary: 'When one change drives another, the rates multiply. That is the chain rule.', minutes: 13 },
        { id: 'product-rule', title: 'Two Things Changing at Once', summary: 'A growing rectangle shows why the derivative of a product has two parts.', minutes: 13 },
        { id: 'trig-derivatives', title: 'The Slope of a Wave', summary: 'The slope of sine is cosine. See why on the circle, and what it says about a swing.', minutes: 13 },
      ],
    },
    {
      title: 'Running it backwards',
      lessons: [
        { id: 'substitution', title: 'Undoing the Chain Rule', summary: 'Integration by substitution: spot the inside function and change variable.', minutes: 13 },
        { id: 'differential-equations', title: 'Equations About Change', summary: 'When a rule gives the slope instead of the value: slope fields and small steps.', minutes: 14 },
      ],
    },
    {
      title: 'Approximating anything',
      lessons: [
        { id: 'taylor-series', title: 'Polynomials That Pretend', summary: 'Match the value, the slope and the bend, and a polynomial can imitate any smooth curve.', minutes: 14 },
      ],
    },
  ],
};
