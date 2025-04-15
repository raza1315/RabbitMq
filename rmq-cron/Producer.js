// producer.js
require('dotenv').config({path:__dirname+"/../.env"});
const amqp = require('amqplib');
const cron = require('node-cron');

// Queue configuration
const QUEUE_NAME = 'user_processing_queue';
const RABBITMQ_URL = process.env.RABBITMQ_URL;

// Function to connect to RabbitMQ and create a channel
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    // Ensure the queue exists
    await channel.assertQueue(QUEUE_NAME, {
      durable: true // Queue will survive broker restarts
    });
    
    console.log('Connected to RabbitMQ');
    return { connection, channel };
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
}

// Function to fetch users from database (mocked for this example)
async function fetchUsersFromDB() {
  // Mock database query - in a real app, this would be your DB query
  console.log('Fetching users from database...');
  
  // Generate some sample user data
  return Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    needs_processing: true,
    timestamp: new Date().toISOString()
  }));
}

// Function to send users to the queue
async function sendUsersToQueue() {
  let connection, channel;
  
  try {
    // Connect to RabbitMQ
    ({ connection, channel } = await connectRabbitMQ());
    
    // Fetch users
    const users = await fetchUsersFromDB();
    console.log(`Found ${users.length} users to process`);
    
    // Send each user to the queue
    for (const user of users) {
      channel.sendToQueue(
        QUEUE_NAME,
        Buffer.from(JSON.stringify(user)),
        { persistent: true } // Message will survive broker restarts
      );
      console.log(`User ${user.id} sent to queue`);
    }
    
    console.log('All users have been sent to the queue');
  } catch (error) {
    console.error('Error sending users to queue:', error);
  } finally {
    // Close the connection when done
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
}

// Schedule the cron job to run daily at midnight
// For testing, we'll run it every minute
cron.schedule('* * * * *', async () => {
  console.log('Running cron job at', new Date().toISOString());
  await sendUsersToQueue();
});

// Also provide a way to run it immediately for testing
console.log('Producer started. Will run every minute for testing purposes.');
// Uncomment the next line to run immediately when starting the script
// sendUsersToQueue();