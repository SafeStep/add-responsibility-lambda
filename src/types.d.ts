interface InputValidationRule {
    name: string,
    required: boolean,
    min_length?: number,
    max_length?: number,
    regex?: string
}
interface InputValidationResult {
    passed: boolean,
    errors: string[]
}

interface ValidationResult {
    passed: boolean,
    individualResults: Map<String, InputValidationResult>
}

interface User {
    mobile?: string,
    dialing_code?: string,
    f_name: string,
    email: string,
}

interface Responsibility {
    ECID: string,
    RID: string,
    greenId: string
}