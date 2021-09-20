import 'reflect-metadata';
import { Container } from "typedi"
import { SQSEvent } from "aws-lambda";
import Processor from "./processor";

const initialiseInjections = async () => {
    try {
        const module = await import(`./env/${process.env.NODE_ENV}`);
        for (const [key, value] of Object.entries(module.default)) {
            Container.set(key, value);
        }
    }
    catch (e) {
        console.error(e);
        throw "Could not initialise depedencies"
    }
}

export const handler = async (event: SQSEvent) => {
    await initialiseInjections();
    const processor = Container.get(Processor);
    processor.process(event);
}