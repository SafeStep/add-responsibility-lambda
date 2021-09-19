interface InputValidationRules {
    name: String,
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