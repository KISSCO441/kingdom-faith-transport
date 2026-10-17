
export const MARKET_DELIVERY_FEE = 20;
export const MARKET_MINIMUM_ORDER = 50;

export type MarketProduct = {
  id: string;
  name: string;
  category: string;
  allowedAmounts: number[];
};

const amountsFrom = (start: number): number[] => {
  const amounts: number[] = [];

  for (let amount = start; amount <= 50; amount += 5) {
    amounts.push(amount);
  }

  return amounts;
};

export const MARKET_PRODUCTS: MarketProduct[] = [
  {
    id: "tomatoes",
    name: "Fresh Tomatoes",
    category: "Vegetables",
    allowedAmounts: amountsFrom(10),
  },
  {
    id: "garden-eggs",
    name: "Garden Eggs",
    category: "Vegetables",
    allowedAmounts: amountsFrom(5),
  },
  {
    id: "pepper",
    name: "Pepper",
    category: "Vegetables",
    allowedAmounts: amountsFrom(5),
  },
  {
    id: "plantain",
    name: "Ripe Plantain",
    category: "Fruits",
    allowedAmounts: amountsFrom(10),
  },
  {
    id: "pineapple",
    name: "Pineapple",
    category: "Fruits",
    allowedAmounts: amountsFrom(10),
  },
  {
    id: "oranges",
    name: "Oranges",
    category: "Fruits",
    allowedAmounts: amountsFrom(5),
  },
  {
    id: "rice",
    name: "Local Rice",
    category: "Staples",
    allowedAmounts: amountsFrom(10),
  },
  {
    id: "yam",
    name: "Yam Tubers",
    category: "Staples",
    allowedAmounts: amountsFrom(30),
  },
  {
    id: "gari",
    name: "Gari",
    category: "Staples",
    allowedAmounts: amountsFrom(10),
  },
  {
    id: "fish",
    name: "Fresh Fish",
    category: "Protein",
    allowedAmounts: amountsFrom(15),
  },
  {
    id: "smoked-fish",
    name: "Smoked Fish",
    category: "Protein",
    allowedAmounts: amountsFrom(10),
  },
  {
    id: "eggs",
    name: "Eggs",
    category: "Protein",
    allowedAmounts: amountsFrom(10),
  },
];

export function getMarketProduct(id: string): MarketProduct | undefined {
  return MARKET_PRODUCTS.find((product) => product.id === id);
}
