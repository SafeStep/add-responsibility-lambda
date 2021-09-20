import TableInteractor from "./table-interactor";
import Validator from "./validator/validator"
import { SQSEvent } from "aws-lambda";
import { Service } from "typedi"

@Service()
export default class Processor {
    constructor (
        private tableInteractor: TableInteractor,
        private validator: Validator
    ) {}

    process(event: SQSEvent) {
        event.Records.forEach(record => {  // for each value from the queue
            const jsonBody = JSON.parse(record.body);
            const validInputs = this.validator.validate(new Map(Object.entries(jsonBody)))

            if (!validInputs.passed) {
                console.error([...validInputs.individualResults].filter(([k,v]) => {return !v.passed}));  // output all the values that failed
                throw "Inputs did not pass validation"
            }

            const userAlreadyExists = this.tableInteractor.userAlreadyExists(jsonBody.mobile);
        });
    }
}