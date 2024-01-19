import { nativeTheme, nativeImage, NativeImage, Notification } from 'electron';
import clamp from 'lodash/clamp'
import { menubar } from 'menubar'
import sharp from 'sharp'
import { io } from 'socket.io-client'

const getColor = (value?: number) => {
  const defaultColor = nativeTheme.shouldUseDarkColors ? 'white' : 'black'
  if (typeof value !== 'number') return defaultColor

  const isInRange = clamp(value, 4, 8) === value
  if (isInRange) return defaultColor

  const isInWarningRange = value === 3.9 || clamp(value, 8, 10) === value
  return isInWarningRange ? 'orange' : 'red'
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

  mb.on('ready', async () => {
    const data = await fetch('https://api.glukees.online/current')
    const result = await data.json()

    processValue(result.value)
    initWebsocketConnection((data: any) => processValue(data.current.value))
  })

  const processValue = (value: number) => {
    updateIcon(value, (icon) => mb.tray.setImage(icon));
    sendOutOfBoundsNotification(value)
  }
}

async function updateIcon(value: number, cb: (icon: NativeImage) => any) {
  const color = getColor(value)
  const icon = await getIcon(value, color)

  cb(icon)
}

const initWebsocketConnection = (onData: (data: any) => any) => {
  const socket = io('https://api.glukees.online');

  socket.on('data', onData)

  // Handle process exit
  process.on('exit', (code) => {
    console.log(`Process is exiting with code ${code}`);
    
    // Close WebSocket connection before exiting
    socket.close();
  });

  // Handle Ctrl+C or other termination signals
  process.on('SIGINT', () => {
    console.log('Received termination signal. Closing WebSocket connection.');
    
    // Close WebSocket connection before exiting
    socket.close();
    process.exit();
  });
}

let cachedValue: number
const sendOutOfBoundsNotification = (value: number) => {
  const isInRange = clamp(value, 4, 9)
  const isCachedValueInRange = cachedValue ? clamp(cachedValue, 4, 9) : true
  if (isInRange || !isCachedValueInRange) return

  const body = `Te ${value > 9 ? 'hoog' : 'laag'}, sukkel.`
  cachedValue = value

  return new Notification({
    title: 'Glukees alarm',
    body
  }).show()
}

init()