import { app, nativeTheme, nativeImage } from 'electron';
import { menubar } from 'menubar'
import sharp from 'sharp'

const mb = menubar({
  index: 'https://glukees.online',
  browserWindow: {
    width: 480,
    height: 240,
    resizable: false,
  }
});

app.dock.hide(); // Hide the app from the dock and the App Switcher

mb.on('ready', () => {
  updateIcon()
});

async function updateIcon() {
  const data = await fetch('https://api.glukees.online/current')
  const result = await data.json()
  
  const color = nativeTheme.shouldUseDarkColors ? 'white' : 'black'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <text x="4" y="16" font-family="Arial" font-size="12" fill="${color}">${result.value.toFixed(1)}</text>
  </svg>`;

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const icon = nativeImage.createFromBuffer(pngBuffer)
  mb.tray.setImage(icon)

  setTimeout(() => updateIcon(), 60000)
}