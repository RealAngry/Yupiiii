const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

// Function to convert regular commands to slash commands
function convertToSlash() {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const slashPath = path.join(__dirname, '..', 'slash');
    
    // Create slash directory if it doesn't exist
    if (!fs.existsSync(slashPath)) {
        fs.mkdirSync(slashPath);
    }
    
    // Read all command categories
    const categories = fs.readdirSync(commandsPath);
    
    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
        
        for (const file of files) {
            const filePath = path.join(categoryPath, file);
            const command = require(filePath);
            
            // Log command name and description
            console.log(`Converting command: ${command.name}, Description: ${command.description}`);
            
            // Create slash command data
            const slashCommand = new SlashCommandBuilder()
                .setName(command.name)
                .setDescription(command.description || 'No description provided');
            
            // Create the slash command file content
            const slashContent = `const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: ${slashCommand.toJSON()},
    async execute(interaction) {
        // Convert the regular command to work with interactions
        try {
            // Create a mock message object for compatibility
            const message = {
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                member: interaction.member,
                reply: (content) => interaction.reply(content)
            };
            
            // Get args from options if needed
            const args = [];
            
            // Execute the command
            await require('../commands/${category}/${file}').execute(interaction.client, message, args);
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error executing this command!',
                ephemeral: true 
            });
        }
    }
};`;
            
            // Write the slash command file
            const slashFilePath = path.join(slashPath, `${command.name}.js`);
            fs.writeFileSync(slashFilePath, slashContent);
            
            console.log(`Converted ${command.name} to slash command`);
        }
    }
    
    console.log('Finished converting commands to slash commands');
}

// Run the conversion
convertToSlash(); 