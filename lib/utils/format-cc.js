'use strict'

module.exports = cc => {
  return cc.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
}
