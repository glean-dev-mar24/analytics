/** @typedef {import('../test/support/types').VerifyV2Args} VerifyV2Args */
/** @typedef {import('../test/support/types').VerifyV2Result} VerifyV2Result */
import { checkCookieBanner } from './check-cookie-banner'
import { checkDisallowedByCSP } from './check-disallowed-by-csp'
import ConsentEngine from '../node_modules/consent-o-matic/Extension/ConsentEngine'
import { cookiebot } from './consent-o-matic-rules'

/**
 * Function that verifies if Plausible is installed correctly.
 * @param {VerifyV2Args}
 * @returns {Promise<VerifyV2Result>}
 */

async function verifyPlausibleInstallation({
  timeoutMs,
  responseHeaders,
  debug,
  cspHostToCheck
}) {
  function log(message) {
    if (debug) console.log('[VERIFICATION v2]', message)
  }

  let cookiesHandled = null

  const disallowedByCsp = checkDisallowedByCSP(responseHeaders, cspHostToCheck)

  const { stopRecording, getInterceptedFetch } = startRecordingEventFetchCalls()

  const fetchedRules = [cookiebot]
  const url = window.location.href
  const config = Object.assign({}, ...fetchedRules)
  startConsentEngine({
    consentTypes: {
      A: true,
      B: true,
      D: true,
      E: true,
      F: true,
      X: true
    },
    config,
    url,
    debugValues: {
      clickDelay: false,
      skipSubmit: false,
      paintMatchers: false,
      debugClicks: false,
      alwaysForceRulesUpdate: false,
      skipHideMethod: false,
      debugLog: true,
      debugRules: true,
      debugTranslations: false,
      skipSubmitConfirmation: false,
      dontHideProgressDialog: false,
      skipOpenMethod: false,
      autoOpenOptionsTab: false
    },
    generalSettings: {
      hideInsteadOfPIP: false
    },
    handledCallback: (evt) => {
      let result = {
        handled: evt.handled
      }

      if (evt.handled) {
        result.cmp = evt.cmpName
        result.clicks = evt.clicks
        result.url = url

        cookiesHandled = result
      } else if (evt.error) {
        cookiesHandled = 'CMPError'
      } else {
        cookiesHandled = 'NothingFound'
      }
      log(cookiesHandled)
    }
  })

  const {
    plausibleIsInitialized,
    plausibleIsOnWindow,
    plausibleVersion,
    plausibleVariant,
    testEvent,
    error: testPlausibleFunctionError
  } = await testPlausibleFunction({
    timeoutMs
  })

  if (testPlausibleFunctionError) {
    log(
      `There was an error testing plausible function: ${testPlausibleFunctionError}`
    )
  }

  stopRecording()

  const interceptedTestEvent = getInterceptedFetch('verification-agent-test')

  if (!interceptedTestEvent) {
    log(`No test event request was among intercepted requests`)
  }

  const diagnostics = {
    disallowedByCsp,
    plausibleIsOnWindow,
    plausibleIsInitialized,
    plausibleVersion,
    plausibleVariant,
    testEvent: {
      ...testEvent,
      requestUrl: interceptedTestEvent?.request?.url,
      normalizedBody: interceptedTestEvent?.request?.normalizedBody,
      responseStatus: interceptedTestEvent?.response?.status,
      error: interceptedTestEvent?.error
    },
    cookieBannerLikely: checkCookieBanner(),
    cookiesHandled
  }

  log({
    diagnostics
  })

  return {
    data: {
      completed: true,
      ...diagnostics
    }
  }
}

function getNormalizedPlausibleEventBody(fetchOptions) {
  try {
    const body = JSON.parse(fetchOptions.body ?? '{}')

    let name = null
    let domain = null
    let version = null

    if (
      fetchOptions.method === 'POST' &&
      (typeof body?.n === 'string' || typeof body?.name === 'string') &&
      (typeof body?.d === 'string' || typeof body?.domain === 'string')
    ) {
      name = body?.n || body?.name
      domain = body?.d || body?.domain
      version = body?.v || body?.version
    }
    return name && domain ? { name, domain, version } : null
  } catch (e) {}
}

function startRecordingEventFetchCalls() {
  const interceptions = new Map()

  const originalFetch = window.fetch
  window.fetch = function (url, options = {}) {
    let identifier = null

    const normalizedEventBody = getNormalizedPlausibleEventBody(options)
    if (normalizedEventBody) {
      identifier = normalizedEventBody.name
      interceptions.set(identifier, {
        request: { url, normalizedBody: normalizedEventBody }
      })
    }

    return originalFetch
      .apply(this, arguments)
      .then(async (response) => {
        const eventRequest = interceptions.get(identifier)
        if (eventRequest) {
          const responseClone = response.clone()
          const body = await responseClone.text()
          eventRequest.response = { status: response.status, body }
        }
        return response
      })
      .catch((error) => {
        const eventRequest = interceptions.get(identifier)
        if (eventRequest) {
          eventRequest.error = {
            message: error?.message || 'Unknown error during fetch'
          }
        }
        throw error
      })
  }
  return {
    getInterceptedFetch: (identifier) => interceptions.get(identifier),
    stopRecording: () => {
      window.fetch = originalFetch
    }
  }
}

function isPlausibleOnWindow() {
  return !!window.plausible
}

function isPlausibleInitialized() {
  return window.plausible?.l
}

function getPlausibleVersion() {
  return window.plausible?.v
}

function getPlausibleVariant() {
  return window.plausible?.s
}

async function testPlausibleFunction({ timeoutMs }) {
  return new Promise(async (_resolve) => {
    let plausibleIsOnWindow = isPlausibleOnWindow()
    let plausibleIsInitialized = isPlausibleInitialized()
    let plausibleVersion = getPlausibleVersion()
    let plausibleVariant = getPlausibleVariant()
    let testEvent = {}

    let resolved = false

    function resolve(additionalData) {
      resolved = true
      _resolve({
        plausibleIsInitialized,
        plausibleIsOnWindow,
        plausibleVersion,
        plausibleVariant,
        testEvent,
        ...additionalData
      })
    }

    const timeout = setTimeout(() => {
      resolve({
        error: 'Test Plausible function timeout exceeded'
      })
    }, timeoutMs)

    while (!plausibleIsOnWindow) {
      if (isPlausibleOnWindow()) {
        plausibleIsOnWindow = true
      }
      await delay(10)
    }

    while (!plausibleIsInitialized) {
      if (isPlausibleInitialized()) {
        plausibleIsInitialized = true
        plausibleVersion = getPlausibleVersion()
        plausibleVariant = getPlausibleVariant()
      }
      await delay(10)
    }

    window.plausible('verification-agent-test', {
      callback: (testEventCallbackResult) => {
        if (resolved) return
        clearTimeout(timeout)
        resolve({
          testEvent: { callbackResult: testEventCallbackResult }
        })
      }
    })
  })
}

function startConsentEngine({
  url,
  debugValues,
  generalSettings,
  config,
  consentTypes,
  handledCallback
}) {
  ConsentEngine.debugValues = debugValues
  ConsentEngine.generalSettings = generalSettings
  ConsentEngine.topFrameUrl = url

  let engine = new ConsentEngine(config, consentTypes, handledCallback)

  ConsentEngine.singleton = engine
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

window.verifyPlausibleInstallation = verifyPlausibleInstallation
