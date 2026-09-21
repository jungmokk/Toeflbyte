import { syncRecentNews } from '../src/services/newsService.js';

console.log("[Sync-News] Starting manual news synchronization...");

syncRecentNews()
    .then(() => {
        console.log("[Sync-News] Synchronization completed successfully.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("[Sync-News] Synchronization failed:", error);
        process.exit(1);
    });
