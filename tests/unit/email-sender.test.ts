import 'reflect-metadata'
import EmailSender from "../../src/email-sender"
import { SES } from "aws-sdk"
import Container from "typedi"

describe("Email Sender", () => {

    var mockSES: SES

    beforeAll(() => {
        Container.set("aws_region", "eu-west-1")
        Container.set("email_template_name", "wibble")
        Container.set("email_source", "myfaveemail@safe-step.net")
        
        mockSES = new SES();
        Container.set(SES, mockSES);
    });

    afterAll(() => {
        Container.remove("aws_region");
        Container.remove("email_template_name");
        Container.remove("email_source");
    })

    it("Should send an email if a valid new responsibility is passed", async () => {
        // given

        //@ts-ignore
        mockSES.sendTemplatedEmail = jest.fn(() => {
            return {
                promise: () => {
                    return new Promise((resolve, reject) => {
                        //@ts-ignore
                        resolve({
                            MessageId: "123"
                        });
                    })
                }
            }
        })

        const responsibility = {
            ECID: "an-ecid",
            RID: "NTcyNTdlYTktYWQ1ZS00NWNhLWEwZDAtMTZlNjA2OTUzODZl",
            greenId: "a-green-users-id"
        }
        
        const EC = {
            f_name: "John",
            email: "john.smith@yahoo.com"
        }
        // when
        let sut = Container.get(EmailSender)
        await sut.sendEmail(responsibility, EC);
        
        // then
        expect(mockSES.sendTemplatedEmail).toHaveBeenCalledWith({
            Source: "myfaveemail@safe-step.net",
            Destination: {
                ToAddresses: [
                    "john.smith@yahoo.com"
                ],
            },
            Template: "wibble",
            TemplateData: `{
                "greenName": "%FIRST_NAME_STILL_NEEDS_FETCHING%",
                "ecName": "John",
                "RID": "NTcyNTdlYTktYWQ1ZS00NWNhLWEwZDAtMTZlNjA2OTUzODZl"
            }`.replace(/\s/g, "")
        });
    })
})