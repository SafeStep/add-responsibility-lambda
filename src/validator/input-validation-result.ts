import { Service } from "typedi";
import * as config from "../config.json"

@Service()
export default class InputValidationRules {
    private rules: InputValidationRule[]; 

    constructor() {
        this.rules = config.inputRules;
    }

    getRules() : InputValidationRule[]{
        return this.rules;
    }
}