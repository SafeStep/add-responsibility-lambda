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

    const EC_TABLE_NAME = "example_ecid_store";
    const EC_TABLE_MOBILE_INDEX = "example_mobile_index";
    const RESPONSIBILITY_TABLE_NAME = "example_responsibility_store"

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

    afterEach(async () => {
        try {
            await sut.executeInsertions()  // remove statefulness
        }
        catch{};
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
                                Items: [{
                                    ECID: "f428015d-4c42-4505-b6ab-e31fdb2691d3"
                                }]
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
            const result = await sut.getEcid({
                f_name: "bruh",
                email: "someones_email",
                mobile: "12345678910",
                dialing_code: "44"
            });
            // then
            const expectedParams: QueryInput = {
                TableName: "example_ecid_store",
                IndexName: "example_mobile_index",
                KeyConditionExpression: "mobile = :m",
                ExpressionAttributeValues: {
                  ":m": {
                    S: "12345678910"
                  }
                }
              }
            expect(mockDocumentClient.query).toHaveBeenCalledWith(expectedParams);
            expect(result).toBe("f428015d-4c42-4505-b6ab-e31fdb2691d3");
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
                                Items: []
                            })
                        });
                    }
                }
            });

            //@ts-ignore
            v4.mockReturnValueOnce("6177ac9f-de21-4b9a-9b3a-f5f9e70366fd")            
            sut = Container.get(TableInteractor);

            // when
            const result = await sut.getEcid({
                f_name: "bruh",
                email: "someones_email",
                mobile: "12345678910",
                dialing_code: "44"
            });
            // then
            const expectedParams: QueryInput = {
                TableName: "example_ecid_store",
                IndexName: "example_mobile_index",
                KeyConditionExpression: "mobile = :m",
                ExpressionAttributeValues: {
                  ":m": {
                    S: "12345678910"
                  }
                }
              }
            expect(mockDocumentClient.query).toHaveBeenCalledWith(expectedParams);
            expect(result).toBe("");
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
            sut.createUserWithResponsibility(fakeUser, "12345678-1234-1234-1234-123456789012");

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
                        dialing_code: {
                            S: "44"
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
                            S: "ZDIwNjM5MWYtY2IxYy00ZGNlLTg3YTQtNjM4YWJhNDg0ZjAw"
                        },
                        greenId: {
                            S: "12345678-1234-1234-1234-123456789012"
                        },
                        status: {
                            S: "pending"
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
            sut.createResponsibility("3edea470-3fd7-4421-a17a-c0e754faae35", "12345678-1234-1234-1234-123456789012");

            // then
            expect(sut.getInsertionParams()[RESPONSIBILITY_TABLE_NAME]).toContainEqual({
                PutRequest: {
                    Item: {
                        ECID: {
                            S: "3edea470-3fd7-4421-a17a-c0e754faae35"
                        },
                        RID: {
                            S: "NjE3N2FjOWYtZGUyMS00YjlhLTliM2EtZjVmOWU3MDM2NmZk"
                        },
                        greenId: {
                            S: "12345678-1234-1234-1234-123456789012"
                        },
                        status: {
                            S: "pending"
                        }
                    }
                }
            })
        })
    })

    describe("Execute insertions method", () => {
        it("should call execute insertions should be called for each scenario", async () => {
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

            mockDocumentClient.batchWrite = jest.fn();

            //@ts-ignore
            v4.mockReturnValueOnce("d1f05698-fbef-4fc8-954a-1dc505eace42") // used for RID for first responsibility
            .mockReturnValueOnce("11588249-465f-4ccf-8803-bd4d7d3da576")  // used for RID of new user and responsibility
            .mockReturnValueOnce("9aba95f5-5e8a-47ca-95b9-307237203599")  // used for ECID of new user

            sut.createResponsibility("123", "something-else")
            sut.createUserWithResponsibility({
                f_name: "John",
                mobile: "12345678910",
                dialing_code: "44",
                email: "someones-email@yah.com"
            }, "some-green-user")

            // when
            await sut.executeInsertions();

            // then
            expect(mockDocumentClient.batchWrite).toHaveBeenCalledWith({
                RequestItems: {
                    "example_responsibility_store": [
                        {
                            "PutRequest": {
                                "Item": {
                                    "ECID": {
                                        "S": "123"
                                    },
                                    "RID": {
                                        "S": "ZDFmMDU2OTgtZmJlZi00ZmM4LTk1NGEtMWRjNTA1ZWFjZTQy"
                                    },
                                    "greenId": {
                                        "S": "something-else"
                                    },
                                    "status": {
                                        "S": "pending"
                                    }
                                }
                            }
                        },
                        {
                            "PutRequest": {
                                "Item": {
                                    "ECID": {
                                        "S": "11588249-465f-4ccf-8803-bd4d7d3da576"
                                    },
                                    "RID": {
                                        "S": "OWFiYTk1ZjUtNWU4YS00N2NhLTk1YjktMzA3MjM3MjAzNTk5"
                                    },
                                    "greenId": {
                                        "S": "some-green-user"
                                    },
                                    "status": {
                                        "S": "pending"
                                    }
                                }
                            }
                        },
                    ],
                    "example_ecid_store": [
                        {
                            "PutRequest": {
                                "Item": {
                                    "ECID": {
                                        "S": "11588249-465f-4ccf-8803-bd4d7d3da576"
                                    },
                                    "email": {
                                        "S": "someones-email@yah.com"
                                    },
                                    "f_name": {
                                        "S": "John"
                                    },
                                    "mobile": {
                                        "S": "12345678910"
                                    },
                                    "dialing_code": {
                                        "S": "44"
                                    },
                                }
                            }
                        },
                    ]

                }
            })
        })
    });
});