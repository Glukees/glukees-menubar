import { nativeTheme } from 'electron';
import { menubar } from 'menubar'

const mb = menubar();

mb.on('ready', () => {
  updateIcon()
});

async function updateIcon() {
  const data = await fetch('https://api.glukees.online/current')
  const result = await data.json()
  mb.tray.setImage(`https://api.glukees.online/current/image/${nativeTheme.shouldUseDarkColors ? 'black' : 'white'}`)
  setTimeout(() => updateIcon(), 60000)
}