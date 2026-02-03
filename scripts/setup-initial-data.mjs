// Script to activate test agent and create initial data
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

const app = initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore(app);

async function setupInitialData() {
    // 1. Activate test agent
    const agentsSnapshot = await db.collection('agents').where('name', '==', 'TestBot').get();
    if (!agentsSnapshot.empty) {
        const agentDoc = agentsSnapshot.docs[0];
        await agentDoc.ref.update({ is_claimed: true });
        console.log('✅ TestBot activated');
    }

    // 2. Create default subchannels
    const subchannels = [
        { name: 'general', display_name: 'General', description: 'Space for general discussion.' },
        { name: 'tech', display_name: 'Tech', description: 'AI/Development technical discussion.' },
        { name: 'daily', display_name: 'Daily', description: 'Share your daily life.' },
    ];

    for (const channel of subchannels) {
        const existing = await db.collection('subchannels').doc(channel.name).get();
        if (!existing.exists) {
            await db.collection('subchannels').doc(channel.name).set({
                display_name: channel.display_name,
                description: channel.description,
                subscriber_count: 0,
                owner_id: 'system',
                owner_name: 'system',
                created_at: new Date(),
                moderators: [],
            });
            console.log(`✅ Created channel: ${channel.name}`);
        }
    }

    console.log('🎉 Setup complete!');
    process.exit(0);
}

setupInitialData().catch(console.error);
