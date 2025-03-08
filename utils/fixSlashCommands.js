const fs = require('fs');
const path = require('path');

// Function to fix all slash command files
function fixSlashCommands() {
    const slashPath = path.join(__dirname, '..', 'slash');
    
    // Check if slash directory exists
    if (!fs.existsSync(slashPath)) {
        console.log('Slash directory not found.');
        return;
    }
    
    // Get all slash command files
    const slashFiles = fs.readdirSync(slashPath).filter(file => file.endsWith('.js'));
    
    for (const file of slashFiles) {
        try {
            const filePath = path.join(slashPath, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Check if the file has the [object Object] syntax error
            if (content.includes('data: [object Object]')) {
                // Extract command name from file name
                const commandName = file.replace('.js', '');
                
                // Get the description from the matching command file
                let description = 'No description provided';
                
                // Try to find the matching command file in commands directory
                const commandsPath = path.join(__dirname, '..', 'commands');
                const categories = fs.readdirSync(commandsPath);
                
                outerLoop:
                for (const category of categories) {
                    const categoryPath = path.join(commandsPath, category);
                    const commandFiles = fs.readdirSync(categoryPath).filter(cmdFile => cmdFile.endsWith('.js'));
                    
                    for (const cmdFile of commandFiles) {
                        if (cmdFile.replace('.js', '') === commandName) {
                            // Found matching command file, get description
                            const commandFilePath = path.join(categoryPath, cmdFile);
                            const commandModule = require(commandFilePath);
                            description = commandModule.description || description;
                            break outerLoop;
                        }
                    }
                }
                
                // Replace the [object Object] with proper SlashCommandBuilder
                const fixedContent = content.replace(
                    'data: [object Object]',
                    `data: new SlashCommandBuilder()
        .setName('${commandName}')
        .setDescription('${description.replace(/'/g, "\\'")}')`
                );
                
                // Write the fixed content back to the file
                fs.writeFileSync(filePath, fixedContent);
                console.log(`Fixed: ${file}`);
            } else {
                console.log(`Skipped: ${file} (already fixed)`);
            }
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }
    
    console.log('Finished fixing slash command files.');
}

// Run the function
fixSlashCommands(); 