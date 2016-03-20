'use strict'
/* global describe, it */
const should = require('should')
const Resper = require('../lib/Resper')
const CRLF = '\r\n'

describe('Resper test', () => {
  it('Should throw when type of param is wrong', () => {
    (() => Resper.encodeString(1)).should.throw(/should be a string/);

    (() => Resper.encodeError(1)).should.throw(/should be an instance of Error/);

    (() => Resper.encodeInt('jaja')).should.throw(/should be an integer/);

    (() => Resper.encodeBulkString(1)).should.throw(/should be a string or an instance of Buffer/);

    (() => Resper.encodeArray('jaja')).should.throw(/should be an array/);

    (() => Resper.encodeArray(['jaja'])).should.throw(/should be an instance of Buffer/);

    (() => Resper.decode(['jaja'])).should.throw(/should be an instance of Buffer/)
  })

  it('Should decode right', () => {
    Resper.decode(Resper.encodeString('jaja'))[0].should.eql('jaja')

    let error = Resper.decode(Resper.encodeError(new TypeError('heheda')))[0]
    error.name.should.eql('TypeError')
    error.message.should.eql('heheda')

    Resper.decode(Resper.encodeInt(998))[0].should.eql(998)

    Resper.decode(Resper.encodeBulkString('bulkjaja'))[0].should.eql('bulkjaja')
    should(Resper.decode(Resper.encodeNull())[0]).be.null()

    let _err = new Error('heheda')
    _err.name = 'Error'
    Resper.decode(Resper.encodeArray([
      Resper.encodeInt(1),
      Resper.encodeString('str'),
      Resper.encodeNullArray(),
      Resper.encodeError(new Error('heheda'))
    ]))[0].should.eql([1, 'str', null, _err])
  })

  it('Should encode string right', () => {
    Resper.encodeString('jaja').toString().should.eql(`+jaja${CRLF}`)
  })

  it('Should encode error right', () => {
    Resper.encodeError(new TypeError('jaja')).toString().should.eql(`-TypeError jaja${CRLF}`)
  })

  it('Should encode integer right', () => {
    Resper.encodeInt(998).toString().should.eql(`:998${CRLF}`)
  })

  it('Should encode bulkStr right', () => {
    Resper.encodeBulkString('jaja').toString().should.eql(`$4${CRLF}jaja${CRLF}`)

    Resper.encodeBulkString(new Buffer('jaja')).toString().should.eql(`$4${CRLF}jaja${CRLF}`)
  })

  it('Should encode null right', () => {
    Resper.encodeNull().toString().should.eql(`$-1${CRLF}`)
  })

  it('Should encode nullArray right', () => {
    Resper.encodeNullArray().toString().should.eql(`*-1${CRLF}`)
  })

  it('Should encode array right', () => {
    Resper.encodeArray([
      Resper.encodeInt(1),
      Resper.encodeString('str'),
      Resper.encodeNullArray(),
      Resper.encodeError(new Error('heheda'))
    ]).toString().should.eql(`*4${CRLF}:1${CRLF}+str${CRLF}*-1${CRLF}-Error heheda${CRLF}`)

    Resper.encodeArray([
      Resper.encodeInt(1),
      Resper.encodeString('str'),
      [
        Resper.encodeNullArray(),
        Resper.encodeError(new Error('heheda'))
      ]
    ]).toString().should.eql(`*3${CRLF}:1${CRLF}+str${CRLF}*2${CRLF}*-1${CRLF}-Error heheda${CRLF}`)
  })
})
