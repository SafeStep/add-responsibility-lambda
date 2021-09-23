import { Inject, Service } from "typedi";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as AWS from "aws-sdk";

@Service()
export default class TableInteractor {
    @Inject("aws_region")
    awsRegion!: string
    @Inject("db_endpoint")
    endpoint: string | undefined
    
    constructor(
      private docClient: DocumentClient
      ) {
        AWS.config.update({
          region: this.awsRegion
        });
      }
    
    public async userAlreadyExists(mobile: String): Promise<boolean> {
      const result = await this.docClient.get({
        TableName: "",
        Key: {}
      })
      throw "Not Implimented" 
      return false;
    }
}