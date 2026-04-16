import { useEffect, useReducer, useRef, useState } from 'react'
import { colorNameReducer } from '@/features/products/page/PhoneDetail/PhoneDetail.reducer'
import styles from './ColorSelector.module.scss'

export interface ColorOption {
  hexCode: string
  name: string
}

interface ColorSelectorProps {
  colors: ColorOption[]
  selectedHexCode: string | null
  onChange: (hexCode: string) => void
  showColorName?: boolean
}

const ColorSelector = ({ colors, selectedHexCode, onChange, showColorName = true }: ColorSelectorProps) => {
  const [hoveredHexCode, setHoveredHexCode] = useState<string | null>(null)
  const activeHexCode = hoveredHexCode ?? selectedHexCode
  const activeName = colors.find(c => c.hexCode === activeHexCode)?.name ?? '\u00A0'

  const [colorName, dispatchColorName] = useReducer(colorNameReducer, {
    text: '\u00A0',
    visible: true,
  })
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      dispatchColorName({ type: 'set', name: activeName })
      return
    }
    dispatchColorName({ type: 'hide' })
    const timer = setTimeout(() => {
      dispatchColorName({ type: 'show', name: activeName })
    }, 150)
    return () => clearTimeout(timer)
  }, [activeName])

  return (
    <div>
      <div className={styles.colorOptions}>
        {colors.map(color => (
          <button
            key={color.hexCode}
            className={`${styles.colorSwatch}${selectedHexCode === color.hexCode ? ` ${styles.selected}` : ''}`}
            style={{ background: color.hexCode }}
            onClick={() => onChange(color.hexCode)}
            onMouseEnter={() => setHoveredHexCode(color.hexCode)}
            onMouseLeave={() => setHoveredHexCode(null)}
            aria-label={color.name}
          />
        ))}
      </div>
      {showColorName && (
        <p className={styles.colorName} style={{ opacity: colorName.visible ? 1 : 0 }}>
          {colorName.text}
        </p>
      )}
    </div>
  )
}

export default ColorSelector
