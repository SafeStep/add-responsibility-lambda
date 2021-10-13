# add-responsibility-lambda
Lambda for a green user to add a responsibility to their account

## Installation

Use environment variable `NODE_ENV=production` or `NODE_ENV=development` to define the environment

Install dependenies
```
npm install
```

`NODE_ENV` will need to be set to `local` or `production`

## Launching
### Locally
This lambda function does require the [emergency-contact-store](www.google.com) DynamoDB table. A local mock version can be found at this [Repo](https://github.com/SafeStep/mock-emergency-contact-responsibility-store).

Ensure the emergency-contact-store table is active / container is running and that you have typescript compiler installed on your machine. 

Typescript can be installed using `npm install -g typescript`

#### Compile the project
```
tsc -b
```
#### Run the project
```
npm run start
```

### Prod
The root directory must be compiled into a .zip, then stored in the S3 bucket called `safe-step-lambda-functions-source` with a key of `add-responsibility.zip`. Then running the `add-responsibility-stack` will deploy the new lambda.

## Example Input
The input to the lambda is a SQS, which should have elements of the following structure:
```
{
    "phone": "12345678910",
    "dialing_code": 1,
    "f_name": "John",
    "email": "john.smith@gmail.com",
    "greenId": "12345678-1234-1234-1234-123456789123"
}
```

OR

```
{
    "f_name": "John",
    "email": "john.smith@gmail.com",
    "greenId": "12345678-1234-1234-1234-123456789123"
}
```

As phone number and dialing code is optional when a green user creates a new emergency contact