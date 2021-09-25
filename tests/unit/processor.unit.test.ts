import TableInteractor from "../../src/table-interactor"; 
import Validator from "../../src/validator/validator";
import Processor from "../../src/processor";
import { SQSRecord, SQSEvent } from "aws-lambda";
import Container from "typedi";

describe("Processor class tests", () => {
    const TableInteractorMock = <jest.Mock<TableInteractor>>TableInteractor
    const ValidatorMock = <jest.Mock<Validator>>Validator;

    let sut: Processor;  // subject under test
    let mockTableInteractor: TableInteractor;
    let mockValidator: Validator;

    beforeEach(() => {
        mockTableInteractor = new TableInteractorMock()
        mockValidator = new ValidatorMock();
        sut = new Processor(mockTableInteractor, mockValidator);
    })

    test("Create pending user when phone is not found in database", async () => {
        // given
        mockValidator.validate = jest.fn().mockReturnValue({passed: true, individualResults: new Map()})
        mockTableInteractor.getEcid = jest.fn().mockReturnValue("");
        mockTableInteractor.createUserWithResponsibility = jest.fn();

        const fakeSqsEvent: SQSEvent = {
            Records: [getMockSqsRecord(`{
                "mobile": "12345678910",
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
            mobile: "12345678910",
            dialing_code: 1,
            f_name: "John",
            email: "john.smith@gmail.com",
            greenId: "12345678-1234-1234-1234-123456789123"
        })));
        expect(mockTableInteractor.getEcid).toHaveBeenCalledWith({
            mobile: "12345678910",
            dialing_code: 1,
            f_name: "John",
            email: "john.smith@gmail.com",
        })
        expect(mockTableInteractor.createUserWithResponsibility).toHaveBeenCalledWith({
            mobile: "12345678910",
            dialing_code: 1,
            f_name: "John",
            email: "john.smith@gmail.com",
        }, "12345678-1234-1234-1234-123456789123");
        
    });

    test("Add responsibility to already existing user", async () => {
        // given
        mockValidator.validate = jest.fn().mockReturnValue({passed: true, individualResults: new Map()})
        mockTableInteractor.getEcid = jest.fn().mockReturnValue("c2ca44a9-f658-45dc-933c-038d0425a847");
        mockTableInteractor.createResponsibility = jest.fn();

        const fakeSqsEvent: SQSEvent = {
            Records: [getMockSqsRecord(`{
                "mobile": "12345678910",
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
            mobile: "12345678910",
            dialing_code: 1,
            f_name: "John",
            email: "john.smith@gmail.com",
            greenId: "12345678-1234-1234-1234-123456789123"
        })));
        expect(mockTableInteractor.getEcid).toHaveBeenCalledWith({
            mobile: "12345678910",
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
                "mobile": "12345678910",
                "f_name": "John",
                "email": "john.smith@gmail.com",
                "greenId": "12345678-1234-1234-1234-123456789123"
            }`)]
        }
        
        // when
        await expect(sut.process(fakeSqsEvent)).rejects.toThrow("Inputs did not pass validation")
        
        // then
        expect(mockValidator.validate).toHaveBeenCalledWith(new Map(Object.entries({
            mobile: "12345678910",
            f_name: "John",
            email: "john.smith@gmail.com",
            greenId: "12345678-1234-1234-1234-123456789123"
        })));
        expect(mockTableInteractor.getEcid).toBeCalledTimes(0)
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