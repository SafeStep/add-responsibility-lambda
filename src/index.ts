import 'reflect-metadata';
import { Container } from "typedi"
import Injector from './injector';
import { SQSEvent } from "aws-lambda";
import Processor from "./processor";

export const handler = async (event: SQSEvent) => {
    await Injector.init();
    const processor = Container.get(Processor);
    await processor.process(event);
}