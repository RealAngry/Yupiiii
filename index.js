const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { connectToDatabase } = require('./utils/database');
const DisabledCommand = require('./models/DisabledCommand');
const { getCommandCategory } = require('./utils/commandUtils');
const { scheduleCleanupTasks } = require('./utils/cleanupTasks');
require('dotenv').config();

// Create client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildScheduledEvents
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction,
        Partials.ThreadMember
    ]
});

// Global variables
client.commands = new Collection();
client.aliases = new Collection();
client.slashCommands = new Collection(); // Separate collection for slash commands
client.categories = fs.readdirSync("./commands/");
client.prefix = process.env.PREFIX || "-";
client.afkUsers = new Map();
client.cooldowns = new Collection();
client.settings = new Map();
client.warnings = new Map();
client.spamTracker = new Map();
client.modlogs = new Map();
client.raidMode = new Map();
client.joinedMembers = new Map();
client.cases = new Collection(); // Collection for moderation cases
client.caseCount = 0; // Counter for case IDs
client.extraOwners = new Set(); // Set for extra bot owners
client.botInfo = {
    description: 'A versatile Discord bot with moderation, utility, and fun commands.',
    features: [
        'Moderation commands',
        'Utility tools',
        'Custom profiles',
        'Giveaway system',
        'And much more!'
    ],
    createdAt: Date.now(),
    lastUpdated: Date.now()
};

// Create folder structure if it doesn't exist
const directories = ['commands', 'events', 'utils', 'slash'];
const commandCategories = ['moderation', 'utility', 'config', 'automod'];

for (const dir of directories) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

for (const category of commandCategories) {
    const categoryPath = path.join(__dirname, 'commands', category);
    if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
    }
}

// Load regular commands
function loadCommands(directory) {
    const commandPath = path.join(__dirname, directory);
    const commandFolders = fs.readdirSync(commandPath);
    
    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(`${commandPath}/${folder}`).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandPath, folder, file);
            const command = require(filePath);
            
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if (command.name) {
                client.commands.set(command.name, command);
                console.log(`Loaded command: ${command.name}`);
                
                // If command has aliases, set them in the aliases collection
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => {
                        client.aliases.set(alias, command.name);
                    });
                }
            }
        }
    }
}

// Load slash commands
function loadSlashCommands(directory) {
    const slashCommandPath = path.join(__dirname, directory);
    
    if (!fs.existsSync(slashCommandPath)) {
        fs.mkdirSync(slashCommandPath, { recursive: true });
        console.log(`Created directory: ${directory}`);
        return; // Exit if directory was just created (no files yet)
    }
    
    const slashCommandFiles = fs.readdirSync(slashCommandPath).filter(file => file.endsWith('.js'));

    for (const file of slashCommandFiles) {
        const filePath = path.join(slashCommandPath, file);
        const command = require(filePath);

        if (command.data) {
            client.slashCommands.set(command.data.name, command);
            console.log(`Loaded slash command: ${command.data.name}`);
        }
    }
}

// Register slash commands with Discord API
async function registerSlashCommands() {
    try {
        const commands = [];
        client.slashCommands.forEach(command => {
            if (command.data) {
                commands.push(command.data.toJSON());
            }
        });

        if (commands.length > 0) {
            const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
            
            console.log('Started refreshing application (/) commands.');
            
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );
            
            console.log(`Successfully registered ${commands.length} application (/) commands.`);
        } else {
            console.log('No slash commands found to register.');
        }
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
}

// Handle process events
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

// SINGLE EVENT HANDLERS - NO DUPLICATES

// Ready event - runs when the bot is ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot prefix: ${client.prefix}`);
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Set bot status
    client.user.setPresence({
        activities: [{ 
            name: `Angry | ${client.prefix}help`, 
            type: 2 // 2 = Listening
        }],
        status: 'online'
    });
    
    // Load commands
    loadCommands('commands');
    loadSlashCommands('slash');
    
    console.log(`Loaded ${client.commands.size} regular commands and ${client.aliases.size} aliases`);
    console.log(`Loaded ${client.slashCommands.size} slash commands`);
    console.log(`Bot is ready to serve in ${client.guilds.cache.size} servers!`);
    
    // Register slash commands with Discord API
    await registerSlashCommands();
    
    // Schedule cleanup tasks
    scheduleCleanupTasks(client);
});

// Message event - handles ALL prefix commands
client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;

    const prefix = client.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Handle setprefix command directly
    if (commandName === 'setprefix') {
        const newPrefix = args[0];
        if (!newPrefix) return message.reply('Please provide a new prefix.');

        client.prefix = newPrefix;
        console.log(`Prefix updated to: ${newPrefix}`);
        return message.reply(`Prefix updated to: ${newPrefix}`);
    }

    // Find the command
    const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
    if (!command) {
        // Send a helpful message for unknown commands
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Command Not Found')
            .setDescription(`The command \`${commandName}\` was not found.`)
            .addFields(
                { name: 'Need Help?', value: `Use \`${prefix}help\` to see a list of all available commands.` },
                { name: 'Similar Commands', value: 'Here are some commands that might be similar:' }
            )
            .setFooter({ text: `Tip: You can also use slash commands like /${commandName}` });
        
        // Find similar commands based on name
        const similarCommands = [...client.commands.keys()].filter(cmd => 
            cmd.includes(commandName) || commandName.includes(cmd)
        ).slice(0, 3);
        
        if (similarCommands.length > 0) {
            embed.addFields({ 
                name: 'Did you mean?', 
                value: similarCommands.map(cmd => `\`${prefix}${cmd}\``).join('\n') 
            });
        }
        
        return message.reply({ embeds: [embed] });
    }

    // Check if command is disabled
    try {
        // Skip the check for enable/disable commands to prevent lockouts
        if (!['enablecommand', 'disablecommand', 'disabledcommands'].includes(command.name)) {
            const isDisabled = await DisabledCommand.isCommandDisabled(
                message.guild.id,
                message.channel.id,
                command.name
            );
            
            if (isDisabled) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Command Disabled')
                            .setDescription(`The \`${command.name}\` command is disabled in this channel or server.`)
                            .setColor('#FF5555')
                            .setFooter({ text: 'Contact a server admin if you believe this is a mistake.' })
                    ]
                });
            }
        }
    } catch (error) {
        console.error('Error checking if command is disabled:', error);
        // Continue with command execution even if the check fails
    }

    // Check permissions if specified
    if (command.permissions && !message.member.permissions.has(command.permissions)) {
        return message.reply("You don't have permission to use this command.");
    }

    // Handle cooldowns
    if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(
                `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
            );
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Execute command
    try {
        await command.execute(client, message, args);
    } catch (error) {
        console.error(`Error executing command ${command.name}:`, error);
        message.reply('There was an error executing that command! The error has been logged.');
        
        // Log detailed error information
        const errorEmbed = new EmbedBuilder()
            .setTitle('Command Error')
            .setDescription(`Error in command: ${command.name}`)
            .addFields(
                { name: 'Error Message', value: error.message || 'No error message' },
                { name: 'User', value: `${message.author.tag} (${message.author.id})` },
                { name: 'Guild', value: `${message.guild.name} (${message.guild.id})` },
                { name: 'Channel', value: `${message.channel.name} (${message.channel.id})` }
            )
            .setColor('#FF0000')
            .setTimestamp();
        
        // If there's a log channel configured, send the error there
        const logChannelId = client.settings.get(message.guild.id)?.logChannelId;
        if (logChannelId) {
            const logChannel = client.channels.cache.get(logChannelId);
            if (logChannel) {
                logChannel.send({ embeds: [errorEmbed] }).catch(console.error);
            }
        }
    }
});

// Interaction event - handles slash commands
client.on('interactionCreate', async interaction => {
    // Only handle chat input commands (slash commands)
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) {
        // Handle unknown slash commands
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Command Not Found')
            .setDescription(`The slash command \`/${interaction.commandName}\` was not found.`)
            .addFields(
                { name: 'Need Help?', value: 'Use `/help` to see a list of all available slash commands.' }
            );
        
        // Find similar commands based on name
        const similarCommands = [...client.slashCommands.keys()].filter(cmd => 
            cmd.includes(interaction.commandName) || interaction.commandName.includes(cmd)
        ).slice(0, 3);
        
        if (similarCommands.length > 0) {
            embed.addFields({ 
                name: 'Did you mean?', 
                value: similarCommands.map(cmd => `\`/${cmd}\``).join('\n') 
            });
        }
        
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if command is disabled
    try {
        // Skip the check for enable/disable commands to prevent lockouts
        if (!['enablecommand', 'disablecommand', 'disabledcommands'].includes(interaction.commandName)) {
            const isDisabled = await DisabledCommand.isCommandDisabled(
                interaction.guild.id,
                interaction.channel.id,
                interaction.commandName
            );
            
            if (isDisabled) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Command Disabled')
                            .setDescription(`The \`/${interaction.commandName}\` command is disabled in this channel or server.`)
                            .setColor('#FF5555')
                            .setFooter({ text: 'Contact a server admin if you believe this is a mistake.' })
                    ],
                    ephemeral: true
                });
            }
        }
    } catch (error) {
        console.error('Error checking if command is disabled:', error);
        // Continue with command execution even if the check fails
    }

    // Add a flag to track if this interaction has been handled
    interaction.isHandled = false;

    try {
        // Execute the command
        await command.execute(interaction, client);
        interaction.isHandled = true;
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        
        // Only try to reply if we haven't already
        if (!interaction.replied && !interaction.deferred && !interaction.isHandled) {
            try {
                await interaction.reply({ 
                    content: 'There was an error executing this command!', 
                    ephemeral: true 
                });
                interaction.isHandled = true;
            } catch (err) {
                // If we can't reply, it's likely because the interaction is no longer valid
                // Just log the error and continue
                console.error('Failed to send error response:', err);
            }
        }
    }
});

// Global process error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Load event handlers from files
const eventPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventPath).filter(file => file.endsWith('.js') && file !== 'interactionCreate.js');

for (const file of eventFiles) {
    const filePath = path.join(eventPath, file);
    const event = require(filePath);
    
    // Skip messageCreate and ready as we handle them directly
    if (['messageCreate', 'ready'].includes(event.name)) {
        console.log(`Skipping event: ${event.name} (handled directly in index.js)`);
        continue;
    }
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`Loaded event: ${event.name}`);
}

// Login to Discord
client.login(process.env.TOKEN).catch(err => {
    console.error('Failed to login to Discord:', err);
});

