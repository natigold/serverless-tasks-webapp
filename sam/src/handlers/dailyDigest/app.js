const uuid = require('uuid');
const { PublishCommand, SNSClient } = require("@aws-sdk/client-sns");

const snsTopic = process.env.SNS_TOPIC_ARN
const snsClient = new SNSClient();

exports.handler = async (event) => {
  const message = event.Records[0].body;
  const messageCount = event.Records.length;

  await publishTasksNumber(messageCount);

  return {
    statusCode: 200,
    body: JSON.stringify({
      messageCount: messageCount,
    })
  }
}

publishTasksNumber = async (messageCount) => {
  const snsMessage = {
    Message: `Good morning, you now have ${messageCount} new tasks!`,    
    TopicArn: snsTopic
  };

  const publishCommand = new PublishCommand(snsMessage);
  const publishResponse = await snsClient.send(publishCommand);
}