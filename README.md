# add-responsibility-lambda
Lambda for a green user to add a responsibility to their account

## Installation

Use environment variable `NODE_ENV=production` or `NODE_ENV=development` to define the environment

Install dependenies
```
npm install
```

## Launching
### Locally
This lambda function does require the [emergency-contact-store](www.google.com) DynamoDB table. A local mock version can be found at this [Repo](https://github.com/SafeStep/mock-emergency-contact-responsibility-store).

Ensure the emergency-contact-store table is active / container is running
```
npm run start
```

### Prod
The root directory must be compiled into a .zip, then stored in the S3 bucket called `safe-step-lambda-functions-source` with a key of `add-responsibility.zip`. Then running the `add-responsibility-stack` will deploy the new lambda.