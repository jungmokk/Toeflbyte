import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const { syncRecentNews } = await import('./newsService.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Schedule tasks:
 * 1. Weekly question generation (Sunday 00:00)
 * 2. Daily news synchronization (Daily 00:00)
 */
export const initCronJobs = () => {
    // 1. Weekly Question Pre-generation (Sunday 00:00)
    cron.schedule('0 0 * * 0', () => {
        console.log('[Cron] ⏰ Running weekly question pre-generation task...');
        
        const scriptPath = path.join(__dirname, '../../scripts/pre-generate-questions.js');
        const job = spawn('node', [scriptPath]);

        job.stdout.on('data', (data) => console.log(`[Cron-Stats]: ${data}`));
        job.stderr.on('data', (data) => console.error(`[Cron-Error]: ${data}`));
        job.on('close', (code) => console.log(`[Cron-Finished] with code ${code}`));
    });

    // 2. Daily News Synchronization (Daily 00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] ⏰ Running daily news synchronization...');
        try {
            await syncRecentNews();
            console.log('[Cron] ✅ News synchronization completed.');
        } catch (error) {
            console.error('[Cron] ❌ News synchronization failed:', error);
        }
    });

    console.log('✅ Cron Scheduler Initialized:');
    console.log('   - Weekly Question Pool: Sundays at 00:00');
    console.log('   - Daily Academic News Sync: Every day at 00:00');
};

