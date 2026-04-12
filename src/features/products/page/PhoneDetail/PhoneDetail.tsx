import useProductDetail from '@/features/products/hooks/useProductDetail'

const PhoneDetail = () => {
  const {
    product,
    isLoading,
    error,
    selectedColor,
    selectedStorage,
    currentPrice,
    currentImageUrl,
    canAddToCart,
    handleColorSelect,
    handleStorageSelect,
  } = useProductDetail()

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>
  if (!product) return null

  return (
    <div style={{ padding: '1rem', maxWidth: 480, margin: '0 auto' }}>
      <img src={currentImageUrl} alt={product.name} style={{ width: '100%' }} />

      <h1>{product.brand} {product.name}</h1>
      <p>{currentPrice} EUR</p>

      <section>
        <h2>Color</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {product.colorOptions.map(color => (
            <button
              key={color.hexCode}
              onClick={() => handleColorSelect(color)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: color.hexCode,
                border: selectedColor?.hexCode === color.hexCode ? '3px solid black' : '2px solid #ccc',
                cursor: 'pointer',
              }}
              title={color.name}
            />
          ))}
        </div>
        {selectedColor && <p>Selected: {selectedColor.name}</p>}
      </section>

      <section>
        <h2>Storage</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {product.storageOptions.map(storage => (
            <button
              key={storage.capacity}
              onClick={() => handleStorageSelect(storage)}
              style={{
                padding: '4px 12px',
                border: selectedStorage?.capacity === storage.capacity ? '2px solid black' : '1px solid #ccc',
                cursor: 'pointer',
                background: 'none',
              }}
            >
              {storage.capacity}
            </button>
          ))}
        </div>
      </section>

      <button
        disabled={!canAddToCart}
        style={{ marginTop: 16, padding: '10px 24px', opacity: canAddToCart ? 1 : 0.4 }}
      >
        Add to cart
      </button>
    </div>
  )
}

export default PhoneDetail
