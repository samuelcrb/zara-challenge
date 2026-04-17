const formatPrice = (price: number): string => {
  const [integer, decimal] = price.toFixed(2).split('.')
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const trimmedDecimal = decimal.replace(/0+$/, '')
  return trimmedDecimal ? `${formattedInteger},${trimmedDecimal}` : formattedInteger
}

export { formatPrice }
