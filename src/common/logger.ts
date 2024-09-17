import { workspace } from 'vscode'

export class Logger {
  _config = workspace.getConfiguration('devdock')
  _debugEnabled = this._config.get('enableLogging') as boolean

  public log = (message: string) => {
    if (!this._debugEnabled) return
    console.log(`[devdock] ${message}`)
  }

  public error = (err: NodeJS.ErrnoException) => {
    if (!this._debugEnabled) return
    console.error(err.message)
  }

  public updateConfig() {
    this._config = workspace.getConfiguration('devdock')
    this._debugEnabled = this._config.get('enableLogging') as boolean
  }
}
