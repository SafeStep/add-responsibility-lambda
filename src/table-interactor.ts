import { Service } from "typedi";
import { AwsInfo } from "./aws-info"

@Service()
export default class TableInteractor {
    constructor(
        private awsInfo: AwsInfo
      ) {}
    
    public userAlreadyExists(mobile: String): boolean {
      throw "Not Implimented" 
    }
}