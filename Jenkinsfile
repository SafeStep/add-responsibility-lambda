#!groovy

def ZIP_FILE_NAME = "dist"
def SOURCE_CODE_BUCKET_NAME = "safe-step-lambda-functions-source"
def S3_OBJECT_KEY = "add-responsibility.zip"
def CF_STACK_NAME = "add-responsibility"
def CF_TEMPLATE_FILE_NAME = "template.json"

def String OBJECT_VERSION

pipeline {
    agent any 

    tools {nodejs "nodejs"}

    stages {
        stage("Build") { 
            steps {
                fileOperations([folderCreateOperation("dist")])
                fileOperations([fileCopyOperation(excludes: "", flattenFiles: false, includes: "package.json", targetLocation: "dist")])
                
                sh "npm install --production"              
                sh "tsc -b"  // typescript transpile
                
                fileOperations([ fileDeleteOperation(includes: "dist/package.json", excludes: "")])

                fileOperations([ fileZipOperation(folderPath: ZIP_FILE_NAME, outputFolderPath: "./")])  // zip the result

            }
        }
        stage("Test") {
            steps {
                sh "npm install" // install local including test packages
                sh "npm run test-unit"
            }
        }
        stage("Deploy") {
            steps {
                script {
                    OBJECT_VERSION = sh (
                        script: "aws s3api put-object --bucket ${SOURCE_CODE_BUCKET_NAME} --key ${S3_OBJECT_KEY} --body ${ZIP_FILE_NAME}.zip",
                        returnStdout: true
                    ).trim().replaceAll("\\s","").split("\"")[2]  // just extract the version
                }
                echo "S3 Object Version: ${OBJECT_VERSION}";

                script {
                    jsonfile = readJSON file: CF_TEMPLATE_FILE_NAME
                    jsonfile["Resources"]["AddResponsibilityLambda"]["Properties"]["Code"]["S3ObjectVersion"] = OBJECT_VERSION
                    writeJSON file: CF_TEMPLATE_FILE_NAME, json: jsonfile
                    echo "Injected S3 object version into template"
                }

                sh "aws cloudformation deploy --template-file ${CF_TEMPLATE_FILE_NAME} --stack-name ${CF_STACK_NAME} --capabilities CAPABILITY_NAMED_IAM"
            }
        }
    }
    post {
        cleanup {
            cleanWs()
        }
    }
}