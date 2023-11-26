import { nativeTheme, nativeImage } from 'electron';
import clamp from 'lodash/clamp'
import { menubar } from 'menubar'
import sharp from 'sharp'

const getColor = (value?: number) => {
  const defaultColor = nativeTheme.shouldUseDarkColors ? 'white' : 'black'
  if (typeof value !== 'number') return defaultColor

  const isInRange = clamp(4, value, 10) === value
  return isInRange ? defaultColor : 'red'
}

const getIcon = async (value: string | number, color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <text
      x="50%"
      y="16"
      dominant-baseline="middle"
      text-anchor="middle"
      font-family="Arial"
      font-weight="bold"
      font-size="12"
      fill="${color}"
    >
      ${typeof value === 'string' ? value : value.toFixed(1)}
    </text>
  </svg>`;

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return nativeImage.createFromBuffer(pngBuffer)
}

const init = async () => {
  const icon = await getIcon('...', getColor())
  const mb = menubar({
    index: 'https://glukees.online',
    icon,
    showDockIcon: false,
    showOnAllWorkspaces: false,
    browserWindow: {
      skipTaskbar: false,
      width: 480,
      height: 240,
      resizable: false,
    }
  });

  mb.on('ready', () => updateIcon());

  async function updateIcon() {
    const data = await fetch('https://api.glukees.online/current')
    const result = await data.json()
    
    const color = getColor(result.value)
    const icon = await getIcon(result.value, color)
  
    mb.tray.setImage(icon)
  
    setTimeout(() => updateIcon(), 60000)
  }
}

init()