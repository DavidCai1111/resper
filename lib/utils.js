'use strict'
const CRLF = '\r\n'
const STR_PREFIX_CODE = '+'.charCodeAt()
const ERROR_PREFIX_CODE = '-'.charCodeAt()
const INT_PREFIX_CODE = ':'.charCodeAt()
const BULK_STR_PRIFIX_CODE = '$'.charCodeAt()
const ARRAY_PREFIX_CODE = '*'.charCodeAt()

exports.isError = (err) => {
  return Object.prototype.toString.call(err) === '[object Error]' ||
    err instanceof Error
}

exports.parseBuffer = (buffer, start) => {
  let result = []

  switch (buffer[start]) {
    case STR_PREFIX_CODE: // String
      result = _parse(buffer, start + 1)
      break
    case ERROR_PREFIX_CODE: // Error
      result = _parse(buffer, start + 1)
      let err = result[0]
      if (err === null) break

      let spaceIndex = err.indexOf(' ')
      if (~spaceIndex) {
        result[0] = new Error(err.slice(spaceIndex + 1))
        result[0].name = err.slice(0, spaceIndex)
        break
      }

      result[0] = new Error(err)
      break
    case INT_PREFIX_CODE: // Integer
      result = _parse(buffer, start + 1)
      if (result[0] === null) break

      result[0] = parseInt(result[0], 10)
      break
    case BULK_STR_PRIFIX_CODE: // Bulk String
      result = _parse(buffer, start + 1)
      if (result[0] === null) break

      let bulkStartIndex = result[1]
      let bulkLen = parseInt(result[0], 10)
      let bulkEndIndex = bulkStartIndex + bulkLen

      if (bulkLen === -1) { // Null
        result[0] = null
      } else if (Number.isNaN(bulkLen) || bulkLen < -1) {
        result[0] = new Error(`Invaild bulk string length: ${bulkLen}`)
      } else if (buffer.length < bulkEndIndex + CRLF.length) {
        result[0] = null
      } else if (buffer.indexOf(CRLF, bulkStartIndex) !== bulkEndIndex) {
        result[0] = new Error(`Invaild bulk string, missing end CRLF: ${buffer}`)
      } else {
        result[0] = buffer.slice(bulkStartIndex, bulkEndIndex).toString()
      }
      break
    case ARRAY_PREFIX_CODE: // Array
      result = _parse(buffer, start + 1)
      if (result[0] === null) break

      let arrLen = parseInt(result[0], 10)
      if (arrLen === -1) { // Null Array
        result[0] = null
      } else if (Number.isNaN(arrLen) || arrLen < -1) {
        throw new Error(`Invaild array length: ${bulkLen}`)
      } else {
        for (let i = 0, _result; i < arrLen; i++) {
          _result = exports.parseBuffer(buffer, result[1])

          if (!Array.isArray(result[0])) result[0] = []
          result[0][i] = _result[0]
          result[1] = _result[1]
        }
      }

      break

    default:
      result[0] = new Error(`Missing prefix: ${buffer}`)
  }

  return result
}

function _parse (buffer, start) {
  let index = buffer.indexOf(CRLF, start)
  if (!~index) return null

  return [buffer.slice(start, index).toString(), index + 2]
}
