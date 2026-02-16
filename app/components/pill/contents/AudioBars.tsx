import { AudioBarsBase, BAR_COUNT } from './AudioBarsBase'

const BARS = Array(BAR_COUNT).fill(1)

export const AudioBars = ({
  volumeHistory,
  barColor = 'white',
}: {
  volumeHistory: number[]
  barColor?: string
}) => {
  const activeBarIndex = volumeHistory.length % BAR_COUNT

  const dynamicHeights = BARS.map((baseHeight, index) => {
    const volume = volumeHistory[volumeHistory.length - index - 1] || 0
    const scale = Math.max(0.05, Math.min(1, volume * 20))
    const activeBarHeight = index === activeBarIndex ? 2 : 0
    const height = activeBarHeight + baseHeight * 20 * scale
    return Math.min(Math.max(height, 1), 16)
  })

  return <AudioBarsBase heights={dynamicHeights} barColor={barColor} />
}
