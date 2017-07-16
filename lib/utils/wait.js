'use strict'

const ora = require('ora')
const chalk = require('chalk')
const { eraseLine } = require('ansi-escapes')

module.exports = msg => {
  const spinner = ora(chalk.gray(msg))
  spinner.color = 'gray'
  spinner.start()

  return () => {
    spinner.stop()
    process.stdout.write(eraseLine)
  }
}
