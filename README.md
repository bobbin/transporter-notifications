# Transporter Deployment in Openshift

## Github: https://github.com/eits-lafargeholcim/evenstore-transporter
## Branch: main

The goal of this microservice is to communicate an EventstoreDB deployment with a Elasticsearch cluster.

Currently, it subscribes to a single stream from the Evenstore and forwards its content to a single Elasticsearch index, everything can be configured using the following environment variables on the deployed POD:

TARGET_STREAM -> Eventstore stream where the transporter will subscribe to

ENDPOINT -> Evenstore endpoint, including port (e.g.: tcp://172.30.215.128:1113)

USER -> Evenstore user

PASSWORD -> Eventstore password

ELK_ENDPOINT -> Elasticsearch endpoint (e.g.: https://search-lh-emea-itsc-quality-6qifyxl5dadu6v4ydq3jrxgn6y.eu-west-1.es.amazonaws.com)

INDEX -> Elasticsearch index where the events will be written. Elasticsearch may admit that the index can be created in the first event ingestion, but it depends on the configuration.

ELK_USER -> Elasticsearch user

ELK_PASS -> Elasticsearch password

Things to take into account: Integration Elasticsearch authorization configuration may need the IP of the deployed service to allow connection, so you may have to contact Juanma to add the public IP of the POD once it’s deployed.

