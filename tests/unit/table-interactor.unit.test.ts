import 'reflect-metadata';
import { DocumentClient} from "aws-sdk/clients/dynamodb";
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
    const EC_TABLE_EMAIL_INDEX = "example_email_index";
    const RESPONSIBILITY_TABLE_NAME = "example_responsibility_store"
    const GREEN_ID_INDEX = "greenID-Index"

    var mockDocumentClient: DocumentClient;

    beforeAll(() => {
        Container.set("aws_region", "");
        Container.set("db_endpoint", "");
        Container.set("ec_table_name", EC_TABLE_NAME);
        Container.set("ec_email_index", EC_TABLE_EMAIL_INDEX);
        Container.set("responsibility_table_name", RESPONSIBILITY_TABLE_NAME);
        Container.set("responsibility_green_id_index", GREEN_ID_INDEX)

        mockDocumentClient = new DocumentClient();
        Container.set(DocumentClient, mockDocumentClient);
    });

    afterAll(() => {
        Container.remove("aws_region");
        Container.remove("db_endpoint");
        Container.remove("ec_table_name");
        Container.remove("ec_email_index");
        Container.remove("responsibility_table_name");
        Container.remove("responsibility_green_id_index")
    })

    afterEach(async () => {
        try {
            await sut.executeInsertions()  // clear state
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
                email: "someonES_email",  // this should be lowercased
                phone: "12345678910",
                dialing_code: "44"
            });
            // then
            const expectedParams = {
                TableName: "example_ecid_store",
                IndexName: "example_email_index",
                KeyConditionExpression: "email = :e",
                ExpressionAttributeValues: {
                  ":e": "someones_email"
                }
              }
            expect(mockDocumentClient.query).toHaveBeenCalledWith(expectedParams);
            expect(result).toBe("f428015d-4c42-4505-b6ab-e31fdb2691d3");
        });

        it("should return false phone is not found in ec store", async () => {
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
                phone: "12345678910",
                dialing_code: "44"
            });
            // then
            const expectedParams = {
                TableName: "example_ecid_store",
                IndexName: "example_email_index",
                KeyConditionExpression: "email = :e",
                ExpressionAttributeValues: {
                  ":e": "someones_email"
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
                email: "john.SMITH@gmail.com",
                phone: "12345678910",
                dialing_code: "44"
            }

            sut = Container.get(TableInteractor);

            // when
            sut.createUserWithResponsibility(fakeUser, "12345678-1234-1234-1234-123456789012");

            // then
            expect(sut.getInsertionParams()[EC_TABLE_NAME]).toContainEqual({
                PutRequest: {
                    Item: {
                        f_name: "John",
                        email: "john.smith@gmail.com",
                        phone: "12345678910",
                        dialing_code: "44",
                        ECID: "3edea470-3fd7-4421-a17a-c0e754faae35",
                    }
                }
            });
            expect(sut.getInsertionParams()[RESPONSIBILITY_TABLE_NAME]).toContainEqual({
                PutRequest: {
                    Item: {
                        ECID: "3edea470-3fd7-4421-a17a-c0e754faae35",
                        RID:"ZDIwNjM5MWYtY2IxYy00ZGNlLTg3YTQtNjM4YWJhNDg0ZjAw",
                        greenID: "12345678-1234-1234-1234-123456789012",
                        status: "pending",
                    }
                }
            })
        })

        it("Should create params for insertion of responsibility on already created user", async () => {
            // given

            sut = Container.get(TableInteractor);

            // when
            sut.createResponsibility("3edea470-3fd7-4421-a17a-c0e754faae35", "12345678-1234-1234-1234-123456789012");

            // then
            expect(sut.getInsertionParams()[RESPONSIBILITY_TABLE_NAME]).toContainEqual({
                PutRequest: {
                    Item: {
                        ECID: "3edea470-3fd7-4421-a17a-c0e754faae35",
                        RID: "NjE3N2FjOWYtZGUyMS00YjlhLTliM2EtZjVmOWU3MDM2NmZk",
                        greenID:"12345678-1234-1234-1234-123456789012",
                        status: "pending",
                    }
                }
            })
        })
    })

    describe("Execute insertions method", () => {
        it("should call execute insertions should be called for each scenario", async () => {
            // given

            //@ts-ignore
            mockDocumentClient.batchWrite = jest.fn(() => {
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            //@ts-ignore ignore this because it will not perfectly match the object
                            resolve()
                        })
                    }
                }
            })

            //@ts-ignore
            v4.mockReturnValueOnce("d1f05698-fbef-4fc8-954a-1dc505eace42") // used for RID for first responsibility
            .mockReturnValueOnce("11588249-465f-4ccf-8803-bd4d7d3da576")  // used for RID of new user and responsibility
            .mockReturnValueOnce("9aba95f5-5e8a-47ca-95b9-307237203599")  // used for ECID of new user

            sut = Container.get(TableInteractor);

            sut.createResponsibility("123", "something-else")
            sut.createUserWithResponsibility({
                f_name: "John",
                phone: "12345678910",
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
                                    "ECID": "123",
                                    "RID": "ZDFmMDU2OTgtZmJlZi00ZmM4LTk1NGEtMWRjNTA1ZWFjZTQy",
                                    "greenID":"something-else",
                                    "status":"pending"
                                }
                            }
                            
                        },
                        {
                            "PutRequest": {
                                "Item": {
                                    "ECID":"11588249-465f-4ccf-8803-bd4d7d3da576",
                                    "RID":"OWFiYTk1ZjUtNWU4YS00N2NhLTk1YjktMzA3MjM3MjAzNTk5",
                                    "greenID": "some-green-user",
                                    "status": "pending"
                                }
                            }
                        },
                    ],
                    "example_ecid_store": [
                        {
                            "PutRequest": {
                                "Item": {
                                    "ECID": "11588249-465f-4ccf-8803-bd4d7d3da576",
                                    "email": "someones-email@yah.com",
                                    "f_name": "John",
                                    "phone": "12345678910",
                                    "dialing_code": "44",
                                }
                            }
                        },
                    ]

                }
            })
        })
        it("Shouldn't insert if there is nothing to insert", async () => {
            // given

            //@ts-ignore
            mockDocumentClient.batchWrite = jest.fn(() => {
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            //@ts-ignore ignore this because it will not perfectly match the object
                            resolve()
                        })
                    }
                }
            })

            // when
            await sut.executeInsertions();

            // then
            expect(mockDocumentClient.batchWrite).toBeCalledTimes(0)  // this should not be called
        })
    });

    describe("Responsibility exists method", () => {
        it("should not create a responsibility if one already exists remotely", async () => {

            // given

            //@ts-ignore
            mockDocumentClient.query = jest.fn(() => {
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            //@ts-ignore ignore this because it will not perfectly match the object
                            resolve({
                                Items: [{
                                    ECID: "example_ecid",
                                    RID: "wibble",
                                    greenId: "example_green_id"
                                }]
                            })
                        });
                    }
                }
            });

            sut = Container.get(TableInteractor)

            // when 

            const result = await sut.responsibilityExists("example_ecid", "example_green_id")

            // then

            const params = {
                TableName: RESPONSIBILITY_TABLE_NAME,
                IndexName: GREEN_ID_INDEX,
                KeyConditionExpression: "greenID = :g",
                ExpressionAttributeValues: {
                  ":g": "example_green_id"
                }
            }

            expect(mockDocumentClient.query).toHaveBeenCalledWith(params);
            expect(result).toBe(true)
        })

        it("should not create a responsibility if one already exists in local memory", async () => {

            // given 

            //@ts-ignore
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
            v4.mockReturnValueOnce("d1f05698-fbef-4fc8-954a-1dc505eace42") // used for RID for first responsibility

            sut = Container.get(TableInteractor)

            sut.createResponsibility("example_ecid", "example_green_id")

            // when

            const result = await sut.responsibilityExists("example_ecid", "example_green_id")

            // then

            const params = {
                TableName: RESPONSIBILITY_TABLE_NAME,
                IndexName: GREEN_ID_INDEX,
                KeyConditionExpression: "greenID = :g",
                ExpressionAttributeValues: {
                  ":g": "example_green_id"
                }
            }

            expect(mockDocumentClient.query).toHaveBeenCalledWith(params);
            expect(result).toBe(true)
        })
    })
});