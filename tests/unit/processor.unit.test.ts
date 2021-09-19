jest.mock("../../src/table-interactor")
import TableInteractor from "../../src/table-interactor"; 
import Processor from "../../src/processor";
import { SQSRecord, SQSEvent } from "aws-lambda";

describe("", () => {
    const TableInteractorMock = <jest.Mock<TableInteractor>>TableInteractor

    let sut: Processor;  // subject under test
    let mockTableInteractor: TableInteractor;

    beforeEach(() => {
        mockTableInteractor = new TableInteractorMock()
        sut = new Processor(mockTableInteractor);
    })

    test("Create pending user when phone is not found in database", () => {
        // given
        mockTableInteractor.userAlreadyExists = jest.fn(() => { return false; })
        const fakeSqsEvent: SQSEvent = {
            Records: [getMockSqsRecord(`{
                "mobile": "12345678910" 
            }`)]
        }
        
        // when
        sut.process(fakeSqsEvent);
        
        // then
        expect(mockTableInteractor.userAlreadyExists).toHaveBeenCalledWith("12345678910")
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