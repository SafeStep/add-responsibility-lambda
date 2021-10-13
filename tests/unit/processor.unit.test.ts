import TableInteractor from "../../src/table-interactor"; 
import Validator from "../../src/validator/validator";
import Processor from "../../src/processor";
import EmailSender from "../../src/email-sender";
import { SQSRecord, SQSEvent } from "aws-lambda";
import Container from "typedi";
import InputValidationRules from "../../src/validator/input-validation-result";

describe("Processor class tests", () => {
    let sut: Processor;  // subject under test
    let mockTableInteractor: TableInteractor;
    let mockValidator: Validator;
    let mockEmailSender: EmailSender;

    beforeAll(() => {
        mockTableInteractor = new TableInteractor("ec_store_name", "resp_store_name")
        mockValidator = new Validator({} as InputValidationRules);
        mockEmailSender = new EmailSender();

        mockTableInteractor.createResponsibility = jest.fn();
        mockTableInteractor.createUserWithResponsibility = jest.fn()
        mockTableInteractor.executeInsertions = jest.fn();
    })

    beforeEach(() => {
        Container.set(EmailSender, mockEmailSender);
        Container.set(TableInteractor, mockTableInteractor);
        Container.set(Validator, mockValidator);
        sut = Container.get(Processor)
    })

    afterAll(() => {
        Container.remove(EmailSender);
        Container.remove(TableInteractor);
        Container.remove(Validator);
    })

    test("Create pending user when phone is not found in database", async () => {
        // given
        mockValidator.validate = jest.fn().mockReturnValue({passed: true, individualResults: new Map()})
        mockTableInteractor.getEcid = jest.fn().mockReturnValue("");
        mockTableInteractor.createUserWithResponsibility = jest.fn().mockReturnValue(["123", "321"]);
        mockEmailSender.sendEmail = jest.fn();

        const fakeSqsEvent: SQSEvent = {
            Records: [getMockSqsRecord(`{
                "phone": "12345678910",
                "dialing_code": 1,
                "f_name": "John",
                "email": "john.smith@gmail.com",
                "greenId": "12345678-1234-1234-1234-123456789123"
            }`)]
        }
        
        // when
        await sut.process(fakeSqsEvent);
        
        // then
        expect(mockValidator.validate).toHaveBeenCalledWith(new Map(Object.entries({
            phone: "12345678910",
            dialing_code: 1,
            f_name: "John",
            email: "john.smith@gmail.com",
            greenId: "12345678-1234-1234-1234-123456789123"
        })));
        expect(mockTableInteractor.getEcid).toHaveBeenCalledWith({
            phone: "12345678910",
            dialing_code: 1,
            f_name: "John",
            email: "john.smith@gmail.com",
        })
        expect(mockTableInteractor.createUserWithResponsibility).toHaveBeenCalledWith({
            phone: "12345678910",
            dialing_code: 1,
            f_name: "John",
            email: "john.smith@gmail.com",
        }, "12345678-1234-1234-1234-123456789123")
        expect(mockTableInteractor.executeInsertions).toHaveBeenCalled();
        expect(mockEmailSender.sendEmail).toHaveBeenCalledTimes(1)
        expect(mockEmailSender.sendEmail).toHaveBeenCalledWith({
            ECID: "321",
            RID: "123",
            greenId: "12345678-1234-1234-1234-123456789123"
        }, {
            phone: "12345678910",
            dialing_code: 1,
            f_name: "John",
            email: "john.smith@gmail.com",
        })
    });

    test("Add responsibility to already existing user", async () => {
        // given
        mockValidator.validate = jest.fn().mockReturnValue({passed: true, individualResults: new Map()})
        mockTableInteractor.getEcid = jest.fn().mockReturnValue("c2ca44a9-f658-45dc-933c-038d0425a847");

        const fakeSqsEvent: SQSEvent = {
            Records: [getMockSqsRecord(`{
                "phone": "12345678910",
                "dialing_code": 1,
                "f_name": "John",
                "email": "john.smith@gmail.com",
                "greenId": "12345678-1234-1234-1234-123456789123"
            }`)]
        }
        
        // when
        await sut.process(fakeSqsEvent);
        
        // then
        expect(mockValidator.validate).toHaveBeenCalledWith(new Map(Object.entries({
            phone: "12345678910",
            dialing_code: 1,
            f_name: "John",
            email: "john.smith@gmail.com",
            greenId: "12345678-1234-1234-1234-123456789123"
        })));
        expect(mockTableInteractor.getEcid).toHaveBeenCalledWith({
            phone: "12345678910",
            dialing_code: 1,
            f_name: "John",
            email: "john.smith@gmail.com",
        })
        expect(mockTableInteractor.createResponsibility).toHaveBeenCalledWith("c2ca44a9-f658-45dc-933c-038d0425a847", "12345678-1234-1234-1234-123456789123");
    });

    test("Exception is thrown if inputs are invalid", async () => {
        // given
        mockValidator.validate = jest.fn().mockReturnValue({passed: false, individualResults: new Map()})
        mockTableInteractor.getEcid = jest.fn();

        const fakeSqsEvent: SQSEvent = {
            Records: [getMockSqsRecord(`{
                "phone": "12345678910",
                "f_name": "John",
                "email": "john.smith@gmail.com",
                "greenId": "12345678-1234-1234-1234-123456789123"
            }`)]
        }
        
        // when
        const rejectedMessages = await sut.process(fakeSqsEvent)
        
        // then
        expect(rejectedMessages).toHaveLength(1)
        expect(mockValidator.validate).toHaveBeenCalledWith(new Map(Object.entries({
            phone: "12345678910",
            f_name: "John",
            email: "john.smith@gmail.com",
            greenId: "12345678-1234-1234-1234-123456789123"
        })));
        expect(mockTableInteractor.getEcid).toHaveBeenCalledTimes(0)
    })

    test("Insert valid inputs and not invalid ones", async () => {
        // given
        mockValidator.validate = jest.fn()
        .mockReturnValueOnce({passed: false, individualResults: new Map()})
        .mockReturnValueOnce({passed: true, individualResults: new Map()})
        mockTableInteractor.getEcid = jest.fn();

        const fakeSqsEvent: SQSEvent = {
            Records: [
                getMockSqsRecord(`{
                    "phone": "12345678910",
                    "f_name": "John",
                    "email": "john.smith@gmail.com",
                    "greenId": "12345678-1234-1234-1234-123456789123"
                }`),
                getMockSqsRecord(`{
                    "phone": "10987654321",
                    "f_name": "Alice",
                    "email": "alice.smith@gmail.com",
                    "greenId": "87654321-4321-4321-4321-987654321321"
                }`),
            ]
        }
        
        // when
        const rejectedMessages = await sut.process(fakeSqsEvent)
        
        // then
        expect(mockValidator.validate).toHaveBeenCalledWith(new Map(Object.entries({
            phone: "12345678910",
            f_name: "John",
            email: "john.smith@gmail.com",
            greenId: "12345678-1234-1234-1234-123456789123"
        })));
        expect(rejectedMessages).toHaveLength(1)
        expect(mockTableInteractor.getEcid).toHaveBeenCalledTimes(1)
    })
})

const getMockSqsRecord = (message: string): SQSRecord => {
    const record: SQSRecord = {
        messageId: "",
        receiptHandle: "",
        body: message,
        attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: ""
        },
        messageAttributes: {},
        md5OfBody: "",
        eventSource: "",
        eventSourceARN: "",
        awsRegion: ""
    }

    return record;
}