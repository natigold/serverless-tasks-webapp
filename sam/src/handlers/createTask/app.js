const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb')
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs')
const uuid = require('uuid')

const ddbClient = new DynamoDBClient()
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient)
const sqsClient = new SQSClient()
const tableName = process.env.TASKS_TABLE
const newTasksQueueUrl = process.env.NEW_TASKS_QUEUE

exports.handler = async (event) => {
  console.info('received:', event)

  const body = JSON.parse(event.body)
  const user = event.requestContext.authorizer.principalId
  const id = uuid.v4()
  const title = body.title
  const bodyText = body.body
  const createdAt = new Date().toISOString()

  let dueDate = null

  if ('dueDate' in body) {
    dueDate = body.dueDate
  }

  const params = {
    TableName: tableName,
    Item: { user: `user#${user}`, id: `task#${id}`, title: title, body: bodyText, dueDate: dueDate, createdAt: createdAt }
  }

  console.info(`Writing data to table ${tableName}`)
  const data = await ddbDocClient.send(new PutCommand(params))
  console.log('Success - item added or updated', data)

  // write message to SQS queue with item properties
  const sqsMessage = {
    id: id,
    title: title,
    body: bodyText,
    dueDate: dueDate,
    createdAt: createdAt
  }

  console.info(`Writing message to queue ${newTasksQueueUrl}`)
  const sqsData = await sqsClient.send(new SendMessageCommand({
    QueueUrl: newTasksQueueUrl,
    MessageBody: JSON.stringify(sqsMessage)
  }));

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  }
  return response
}
