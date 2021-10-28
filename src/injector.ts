import { SES } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import Container from "typedi";

export default abstract class Injector {
    static async init() {
        try {
            const module = await import(`./env/${process.env.NODE_ENV}`);
            for (const [key, value] of Object.entries(module.default)) {
                Container.set(key, value);
            }
        }
        catch (e) {
            console.error(e);
            throw "Could not initialise env depedencies"
        }

        Container.set(DocumentClient, new DocumentClient());
        Container.set(SES, new SES());
    }
}