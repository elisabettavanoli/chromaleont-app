import { useState } from 'react'
import { COLORS, type ChameleonColor } from '../constants/colors'

function LivePage() {
    const [isOn, setIsOn] = useState(false)
    const [selectedColor, setSelectedColor] = useState<ChameleonColor>(COLORS[0])

    return (
        <main className="page">
            <header>
                <h1>Chromaleont</h1>
                <p className="subtitle">Live control</p>
            </header>

            <section className="device-card">
                <div
                    className="color-preview"
                    style={{
                        backgroundColor: isOn ? selectedColor.hex : '#E5E7EB',
                    }}
                    aria-label={
                        isOn
                            ? `Current color: ${selectedColor.name}`
                            : 'Chameleon is turned off'
                    }
                />

                <h2>Your chameleon</h2>

                <p>
                    {isOn
                        ? `On · ${selectedColor.name}`
                        : 'Off'}
                </p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() => setIsOn((current) => !current)}
                    aria-pressed={isOn}
                >
                    {isOn ? 'Turn off' : 'Turn on'}
                </button>
            </section>

            <section className="section">
                <h2>Choose a color</h2>
                <p>Select the color for your chameleon.</p>

                <div className="color-palette">
                    {COLORS.map((color) => (
                        <button
                            key={color.name}
                            type="button"
                            className={`color-option ${
                                selectedColor.name === color.name ? 'selected' : ''
                            }`}
                            onClick={() => setSelectedColor(color)}
                            aria-label={color.name}
                            aria-pressed={selectedColor.name === color.name}
                            title={color.name}
                        >
              <span
                  className="color-swatch"
                  style={{ backgroundColor: color.hex }}
              />
                            <span>{color.name}</span>
                        </button>
                    ))}
                </div>
            </section>
        </main>
    )
}

export default LivePage