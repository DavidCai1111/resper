'use strict'
const EventEmitter = require('events')
const utils = require('./utils')

const CRLF = '\r\n'

module.exports = class Resper extends EventEmitter {
  constructor () {
    super()
    this.buffer = null
    this.index = 0
  }

  refresh () {
    this.buffer = null
    this.index = 0
    return this
  }

  write (buf) {
    if (!Buffer.isBuffer(buf)) this.emit('error', new TypeError(`${buf} should be an instance of Buffer`))

    if (!this.buffer) this.buffer = buf
    else {
      let reamin = this.buffer.length - this.index
      let newBuffer = new Buffer(reamin + buf.length)

      this.buffer.copy(newBuffer, 0, this.index)
      buf.copy(newBuffer, reamin, 0)
      this.buffer = newBuffer
      this.index = 0
    }

    while (this.index < this.buffer.length) {
      let result = utils.parseBuffer(this.buffer, this.index)
      if (!result[0]) {
        this.emit('drain')
        return this
      }

      if (utils.isError(result[0])) {
        this.emit('error', result[0])
        return this
      }

      this.index = result[1]
      this.emit('data', result[0])
    }

    this.refresh()
    return this
  }

  end (buf) {
    if (buf) this.write(buf)
    this.emit('finish')
    return this
  }

  static decode (encodedBuf) {
    if (!Buffer.isBuffer(encodedBuf)) throw new TypeError(`${encodedBuf} should be an instance of Buffer`)

    return utils.parseBuffer(encodedBuf, 0)
  }

  static encodeString (str) {
    if (typeof str !== 'string') throw new TypeError(`${str} should be a string`)

    return new Buffer(`+${str}${CRLF}`)
  }

  static encodeError (err) {
    if (!utils.isError(err)) throw new TypeError(`${err} should be an instance of Error`)

    return new Buffer(`-${err.name} ${err.message}${CRLF}`)
  }

  static encodeInt (int) {
    if (!Number.isInteger(int)) throw new TypeError(`${int} should be an integer`)

    return new Buffer(`:${int}${CRLF}`)
  }

  static encodeBulkString (bulk) {
    let result
    if (Buffer.isBuffer(bulk)) {
      let prefix = `$${bulk.length}${CRLF}`
      result = new Buffer(prefix.length + bulk.length + CRLF.length)

      result.write(prefix)
      bulk.copy(result, prefix.length)
      result.write(CRLF, prefix.length + bulk.length)
    } else if (typeof bulk === 'string') {
      result = new Buffer(`$${Buffer.byteLength(bulk)}${CRLF}${bulk}${CRLF}`)
    } else {
      throw new TypeError(`${bulk} should be a string or an instance of Buffer`)
    }

    return result
  }

  static encodeNull () { return new Buffer(`$-1${CRLF}`) }

  static encodeNullArray () { return new Buffer(`*-1${CRLF}`) }

  static encodeArray (arr) {
    if (!Array.isArray(arr)) throw new TypeError(`${arr} should be an array`)

    let prefix = `*${arr.length}${CRLF}`
    let bufs = [new Buffer(prefix)]
    let len = prefix.length

    for (let elem of arr) {
      if (Array.isArray(elem)) elem = Resper.encodeArray(elem)
      else if (!Buffer.isBuffer(elem)) throw new TypeError(`Every element of ${arr} should be an instance of Buffer`)

      bufs.push(elem)
      len = len + elem.length
    }

    return Buffer.concat(bufs, len)
  }

  static encodeRequestArray (arr) {
    if (!Array.isArray(arr)) throw new TypeError(`${arr} should be an array`)

    let request = []

    for (let elem of arr) {
      request.push(Resper.encodeBulkString(elem))
    }

    return Resper.encodeArray(request)
  }
}
