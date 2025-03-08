const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'backup',
    description: 'Create or load a backup of bot data (Owner only)',
    usage: 'backup <create/load> [name]',
    category: 'owner',
    aliases: ['botbackup', 'savedata'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 30,
    examples: [
        'backup create',
        'backup create weekly',
        'backup load latest',
        'backup list'
    ],
    async execute(client, message, args) {
        // Check if user is the bot owner
        if (message.author.id !== process.env.OWNER_ID && !client.extraOwners.has(message.author.id)) {
            return message.reply('This command can only be used by the bot owner.');
        }

        // Create backups directory if it doesn't exist
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        // If no args, show help
        if (!args.length) {
            return showHelp(message);
        }

        const action = args[0].toLowerCase();
        const backupName = args[1] || `backup_${Date.now()}`;

        switch (action) {
            case 'create':
                return createBackup(client, message, backupName);
            
            case 'load':
                return loadBackup(client, message, backupName);
            
            case 'list':
                return listBackups(message);
            
            default:
                return showHelp(message);
        }
    }
};

// Function to show help
function showHelp(message) {
    const embed = new EmbedBuilder()
        .setTitle('Backup Command Help')
        .setDescription('Create or load backups of bot data')
        .addFields(
            { name: 'Create Backup', value: '`backup create [name]`\nCreates a new backup with optional name' },
            { name: 'Load Backup', value: '`backup load <name>`\nLoads a backup by name' },
            { name: 'List Backups', value: '`backup list`\nLists all available backups' }
        )
        .setColor('#00FFFF')
        .setFooter({ text: 'Only bot owners can use this command' })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Function to create a backup
async function createBackup(client, message, backupName) {
    try {
        // Create loading message
        const loadingMessage = await message.reply('Creating backup, please wait...');
        
        // Prepare data to backup
        const backupData = {
            timestamp: Date.now(),
            name: backupName,
            settings: {},
            botInfo: client.botInfo
        };
        
        // Backup guild settings
        for (const [guildId, settings] of client.settings.entries()) {
            backupData.settings[guildId] = settings;
        }
        
        // Save to file
        const backupPath = path.join(process.cwd(), 'backups', `${backupName}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        
        // Create success embed
        const embed = new EmbedBuilder()
            .setTitle('Backup Created')
            .setDescription(`Successfully created backup: \`${backupName}\``)
            .addFields(
                { name: 'Timestamp', value: new Date(backupData.timestamp).toLocaleString() },
                { name: 'Guild Settings', value: `${Object.keys(backupData.settings).length} guilds` },
                { name: 'File Location', value: backupPath }
            )
            .setColor('#00FF00')
            .setFooter({ text: 'Use backup load to restore this backup' })
            .setTimestamp();
        
        // Edit loading message with success embed
        await loadingMessage.edit({ content: null, embeds: [embed] });
        
        return true;
    } catch (error) {
        console.error('Error creating backup:', error);
        await message.reply(`Error creating backup: ${error.message}`);
        return false;
    }
}

// Function to load a backup
async function loadBackup(client, message, backupName) {
    try {
        // Check if backup exists
        const backupPath = path.join(process.cwd(), 'backups', `${backupName}.json`);
        
        if (!fs.existsSync(backupPath)) {
            // If backup name is "latest", try to find the most recent backup
            if (backupName === 'latest') {
                const backups = getBackupsList();
                if (backups.length === 0) {
                    return message.reply('No backups found.');
                }
                
                // Sort backups by timestamp (newest first)
                backups.sort((a, b) => b.timestamp - a.timestamp);
                
                // Use the most recent backup
                const latestBackup = backups[0];
                return loadBackup(client, message, latestBackup.name);
            }
            
            return message.reply(`Backup \`${backupName}\` not found. Use \`backup list\` to see available backups.`);
        }
        
        // Create confirmation message
        const confirmEmbed = new EmbedBuilder()
            .setTitle('Confirm Backup Load')
            .setDescription(`Are you sure you want to load backup \`${backupName}\`?\nThis will overwrite current bot data.`)
            .setColor('#FFA500')
            .setFooter({ text: 'Reply with "yes" to confirm or "no" to cancel' })
            .setTimestamp();
        
        const confirmMessage = await message.reply({ embeds: [confirmEmbed] });
        
        // Create message collector for confirmation
        const filter = m => m.author.id === message.author.id && ['yes', 'no'].includes(m.content.toLowerCase());
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });
        
        collector.on('collect', async m => {
            if (m.content.toLowerCase() === 'yes') {
                // Create loading message
                await confirmMessage.edit({ content: 'Loading backup, please wait...', embeds: [] });
                
                // Load backup data
                const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
                
                // Restore guild settings
                client.settings.clear();
                for (const [guildId, settings] of Object.entries(backupData.settings)) {
                    client.settings.set(guildId, settings);
                }
                
                // Restore bot info
                if (backupData.botInfo) {
                    client.botInfo = backupData.botInfo;
                }
                
                // Create success embed
                const successEmbed = new EmbedBuilder()
                    .setTitle('Backup Loaded')
                    .setDescription(`Successfully loaded backup: \`${backupName}\``)
                    .addFields(
                        { name: 'Timestamp', value: new Date(backupData.timestamp).toLocaleString() },
                        { name: 'Guild Settings', value: `${Object.keys(backupData.settings).length} guilds` }
                    )
                    .setColor('#00FF00')
                    .setTimestamp();
                
                // Edit loading message with success embed
                await confirmMessage.edit({ content: null, embeds: [successEmbed] });
            } else {
                // Cancel loading
                await confirmMessage.edit({ content: 'Backup loading cancelled.', embeds: [] });
            }
        });
        
        collector.on('end', collected => {
            if (collected.size === 0) {
                confirmMessage.edit({ content: 'Backup loading cancelled (timed out).', embeds: [] });
            }
        });
        
        return true;
    } catch (error) {
        console.error('Error loading backup:', error);
        await message.reply(`Error loading backup: ${error.message}`);
        return false;
    }
}

// Function to list backups
function listBackups(message) {
    try {
        const backups = getBackupsList();
        
        if (backups.length === 0) {
            return message.reply('No backups found.');
        }
        
        // Sort backups by timestamp (newest first)
        backups.sort((a, b) => b.timestamp - a.timestamp);
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('Available Backups')
            .setDescription(`Found ${backups.length} backups`)
            .setColor('#00FFFF')
            .setFooter({ text: 'Use backup load <name> to load a backup' })
            .setTimestamp();
        
        // Add backups to embed (up to 25)
        const maxBackups = Math.min(backups.length, 25);
        for (let i = 0; i < maxBackups; i++) {
            const backup = backups[i];
            embed.addFields({
                name: backup.name,
                value: `Created: ${new Date(backup.timestamp).toLocaleString()}\nGuilds: ${Object.keys(backup.settings).length}`
            });
        }
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error listing backups:', error);
        return message.reply(`Error listing backups: ${error.message}`);
    }
}

// Helper function to get list of backups
function getBackupsList() {
    const backupDir = path.join(process.cwd(), 'backups');
    const backupFiles = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
    
    const backups = [];
    
    for (const file of backupFiles) {
        try {
            const backupPath = path.join(backupDir, file);
            const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            
            backups.push({
                name: backupData.name || file.replace('.json', ''),
                timestamp: backupData.timestamp || 0,
                settings: backupData.settings || {}
            });
        } catch (error) {
            console.error(`Error reading backup file ${file}:`, error);
        }
    }
    
    return backups;
} 