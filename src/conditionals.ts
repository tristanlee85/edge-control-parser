import toRegExp from './utils/toRegExp'
import toPathRegexp from './utils/toPathRegexp'

export const CONDITIONALS = {
  EQUALS_EXPRESS: '==',
  EQUALS: '===',
  AND: 'and',
  OR: 'or',
  NOT_EQUALS_EXPRESS: '!=',
  NOT_EQUALS: '!==',
  MATCHES: '=~',
  NOT_MATCHES: '!~',
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUALS: '>=',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUALS: '<=',
  IN: 'in',
  NOT_IN: 'not_in'
}

export const OPERATIONS: { [key: string]: (l: any, r: any) => boolean } = {
  [CONDITIONALS.EQUALS]: (l: any, r: any) => l === r,
  [CONDITIONALS.NOT_EQUALS]: (l: any, r: any) => l !== r,
  [CONDITIONALS.EQUALS_EXPRESS]: (l: any, r: any) => toPathRegexp(<string>r).test(l?.toString() ?? ''),
  [CONDITIONALS.NOT_EQUALS_EXPRESS]: (l: any, r: any) => !toPathRegexp(<string>r).test(l?.toString() ?? ''),
  [CONDITIONALS.LESS_THAN]: (l: any, r: any) => Number(l) < Number(r),
  [CONDITIONALS.LESS_THAN_OR_EQUALS]: (l: any, r: any) => Number(l) <= Number(r),
  [CONDITIONALS.GREATER_THAN]: (l: any, r: any) => Number(l) > Number(r),
  [CONDITIONALS.GREATER_THAN_OR_EQUALS]: (l: any, r: any) => Number(l) >= Number(r),
  [CONDITIONALS.MATCHES]: (l: any, r: any) => toRegExp(<string>r).test(l?.toString() ?? ''),
  [CONDITIONALS.NOT_MATCHES]: (l: any, r: any) => !toRegExp(<string>r).test(l?.toString() ?? ''),
  [CONDITIONALS.IN]: (l: any, r: any) => r?.some((item: string | number) => l?.toString() === item?.toString()),
  [CONDITIONALS.NOT_IN]: (l: any, r: any) =>
    !r?.some((item: string | number) => l?.toString() === item?.toString()),

  [CONDITIONALS.AND]: (ary:ConditionalMatch[], requestContext) => ary.every(c => c.evaluate(requestContext)),
  [CONDITIONALS.OR]: (ary:ConditionalMatch[], requestContext) => ary.some(c => c.evaluate(requestContext)),
}

export const CONDITIONAL_OPERANDS = new Set( Object.values(CONDITIONALS) )

export class ConditionalBase {}

export class ConditionalMatch extends ConditionalBase {
  private key
  private value

  static tag = ''

  constructor(obj) {
    super()

    this.key    = obj[0]
    this.value  = obj[1]
  }

  evaluate(requestContext) {
    const left    = requestContext.resolveKey(this.key)
    const right   = this.value
    const result  = OPERATIONS[this.constructor.tag](left, right)

    // console.log(">> Evaluating:")
    // console.log(">> TAG:", this.constructor.tag)
    // console.log(">> KEY:", this.key)
    // console.log(">> LEFT:", left)
    // console.log(">> RIGHT:", right)
    // console.log(">> RESULT", result)

    return result
  }
}

export class ConditionalGroup extends ConditionalBase {
  private values

  constructor(obj) {
    super()
    this.values = obj.flatMap((e) => Object.values(e))
  }

  evaluate(requestContext) {
    return OPERATIONS[this.constructor.tag](this.values, requestContext)
  }
}

export class ConditionalEqualsExpress extends ConditionalMatch {
  static tag = CONDITIONALS.EQUALS_EXPRESS
}

export class ConditionalEquals extends ConditionalMatch {
  static tag = CONDITIONALS.EQUALS
}

export class ConditionalAnd extends ConditionalGroup {
  static tag = CONDITIONALS.AND
}

export class ConditionalOr extends ConditionalGroup {
  static tag = CONDITIONALS.OR
}

export class ConditionalNotEqualsExpress extends ConditionalMatch {
  static tag = CONDITIONALS.NOT_EQUALS_EXPRESS
}

export class ConditionalNotEquals extends ConditionalMatch {
  static tag = CONDITIONALS.NOT_EQUALS
}

export class ConditionalMatches extends ConditionalMatch {
  static tag = CONDITIONALS.MATCHES
}

export class ConditionalNotMatches extends ConditionalMatch {
  static tag = CONDITIONALS.NOT_MATCHES
}

export class ConditionalGreaterThan extends ConditionalMatch {
  static tag = CONDITIONALS.GREATER_THAN
}

export class ConditionalGreaterThanOrEquals extends ConditionalMatch {
  static tag = CONDITIONALS.GREATER_THAN_OR_EQUALS
}

export class ConditionalLessThan extends ConditionalMatch {
  static tag = CONDITIONALS.LESS_THAN
}

export class ConditionalLessThanOrEquals extends ConditionalMatch {
  static tag = CONDITIONALS.LESS_THAN_OR_EQUALS
}

export class ConditionalIn extends ConditionalMatch {
  static tag = CONDITIONALS.IN
}

export class ConditionalNotIn extends ConditionalMatch {
  static tag = CONDITIONALS.NOT_IN
}

export const ConditionalLookup = {
  [CONDITIONALS.EQUALS_EXPRESS]: ConditionalEqualsExpress,
  [CONDITIONALS.EQUALS]: ConditionalEquals,
  [CONDITIONALS.AND]: ConditionalAnd,
  [CONDITIONALS.OR]: ConditionalOr,
  [CONDITIONALS.NOT_EQUALS_EXPRESS]: ConditionalNotEqualsExpress,
  [CONDITIONALS.NOT_EQUALS]: ConditionalNotEquals,
  [CONDITIONALS.MATCHES]: ConditionalMatches,
  [CONDITIONALS.NOT_MATCHES]: ConditionalNotMatches,
  [CONDITIONALS.GREATER_THAN]: ConditionalGreaterThan,
  [CONDITIONALS.GREATER_THAN_OR_EQUALS]: ConditionalGreaterThanOrEquals,
  [CONDITIONALS.LESS_THAN]: ConditionalLessThan,
  [CONDITIONALS.LESS_THAN_OR_EQUALS]: ConditionalLessThanOrEquals,
  [CONDITIONALS.IN]: ConditionalIn,
  [CONDITIONALS.NOT_IN]: ConditionalNotIn
}

export class ConditionalHelper {
  static isKeyConditional(key):boolean {
    return CONDITIONAL_OPERANDS.has(key)
  }

  static instanceByOperator(operator, value):ConditionalBase {
    return new ConditionalLookup[operator](value)
  }
}











