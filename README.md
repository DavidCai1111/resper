# resper
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/DavidCai1993/resper.svg?branch=master)](https://travis-ci.org/DavidCai1993/resper)
[![Coverage Status](https://coveralls.io/repos/github/DavidCai1993/resper/badge.svg?branch=master)](https://coveralls.io/github/DavidCai1993/resper?branch=master)

A parser for RESP (REdis Serialization Protocol).

## Install

```sh
npm install resper
```

## Usage

```js
'use strict'
const Resper = require('resper')

let resper = new Resper()

resper
  .on('error', console.error)
  .on('data', console.log)
  .on('drain', () => {
    // ...
    console.log('drain')
  })

resper.write(Resper.encodeInt(998))
resper.end(Resper.encodeArray([
  Resper.encodeInt(1),
  Resper.encodeString('str'),
  [
    Resper.encodeNullArray(),
    Resper.encodeError(new Error('heheda'))
  ]
]))
```

## API

### Class: Resper

### Class Method: encodeString(str)

Encode `str` to RESP buffer.

### Class Method: encodeError(err)

Encode `err` to RESP buffer.

### Class Method: encodeInt(int)

Encode `int` to RESP buffer.

### Class Method: encodeBulkString(bulk)

Encode `bluk` to RESP buffer, `bluk` could be a String or a Buffer.

### Class Method: encodeNull()

Get the RESP Null buffer.

### Class Method: encodeNullArray()

Get the RESP NullArray buffer.

### Class Method: encodeArray(arr)

Encode `arr` to RESP buffer, each element in `arr` should be an instance of buffer.

### Class Method: encodeRequestArray(requestArr)

Encode `requestArr` to RESP request buffer, each element in `requestArr` should be a string.

```
resper.encodeRequestArray(['LLEN', 'mylist'])
```

### Class Method: decode(encodedBuffer)

Decode RESP buffer to real value. The return value is array which first element is the decode result, and the second value is the index after first `CRLF`.

```js
Resper.decode(Resper.encodeInt(998))[0] // 998
```

### resper.write(buffer)

Write `buffer` to the resper, resper will emit `data` event when after it parsed the `buffer`.

### resper.end([buffer])

When no more data will be writen, you can call this method, and the instance of `Resper` will emit `finish` event.

#### Event: data

`function (parsedData) { }`

Emitted when the instance of `Resper` parsed the written RESP buffer.

#### Event: error

`function (error) { }`

Emitted when an error was occurred.

#### Event: drain

`function () { }`

Emitted when no more data in instance's inner buffer.

#### Event: finish

Emitted when the `resper.end` was called.
