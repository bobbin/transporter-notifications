// Subscribe to all new events on the $all stream. Filter out any which aren"t about "user" aggregates.
const {
  EventStoreDBClient,
  jsonEvent,
  FORWARDS,
  START,
  END
} = require("@eventstore/db-client");

require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var config = new AWS.Config({region: 'eu-west-1' });
// Set the region 
AWS.config.update({
  region: 'eu-west-1'
});

// Create an SQS service object
var sqs = new AWS.SQS({
  apiVersion: '2012-11-05'
 
});


const client = require("node-eventstore-client")


// Eventstore connection configuration
const resolveLinkTos = false
const stream = process.env.TARGET_STREAM
const endpoint = process.env.ENDPOINT
const user = process.env.USER
const password = process.env.PASSWORD

// Elasticsearch connection configuration
// const elkEndpoint = process.env.ELK_ENDPOINT // https://localhost:9200
// const elkIndex = process.env.INDEX
// const elkUser = process.env.ELK_USER // 'elastic'
// const elkPassword = process.env.ELK_PASS // 'changeme'
// const elkClient = new Client({
//   node: elkEndpoint,
//   auth: {
//     username: elkUser,
//     password: elkPassword
//   }
// })

const sendMessageSNS = (e) => {
  var evtData = e.event.data;
  console.log("type:", e.event.type);
  evtData.eventType = e.event.type;
  //console.log("metadata", e.event.metadata);
  var params = {
    MessageAttributes: {
      "SalesArea": {
        DataType: "String",
        StringValue: e.event.metadata.salesOrg
      }
    },
    MessageGroupId: "trucks-emea",  // Required for FIFO queues
    Message: JSON.stringify(evtData), /* required */
    TopicArn: 'arn:aws:sns:eu-west-1:487540052268:test-trucks.fifo'
  };
  // Create promise and SNS service object
  var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
  console.log("salesArea", e.event.metadata.salesAreaId)
  //console.log("EventoStr", JSON.stringify(e.event));
  //console.log("EventoFull", JSON.stringify(e));

  publishTextPromise.then(
    function(data) {
      console.log(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
      console.log("MessageID is " + data.MessageId);
    }).catch(
      function(err) {
      console.error(err, err.stack);
    });
}

const filterEvent = (e) => {
  return e.event.streamId.startsWith(stream)
}

// Event detected  
const eventAppeared = (e) => {
    if (filterEvent(e)) {
      var evtData = e.event.data;
      console.log(e.event)
      sendMessageSNS(e)
    // // Event objet built for Elasticsearch injection
    //   var params = {

    //       MessageAttributes: {
    //         "Stream": {
    //           DataType: "String",
    //           StringValue: e.event.streamId
    //         },
    //     //      "Author": {
    //     //        DataType: "String",
    //     //        StringValue: "John Grisham"
    //     //      },
    //     //      "WeeksOn": {
    //     //        DataType: "Number",
    //     //        StringValue: "6"
    //     //      }
    //       },
    //       MessageBody: JSON.stringify(evtData),
    //       MessageDeduplicationId: e.event.id,  // Required for FIFO queues
    //       MessageGroupId: "trucks-emea",  // Required for FIFO queues
    //       QueueUrl: "https://sqs.eu-west-1.amazonaws.com/487540052268/logistics-databackbone.fifo"
    //   };
    //   sqs.sendMessage(params, function(err, data) {
    //     if (err) {
    //       console.log("Error", err);
    //     } else {
    //       console.log("Success", data.MessageId);
    //     }
    //   });
  }
}

const subscriptionDropped = (subscription, reason, error) =>
  console.log(error ? error : "Subscription dropped.")

const initEventStore = () => {
  const credentials = {
    username: user,
    password: password,
  };

  const eventStoreClient = EventStoreDBClient.connectionString(endpoint);
  try {
    const subscription = eventStoreClient
      .subscribeToAll({ credentials, subscriptionDropped, fromPosition: END })
      .on("data", eventAppeared)
  } catch (err) {
    initEventStore();
  }
}

initEventStore();
