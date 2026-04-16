import mongoose from 'mongoose';
import dns from 'dns';

// Setting public DNS servers to bypass potential SRV resolution issues in local environments
try {
    if (dns.setServers) {
        console.log('🌐 Configuring public DNS servers (8.8.8.8, 1.1.1.1)...');
        dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
} catch (e) {
    console.warn('⚠️ Could not set DNS servers:', e.message);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    process.exit(1);
}

async function test() {
    // Set a timeout for the whole test
    const timeout = setTimeout(() => {
        console.error('❌ Test timed out after 30 seconds.');
        process.exit(1);
    }, 30000);

    try {
        const host = MONGODB_URI.split('@')[1]?.split('/')[0] || 'URI';
        console.log('⏳ Connecting to:', host);
        
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, 
        });
        
        console.log('✅ Successfully connected to MongoDB!');
        clearTimeout(timeout);
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.message.includes('querySrv ECONNREFUSED')) {
            console.error('\n💡 TIP: Your DNS server is refusing SRV lookups. Using public DNS (8.8.8.8) usually fixes this.');
        } else if (error.message.includes('server selection timeout')) {
            console.error('\n💡 TIP: Could not reach the MongoDB cluster. Check if your current IP is whitelisted in MongoDB Atlas.');
        }
        
        clearTimeout(timeout);
        process.exit(1);
    }
}

test();
