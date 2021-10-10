import 'reflect-metadata';
import { Inject, Service } from "typedi";
import { config, SES } from "aws-sdk"

@Service()
export default class EmailSender {
    @Inject("aws_region")
    private readonly awsRegion!: string
    @Inject("email_template_name")
    private readonly emailTemplateName!: string
    @Inject("email_source")
    private readonly emailSource!: string
    @Inject()
    private emailService!: SES

    constructor() {
        config.update({
            region: this.awsRegion
        });
    }

    async sendEmail(responsibility: Responsibility) {
        try {
            await this.emailService.sendTemplatedEmail({
                Source: this.emailSource,
                Destination: {
                    ToAddresses: [
                        "the-email-of-the-ec"
                    ],
                },
                Template: this.emailTemplateName,
                TemplateData: `{
                    "greenName": "%FIRST_NAME_STILL_NEEDS_FETCHING%",
                    "RID": "${responsibility.RID}"
                }`.replace(/\s/g, "")  // removes any whitespace/newlines
            }).promise();
        }
        catch (e) {
            console.error(e);
            console.error(`failed to send email for RID ${responsibility.RID}`)
        }
    }
}