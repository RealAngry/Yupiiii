const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Display a list of available commands or info about a specific command',
    usage: 'help [command/category]',
    category: 'utility',
    aliases: ['commands', 'cmds', 'h'],
    cooldown: 5,
    examples: [
        'help',
        'help moderation',
        'help ban',
        'help embedbuilder',
        'help setwelcomechannel'
    ],
    execute(client, message, args) {
        const prefix = client.prefix;
        
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
        if (args.length === 1) {
            const commandName = args[0].toLowerCase();
            const command = client.commands.get(commandName) || 
                           client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            
            if (!command) {
                // Check if it's a category
                const categoryName = Object.keys(categories).find(cat => 
                    cat.toLowerCase() === commandName.toLowerCase()
                );
                
                if (categoryName) {
                    return showCategoryCommands(client, message, categoryName, categories[categoryName]);
                }
                
                return message.reply(`Command or category \`${commandName}\` not found. Use \`${prefix}help\` to see all categories.`);
            }
            
            return showCommandDetails(client, message, command);
        }
        
        // Show main help menu with categories only
        const embed = new EmbedBuilder()
            .setTitle('Dash Bot Command Categories')
            .setDescription(`Welcome to Dash Bot's help menu! This bot offers a wide range of features including moderation, utility tools, custom profiles, and more.\n\nUse \`${prefix}help [category]\` to view commands in a category.\nUse \`${prefix}help [command]\` for detailed information about a specific command.`)
            .setColor('#00FFFF')
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Bot Information', value: `Prefix: \`${prefix}\`\nServers: ${client.guilds.cache.size}\nCommands: ${client.commands.size}\nSlash Commands: ${client.slashCommands.size}` }
            )
            .setFooter({ text: `Type ${prefix}help [category] to see commands in that category` })
            .setTimestamp();
        
        // Add categories list with descriptions
        const categoryDescriptions = {
            'moderation': 'Commands for server moderation like ban, kick, mute, nuke, etc.',
            'utility': 'Useful tools like userinfo, serverinfo, ping, embedbuilder, etc.',
            'config': 'Server configuration commands like setprefix, setwelcomechannel, etc.',
            'automod': 'Automatic moderation features like antiraid, antispam, etc.',
            'fun': 'Fun commands like shayari, meme, motivation, facts, etc.',
            'roles': 'Role management commands like bothumanrole, etc.'
        };
        
        const categoryList = Object.keys(categories).map(category => {
            const description = categoryDescriptions[category.toLowerCase()] || `${category} related commands`;
            return `• **${category}** (${categories[category].length} commands) - ${description}`;
        });
        
        embed.addFields({ name: 'Categories', value: categoryList.join('\n') });
        
        // Add featured commands section
        embed.addFields({ 
            name: 'Featured Commands', 
            value: `🔸 \`${prefix}embedbuilder\` - Create and preview custom embeds using JSON\n` +
                   `🔸 \`${prefix}setwelcomechannel message\` - Customize welcome messages with variables\n` +
                   `🔸 \`${prefix}profileedit\` - Edit your profile information\n` +
                   `🔸 \`${prefix}shayari\` - Get beautiful shayari in different categories\n` +
                   `🔸 \`${prefix}meme\` - Get memes from various categories\n` +
                   `🔸 \`${prefix}serverinfo\` - View detailed server information\n` +
                   `🔸 \`${prefix}bothumanrole\` - Automatically assign roles to bots and humans`
        });
        
        // Add quick examples
        embed.addFields({ 
            name: 'Quick Examples', 
            value: `\`${prefix}help moderation\` - View all moderation commands\n` +
                   `\`${prefix}help ban\` - View details about the ban command\n` +
                   `\`${prefix}embedbuilder preview {"title":"Test","description":"Test embed"}\` - Preview an embed\n` +
                   `\`${prefix}shayari love\` - Get love shayari\n` +
                   `\`${prefix}meme dank\` - Get dank memes\n` +
                   `\`${prefix}bothumanrole @BotRole @HumanRole\` - Set roles for bots and humans`
        });
        
        message.reply({ embeds: [embed] });
    }
};

// Function to show details about a specific command
function showCommandDetails(client, message, command) {
    const embed = new EmbedBuilder()
        .setTitle(`Command: ${command.name}`)
        .setDescription(command.description || 'No description provided')
        .setColor('#00FFFF')
        .addFields(
            { name: 'Category', value: command.category || 'Uncategorized', inline: true },
            { name: 'Cooldown', value: `${command.cooldown || 3} seconds`, inline: true }
        )
        .setFooter({ text: `Type ${client.prefix}help for all categories` })
        .setTimestamp();
    
    // Add usage
    if (command.usage) {
        embed.addFields({ name: 'Usage', value: `\`${client.prefix}${command.usage}\`` });
    }
    
    // Add aliases if any
    if (command.aliases && command.aliases.length) {
        embed.addFields({ name: 'Aliases', value: command.aliases.map(a => `\`${a}\``).join(', ') });
    }
    
    // Add examples if any
    if (command.examples && command.examples.length) {
        embed.addFields({ 
            name: 'Examples', 
            value: command.examples.map(e => `\`${client.prefix}${e}\``).join('\n') 
        });
    } else {
        // Generate a basic example if none provided
        embed.addFields({ 
            name: 'Example', 
            value: `\`${client.prefix}${command.name}${command.usage ? ' ' + command.usage.split(' ').slice(1).join(' ') : ''}\`` 
        });
    }
    
    // Add permissions if any
    if (command.permissions) {
        const permissionNames = Array.isArray(command.permissions) 
            ? command.permissions.map(p => formatPermission(p)).join(', ')
            : formatPermission(command.permissions);
        
        embed.addFields({ name: 'Required Permissions', value: permissionNames });
    }
    
    // Add slash command info if available
    if (client.slashCommands.has(command.name)) {
        embed.addFields({ 
            name: 'Slash Command', 
            value: `This command is also available as a slash command: \`/${command.name}\`` 
        });
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
    } else if (command.name === 'shayari') {
        embed.addFields({ 
            name: 'Categories', 
            value: 'Available categories: `love`, `sad`, `friendship`, `motivational`, `life`, `funny`\n' +
                   'Use `shayari categories` to see all available categories.'
        });
    } else if (command.name === 'meme') {
        embed.addFields({ 
            name: 'Categories', 
            value: 'Available categories: `indian`, `dank`, `wholesome`, `programming`, `anime`, `gaming`, `animals`\n' +
                   'Use `meme categories` to see all available categories.'
        });
    } else if (command.name === 'bothumanrole') {
        embed.addFields({ 
            name: 'Note', 
            value: 'This command will automatically assign roles to all bots and humans in your server. Make sure the bot has the necessary permissions to manage roles.'
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
    
    message.reply({ embeds: [embed] });
}

// Function to show commands in a specific category
function showCategoryCommands(client, message, categoryName, commands) {
    const embed = new EmbedBuilder()
        .setTitle(`${categoryName} Commands`)
        .setDescription(`Here are all the commands in the ${categoryName} category.\nUse \`${client.prefix}help [command]\` for more details on a command.`)
        .setColor('#00FFFF')
        .setFooter({ text: `Type ${client.prefix}help for all categories` })
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
            return `• \`${cmd.name}\` - ${cmd.description ? cmd.description.split('.')[0] : 'No description'}${hasExample ? `\n  Example: \`${client.prefix}${cmd.examples[0]}\`` : ''}`;
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
            value: `🔸 \`${client.prefix}embedbuilder\` - Create and preview custom embeds using JSON\n` +
                   `🔸 \`${client.prefix}profile\` - View your or another user's profile\n` +
                   `🔸 \`${client.prefix}profileedit\` - Edit your profile information\n` +
                   `🔸 \`${client.prefix}weather\` - Get weather information for any location\n` +
                   `🔸 \`${client.prefix}serverinfo\` - View detailed server information`
        });
    } else if (categoryName.toLowerCase() === 'config') {
        embed.addFields({ 
            name: 'Featured Config Commands', 
            value: `🔸 \`${client.prefix}setwelcomechannel\` - Set and customize welcome messages\n` +
                   `🔸 \`${client.prefix}setprefix\` - Change the bot's command prefix\n` +
                   `🔸 \`${client.prefix}setlogchannel\` - Set a channel for logging events\n` +
                   `🔸 \`${client.prefix}botstatus\` - Change the bot's status and activity`
        });
    } else if (categoryName.toLowerCase() === 'moderation') {
        embed.addFields({ 
            name: 'Featured Moderation Commands', 
            value: `🔸 \`${client.prefix}nuke\` - Completely clear a channel by cloning and deleting it\n` +
                   `🔸 \`${client.prefix}ban\` - Ban a user from the server\n` +
                   `🔸 \`${client.prefix}timeout\` - Timeout a user for a specified duration\n` +
                   `🔸 \`${client.prefix}cases\` - Manage and view moderation cases`
        });
    }
    
    message.reply({ embeds: [embed] });
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