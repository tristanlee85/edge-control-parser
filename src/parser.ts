import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConditionalHelper } from './conditionals';
import { Rule, AlwaysRule, RuleHelper } from './rules';

export class EdgeControlParser {
	private _path: string;
	// private _file: BunFile;

	constructor(path: string) {
		this._path = resolve(path);

		if (!existsSync(this._path)) {
			throw new Error(`File not found: ${this._path}`);
		}

		// this._file = file(this._path);
	}

	async parse() {
		const text = readFileSync(this._path, 'utf-8');

		const { rules } = JSON.parse(text, EdgeControlParser.JSONReviver);

		return {
			rules: rules.map((r: Rule | string) => {
				return r instanceof Rule ? r : new AlwaysRule(r);
			}),
		};
	}

	static reviveConditional(key, value, context) {
		return ConditionalHelper.instanceByOperator(key, value);
	}

	static reviveRule(value, context) {
		return RuleHelper.revive(value, context);
	}

	static JSONReviver(key, value, context) {
		// console.log(">> REVIVING:", key)

		if (ConditionalHelper.isKeyConditional(key)) return EdgeControlParser.reviveConditional(key, value, context);

		if (key === 'if') return EdgeControlParser.reviveRule(value, context);

		if (value['if'] instanceof Rule) return value['if'];

		if (typeof value === 'string') {
			if (/^true$/.test(value)) return true;

			if (/^false$/.test(value)) return false;

			if (/^\d+$/.test(value)) {
				return parseInt(value);
			}
		}

		return value;
	}
}
