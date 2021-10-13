import TableInteractor from "./table-interactor";
import Validator from "./validator/validator"
import EmailSender from "./email-sender";
import { SQSEvent, SQSRecord} from "aws-lambda";
import { Inject, Service } from "typedi"

@Service()
export default class Processor {
    @Inject()
    private tableInteractor!: TableInteractor
    @Inject()
    private validator!: Validator
    @Inject()
    private emailSender!: EmailSender

    async process(event: SQSEvent): Promise<SQSRecord[]> {
        let rejectedMessages: SQSRecord[] = [];
        let emailsToSend: InviteEmail[] = [];
        for (const record of event.Records) {
            let jsonBody = JSON.parse(record.body);
            const validInputs = this.validator.validate(new Map(Object.entries(jsonBody)))

            if (!validInputs.passed) {
                console.error([...validInputs.individualResults].filter(([k,v]) => {return !v.passed}));  // output all the values that failed
                rejectedMessages.push(record);
                continue
            }

            const greenId = jsonBody.greenId;
            delete jsonBody.greenId;  // remove the greenId from the jsonbody
            const EC: User = jsonBody;

            console.log("passed validation");
            console.log(`creating responsibility for user with id ${greenId}`)

            let ECID = await this.tableInteractor.getEcid(jsonBody);
            let RID;
            if (ECID === "") {
                [RID, ECID] = this.tableInteractor.createUserWithResponsibility(EC, greenId);
            }
            else {
                RID = this.tableInteractor.createResponsibility(ECID, greenId);
            }
            emailsToSend.push({resp: {
                ECID: ECID,
                RID: RID,
                greenId: greenId
            }, EC: EC})
        };
        await this.tableInteractor.executeInsertions();  // add the contents to the dynamodb in one batch run
        emailsToSend.forEach(async email => {
            await this.emailSender.sendEmail(email.resp, email.EC)
        });

        console.log("Rejected messages the following:")
        console.log(rejectedMessages);
        return rejectedMessages;
    }
}