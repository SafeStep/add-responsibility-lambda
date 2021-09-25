import 'reflect-metadata';
import { DocumentClient, QueryInput } from "aws-sdk/clients/dynamodb";
import TableInteractor from "../../src/table-interactor";
import Container from "typedi";
import { v4 } from 'uuid';

jest.mock('uuid', () => {
    return {
        v4: jest.fn()
    };
});

describe("Table Interactor class tests", () => {
    let sut: TableInteractor;  // subject under test

    const EC_TABLE_NAME = "example_table_name";
    const EC_TABLE_MOBILE_INDEX = "example_mobile_index";
    const RESPONSIBILITY_TABLE_NAME = "example_responsiblity_store"

    var mockDocumentClient: DocumentClient;

    beforeAll(() => {
        Container.set("aws_region", "");
        Container.set("db_endpoint", "");
        Container.set("ec_table_name", EC_TABLE_NAME);
        Container.set("ec_mobile_index", EC_TABLE_MOBILE_INDEX);
        Container.set("responsibility_table_name", RESPONSIBILITY_TABLE_NAME);

        mockDocumentClient = new DocumentClient();
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

            //@ts-ignore
            v4.mockReturnValueOnce("3edea470-3fd7-4421-a17a-c0e754faae35")
            .mockReturnValueOnce("d206391f-cb1c-4dce-87a4-638aba484f00")
            sut = Container.get(TableInteractor);

            // when
            const result = await sut.userAlreadyExists({
                f_name: "bruh",
                email: "someones_email",
                mobile: "12345678910",
                dialing_code: "44"
            });
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

            //@ts-ignore
            v4.mockReturnValueOnce("6177ac9f-de21-4b9a-9b3a-f5f9e70366fd")            
            sut = Container.get(TableInteractor);

            // when
            const result = await sut.userAlreadyExists({
                f_name: "bruh",
                email: "someones_email",
                mobile: "12345678910",
                dialing_code: "44"
            });
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

    describe("Create User Method", () => {
        it("Should create params for insertion of user with responsibility", async () => {
            // given
            const fakeUser = {
                f_name: "John",
                email: "john.smith@gmail.com",
                mobile: "12345678910",
                dialing_code: "44"
            }

            //@ts-ignore
            mockDocumentClient.put = jest.fn(() => {
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            //@ts-ignore ignore this because it will not perfectly match the object
                            resolve({})
                        });
                    }
                }
            });

            sut = Container.get(TableInteractor);

            // when
            await sut.createUserWithResponsibility(fakeUser, "12345678-1234-1234-1234-123456789012");

            // then
            expect(sut.getInsertionParams()[EC_TABLE_NAME]).toContainEqual({
                PutRequest: {
                    Item: {
                        f_name: {
                            S: "John"
                        },
                        email:  {
                            S: "john.smith@gmail.com" 
                        },
                        mobile: {
                            S: "12345678910"
                        },
                        ECID:  {
                            S: "3edea470-3fd7-4421-a17a-c0e754faae35"
                        }
                    }
                }
            });
            expect(sut.getInsertionParams()[RESPONSIBILITY_TABLE_NAME]).toContainEqual({
                PutRequest: {
                    Item: {
                        ECID: {
                            S: "3edea470-3fd7-4421-a17a-c0e754faae35"
                        },
                        RID: {
                            S: "d206391f-cb1c-4dce-87a4-638aba484f00"
                        },
                        greenId: {
                            S: "12345678-1234-1234-1234-123456789012"
                        }
                    }
                }
            })
        })

        it("Should create params for insertion of responsibility on already created user", async () => {
            // given

            //@ts-ignore
            mockDocumentClient.put = jest.fn(() => {
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            //@ts-ignore ignore this because it will not perfectly match the object
                            resolve({})
                        });
                    }
                }
            });

            sut = Container.get(TableInteractor);

            // when
            await sut.createResponsibility("3edea470-3fd7-4421-a17a-c0e754faae35", "12345678-1234-1234-1234-123456789012");

            // then
            expect(sut.getInsertionParams()[RESPONSIBILITY_TABLE_NAME]).toContainEqual({
                PutRequest: {
                    Item: {
                        ECID: {
                            S: "3edea470-3fd7-4421-a17a-c0e754faae35"
                        },
                        RID: {
                            S: "6177ac9f-de21-4b9a-9b3a-f5f9e70366fd"
                        },
                        greenId: {
                            S: "12345678-1234-1234-1234-123456789012"
                        }
                    }
                }
            })
        })
    })
});