const formatPrice = (price: number): string => {
  const [integer, decimal] = price.toFixed(2).split('.')
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formattedInteger},${decimal}`
}

export { formatPrice }