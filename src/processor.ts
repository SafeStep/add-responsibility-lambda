import TableInteractor from "./table-interactor";
import { SQSEvent } from "aws-lambda";
import { Service } from "typedi"

@Service()
export default class Processor {
    constructor (
        private tableInteractor: TableInteractor
    ) {}

    process(event: SQSEvent) {
        event.Records.forEach(record => {
            const jsonBody = JSON.parse(record.body);
            const userAlreadyExists = this.tableInteractor.userAlreadyExists(jsonBody.mobile);
        });
    }
}