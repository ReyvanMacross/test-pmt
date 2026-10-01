const bcrypt = require('bcryptjs')

function readHiddenPassword() {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      reject(new Error('Jalankan langsung di terminal interaktif PowerShell.'))
      return
    }
    let password = ''
    stdout.write('Masukkan password admin (min. 8 karakter; input disembunyikan): ')
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    const cleanup = () => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
    }
    const onData = (chunk) => {
      if (chunk === '\u0003') {
        cleanup()
        stdout.write('\nDibatalkan.\n')
        reject(new Error('Dibatalkan.'))
      } else if (chunk === '\r' || chunk === '\n') {
        cleanup()
        stdout.write('\n')
        resolve(password)
      } else if (chunk === '\u007f' || chunk === '\b') {
        password = password.slice(0, -1)
      } else if (chunk >= ' ' && chunk !== '\u007f') {
        password += chunk
      }
    }
    stdin.on('data', onData)
  })
}

async function main() {
  try {
    const password = await readHiddenPassword()
    if (password.length < 8) throw new Error('Password harus minimal 8 karakter.')
    console.log(await bcrypt.hash(password, 10))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

main()
