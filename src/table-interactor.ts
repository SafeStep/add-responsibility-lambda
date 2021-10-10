import 'reflect-metadata';
import Container, { Inject, Service } from "typedi";
import { BatchWriteItemRequestMap, DocumentClient, QueryInput } from "aws-sdk/clients/dynamodb";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from 'uuid';
import base64url from "base64url";

@Service()
export default class TableInteractor {
    @Inject("aws_region")
    private readonly awsRegion!: string
    @Inject("ec_table_name")
    private readonly ecStoreName!: string
    @Inject("ec_mobile_index")
    private readonly ecMobileIndexName!: string
    @Inject("responsibility_table_name")
    private readonly responsibilityStoreName!: string
    @Inject()
    private docClient!: DocumentClient

    private insertionParams: BatchWriteItemRequestMap
    
    constructor(
      @Inject("ec_table_name") ecStoreName: string,
      @Inject("responsibility_table_name") responsibilityStoreName: string
      ) {
        AWS.config.update({
          region: this.awsRegion
        });
        this.insertionParams = {};
        this.insertionParams[ecStoreName] = []
        this.insertionParams[responsibilityStoreName] = []
      }
    
    public async getEcid(user: User): Promise<string> {
      const params: QueryInput = {
        TableName: this.ecStoreName,
        IndexName: this.ecMobileIndexName,
        KeyConditionExpression: "mobile = :m",
        ExpressionAttributeValues: {
          ":m": {
            S: user.mobile
          }
        }
      }

      const result = await this.docClient.query(params).promise()

      if (result.Items === undefined || result.Items.length === 0) return ""

      return result.Items![0].ECID;
    }

    private createEC(user: User): string {
      const ECID = uuidv4();
      this.insertionParams[this.ecStoreName].push ({
        PutRequest: {
          Item: {
            ECID: {
              S: ECID
            },
            f_name: {
              S: user.f_name
            },
            mobile: {
              S: user.mobile
            },
            dialing_code: {
              S: user.dialing_code
            },
            email: {
              S: user.email
            }
          }
        }
      })
      return ECID;
    }
    
    createUserWithResponsibility(user: User, greenUserId: string ) {
      const ECID = this.createEC(user);
      this.createResponsibility(ECID, greenUserId);
    }

    createResponsibility(ECID: string, greenUserId: string) {
      const RID = base64url(uuidv4());
      this.insertionParams[this.responsibilityStoreName].push ({
        PutRequest: {
          Item: {
            ECID: {
              S: ECID
            },
            RID: {
              S: RID
            },
            greenId: {
              S: greenUserId
            },
            status: {
              S: "pending"
            }
          }
        }
      })
    }

    private resetInsertionParams() {
      this.insertionParams = {};
      this.insertionParams[this.ecStoreName] = []
      this.insertionParams[this.responsibilityStoreName] = []
    }

    async executeInsertions() {
      await this.docClient.batchWrite({
        RequestItems: this.insertionParams
      });
      this.resetInsertionParams()  // reset the insertion params
    }

    getInsertionParams(): BatchWriteItemRequestMap {
      return this.insertionParams;
    }
}