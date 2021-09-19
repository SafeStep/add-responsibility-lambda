import TableInteractor from "./table-interactor";
import Validator from "./validator"
import { SQSEvent } from "aws-lambda";
import { Service } from "typedi"
import * as config from "./config.json"

@Service()
export default class Processor {
    constructor (
        private tableInteractor: TableInteractor,
        private validator: Validator
    ) {}

    process(event: SQSEvent) {
        event.Records.forEach(record => {
            const jsonBody = JSON.parse(record.body);
            const validInputs = this.validator.validate(new Map(Object.entries(jsonBody)), config.inputs)
            const userAlreadyExists = this.tableInteractor.userAlreadyExists(jsonBody.mobile);
            console.log(userAlreadyExists);
        });
    }
}