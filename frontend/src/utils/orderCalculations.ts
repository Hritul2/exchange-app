type OrderData = [string, string];

export function calculateBidsTotal(
  orders: OrderData[]
): [string, string, number][] {
  let currentTotal = 0;
  return orders.map(([price, quantity]) => {
    currentTotal += Number(quantity);
    return [price, quantity, currentTotal];
  });
}

export function calculateAsksTotal(
  orders: OrderData[]
): [string, string, number][] {
  let currentTotal = 0;
  return orders.reverse().map(([price, quantity]) => {
    currentTotal += Number(quantity);
    return [price, quantity, currentTotal];
  });
}
