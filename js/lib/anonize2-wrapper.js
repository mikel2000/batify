/* https://github.com/brave/node-anonize2-relic-emscripten, 0.3.3 */
/* Licensed under the Mozilla Public License 2.0 */
/* Please check ../../LICENSE for licensing details */

/* jshint asi: true, node: true, laxbreak: true, laxcomma: true, undef: true, unused: true */

var init = cwrap('initAnonize', '', '')
if (!init) throw new Error('unable to initialize the anonize2 library')

init()

var emscripten = {
  makeKey: cwrap('makeKey', 'number', [ 'number', 'number' ]),
  registerServerResponse: cwrap('registerServerResponse', 'string', [ 'string', 'string', 'string' ]),
  createSurvey: cwrap('createSurvey', 'number', [ 'number' ]),
  extendSurvey: cwrap('extendSurvey','number', [ 'number', 'number' ]),
  verifyMessage: cwrap('verifyMessage', 'number', ['string', 'string', 'string', 'string', 'number']),
  makeCred: cwrap('makeCred', 'string', [ 'string' ]),
  registerUserMessage: cwrap('registerUserMessage', 'string', [ 'string', 'string' ]),
  registerUserFinal: cwrap('registerUserFinal', 'string', [ 'string', 'string', 'string', 'string']),
  submitMessage: cwrap('submitMessage', 'string', [ 'string', 'string', 'string', 'string', 'string', 'string' ])
}

var addon = {
  version: function() { return '2.1.0' },

  makeKey:
    function () {
      var result
      var ravk = _malloc(2048)
      var rask = _malloc(2048)

      if (emscripten.makeKey(ravk, rask)) {
        result = { registrarSK: Pointer_stringify(rask), registrarVK: Pointer_stringify(ravk) }
      }
      _free(ravk)
      _free(rask)

      if (!result) throw new Error('makeKey failed')
      return result
    },

  registerServerResponse:
    function (userId, request, registrarSK) {
      var result = emscripten.registerServerResponse(userId, request, registrarSK);

      if (!result) throw new Error('registerServerResponse vailed')
      return result
    },

  createSurvey:
    function () {
      var result
      var survey = _malloc(40)

      if (emscripten.createSurvey(survey)) {
        result = { surveyId: Pointer_stringify(getValue(survey, '*')),
                   surveyVK: Pointer_stringify(getValue(survey + 4, '*')),
                   surveySK: Pointer_stringify(getValue(survey + 16, '*'))
                 }
      }
      _free(survey)

      if (!result) throw new Error('createSurvey failed')
      return result
    },

  extendSurvey:
    function (surveyId, surveyVK, surveySK, userId) {
      var result
      var survey = _malloc(40)
      var vid = _malloc(surveyId.length + 1)
      var vavk = _malloc(surveyVK.length + 1)
      var vask = _malloc(surveySK.length + 1)
      var user = _malloc(userId.length + 1)

      writeAsciiToMemory(surveyId, vid)
      setValue(survey, vid, '*')
      writeAsciiToMemory(surveyVK, vavk)
      setValue(survey + 4, vavk, '*')
      writeAsciiToMemory(surveySK, vask)
      setValue(survey + 16, vask, '*')
      writeAsciiToMemory(userId, user)

      if (emscripten.extendSurvey(user, survey)) {
        result = Pointer_stringify(getValue(survey + 8, '*'))
      }
      _free(survey)
      _free(vid)
      _free(vavk)
      _free(vask)
      _free(user)

      if (!result) throw new Error('extendSurvey')
      return result
    },

  verifyMessage:
    function (request, registrarVK, surveyId, surveyVK) {
      var result
      var response = _malloc(16)

      if (emscripten.verifyMessage(request, registrarVK, surveyId, surveyVK, response)) {
        result = { data: Pointer_stringify(getValue(response, '*')),
                   token: Pointer_stringify(getValue(response + 4, '*'))
                 }
      }
      _free(response)

      if (!result) throw new Error('verifyMessage failed')
      return result
    },

  makeCred:
    function (userId) {
      var result = emscripten.makeCred(userId)

      if (!result) throw new Error('makeCred failed')
      return result
    },

  registerUserMessage:
    function (preFlight, registrarVK) {
      var result = emscripten.registerUserMessage(preFlight, registrarVK)

      if (!result) throw new Error('registerUserMessage failed')
      return result
    },

  registerUserFinal:
    function (userId, response, preFlight, registrarVK) {
      var result = emscripten.registerUserFinal(userId, response, preFlight, registrarVK)

      if (!result) throw new Error('registerUserFinal failed')
      return result
    },

  submitMessage:
    function (message, masterUserToken, registrarVK, userIdSignature, surveyId, surveyVK) {
      var result = emscripten.submitMessage (message, masterUserToken, registrarVK, userIdSignature, surveyId, surveyVK)

      if (!result) throw new Error('submitMessage failed')
      return result
    }
}


var Registrar = function (s) {
  var p

  if (!(this instanceof Registrar)) return new Registrar(s)

  if (!s) {
    this.parameters = addon.makeKey()
    return
  }

  if (typeof s !== 'string') s = JSON.stringify(s)
  p = JSON.parse(s)
  if ((typeof p.registrarSK !== 'string') || (typeof p.registrarVK !== 'string')) throw new Error('invalid JSON: ' + s)

  this.parameters = _.pick(p, [ 'registrarSK', 'registrarVK' ])
}

Registrar.prototype.toJSON = function () {
  return this.parameters
}

Registrar.prototype.publicInfo = function () {
  return _.pick(this.parameters, [ 'registrarVK' ])
}

Registrar.prototype.register = function (request) {
  var info = parseStr(request, 'registrar request',
                      '==========ANONLOGIN_CRED_BEG==========', '==========ANONLOGIN_CRED_END===========')

  return addon.registerServerResponse(info[0][0], request, this.parameters.registrarSK)
}


var Surveyor = function (s) {
  var p

  if (!(this instanceof Surveyor)) return new Surveyor(s)

  if (!s) return

  if (typeof s !== 'string') s = JSON.stringify(s)
  p = JSON.parse(s)
  if ((typeof p.surveyorId !== 'string') || (typeof p.surveyVK !== 'string') || (typeof p.registrarVK !== 'string') ||
      ((typeof p.surveySK !== 'string') && (typeof p.surveySK !== 'undefined')) ||
      ((typeof p.signature !== 'string') && (typeof p.signature !== 'undefined'))) throw new Error('invalid JSON: ' + s)

  this.parameters = _.pick(p, [ 'surveyorId', 'surveyVK', 'registrarVK', 'surveySK', 'signature' ])
}

Surveyor.prototype.initialize = function (registrarVK) {
  if (this.parameters) throw new Error('invalid initialization')

  this.parameters = addon.createSurvey()
  this.parameters.surveyorId = this.parameters.surveyorId || this.parameters.surveyId
  delete(this.parameters.surveyId)
  this.parameters.registrarVK = registrarVK

  return this
}

Surveyor.prototype.toJSON = function () {
  return (this.parameters || {})
}

Surveyor.prototype.publicInfo = function () {
  return _.pick(this.parameters, [ 'surveyorId', 'surveyVK', 'registrarVK' ])
}

Surveyor.prototype.sign = function (userId) {
  userId = uId(userId)
  if (userId.length > 31) throw new Error('invalid userId: ' + userId)

  return addon.extendSurvey(this.parameters.surveyorId, this.parameters.surveyVK, this.parameters.surveySK, userId)
}

Surveyor.prototype.verify = function (request) {
  var s = addon.verifyMessage(request, this.parameters.registrarVK, this.parameters.surveyorId, this.parameters.surveyVK)

  try { s = JSON.parse(s) } catch(ex) { }
  return s
}


var Credential = function (userId, registrarVK) {
  var p, s

  if (!(this instanceof Credential)) return new Credential(userId, registrarVK)

  if (!userId) throw new Error('missing parameters')

  if ((typeof userId === 'string') && (typeof registrarVK === 'string')) {
    userId = uId(userId)
    if (userId.length > 31) throw new Error('invalid userId: ' + userId)

    this.parameters = { userId: userId, registrarVK: registrarVK }
    return
  }
  if (typeof registrarVK !== 'undefined') throw new Error('invalid parameters')

  s =  (typeof userId !== 'string') ? JSON.stringify(userId) : userId
  p = JSON.parse(s)
  if ((typeof p.userId !== 'string') || (typeof p.registrarVK !== 'string')) {
    throw new Error('invalid JSON: ' + s)
  }

  this.parameters = _.pick(p, [ 'userId', 'registrarVK', 'masterUserToken', 'preFlight' ])
}

Credential.prototype.toJSON = function () {
  return this.parameters
}

Credential.prototype.request = function () {
  this.parameters.preFlight = addon.makeCred(this.parameters.userId)
  return addon.registerUserMessage(this.parameters.preFlight, this.parameters.registrarVK)
}

Credential.prototype.finalize = function (response) {
  if (!this.parameters.preFlight) throw new Error('preFlight missing for credential')

  this.parameters.masterUserToken = addon.registerUserFinal(this.parameters.userId, response, this.parameters.preFlight,
                                                            this.parameters.registrarVK)
  delete(this.parameters.preFlight)

  return JSON.stringify(this)
}

Credential.prototype.submit = function (survey, message) {
  if (!this.parameters.masterUserToken) throw new Error('masterUserToken missing for credential')

  if (typeof survey === 'string') survey = new Surveyor(survey)
  if (typeof message === 'undefined') message = {}
  if (typeof message !== 'string') message = JSON.stringify(message)

  return addon.submitMessage(message, this.parameters.masterUserToken, this.parameters.registrarVK,
                             survey.parameters.signature.split(',')[1].trim(),
                             survey.parameters.surveyorId, survey.parameters.surveyVK)
}


var parseStr = function (s, text, header /*, trailer */) {
  var a, x, z

  z = s.trim()
  x = z.indexOf(header)
/*
  if (x === -1) throw new Error('invalid ' + text + ' header: ' + s)
  z = z.substring(x + header.length).trim()
  x = z.indexOf(trailer)
  if (x === -1) throw new Error('invalid ' + text + ' trailer: ' + s)
  z = z.substring(0, x - 1)
 */

  a = []
  z.trim().split('\n').forEach(function (line) { a.push(line.trim().split(' ')) })

  return a
}

var uId = function (s) {
  if (typeof s !== 'string') return s

  var u = s.split('-').join('')

// NB: anonize2 limit is 31 octets, ledger expects a v4 UUID
  if ((u.length !== 32) || (u.substr(12, 1) !== '4')) return s

  return (u.substr(0, 12) + u.substr(13, 19)).toLowerCase()
}

