import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getR2Client } from '../config/r2';

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'lettt';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_BASE_URL || '';

// Generate a presigned URL for file upload
export const generateUploadUrlProfile = async (
    fileType: string, 
    fileName: string, 
    folder: string, 
    userId: string, 
    isPermanent: boolean = false
): Promise<{ uploadUrl: string; publicUrl: string }> => {
    try {
        const s3Client = getR2Client();
        const fileExtension = fileName.split('.').pop() || 'jpg';
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        
        // Determine the appropriate path based on folder and file type
        let key: string;
        if (folder === 'art') {
            key = `art/${uniqueFileName}`;
        } else if (folder === 'events') {
            key = `events/${uniqueFileName}`;
        } else if (folder === 'gallery') {
            key = `gallery/${uniqueFileName}`;
        } else {
            key = `uploads/${folder}/${uniqueFileName}`;
        }

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: getMimeType(fileExtension)
        });

        // URL expires in 1 hour
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        // Generate the public URL that will be accessible after upload
        const publicUrl = R2_PUBLIC_URL 
            ? `${R2_PUBLIC_URL}/${key}`
            : `https://${BUCKET_NAME}.r2.dev/${key}`;
        
        return { uploadUrl, publicUrl };
    } catch (error) {
        console.error('Error generating upload URL:', error);
        throw new Error('Failed to generate upload URL');
    }
};

// Delete file from R2 storage
export const deleteFileFromR2 = async (fileUrl: string): Promise<void> => {
    if (!fileUrl) {
        throw new Error('File URL is required for deletion');
    }
    
    try {
        const s3Client = getR2Client();
        
        // Extract the key from the URL
        let key: string;
        
        try {
            const url = new URL(fileUrl);
            key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
        } catch {
            // If URL parsing fails, assume it's already a key
            key = fileUrl;
        }
        
        if (!key || key.trim() === '') {
            throw new Error('Invalid file key extracted from URL');
        }
        
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });
        
        await s3Client.send(command);
        
        // Log successful deletion (for audit trail)
        console.log(`✅ File deleted successfully: ${key}`);
    } catch (error) {
        // Re-throw error instead of silently failing
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to delete file from R2: ${errorMessage}`);
    }
};

// Helper function to determine MIME type based on file extension
const getMimeType = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'm4v': 'video/x-m4v',
        'webm': 'video/webm',
        'avi': 'video/avi',
        'txt': 'text/plain',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}; 