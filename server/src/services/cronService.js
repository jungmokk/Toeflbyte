import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Schedule a task to generate a new pool of questions every Sunday at midnight
 */
export const initCronJobs = () => {
    // Cron schedule: 0 0 * * 0 (Midnight every Sunday)
    // For testing: '0 * * * *' (Every hour) or '*/5 * * * *' (Every 5 mins)
    cron.schedule('0 0 * * 0', () => {
        console.log('⏰ Running weekly question pre-generation task...');
        
        const scriptPath = path.join(__dirname, '../../scripts/pre-generate-questions.js');
        
        // Run the script as a separate process to avoid blocking the main thread
        const job = spawn('node', [scriptPath]);

        job.stdout.on('data', (data) => {
            console.log(`[Cron Job Stats]: ${data}`);
        });

        job.stderr.on('data', (data) => {
            console.error(`[Cron Job Error]: ${data}`);
        });

        job.on('close', (code) => {
            console.log(`[Cron Job Finished] with code ${code}`);
        });
    });

    console.log('✅ Cron Scheduler Initialized: Weekly generation set for Sundays at 00:00');
};
