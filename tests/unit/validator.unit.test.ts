import Validator from "../../src/validator";

test("All rules passed on input", () => {
    const sut = new Validator();
    const rules = [{
       name: "wibble",
       min_length: 1,
       max_length: 10,
       required: true,
       regex: "(.|\\s)*\\S(.|\\s)*"
    }]

    const inputMap = new Map<String, String>();
    inputMap.set("wibble", "abc");
    const result = sut.validate(inputMap, rules);

    expect(result.passed).toBe(true);
    expect(result.individualResults.get("wibble")!.passed).toBe(true);
    expect(result.individualResults.get("wibble")!.errors).toHaveLength(0);
});

test("Regex is not satisfied", () => {
    const sut = new Validator();
    const rules = [{
       name: "wibble",
       required: true,
       regex: "^(((\\+44\\s?\\d{4}|\\(?0\\d{4}\\)?)\\s?\\d{3}\\s?\\d{3})|((\\+44\\s?\\d{3}|\\(?0\\d{3}\\)?)\\s?\\d{3}\\s?\\d{4})|((\\+44\\s?\\d{2}|\\(?0\\d{2}\\)?)\\s?\\d{4}\\s?\\d{4}))(\\s?\\#(\\d{4}|\\d{3}))?$"
    }]

    const inputMap = new Map<String, String>();
    inputMap.set("wibble", "abc");
    const result = sut.validate(inputMap, rules);

    expect(result.passed).toBe(false);
    const individualResult = result.individualResults.get("wibble")
    expect(individualResult!.passed).toBe(false);
    expect(individualResult!.errors).toHaveLength(1);
    expect(individualResult!.errors).toContain(`did not satisfy regex ${rules[0].regex}`);
});

test("Min length is not satisfied", () => {
    const sut = new Validator();
    const rules = [{
       name: "wibble",
       min_length: 8,
       required: true,
    }]

    const inputMap = new Map<String, String>();
    inputMap.set("wibble", "abc");
    const result = sut.validate(inputMap, rules);

    expect(result.passed).toBe(false);
    const individualResult = result.individualResults.get("wibble")
    expect(individualResult!.passed).toBe(false);
    expect(individualResult!.errors).toHaveLength(1);
    expect(individualResult!.errors).toContain(`failed to meet min length of ${rules[0].min_length}`)
});

test("Max length is not satisfied", () => {
    const sut = new Validator();
    const rules = [{
       name: "wibble",
       max_length: 8,
       required: true,
    }]
    const inputMap = new Map<String, String>();
    inputMap.set("wibble", "wibblewobbly");
    const result = sut.validate(inputMap, rules);

    expect(result.passed).toBe(false);
    const individualResult = result.individualResults.get("wibble")
    expect(individualResult!.passed).toBe(false);
    expect(individualResult!.errors).toHaveLength(1);
    expect(individualResult!.errors).toContain(`exceeded max length of ${rules[0].max_length}`)
});

test("Value is not defined on required input", () => {
    const sut = new Validator();
    const rules = [{
       name: "wibble",
       required: false,
    }]
    const inputMap = new Map<String, String>();
    const result = sut.validate(inputMap, rules);

    expect(result.passed).toBe(true);
});