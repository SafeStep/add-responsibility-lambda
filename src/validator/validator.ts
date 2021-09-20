import { Service } from "typedi";
import InputValidationRules from "./input-validation-result";

@Service()
export default class Validator {
    
    constructor(
        private rules: InputValidationRules
    ){};

    public validate(inputs: Map<String, String>): ValidationResult {
        let individualResults: Map<String, InputValidationResult> = new Map(); 
        this.rules.getRules().forEach(inputRules => {
            let errors = [] as string[];

            const actualInput = inputs.get(inputRules.name);

            if (undefined === actualInput || actualInput.length === 0 || !actualInput.trim()) {
                if (!inputRules.required) {
                    return // not required therefore just carry on in the loop
                }
                else { 
                    individualResults.set(inputRules.name, {passed: false, errors:["is required but not provided"]});
                    return  // exit early as all other fields will fail 
                }
            }

            // the input has been specified


            if (undefined !== inputRules.max_length && !(actualInput.length <= inputRules.max_length)) errors.push(`exceeded max length of ${inputRules.max_length}`);

            if (undefined !== inputRules.min_length && !(actualInput.length >= inputRules.min_length)) errors.push(`failed to meet min length of ${inputRules.min_length}`);

            if (undefined !== inputRules.regex && !(actualInput.match(inputRules.regex))) errors.push(`did not satisfy regex ${inputRules.regex}`);

            individualResults.set(inputRules.name, {
                passed: errors.length === 0,
                errors: errors
            })
        });
        
        const passed = [...individualResults].filter(([key, value]) => value.errors.length > 0).length === 0

        return {
            passed: passed,
            individualResults: individualResults
        };
    }
}