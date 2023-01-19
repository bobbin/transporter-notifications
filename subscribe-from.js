//const client = require('../src/client');
const client = require("node-eventstore-client");

const resolveLinkTos = true;

function resumeEvent(event) {
  return [
    event.originalEvent.eventType,
    [event.originalEventNumber.toNumber(), event.originalStreamId].join('@'),
    event.originalPosition
  ].join(" ")
}

const belongsToAUserAggregate = event =>
  event.originalEvent.eventStreamId.startsWith("test-order")

const eventAppeared = (stream, event) => {
    if (belongsToAUserAggregate(event)) {
        console.log(
            event.originalEvent.eventStreamId,
            event.originalEvent.eventId,
            event.originalEvent.eventType,
            event.originalEvent
        )
    }
}
//const eventAppeared = (subscription, event) => console.log("Event received", resumeEvent(event));

const subscriptionDropped = (subscription, reason, error) => console.log("Subscription dropped", reason, error);

const libeProcessingStarted = () => console.log("Live processing started.");

const credentials = new client.UserCredentials("user", "password");

const settings = {};
const endpoint = "tcp://1.1.1.1:1113";
const connection = client.createConnection(settings, endpoint);

connection.connect().catch(err => console.log("Connection failed", err));

connection.on('heartbeatInfo', heartbeatInfo => {}
  //console.log('Heartbeat latency', heartbeatInfo.responseReceivedAt - heartbeatInfo.requestSentAt, 'ms')
);
connection.once("connected", tcpEndPoint => {
  console.log(`Connected to eventstore at ${tcpEndPoint.host}:${tcpEndPoint.port}`);
  connection.subscribeToAllFrom(
    null,
    resolveLinkTos,
    eventAppeared,
    libeProcessingStarted,
    subscriptionDropped,
    credentials
  );
});

connection.on("error", error =>
  console.log(`Error occurred on connection: ${error}`)
)

connection.on("closed", reason =>
  console.log(`Connection closed, reason: ${reason}`)
)
