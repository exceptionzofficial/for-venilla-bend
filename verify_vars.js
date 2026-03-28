import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || '';
console.log('--- MONGODB_URI DIAGNOSTICS ---');
console.log('Length:', uri.length);
console.log('First 20 chars (Hex):', uri.substring(0, 20).split('').map(c => c.charCodeAt(0).toString(16)).join(' '));
console.log('First 20 chars (Raw):', JSON.stringify(uri.substring(0, 20)));

if (uri.includes(' ')) {
    console.log('WARNING: Found at least one space in the URI!');
}

const cleaned = uri.replace(/\s/g, '');
console.log('Cleaned Length:', cleaned.length);
console.log('--- END ---');
