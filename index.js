'use strict'

/**
 * Tweaked to make address lookup as optional, UI and
 * Make it possible to work on any project.
 * Props to:
 * https://github.com/zeit/now-cli/blob/b1663954fe935beb0244002625e05402f59bd20e/bin/now-billing-add.js
 */

const chalk = require('chalk')
const ccValidator = require('credit-card')
const { tick, circleDotted } = require('figures')

const textInput = require('./lib/text')
const geocode = require('./lib/geocode')

const rightPad = require('./lib/utils/right-pad')
const wait = require('./lib/utils/wait')

const countries = require('./lib/helpers/country-list')
const cardBrands = require('./lib/helpers/card-brands')

function expDateMiddleware(data) {
  return data
}

module.exports = googleMapsKey => {
  return new Promise((resolve, reject) => {
    const state = {
      error: undefined,
      cardGroupLabel: `${chalk.gray('>')} ${chalk.bold(
        'Enter your card information.'
      )}`,
      name: {
        label: rightPad('Full Name', 12),
        placeholder: 'John Appleseed',
        validateValue: data => data.trim().length > 0
      },

      cardNumber: {
        label: rightPad('Number', 12),
        mask: 'cc',
        placeholder: '#### #### #### ####',
        validateKeypress: (data, value) => /\d/.test(data) && value.length < 19,
        validateValue: data => {
          data = data.replace(/ /g, '')
          const type = ccValidator.determineCardType(data)
          if (!type) {
            return false
          }
          return ccValidator.isValidCardNumber(data, type)
        }
      },

      ccv: {
        label: rightPad('CCV', 12),
        mask: 'ccv',
        placeholder: '###',
        validateValue: data => {
          const brand = state.cardNumber.brand.toLowerCase()
          return ccValidator.doesCvvMatchType(data, brand)
        }
      },

      expDate: {
        label: rightPad('Exp. Date', 12),
        mask: 'expDate',
        placeholder: 'mm / yyyy',
        middleware: expDateMiddleware,
        validateValue: data => !ccValidator.isExpired(...data.split(' / '))
      },

      addressGroupLabel: `\n${chalk.gray('>')} ${chalk.bold(
        'Enter your billing address'
      )}`,

      country: {
        label: rightPad('Country', 12),
        async autoComplete(value) {
          for (const country in countries) {
            if (!Object.hasOwnProperty.call(countries, country)) {
              continue
            }

            if (country.startsWith(value)) {
              return country.substr(value.length)
            }

            const lowercaseCountry = country.toLowerCase()
            const lowercaseValue = value.toLowerCase()

            if (lowercaseCountry.startsWith(lowercaseValue)) {
              return lowercaseCountry.substr(value.length)
            }
          }

          return false
        },
        validateValue: value => {
          for (const country in countries) {
            if (!Object.hasOwnProperty.call(countries, country)) {
              continue
            }

            if (country.toLowerCase() === value.toLowerCase()) {
              return true
            }
          }

          return false
        }
      },

      zipCode: {
        label: rightPad('ZIP', 12),
        validadeKeypress: data => data.trim().length > 0,
        validateValue: data => data.trim().length > 0
      },

      state: {
        label: rightPad('State', 12),
        validateValue: data => data.trim().length > 0
      },

      city: {
        label: rightPad('City', 12),
        validateValue: data => data.trim().length > 0
      },

      address1: {
        label: rightPad('Address', 12),
        validateValue: data => data.trim().length > 0
      }
    }

    async function render() {
      for (const key in state) {
        if (!Object.hasOwnProperty.call(state, key)) {
          continue
        }
        const piece = state[key]
        if (typeof piece === 'string') {
          console.log(piece)
        } else if (typeof piece === 'object') {
          let result
          try {
            /* eslint-disable no-await-in-loop */
            result = await textInput({
              label: `${circleDotted} ${piece.label}`,
              initialValue: piece.initialValue || piece.value,
              placeholder: piece.placeholder,
              mask: piece.mask,
              validateKeypress: piece.validateKeypress,
              validateValue: piece.validateValue,
              autoComplete: piece.autoComplete
            })

            piece.value = result

            if (key === 'cardNumber') {
              let brand = cardBrands[ccValidator.determineCardType(result)]
              piece.brand = brand

              if (brand === 'American Express') {
                state.ccv.placeholder = '#'.repeat(4)
              } else {
                state.ccv.placeholder = '#'.repeat(3)
              }

              brand = chalk.gray(`[${brand}]`)
              const masked =
                chalk.gray('#### '.repeat(3)) + result.split(' ')[3]
              process.stdout.write(
                `${chalk.green(tick)} ${piece.label}${masked} ${brand}\n`
              )
            } else if (key === 'ccv') {
              process.stdout.write(
                `${chalk.green(tick)} ${piece.label}${'*'.repeat(
                  result.length
                )}\n`
              )
            } else if (key === 'expDate') {
              let text = result.split(' / ')
              text = text[0] + chalk.gray(' / ') + text[1]
              process.stdout.write(
                `${chalk.green(tick)} ${piece.label}${text}\n`
              )
            } else if (key === 'zipCode' && googleMapsKey) {
              const stopSpinner = wait(piece.label + result)
              const addressInfo = await geocode(googleMapsKey, {
                country: state.country.value,
                zipCode: result
              })
              if (addressInfo.state) {
                state.state.initialValue = addressInfo.state
              }
              if (addressInfo.city) {
                state.city.initialValue = addressInfo.city
              }
              stopSpinner()
              process.stdout.write(
                `${chalk.green(tick)} ${piece.label}${result}\n`
              )
            } else {
              process.stdout.write(
                `${chalk.green(tick)} ${piece.label}${result}\n`
              )
            }
          } catch (err) {
            if (err.message === 'USER_ABORT') {
              process.exit(1)
            } else {
              console.error(err)
            }
          }
        }
      }
      console.log('') // New line

      const res = {
        name: state.name.value,
        cardNumber: state.cardNumber.value,
        ccv: state.ccv.value,
        expDate: state.expDate.value,
        country: state.country.value,
        zipCode: state.zipCode.value,
        state: state.state.value,
        city: state.city.value,
        address: state.address1.value,
        last4: state.cardNumber.value.slice(-4)
      }

      resolve(res)
    }

    render().catch(err => reject(err))
  })
}
