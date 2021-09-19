jest.mock("../../src/table-interactor")
import TableInteractor from "../../src/table-interactor"; 
import Validator from "../../src/validator";
import Processor from "../../src/processor";
import { SQSRecord, SQSEvent } from "aws-lambda";
import { when } from 'jest-when'

describe("", () => {
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

    test("Create pending user when phone is not found in database", () => {
        // given
        mockValidator.validate = () => {return {passed: true, individualResults: new Map()}};
        //when(mockValidator.validate).calledWith(new Map<String, String>(), [{name: "123", required: false}]).mockReturnValue({passed: true, individualResults: new Map()});
        when(mockTableInteractor.userAlreadyExists).calledWith(expect.any(String)).mockReturnValue(false);

        const fakeSqsEvent: SQSEvent = {
            Records: [getMockSqsRecord(`{
                "mobile": "12345678910",
                "f_name": "John",
                "email": "john.smith@gmail.com",
                "greenId": "12345678-1234-1234-1234-123456789123"
            }`)]
        }
        
        // when
        sut.process(fakeSqsEvent);
        
        // then
        expect(mockTableInteractor.userAlreadyExists).toHaveBeenCalledWith("12345678910")
        expect(mockValidator.validate).toHaveBeenCalledWith(new Map(Object.entries({
            mobile: "123456789",
            f_name: "John",
            email: "john.smith@gmail.com",
            greenId: "12345678-1234-1234-1234-123456789123"
        })));
    });

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