import 'reflect-metadata';
import { Inject, Service } from "typedi";
import { DocumentClient, QueryInput } from "aws-sdk/clients/dynamodb";
import * as AWS from "aws-sdk";

@Service()
export default class TableInteractor {
    @Inject("aws_region")
    private readonly awsRegion!: string
    @Inject("db_endpoint")
    private readonly endpoint: string | undefined
    @Inject("ec_table_name")
    private readonly ecStoreName!: string
    @Inject("ec_mobile_index")
    private readonly ecMobileIndexName!: string
    
    constructor(
      private docClient: DocumentClient
      ) {
        AWS.config.update({
          region: this.awsRegion
        });
      }
    
    public async userAlreadyExists(user: User): Promise<boolean> {
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

      return result.Items!.length > 0;
    }

    private async createUser(user: User) {
      throw new Error("Method not implemented.");
    }
    
    async createUserWithResponsibility(user: User, greenUserId: string ) {
      throw new Error("Method not implemented.");
    }

    async createResponsibility(user: User, greenUserId: string) {
      throw new Error("Method not implemented.");
    }
}