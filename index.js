import inquirer from 'inquirer'
import { spawn } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import cliProgress from 'cli-progress'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ytDlpPath = path.join(__dirname, 'bin', 'yt-dlp')

const downloadsDir = path.join(__dirname, 'downloads')
if (!existsSync(downloadsDir)) {
  mkdirSync(downloadsDir)
}

const downloadBar = new cliProgress.SingleBar({
  format: `${chalk.green('Download')} ${chalk.green('{bar}')} {percentage}% | {transferred} @ {speed} | ETA: {eta}`,
  barCompleteChar: '█',
  barIncompleteChar: '░',
  hideCursor: true,
  clearOnComplete: false,
  stopOnComplete: true,
  etaBuffer: 10,
  fps: 5,
  stream: process.stdout,
  noTTYOutput: false,
  notTTYSchedule: 2000
}, cliProgress.Presets.shades_classic)

const conversionBar = new cliProgress.SingleBar({
  format: `${chalk.magenta('Conversão')} ${chalk.magenta('{bar}')} {percentage}% | {status}`,
  barCompleteChar: '█',
  barIncompleteChar: '░',
  hideCursor: true,
  clearOnComplete: false,
  stopOnComplete: true,
  etaBuffer: 10,
  fps: 5,
  stream: process.stdout,
  noTTYOutput: false,
  notTTYSchedule: 2000
}, cliProgress.Presets.shades_classic)

function runYtDlpWithProgress(args) {
  return new Promise((resolve, reject) => {
    const process = spawn(ytDlpPath, [
      '--newline',
      '--progress',
      ...args
    ])

    let downloadStarted = false
    let conversionStarted = false
    let conversionProgress = 0

    function parseProgressLine(line) {
      const cleanLine = line.trim()


      if (cleanLine.includes('[download]')) {
        // Capturar progresso de bytes baixados
        const bytesMatch = cleanLine.match(/\[download\]\s+([\d,]+)\/([\d,]+)\s+\(([\w%]+)\)/)
        if (bytesMatch) {
          if (!downloadStarted) {
            downloadStarted = true;
            downloadBar.start(100, 0, {
              transferred: '0B',
              speed: '0B/s',
              eta: 'Calculando...'
            });
          }
          const downloaded = parseInt(bytesMatch[1].replace(/,/g, ''))
          const total = parseInt(bytesMatch[2].replace(/,/g, ''))
          const percent = (downloaded / total) * 100

          // Extrair velocidade e ETA se disponível
          const speedMatch = cleanLine.match(/at\s+([\d.]+\w+\/s)/)
          const etaMatch = cleanLine.match(/ETA\s+([\d:]+)/)

          const speed = speedMatch ? speedMatch[1] : 'N/A'
          const eta = etaMatch ? etaMatch[1] : 'N/A'
          const transferred = formatBytes(downloaded)

          downloadBar.update(Math.min(percent, 100), {
            transferred,
            speed,
            eta
          })
          return true
        }

        // Capturar progresso em porcentagem (formato alternativo)
        const percentMatch = cleanLine.match(/\[download\]\s+([\d.]+)%/)
        if (percentMatch) {
          if (!downloadStarted) {
            downloadStarted = true;
            downloadBar.start(100, 0, {
              transferred: '0B',
              speed: '0B/s',
              eta: 'Calculando...'
            });
          }
          const percent = parseFloat(percentMatch[1])

          // Extrair outras informações se disponível
          const sizeMatch = cleanLine.match(/of\s+~?([\d.]+\w+)/)
          const speedMatch = cleanLine.match(/at\s+([\d.]+\w+\/s)/)
          const etaMatch = cleanLine.match(/ETA\s+([\d:]+)/)

          const transferred = sizeMatch ? sizeMatch[1] : 'N/A'
          const speed = speedMatch ? speedMatch[1] : 'N/A'
          const eta = etaMatch ? etaMatch[1] : 'N/A'

          downloadBar.update(Math.min(percent, 100), {
            transferred,
            speed,
            eta
          })
          return true
        }

        if (cleanLine.includes('Destination:')) {
          const filename = cleanLine.split('/').pop()
          console.log(chalk.blue(`\n📥 Baixando: ${filename}`))
          return true
        }

        if (cleanLine.includes('100%') || cleanLine.includes('ETA NA')) {
          return true
        }

        return false
      }

      return false
    }

    function parseConversionLine(line) {
      const cleanLine = line.trim()

      if (cleanLine.includes('[VideoConvertor]') && cleanLine.includes('Converting video')) {
        if (downloadStarted) {
          downloadBar.stop()
          console.log(chalk.green('\n✅ Download concluído!'))
        }

        conversionStarted = true
        console.log(chalk.magenta('\n🔄 Convertendo para MP4...'))
        conversionBar.start(100, 0, {
          status: 'Iniciando conversão...'
        })

        const conversionInterval = setInterval(() => {
          if (conversionProgress < 90) {
            conversionProgress += Math.random() * 15
            conversionBar.update(Math.min(conversionProgress, 90), {
              status: 'Convertendo...'
            })
          }
        }, 500)

        process.conversionInterval = conversionInterval
        return true
      }

      return false
    }

    function formatBytes(bytes) {
      if (bytes === 0) return '0B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
    }

    process.stdout.on('data', data => {
      const lines = data.toString().split(/\r?\n/)
      for (const line of lines) {
        if (line.trim()) {
          if (!parseProgressLine(line) && !parseConversionLine(line)) {
            if (line.includes('[info]') && line.includes('Downloading') && line.includes('format(s)')) {
              const formatInfo = line.match(/Downloading \d+ format\(s\): ([\d+]+)/)
              if (formatInfo) {
                console.log(chalk.cyan(`\n🎥 Formatos selecionados: ${formatInfo[1]}`))
              }
            }
          }
        }
      }
    })

    process.stderr.on('data', data => {
      const lines = data.toString().split(/\r?\n/)
      for (const line of lines) {
        if (line.trim()) {
          if (!parseProgressLine(line) && !parseConversionLine(line)) {
            // Mostrar informações importantes do YouTube/yt-dlp
            if (line.includes('[youtube]') || line.includes('Extracting') || line.includes('Downloading webpage')) {
              console.log(chalk.cyan(`🔍 ${line.replace('[youtube]', '').trim()}`))
            } else if (line.includes('[Merger]')) {
              if (downloadStarted && !conversionStarted) {
                downloadBar.stop()
                console.log(chalk.green('\n✅ Download concluído!'))
                console.log(chalk.yellow('\n🔧 Combinando arquivos de áudio e vídeo...'))
              }
            } else if (line.includes('Deleting original file')) {
              // Não mostrar mensagens de limpeza
              return
            } else if (line.trim().length > 0 && !line.includes('[info]')) {
              // Outras mensagens importantes
              console.log(chalk.gray(`ℹ️  ${line.trim()}`))
            }
          }
        }
      }
    })

    process.on('close', code => {
      // Limpar interval de conversão se existir
      if (process.conversionInterval) {
        clearInterval(process.conversionInterval)
      }

      if (downloadStarted && !conversionStarted) {
        downloadBar.update(100, {
          transferred: 'Completo',
          speed: 'Finalizado',
          eta: '0:00'
        })
        setTimeout(() => {
          downloadBar.stop()
        }, 500)
      }

      if (conversionStarted) {
        conversionBar.update(100, {
          status: 'Conversão concluída!'
        })
        setTimeout(() => {
          conversionBar.stop()
          console.log(chalk.green('\n✅ Conversão para MP4 concluída!'))
        }, 500)
      }

      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`yt-dlp saiu com código ${code}`))
      }
    })

    process.on('error', err => {
      if (downloadStarted) downloadBar.stop()
      if (conversionStarted) conversionBar.stop()
      if (process.conversionInterval) {
        clearInterval(process.conversionInterval)
      }
      reject(err)
    })
  })
}

async function main() {
  if (!existsSync(ytDlpPath)) {
    console.error('❌ yt-dlp não encontrado. Coloque o binário em: bin/yt-dlp')
    return
  }

  const { url } = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: 'Informe a URL do vídeo:',
      validate: value => value ? true : 'URL não pode estar vazia.'
    }
  ])

  const { downloadType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'downloadType',
      message: 'O que deseja baixar?',
      choices: ['Vídeo com qualidade específica', 'Apenas áudio']
    }
  ])

  let format = 'bestvideo+bestaudio'
  let extraArgs = []

  let quality = ''
  if (downloadType === 'Apenas áudio') {
    format = 'bestaudio'
  } else {
    const qualityPrompt = await inquirer.prompt([
      {
        type: 'list',
        name: 'quality',
        message: 'Selecione a qualidade desejada para o vídeo (quanto maior, melhor a resolução e o tamanho do arquivo):',
        choices: [
          { name: '1080p (Full HD - maior qualidade)', value: '1080p' },
          { name: '720p (HD)', value: '720p' },
          { name: '480p (SD)', value: '480p' },
          { name: '360p (Baixa)', value: '360p' },
          { name: '240p (Muito baixa)', value: '240p' },
          { name: '144p (Extremamente leve)', value: '144p' }
        ]
      }
    ])
    quality = qualityPrompt.quality
    const qualityMap = {
      '1080p': 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio',
      '720p': 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio',
      '480p': 'bestvideo[ext=mp4][height<=480]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio',
      '360p': 'bestvideo[ext=mp4][height<=360]+bestaudio[ext=m4a]/bestvideo[height<=360]+bestaudio',
      '240p': 'bestvideo[ext=mp4][height<=240]+bestaudio[ext=m4a]/bestvideo[height<=240]+bestaudio',
      '144p': 'bestvideo[ext=mp4][height<=144]+bestaudio[ext=m4a]/bestvideo[height<=144]+bestaudio'
    }
    format = qualityMap[quality]
    extraArgs.push('--recode-video', 'mp4')
  }

  // Adicionar qualidade ao nome do arquivo, agora na pasta downloads
  let output = ''
  if (downloadType === 'Apenas áudio') {
    output = path.join(downloadsDir, '%(title)s.%(ext)s')
  } else {
    output = path.join(downloadsDir, `%(title)s-${quality}.%(ext)s`)
  }

  console.log('\n📥 Iniciando download...')
  console.log(`📁 Destino: ${chalk.cyan(downloadsDir)}`)
  console.log('')

  try {
    await runYtDlpWithProgress(['-f', format, '-o', output, ...extraArgs, url])
    console.log(chalk.green('\n🎉 Processo concluído com sucesso!'))

    // Mostrar nome do arquivo final
    const fs = await import('fs')
    const files = await fs.promises.readdir(downloadsDir)
    const mp4Files = files.filter(file => file.endsWith('.mp4') && !file.includes('.f'))
    if (mp4Files.length > 0) {
      console.log(chalk.blue(`📹 Arquivo salvo: ${mp4Files[mp4Files.length - 1]}`))
    }
  } catch (err) {
    console.error(chalk.red('\n❌ Erro durante o processo:'), err.message)
  }
}

main()
