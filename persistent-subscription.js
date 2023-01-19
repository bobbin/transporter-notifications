const esClient = require('node-eventstore-client');

let esConnection = null;

const start = async () => {
  console.log('start');
  const connSettings = {};  // Use defaults
  esConnection = esClient.createConnection(connSettings, "tcp://1.1.1.1:1113");
  await esConnection.connect();

  const connectedPromise = new Promise((resolve, reject) => {
    esConnection.once('connected', resolve);
    const timeoutMs = 5000;
    const errorMsg =
      'Event Store connection failed after 5000ms timeout';
    const error = Error(errorMsg);
    setTimeout(() => reject(error), timeoutMs);
  });
  const tcpEndpoint = await connectedPromise;
  console.log('Connected to eventstore');

  await connectToSubscription();
};

const subscriptionDropped = () => {
  console.log('dropped');
};

const connectToSubscription = async () => {
  const credentials = new esClient.UserCredentials('user', 'password');
  try {
    console.log('connectToSubscription start');
    const subscription = await esConnection.connectToPersistentSubscription(
      'test-orders-4543434AB',
      'transfgrp',
      (subscription, event) => {
        console.log(JSON.parse(event.originalEvent.data.toString()));
        return Promise.resolve();
        },
      subscriptionDropped,
      credentials,
    );
    console.log('connectToSubscription end');
    return subscription;
  } catch (e) {
    console.log(e);
  }
};

start();
