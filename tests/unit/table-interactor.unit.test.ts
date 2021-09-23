import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AWSError, Request } from "aws-sdk";
import TableInteractor from "../../src/table-interactor";

describe("Table Interactor class tests", () => {
    let sut: TableInteractor;  // subject under test

    describe("User exists method tests", () => {
        test("Create pending user when phone is not found in database", () => {
            // given

            // jest.mock('aws-sdk/clients/dynamodb', () => {
            //     // Works and lets you check for constructor calls:
            //     return {
            //       DocumentClient: jest.fn().mockImplementation(() => {
            //         return {get: () => {return {
            //             promise: () => {console.log("hello world")}
            //         }}};
            //       }),
            //     };
            // });

            let mockDocumentClient = new DocumentClient();
            //@ts-ignore
            mockDocumentClient.get = () => {return new Promise((resolve, reject) => {
                //@ts-ignore
                resolve({
                    Item: undefined
                })
            })}

            sut = new TableInteractor(mockDocumentClient);

            // mockDocumentClient.get = jest.fn().mockReturnValue(mockRequest);
            // mockRequest.promise = jest.fn().mockReturnValue(new Promise((resolve, reject) => {  // throw an exception
            //     resolve({Item: {
            //          email: "user-exists"
            //     }})
            // }));
            // when
    
            sut.userAlreadyExists("12345678910");
            // then
        });
    })
});