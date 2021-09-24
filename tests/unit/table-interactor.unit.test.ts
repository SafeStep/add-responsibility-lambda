import 'reflect-metadata';
import { DocumentClient, QueryInput } from "aws-sdk/clients/dynamodb";
import TableInteractor from "../../src/table-interactor";
import Container from "typedi";

describe("Table Interactor class tests", () => {
    let sut: TableInteractor;  // subject under test

    const EC_TABLE_NAME = "example_table_name";
    const EC_TABLE_MOBILE_INDEX = "example_mobile_index";

    var mockDocumentClient = new DocumentClient();

    beforeAll(() => {
        Container.set("aws_region", "");
        Container.set("db_endpoint", "");
        Container.set("ec_table_name", EC_TABLE_NAME);
        Container.set("ec_mobile_index", EC_TABLE_MOBILE_INDEX);

        Container.set(DocumentClient, mockDocumentClient);
    });

    afterAll(() => {
        Container.remove("aws_region");
        Container.remove("db_endpoint");
        Container.remove("ec_table_name");
        Container.remove("ec_mobile_index");
    })

    describe("User exists method tests", () => {
        it("should return true user already exists in ec store", async () => {
            // given
            //@ts-ignore ignore this because it will not perfectly match the object
            mockDocumentClient.query = jest.fn(() => {
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            //@ts-ignore ignore this because it will not perfectly match the object
                            resolve({
                                Items: []
                            })
                        });
                    }
                }
            });

            sut = Container.get(TableInteractor);

            // when
            const result = await sut.userAlreadyExists("12345678910");
            // then
            const expectedParams: QueryInput = {
                TableName: "example_table_name",
                IndexName: "example_mobile_index",
                KeyConditionExpression: "mobile = :m",
                ExpressionAttributeValues: {
                  ":m": {
                    S: "12345678910"
                  }
                }
              }
            expect(mockDocumentClient.query).toHaveBeenCalledWith(expectedParams);
            expect(result).toBe(false);
        });

        it("should return false mobile is not found in ec store", async () => {
            // given
            //@ts-ignore ignore this because it will not perfectly match the object
            mockDocumentClient.query = jest.fn(() => {
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            //@ts-ignore ignore this because it will not perfectly match the object
                            resolve({
                                Items: [{
                                    mobile: "12345678910"
                                }]
                            })
                        });
                    }
                }
            });

            sut = Container.get(TableInteractor);

            // when
            const result = await sut.userAlreadyExists("12345678910");
            // then
            const expectedParams: QueryInput = {
                TableName: "example_table_name",
                IndexName: "example_mobile_index",
                KeyConditionExpression: "mobile = :m",
                ExpressionAttributeValues: {
                  ":m": {
                    S: "12345678910"
                  }
                }
              }
            expect(mockDocumentClient.query).toHaveBeenCalledWith(expectedParams);
            expect(result).toBe(true);
        });
    })
});