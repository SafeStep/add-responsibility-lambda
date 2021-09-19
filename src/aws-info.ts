import { Service } from "typedi";
import * as AWS from "aws-sdk"; 

@Service()
export class AwsInfo {
    constructor(endpoint: string, region: string) {
        console.log("created AwsInfo")
    }
}