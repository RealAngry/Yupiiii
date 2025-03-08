const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display a list of available commands or info about a specific command')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command to get info about')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The category to view commands from')
                .setRequired(false)),
    
    async execute(interaction, client) {
        const commandName = interaction.options.getString('command');
        const categoryName = interaction.options.getString('category');
        
        // Group commands by category
        const categories = {};
        client.commands.forEach(cmd => {
            const category = cmd.category || 'Uncategorized';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(cmd);
        });
        
        // If a specific command is requested
        if (commandName) {
            const command = client.commands.get(commandName) || 
                           client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            
            if (!command) {
                return interaction.reply({ 
                    content: `Command \`${commandName}\` not found. Use \`/help\` to see all categories.`,
                    ephemeral: true 
                });
            }
            
            return showCommandDetails(interaction, client, command);
        }
        
        // If a category is requested
        if (categoryName) {
            const category = Object.keys(categories).find(cat => 
                cat.toLowerCase() === categoryName.toLowerCase()
            );
            
            if (!category) {
                return interaction.reply({ 
                    content: `Category \`${categoryName}\` not found. Use \`/help\` to see all categories.`,
                    ephemeral: true 
                });
            }
            
            return showCategoryCommands(interaction, client, category, categories[category]);
        }
        
        // Show main help menu with categories only
        const embed = new EmbedBuilder()
            .setTitle('Dash Bot Command Categories')
            .setDescription(`Welcome to Dash Bot's help menu! This bot offers a wide range of features including moderation, utility tools, custom profiles, and more.\n\nUse \`/help category:[category_name]\` to view commands in a category.\nUse \`/help command:[command_name]\` for detailed information about a specific command.`)
            .setColor('#00FFFF')
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Bot Information', value: `Servers: ${client.guilds.cache.size}\nCommands: ${client.commands.size}\nSlash Commands: ${client.slashCommands.size}` }
            )
            .setFooter({ text: `Use /help category:[category_name] to see commands in that category` })
            .setTimestamp();
        
        // Add categories list with descriptions
        const categoryDescriptions = {
            'moderation': 'Commands for server moderation like ban, kick, mute, nuke, etc.',
            'utility': 'Useful tools like userinfo, serverinfo, weather, ping, embedbuilder, etc.',
            'config': 'Server configuration commands like setprefix, setwelcomechannel, etc.',
            'automod': 'Automatic moderation features like antiraid, antispam, etc.'
        };
        
        const categoryList = Object.keys(categories).map(category => {
            const description = categoryDescriptions[category.toLowerCase()] || `${category} related commands`;
            return `• **${category}** (${categories[category].length} commands) - ${description}`;
        });
        
        embed.addFields({ name: 'Categories', value: categoryList.join('\n') });
        
        // Add featured commands section
        embed.addFields({ 
            name: 'Featured Commands', 
            value: `🔸 \`/embedbuilder\` - Create and preview custom embeds using JSON\n` +
                   `🔸 \`/setwelcomechannel\` - Set and customize welcome messages with variables\n` +
                   `🔸 \`/profileedit\` - Edit your profile information\n` +
                   `🔸 \`/weather\` - Get weather information for any location\n` +
                   `🔸 \`/serverinfo\` - View detailed server information\n` +
                   `🔸 \`/nuke\` - Completely clear a channel by cloning and deleting it\n` +
                   `🔸 \`/botstatus\` - Change the bot's status and activity`
        });
        
        // Add quick examples
        embed.addFields({ 
            name: 'Quick Examples', 
            value: `/help command:ban - View details about the ban command\n` +
                   `/help category:moderation - View all moderation commands\n` +
                   `/embedbuilder preview - Preview an embed with JSON\n` +
                   `/setwelcomechannel variables - Show welcome message variables\n` +
                   `/weather location:New York - Get weather for New York\n` +
                   `/botstatus status:online activity:playing text:with commands - Change bot status`
        });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};

// Function to show details about a specific command
async function showCommandDetails(interaction, client, command) {
    const embed = new EmbedBuilder()
        .setTitle(`Command: ${command.name}`)
        .setDescription(command.description || 'No description provided')
        .setColor('#00FFFF')
        .addFields(
            { name: 'Category', value: command.category || 'Uncategorized', inline: true },
            { name: 'Cooldown', value: `${command.cooldown || 3} seconds`, inline: true }
        )
        .setFooter({ text: `Use /help for all categories` })
        .setTimestamp();
    
    // Add usage
    if (command.usage) {
        embed.addFields({ name: 'Usage', value: `\`${command.usage}\`` });
    }
    
    // Add aliases if any
    if (command.aliases && command.aliases.length) {
        embed.addFields({ name: 'Aliases', value: command.aliases.map(a => `\`${a}\``).join(', ') });
    }
    
    // Add examples if any
    if (command.examples && command.examples.length) {
        embed.addFields({ 
            name: 'Examples', 
            value: command.examples.map(e => `\`${e}\``).join('\n') 
        });
    } else if (command.usage) {
        // Generate a basic example if none provided
        embed.addFields({ 
            name: 'Example', 
            value: `\`${command.usage}\`` 
        });
    }
    
    // Add permissions if any
    if (command.permissions) {
        const permissionNames = Array.isArray(command.permissions) 
            ? command.permissions.map(p => formatPermission(p)).join(', ')
            : formatPermission(command.permissions);
        
        embed.addFields({ name: 'Required Permissions', value: permissionNames });
    }
    
    // Check if there's a slash command version
    const slashVersion = client.slashCommands.get(command.name);
    if (slashVersion) {
        embed.addFields({ name: 'Slash Command', value: `This command is also available as \`/${command.name}\`` });
    }
    
    // Add special notes for certain commands
    if (command.name === 'embedbuilder') {
        embed.addFields({ 
            name: 'JSON Properties', 
            value: 'You can use these properties in your JSON:\n' +
                   '`title`, `description`, `color`, `url`, `timestamp`, `thumbnail`, `image`, `author`, `footer`, `fields`'
        });
    } else if (command.name === 'setwelcomechannel') {
        embed.addFields({ 
            name: 'Welcome Variables', 
            value: 'You can use these variables in welcome messages:\n' +
                   '`{user}`, `{username}`, `{tag}`, `{id}`, `{server}`, `{memberCount}`, `{createdAt}`, `{userAvatar}`'
        });
    } else if (command.name === 'weather') {
        embed.addFields({ 
            name: 'Note', 
            value: 'This command requires an OpenWeatherMap API key to be set in the environment variables as `OPENWEATHER_API_KEY`.'
        });
    } else if (command.name === 'botstatus') {
        embed.addFields({ 
            name: 'Status Options', 
            value: 'Available status options: `online`, `idle`, `dnd`, `invisible`\n' +
                   'Available activity types: `playing`, `streaming`, `listening`, `watching`, `competing`'
        });
    } else if (command.name === 'nuke') {
        embed.addFields({ 
            name: 'Warning', 
            value: 'This command will completely delete the channel and create a new one with the same settings. All messages will be permanently deleted.'
        });
    }
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Function to show commands in a specific category
async function showCategoryCommands(interaction, client, categoryName, commands) {
    const embed = new EmbedBuilder()
        .setTitle(`${categoryName} Commands`)
        .setDescription(`Here are all the commands in the ${categoryName} category.\nUse \`/help command:[command_name]\` for more details on a command.`)
        .setColor('#00FFFF')
        .setFooter({ text: `Use /help for all categories` })
        .setTimestamp();
    
    // Group commands by functionality
    const groupedCommands = {};
    
    // Try to group commands by common prefixes or functionality
    commands.forEach(cmd => {
        let group = 'General';
        
        // Check for common prefixes
        if (cmd.name.startsWith('set')) group = 'Settings';
        else if (cmd.name.includes('ban')) group = 'Bans';
        else if (cmd.name.includes('mute') || cmd.name.includes('timeout')) group = 'Mutes';
        else if (cmd.name.includes('channel')) group = 'Channels';
        else if (cmd.name.includes('role')) group = 'Roles';
        else if (cmd.name.includes('anti')) group = 'Protection';
        else if (cmd.name.includes('profile')) group = 'Profiles';
        else if (cmd.name === 'embedbuilder') group = 'Embeds';
        else if (cmd.name === 'weather') group = 'Information';
        else if (cmd.name === 'serverinfo' || cmd.name === 'userinfo') group = 'Information';
        else if (cmd.name === 'nuke') group = 'Moderation';
        else if (cmd.name === 'botstatus') group = 'Bot Management';
        
        if (!groupedCommands[group]) {
            groupedCommands[group] = [];
        }
        groupedCommands[group].push(cmd);
    });
    
    // Add each group to the embed
    Object.keys(groupedCommands).forEach(group => {
        const commandList = groupedCommands[group].map(cmd => {
            const hasExample = cmd.examples && cmd.examples.length > 0;
            const slashAvailable = client.slashCommands.has(cmd.name) ? ' (Also available as slash command)' : '';
            return `• \`${cmd.name}\` - ${cmd.description ? cmd.description.split('.')[0] : 'No description'}${slashAvailable}${hasExample ? `\n  Example: \`${cmd.examples[0]}\`` : ''}`;
        });
        
        // Split command list into chunks of appropriate size to avoid exceeding Discord's 1024 character limit
        const chunks = splitIntoChunks(commandList.join('\n\n'), 1000);
        
        // Add each chunk as a separate field
        chunks.forEach((chunk, index) => {
            embed.addFields({ 
                name: chunks.length > 1 ? `${group} Commands (${index + 1}/${chunks.length})` : `${group} Commands`, 
                value: chunk
            });
        });
    });
    
    // Add featured commands for certain categories
    if (categoryName.toLowerCase() === 'utility') {
        embed.addFields({ 
            name: 'Featured Utility Commands', 
            value: `🔸 \`/embedbuilder\` - Create and preview custom embeds using JSON\n` +
                   `🔸 \`/profile\` - View your or another user's profile\n` +
                   `🔸 \`/profileedit\` - Edit your profile information\n` +
                   `🔸 \`/weather\` - Get weather information for any location\n` +
                   `🔸 \`/serverinfo\` - View detailed server information`
        });
    } else if (categoryName.toLowerCase() === 'config') {
        embed.addFields({ 
            name: 'Featured Config Commands', 
            value: `🔸 \`/setwelcomechannel\` - Set and customize welcome messages\n` +
                   `🔸 \`/setprefix\` - Change the bot's command prefix\n` +
                   `🔸 \`/setlogchannel\` - Set a channel for logging events\n` +
                   `🔸 \`/botstatus\` - Change the bot's status and activity`
        });
    } else if (categoryName.toLowerCase() === 'moderation') {
        embed.addFields({ 
            name: 'Featured Moderation Commands', 
            value: `🔸 \`/nuke\` - Completely clear a channel by cloning and deleting it\n` +
                   `🔸 \`/ban\` - Ban a user from the server\n` +
                   `🔸 \`/timeout\` - Timeout a user for a specified duration\n` +
                   `🔸 \`/cases\` - Manage and view moderation cases`
        });
    }
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Helper function to format permission names
function formatPermission(permission) {
    return permission.toString()
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

// Helper function to split text into chunks of specified max length
function splitIntoChunks(text, maxLength) {
    const chunks = [];
    const lines = text.split('\n\n');
    let currentChunk = '';
    
    for (const line of lines) {
        // If adding this line would exceed the max length, push current chunk and start a new one
        if (currentChunk.length + line.length + 2 > maxLength) {
            chunks.push(currentChunk);
            currentChunk = line;
        } else {
            // Otherwise, add the line to the current chunk
            currentChunk += (currentChunk ? '\n\n' : '') + line;
        }
    }
    
    // Push the last chunk if it's not empty
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}