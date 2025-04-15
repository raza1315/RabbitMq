// worker.js
require('dotenv').config({ path: __dirname + "/../.env" });
const amqp = require('amqplib');

// Queue configuration
const QUEUE_NAME = 'user_processing_queue';
const RABBITMQ_URL = process.env.RABBITMQ_URL;

// Function to mock API call and data processing
async function processUser(userData) {
    return new Promise((resolve) => {
        // Simulate API call delay
        setTimeout(() => {
            console.log(`Processing user ${userData.id}: ${userData.name}`);
            console.log('User data:', JSON.stringify(userData, null, 2));

            // In a real application, you would:
            // 1. Call third-party APIs
            // 2. Process the response
            // 3. Update the database

            resolve({
                userId: userData.id,
                processed: true,
                processingTime: new Date().toISOString()
            });
        }, 1000); // Simulate half-second processing time
    });
}

// Function to start the worker
async function startWorker() {
    let connection;
    let channel;

    try {
        // Connect to RabbitMQ
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        // Ensure the queue exists
        await channel.assertQueue(QUEUE_NAME, {
            durable: true
        });

        // Set prefetch to 1 to ensure we process one message at a time
        await channel.prefetch(1);

        console.log('Worker connected to RabbitMQ');
        console.log(`Waiting for messages in queue: ${QUEUE_NAME}`);

        // Consume messages from the queue
        channel.consume(QUEUE_NAME, async (msg) => {
            if (msg !== null) {
                try {
                    const userData = JSON.parse(msg.content.toString());
                    console.log(`Received user ${userData.id} from queue`);

                    // Process the user data
                    const result = await processUser(userData);
                    console.log(`User ${result.userId} processed successfully`);

                    // Acknowledge the message - remove it from the queue
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing message:', error);
                    // Negative acknowledgment - put the message back in the queue
                    channel.nack(msg, false, true);
                }
            }
        });

        // Handle application termination
        process.on('SIGINT', async () => {
            console.log('Worker shutting down...');
            await channel.close();
            await connection.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('Worker error:', error);
        // Try to reconnect after a delay
        setTimeout(startWorker, 5000);
    }
}

// Start the worker
console.log('Starting worker...');
startWorker();