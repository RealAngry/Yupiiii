const fs = require('fs');
const path = require('path');

// Cache for command categories
let commandCategories = null;

/**
 * Load all command categories from the commands directory
 * @returns {Object} Object mapping command names to their categories
 */
function loadCommandCategories() {
    if (commandCategories) return commandCategories;
    
    commandCategories = {};
    const commandsPath = path.join(process.cwd(), 'commands');
    const categories = fs.readdirSync(commandsPath).filter(file => 
        fs.statSync(path.join(commandsPath, file)).isDirectory()
    );
    
    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = require(path.join(categoryPath, file));
            if (command.name) {
                commandCategories[command.name] = category;
                
                // Also add aliases if they exist
                if (command.aliases && Array.isArray(command.aliases)) {
                    for (const alias of command.aliases) {
                        commandCategories[alias] = category;
                    }
                }
            }
        }
    }
    
    return commandCategories;
}

/**
 * Get the category of a command
 * @param {string} commandName - The name of the command
 * @returns {string|null} The category of the command, or null if not found
 */
function getCommandCategory(commandName) {
    const categories = loadCommandCategories();
    return categories[commandName] || null;
}

/**
 * Get all commands in a category
 * @param {string} category - The category to get commands for
 * @returns {Array} Array of command names in the category
 */
function getCommandsInCategory(category) {
    const categories = loadCommandCategories();
    return Object.keys(categories).filter(cmd => categories[cmd] === category);
}

/**
 * Get all categories
 * @returns {Array} Array of unique category names
 */
function getAllCategories() {
    const categories = loadCommandCategories();
    return [...new Set(Object.values(categories))];
}

module.exports = {
    getCommandCategory,
    getCommandsInCategory,
    getAllCategories
}; 