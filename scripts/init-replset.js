const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env' });

(async () => {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  // Connect without replicaSet param for the initial admin command
  const connectUrl = rawUrl.replace(/[?&]replicaSet=[^&]+/, '');

  const client = new MongoClient(connectUrl, { useUnifiedTopology: true });
  try {
    await client.connect();
    const adminDb = client.db().admin();

    console.log('Connected to MongoDB. Attempting replSetInitiate...');

    // Try to run replSetInitiate; if already initiated, catch and continue
    try {
      const initRes = await adminDb.command({ replSetInitiate: {} });
      console.log('replSetInitiate result:', JSON.stringify(initRes, null, 2));
    } catch (e) {
      console.error('replSetInitiate error (might already be initiated):', e.message || e);
    }

    // Wait a short moment for the repl set to elect primary
    await new Promise((r) => setTimeout(r, 1500));

    // Get replSet status
    try {
      const status = await adminDb.command({ replSetGetStatus: 1 });
      console.log('Replica set status:', JSON.stringify(status, null, 2));
    } catch (e) {
      console.error('Failed to get replSet status:', e.message || e);
    }
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();
