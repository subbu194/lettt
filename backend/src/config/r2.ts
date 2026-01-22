import { S3Client, ListBucketsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

let s3Client: S3Client | null = null;

export async function initializeR2() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_BASE_URL;

    // Check required environment variables
    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
        console.error('\x1b[31m❌ R2 Configuration Error: Missing required environment variables\x1b[0m');
        console.error('\x1b[31m   Required: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME\x1b[0m');
        return null;
    }

    try {
        // Initialize S3 Client for R2
        s3Client = new S3Client({
            endpoint: endpoint,
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            },
            region: 'auto'
        });

        // Verify connection by checking if bucket exists
        const headBucketCommand = new HeadBucketCommand({ Bucket: bucketName });
        await s3Client.send(headBucketCommand);

        console.log('✅ R2 Storage initialized successfully');
        
        return s3Client;
    } catch (error: any) {
        console.error('\x1b[31m❌ R2 Storage initialization failed:\x1b[0m', error.message);
        
        // Provide helpful error messages
        if (error.name === 'NetworkingError') {
            console.error('\x1b[31m   └─ Network error: Check your R2_ENDPOINT\x1b[0m');
        } else if (error.name === 'InvalidAccessKeyId') {
            console.error('\x1b[31m   └─ Invalid access key: Check your R2_ACCESS_KEY_ID\x1b[0m');
        } else if (error.name === 'SignatureDoesNotMatch') {
            console.error('\x1b[31m   └─ Invalid secret key: Check your R2_SECRET_ACCESS_KEY\x1b[0m');
        } else if (error.name === 'NoSuchBucket') {
            console.error(`\x1b[31m   └─ Bucket not found: "${bucketName}" does not exist\x1b[0m`);
        }
        
        return null;
    }
}

export function getR2Client(): S3Client {
    if (!s3Client) {
        throw new Error('R2 client not initialized. Call initializeR2() first.');
    }
    return s3Client;
}
