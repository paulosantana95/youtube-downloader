# yt-downloader

Ferramenta de linha de comando para baixar vídeos ou áudios do YouTube com seleção de qualidade e conversão automática para MP4.

## Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **yt-dlp**: binário necessário para baixar vídeos/áudios.
- **ffmpeg**: necessário para conversão e manipulação de mídia (deve estar instalado globalmente no sistema).

> O projeto já inclui o binário do **yt-dlp** para **macOS** na pasta `bin/`. O ffmpeg deve ser instalado globalmente no seu sistema operacional (veja abaixo como configurar).

## Instalação

1. Clone este repositório:
   ```sh
   git clone <url-do-repo>
   cd yt-downloader
   ```
2. Instale as dependências:
   ```sh
   npm install
   ```


## Executando

```sh
node index.js
```

Siga as instruções interativas para informar a URL e escolher o tipo e qualidade do download.


## Sobre os binários

- O binário `yt-dlp` presente em `bin/` é para **macOS**. Se você estiver em outro sistema, substitua conforme abaixo.
- O **ffmpeg** deve ser instalado globalmente no seu sistema operacional.

### Windows
- Baixe o `yt-dlp.exe` em: https://github.com/yt-dlp/yt-dlp/releases/latest
- Renomeie para `yt-dlp` (sem extensão) e coloque na pasta `bin/`.
- Ou use o comando PowerShell para baixar direto:
  ```powershell
  Invoke-WebRequest -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile ".\bin\yt-dlp"
  ```
- Instale o ffmpeg globalmente: https://www.gyan.dev/ffmpeg/builds/ (adicione o executável ao PATH do sistema).

### Linux
- Baixe o yt-dlp diretamente para a pasta bin:
  ```sh
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp
  chmod +x bin/yt-dlp
  ```
- Instale o ffmpeg globalmente:
  ```sh
  sudo apt install ffmpeg
  ```

### macOS
- O binário do yt-dlp já está pronto na pasta `bin/`. Para atualizar ou baixar manualmente:
  ```sh
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos -o bin/yt-dlp
  chmod +x bin/yt-dlp
  ```
- Instale o ffmpeg globalmente:
  ```sh
  brew install ffmpeg
  ```

## Observações
- O script sempre tenta usar o binário local do yt-dlp na pasta `bin/` se existir.
- O ffmpeg deve estar disponível globalmente no PATH do sistema.

## Licença
MIT
