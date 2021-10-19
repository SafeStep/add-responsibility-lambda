import 'reflect-metadata';
import Container, { Inject, Service } from "typedi";
import { DocumentClient, QueryInput } from "aws-sdk/clients/dynamodb";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from 'uuid';
import base64url from "base64url";

@Service()
export default class TableInteractor {
    @Inject("aws_region")
    private readonly awsRegion!: string
    @Inject("ec_table_name")
    private readonly ecStoreName!: string
    @Inject("ec_email_index")
    private readonly ecEmailIndexName!: string
    @Inject("responsibility_table_name")
    private readonly responsibilityStoreName!: string
    @Inject("responsibility_green_id_index")
    private readonly responsibilityGreenIdIndex!: string
    @Inject()
    private docClient!: DocumentClient

    private insertionParams: DocumentClient.BatchWriteItemRequestMap
    
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
      console.log("requesting ID")
      const params = {
        TableName: this.ecStoreName,
        IndexName: this.ecEmailIndexName,
        KeyConditionExpression: "email = :e",
        ExpressionAttributeValues: {
          ":e": user.email.toLowerCase()
        }
      }

      const result = await this.docClient.query(params).promise()

      if (result.Items === undefined || result.Items.length === 0) return ""

      console.log("resolved ID")
      return result.Items![0].ECID;
    }

    private createEC(user: User): string {
      const ECID = uuidv4();
      console.log(`Creating new EC locally with ECID: ${ECID}`)
      this.insertionParams[this.ecStoreName].push ({
        PutRequest: {
          Item: {
            ECID: ECID,
            f_name: user.f_name,
            phone: user.phone,
            dialing_code: user.dialing_code,
            email: user.email.toLowerCase()
          }
        }
      })
      return ECID;
    }
    
    createUserWithResponsibility(user: User, greenUserId: string ) {
      const ECID = this.createEC(user);
      return [this.createResponsibility(ECID, greenUserId), ECID];
    }

    createResponsibility(ECID: string, greenUserId: string) {
      console.log(`creating local responsibility between ECID ${ECID} and greenId: ${greenUserId}`);
      const RID = base64url(uuidv4());
      this.insertionParams[this.responsibilityStoreName].push ({
        PutRequest: {
          Item: {
            ECID: ECID,
            RID: RID,
            greenID:greenUserId,
            status:"pending"
          }
        }
      })
      return RID;
    }

    private resetInsertionParams() {
      console.log("Emptying stored insertions")
      this.insertionParams = {};
      this.insertionParams[this.ecStoreName] = []
      this.insertionParams[this.responsibilityStoreName] = []
      console.log("Cleared stored insertions")
    }

    async executeInsertions() {
      console.log("Beginning insertion into tables");
      
      this.removeTablesWithNoInsertions();

      for(const [tableName, insertions] of Object.entries(this.insertionParams)) {
          console.log(`Inserting into ${tableName}`);
          insertions.forEach((item) => {
            console.log(item.PutRequest?.Item)
          })
      }
      
      try {
        if (Object.keys(this.insertionParams).length == 0) {
          throw "Nothing to insert"
        }

        const result = await this.docClient.batchWrite({
          RequestItems: this.insertionParams
        }).promise();
        console.log(result);
      console.log("Completed insertions")
      }
      catch(e) {
        console.log("Insertion not completed")
        console.error(e);
      }
      finally {
        this.resetInsertionParams()  // reset the insertion params
      }
    }

    private removeTablesWithNoInsertions() {
      const copyObject = {...this.insertionParams};

      for(const [tableName, insertions] of Object.entries(copyObject)) {
        if (insertions.length == 0) {  // there are no requests for this table
          delete this.insertionParams[tableName];
        }
      }
    }

    async responsibilityExists(ecid: string, greenId: string) {
      const params = {
        TableName: this.responsibilityStoreName,
        IndexName: this.responsibilityGreenIdIndex,
        KeyConditionExpression: "greenID = :g",
        ExpressionAttributeValues: {
          ":g": greenId
        }
      }
      
      const result = await this.docClient.query(params).promise()
      
      if (result.Items && result.Items.filter(item => item.ECID == ecid).length > 0) {  // if a resp between ECID and GreenID already exists
        return true
      }

      const matchingParams = this.insertionParams[this.responsibilityStoreName].filter(request => {
        const item = request.PutRequest!.Item
        return (item.ECID == ecid && item.greenID == greenId)
      })

      if (matchingParams.length > 0) {
        return true
      }

      return false
    }
    
    getInsertionParams(): DocumentClient.BatchWriteItemRequestMap {
      return this.insertionParams;
    }
}