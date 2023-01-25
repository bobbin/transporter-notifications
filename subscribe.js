// Subscribe to all new events on the $all stream. Filter out any which aren"t about "user" aggregates.
//Esta es una linea de prueba
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
      "Message": {
        DataType: "String",
        StringValue: evtData
      }
    },
    MessageGroupId: "notifications-trips",  // Required for FIFO queues
    Message: JSON.stringify(evtData), /* required */
    TopicArn: 'arn:aws:sns:eu-west-1:487540052268:ZondaMail.fifo'
  };
  // Create promise and SNS service object
  var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
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
