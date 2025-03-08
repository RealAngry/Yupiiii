const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'reload',
    description: 'Reload a command or all commands',
    usage: 'reload [command/all]',
    category: 'owner',
    aliases: ['refresh'],
    ownerOnly: true,
    cooldown: 3,
    examples: [
        'reload ping',
        'reload all'
    ],
    
    async execute(client, message, args) {
        // Check if user is the bot owner
        if (message.author.id !== process.env.OWNER_ID && !client.extraOwners?.includes(message.author.id)) {
            return message.reply('Only the bot owner can use this command.');
        }
        
        // Check if command name is provided
        if (!args.length) {
            return message.reply('Please provide a command name to reload, or use `all` to reload all commands.');
        }
        
        const commandName = args[0].toLowerCase();
        
        // If reloading all commands
        if (commandName === 'all') {
            return reloadAllCommands(client, message);
        }
        
        // Find command by name or alias
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        // If command not found
        if (!command) {
            return message.reply(`Could not find command \`${commandName}\`.`);
        }
        
        // Get command category
        const category = command.category;
        
        // Get command file path
        const commandPath = path.join(process.cwd(), 'commands', category, `${command.name}.js`);
        
        // Check if command file exists
        if (!fs.existsSync(commandPath)) {
            return message.reply(`Could not find command file for \`${command.name}\`.`);
        }
        
        // Delete command from cache
        delete require.cache[require.resolve(commandPath)];
        
        try {
            // Load command
            const newCommand = require(commandPath);
            
            // Set command
            client.commands.set(newCommand.name, newCommand);
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Command Reloaded')
                .setDescription(`Successfully reloaded command \`${newCommand.name}\`.`)
                .setColor('#00FF00')
                .setTimestamp()
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
            
            // Send embed
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(`Error reloading command \`${command.name}\`:\n\`\`\`${error.message}\`\`\``)
                .setColor('#FF0000')
                .setTimestamp()
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
            
            // Send embed
            message.reply({ embeds: [embed] });
        }
    }
};

// Function to reload all commands
async function reloadAllCommands(client, message) {
    // Send loading message
    const loadingMsg = await message.channel.send('Reloading all commands, please wait...');
    
    // Get commands directory
    const commandsDir = path.join(process.cwd(), 'commands');
    
    // Get categories
    const categories = fs.readdirSync(commandsDir).filter(file => fs.statSync(path.join(commandsDir, file)).isDirectory());
    
    // Track success and errors
    const results = {
        success: [],
        errors: []
    };
    
    // Loop through categories
    for (const category of categories) {
        // Get command files
        const commandFiles = fs.readdirSync(path.join(commandsDir, category)).filter(file => file.endsWith('.js'));
        
        // Loop through command files
        for (const file of commandFiles) {
            // Get command name
            const commandName = file.split('.')[0];
            
            // Get command path
            const commandPath = path.join(commandsDir, category, file);
            
            try {
                // Delete command from cache
                delete require.cache[require.resolve(commandPath)];
                
                // Load command
                const command = require(commandPath);
                
                // Set command
                client.commands.set(command.name, command);
                
                // Add to success
                results.success.push(command.name);
            } catch (error) {
                // Add to errors
                results.errors.push({ name: commandName, error: error.message });
            }
        }
    }
    
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Commands Reloaded')
        .setDescription(`Reloaded ${results.success.length} commands.`)
        .setColor(results.errors.length > 0 ? '#FFFF00' : '#00FF00')
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
    // Add success field if there are successful reloads
    if (results.success.length > 0) {
        embed.addFields({ 
            name: 'Successfully Reloaded', 
            value: results.success.map(name => `\`${name}\``).join(', ') 
        });
    }
    
    // Add errors field if there are errors
    if (results.errors.length > 0) {
        embed.addFields({ 
            name: 'Failed to Reload', 
            value: results.errors.map(err => `\`${err.name}\`: ${err.error}`).join('\n') 
        });
    }
    
    // Edit loading message
    loadingMsg.edit({ content: null, embeds: [embed] });
} 