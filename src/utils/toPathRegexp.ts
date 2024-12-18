import { pathToRegexp } from 'path-to-regexp'
// import InvalidRoutePatternError from '../errors/InvalidRoutePatternError'

/**
 * Converts an express-style path string with optional variables to a RegExp instance.
 * @param path
 * @returns
 */
export default function toPathRegexp(path?: string): RegExp {
  /* istanbul ignore else */
  if (path) {
    try {
      return pathToRegexp(path)
    } catch (e) {
      // throw new InvalidRoutePatternError(path)
      // console.log(">> BORK:", e)
      // throw new Error(`Invalid Route Pattern: ${path}`)
      console.log(">> Invalid route pattern", path)
      throw e
    }
  } else {
    // For fallbacks we want everything matched so that we can replace everything if needed.
    // We insist on total matching with `^` and `$` because some regex replacement algorithms
    // have issues with correctly applying `.*` in completely greedy manner (e.g. Fastly's `regsuball`)
    return /^.*$/
  }
}
