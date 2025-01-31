# RabbitMq

run the rabbitmq message broker in the docker container before hand.
using it for message queue (producers and consumers  && one messgae to one consumer only) for scalable systems

docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

