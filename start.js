const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║                                                        ║');
console.log('║                 DISCORD BOT LAUNCHER                   ║');
console.log('║                                                        ║');
console.log('╚════════════════════════════════════════════════════════╝');

// Check if dashboard directory exists
if (!fs.existsSync(path.join(__dirname, 'dashboard'))) {
    console.error('Dashboard directory not found. Please make sure the dashboard is set up correctly.');
    process.exit(1);
}

// Function to start the main bot
function startBot() {
    console.log('\n[LAUNCHER] Starting Discord bot...');
    
    const bot = spawn('node', ['index.js'], {
        stdio: 'inherit',
        shell: true
    });
    
    bot.on('close', (code) => {
        if (code !== 0) {
            console.log(`\n[LAUNCHER] Discord bot process exited with code ${code}`);
            console.log('[LAUNCHER] Restarting Discord bot in 5 seconds...');
            setTimeout(startBot, 5000);
        }
    });
    
    return bot;
}

// Function to start the dashboard
function startDashboard() {
    console.log('\n[LAUNCHER] Starting Dashboard...');
    
    const dashboard = spawn('node', ['dashboard/index.js'], {
        stdio: 'inherit',
        shell: true
    });
    
    dashboard.on('close', (code) => {
        if (code !== 0) {
            console.log(`\n[LAUNCHER] Dashboard process exited with code ${code}`);
            console.log('[LAUNCHER] Restarting Dashboard in 5 seconds...');
            setTimeout(startDashboard, 5000);
        }
    });
    
    return dashboard;
}

// Start both applications
const botProcess = startBot();
const dashboardProcess = startDashboard();

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n[LAUNCHER] Shutting down all processes...');
    
    // Kill both processes
    if (botProcess) botProcess.kill();
    if (dashboardProcess) dashboardProcess.kill();
    
    // Exit the launcher
    process.exit(0);
});

// Log startup information
setTimeout(() => {
    const port = process.env.DASHBOARD_PORT || 3000;
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log('║                  STARTUP COMPLETE                      ║');
    console.log('║                                                        ║');
    console.log(`║  Dashboard URL: http://localhost:${port}                ${' '.repeat(Math.max(0, 8 - port.toString().length))}║`);
    console.log('║  Press Ctrl+C to stop all processes                    ║');
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
}, 3000); 