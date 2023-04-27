import { expect, test } from "vitest";

test("classify", () => {
  const result1 = classify("4104123456789123");
  const result2 = classify("340012345678901");
  const result5 = classify("4903123456789011");

  const result3 = classify("51001234567890");
  const result4 = classify("53001234567890");

  expect(result1).toBe("Visa");
  expect(result2).toBe("Amex");
  expect(result5).toBe("Switch");

  expect(result3).toBe("MasterCard");
  expect(result4).toBe("MasterCard");
}, 60_000_000);

const PROVIDER_MAP: Record<Provider, Rule[]> = {
  Switch: [
    {
      type: "length",
      value: new Set([16]),
    },
    {
      type: "prefix",
      value: ["4903"],
    },
  ],
  Visa: [
    {
      type: "length",
      value: new Set([13, 16]),
    },
    {
      type: "prefix",
      value: ["4"],
    },
  ],
  Amex: [
    {
      type: "length",
      value: new Set([15]),
    },
    {
      type: "prefix",
      value: ["34", "37"],
    },
  ],

  MasterCard: [
    {
      type: "length",
      value: new Set([14]),
    },
    {
      type: "range",
      min: 51,
      max: 55,
    },
  ],
};

function classify(cardNumber: CardNumber): Provider | undefined {
  const providerRules = orderProviderRules(PROVIDER_MAP);
  for (const { rules, provider } of providerRules) {
    if (applyRules(rules, cardNumber)) {
      return provider;
    }
  }
  return undefined;
}

type CardNumber = string;
const PROVIDER = ["Visa", "Amex", "MasterCard", "Switch"];
type Provider = (typeof PROVIDER)[number];

type Rule =
  | {
      type: "length";
      value: Set<number>;
    }
  | {
      type: "prefix";
      value: string[];
    }
  | {
      type: "range";
      min: number;
      max: number;
    };

const orderProviderRules = (providerMap: Record<Provider, Rule[]>) =>
  Object.entries(providerMap)
    .map(([provider, rules]) => ({
      provider,
      rules,
      specificity: specificityForRules(rules),
    }))
    .sort((a, b) => b.specificity - a.specificity);

const specificityForRules = (rules: Rule[]) =>
  Math.max(...rules.map(specificityForRule));

function specificityForRule(rule: Rule) {
  switch (rule.type) {
    case "length":
    case "range":
      return 0;
    case "prefix":
      return Math.max(...rule.value.map((p) => p.length));
    default:
      throw new Error("illegal state");
  }
}

const applyRules = (rules: Rule[], cardNumber: CardNumber) =>
  rules.every((rule) => applyRule(rule, cardNumber));

function applyRule(rule: Rule, cardNumber: CardNumber): boolean {
  switch (rule.type) {
    case "length":
      return rule.value.has(cardNumber.length);
    case "prefix":
      return rule.value.some((prefix) => cardNumber.startsWith(prefix));
    case "range": {
      const numberFromCard = Number(cardNumber.slice(0, 2));
      return numberFromCard >= rule.min && numberFromCard <= rule.max;
    }
    default:
      throw new Error("illegal state");
  }
}
