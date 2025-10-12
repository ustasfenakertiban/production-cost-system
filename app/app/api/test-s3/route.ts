
import { NextResponse } from 'next/server';
import { uploadBackup, downloadBackup, listBackups } from '@/lib/s3';
import { getBucketConfig } from '@/lib/aws-config';

export async function GET() {
  try {
    console.log('[Test S3] Starting S3 test...');
    
    // Проверяем конфигурацию
    const config = getBucketConfig();
    console.log('[Test S3] Bucket config:', config);
    
    // Создаем тестовый файл
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'This is a test backup file'
    };
    
    const testBuffer = Buffer.from(JSON.stringify(testData, null, 2), 'utf-8');
    const testFilename = `test_backup_${Date.now()}.json`;
    
    console.log('[Test S3] Uploading test file:', testFilename);
    
    // Пробуем загрузить
    const uploadResult = await uploadBackup(testBuffer, testFilename);
    console.log('[Test S3] Upload result:', uploadResult);
    
    // Пробуем скачать
    console.log('[Test S3] Downloading test file...');
    const downloadedBuffer = await downloadBackup(uploadResult.key);
    const downloadedData = JSON.parse(downloadedBuffer.toString('utf-8'));
    console.log('[Test S3] Downloaded data:', downloadedData);
    
    // Проверяем список файлов
    console.log('[Test S3] Listing backups...');
    const backups = await listBackups();
    console.log('[Test S3] Found backups:', backups.length);
    
    return NextResponse.json({
      success: true,
      config: {
        bucketName: config.bucketName,
        folderPrefix: config.folderPrefix
      },
      uploadResult,
      downloadedData,
      backupsList: backups.slice(0, 5)
    });
  } catch (error: any) {
    console.error('[Test S3] Error:', error);
    return NextResponse.json(
      {
        error: 'S3 test failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
