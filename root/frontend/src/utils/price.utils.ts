const formatPrice = (price: number): string =>
  Number.isInteger(price) ? String(price) : price.toFixed(2)

export { formatPrice }
