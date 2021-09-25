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

    async process(event: SQSEvent) {
        for (const record of event.Records) {
            let jsonBody = JSON.parse(record.body);
            const validInputs = this.validator.validate(new Map(Object.entries(jsonBody)))

            if (!validInputs.passed) {
                console.error([...validInputs.individualResults].filter(([k,v]) => {return !v.passed}));  // output all the values that failed
                throw new Error("Inputs did not pass validation")
            }

            const greenId = jsonBody.greenId;
            delete jsonBody.greenId;  // remove the greenId from the jsonbody
            const EC: User = jsonBody;

            const userAlreadyExists = await this.tableInteractor.userAlreadyExists(jsonBody);
            if (userAlreadyExists) {
                throw new Error("Not implemented")
            }
            else {
                this.tableInteractor.createUserWithResponsibility(EC, greenId);
            }
        };
    }
}