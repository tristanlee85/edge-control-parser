export class Rule {
  private _conditions
  private _features

  constructor(conditions, features) {
    this._conditions = conditions
    this._features   = features
  }

  evaluate(requestContext) {
    return Object.values(this._conditions).map((c) => c.evaluate(requestContext)).every(Boolean)
  }

  get features() {
    return this._features
  }
}

export class AlwaysRule extends Rule {
  constructor(features) {
    super(null, features)
  }

  evaluate(requestContext) {
    return true
  }
}

export class RuleHelper {
  static revive(value, context) {
    let [condition, features] = value
    return new Rule(condition, features)
  }
}