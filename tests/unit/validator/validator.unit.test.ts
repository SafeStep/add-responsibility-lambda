
import InputValidationRules from "../../../src/validator/input-validation-result";
import Validator from "../../../src/validator/validator";

describe("", () => {
    const InputValidationRulesMock = <jest.Mock<InputValidationRules>>InputValidationRules
    let mockInputValidationRules: InputValidationRules;
    beforeEach(() => {
        mockInputValidationRules = new InputValidationRulesMock();
    });

    test("All rules passed on input", () => {
        // given
        const rules = [{
           name: "wibble",
           min_length: 1,
           max_length: 10,
           required: true,
           regex: "(.|\\s)*\\S(.|\\s)*"
        }]

        mockInputValidationRules.getRules = jest.fn().mockReturnValue(rules);
        const sut = new Validator(mockInputValidationRules);
        const inputMap = new Map<String, String>();
        inputMap.set("wibble", "abc");

        // when
        const result = sut.validate(inputMap);
    
        // then 
        expect(result.passed).toBe(true);
        expect(result.individualResults.get("wibble")!.passed).toBe(true);
        expect(result.individualResults.get("wibble")!.errors).toHaveLength(0);
    });
    
    test("Regex is not satisfied", () => {
        // given
        const rules = [{
           name: "wibble",
           required: true,
           regex: "^(((\\+44\\s?\\d{4}|\\(?0\\d{4}\\)?)\\s?\\d{3}\\s?\\d{3})|((\\+44\\s?\\d{3}|\\(?0\\d{3}\\)?)\\s?\\d{3}\\s?\\d{4})|((\\+44\\s?\\d{2}|\\(?0\\d{2}\\)?)\\s?\\d{4}\\s?\\d{4}))(\\s?\\#(\\d{4}|\\d{3}))?$"
        }]
        mockInputValidationRules.getRules = jest.fn().mockReturnValue(rules);
        const sut = new Validator(mockInputValidationRules);
        const inputMap = new Map<String, String>();
        inputMap.set("wibble", "abc");
        
        // when
        const result = sut.validate(inputMap);
    

        // then
        expect(result.passed).toBe(false);
        const individualResult = result.individualResults.get("wibble")
        expect(individualResult!.passed).toBe(false);
        expect(individualResult!.errors).toHaveLength(1);
        expect(individualResult!.errors).toContain(`did not satisfy regex ${rules[0].regex}`);
    });
    
    test("Min length is not satisfied", () => {
        // given
        const rules = [{
           name: "wibble",
           min_length: 8,
           required: true,
        }]
        mockInputValidationRules.getRules = jest.fn().mockReturnValue(rules);
        const sut = new Validator(mockInputValidationRules);
        const inputMap = new Map<String, String>();
        inputMap.set("wibble", "abc");

        // when
        const result = sut.validate(inputMap)
    
        // then
        expect(result.passed).toBe(false);
        const individualResult = result.individualResults.get("wibble")
        expect(individualResult!.passed).toBe(false);
        expect(individualResult!.errors).toHaveLength(1);
        expect(individualResult!.errors).toContain(`failed to meet min length of ${rules[0].min_length}`)
    });
    
    test("Max length is not satisfied", () => {
        // given
        const rules = [{
           name: "wibble",
           max_length: 8,
           required: true,
        }]
        mockInputValidationRules.getRules = jest.fn().mockReturnValue(rules);
        const sut = new Validator(mockInputValidationRules);
        const inputMap = new Map<String, String>();
        inputMap.set("wibble", "wibblewobbly");
        
        // when
        const result = sut.validate(inputMap);

        // then
        expect(result.passed).toBe(false);
        const individualResult = result.individualResults.get("wibble")
        expect(individualResult!.passed).toBe(false);
        expect(individualResult!.errors).toHaveLength(1);
        expect(individualResult!.errors).toContain(`exceeded max length of ${rules[0].max_length}`)
    });
    
    test("Value is not defined on required input", () => {
        // given 
        const rules = [{
           name: "wibble",
           required: false,
        }]
        mockInputValidationRules.getRules = jest.fn().mockReturnValue(rules);
        const sut = new Validator(mockInputValidationRules);
        const inputMap = new Map<String, String>();

        // when
        const result = sut.validate(inputMap);
    
        // then
        expect(result.passed).toBe(true);
    });

    test("Validation is carried out on non required input if it is specified", () => {
        // given 
        const rules = [{
            name: "wibble",
            required: false,
            min_length: 4,
         }]
         mockInputValidationRules.getRules = jest.fn().mockReturnValue(rules);
         const sut = new Validator(mockInputValidationRules);
         const inputMap = new Map<String, String>();
         inputMap.set("wibble", "a");
 
         // when
         const result = sut.validate(inputMap);
     
         // then
         expect(result.passed).toBe(false);
         expect(result.individualResults.get("wibble")!.passed).toBe(false);
    })
})
