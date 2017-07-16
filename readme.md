# credit-card-prompt [![Build Status](https://travis-ci.org/bukinoshita/credit-card-prompt.svg?branch=master)](https://travis-ci.org/bukinoshita/credit-card-prompt)

> Credit card prompt with validation and address lookup


## Install
```bash
$ npm install --save credit-card-prompt
```


## Usage
```js
const creditCardPrompt = require('credit-card-prompt')

creditCardPrompt()

/*
{
  name: 'Bu Kinoshita',
  number: 4242424242424242,
  cvc: 123,
  address_country: Canada,
  address_zip: MK63P6,
  address_state: Toronto,
  address_city: res.city,
  address_line1: res.address1,
  exp_month: expDateParts[0],
  exp_year: expDateParts[1]
}
*/
```

_It uses `add-billing` from zeit under the hood with some changes._


## Demo

<img src="https://github.com/bukinoshita/credit-card-prompt/blob/master/demo.gif" width="550">


## API

### creditCardPrompt(googleMapsKey)

Return a `promise`

#### googleMapsKey

Type: `string`<br/>
Optional

If Google Maps API Key is set, it will lookup for user `state` and `city` using zip code.


## Related

- [npm-donate](https://github.com/bukinoshita/npm-donate) — Support maintainers with a donation and help them continue with activities


## License

MIT © [Bu Kinoshita](https://bukinoshita.io)
