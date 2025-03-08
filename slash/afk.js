const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set your AFK status to let others know you are away')
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for being AFK')
                .setRequired(false)),
    async execute(interaction) {
        try {
            const { client } = interaction;
            
            // Check if user is already AFK
            if (client.afkUsers.has(interaction.user.id)) {
                return interaction.reply({
                    content: 'You are already AFK!',
                    ephemeral: true
                });
            }
            
            // Get reason from options
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            // Set user as AFK
            client.afkUsers.set(interaction.user.id, {
                timestamp: Date.now(),
                reason: reason,
                pings: [], // Track pings while AFK
                pingCount: 0 // Count of pings
            });
            
            // Create embed
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle('AFK Status Set')
                .setDescription(`I've set your AFK status: ${reason}`)
                .setColor('#FFA500')
                .setFooter({ text: 'You\'ll be marked as returned once you send a message' })
                .setTimestamp();
            
            // Try to set nickname with [AFK] prefix if in a guild
            if (interaction.guild && interaction.member.manageable) {
                const originalNick = interaction.member.displayName;
                const newNick = originalNick.length > 26 ? 
                    `[AFK] ${originalNick.substring(0, 23)}...` : 
                    `[AFK] ${originalNick}`;
                
                try {
                    await interaction.member.setNickname(newNick);
                    
                    // Store original nickname
                    client.afkUsers.get(interaction.user.id).originalNick = originalNick;
                } catch (err) {
                    console.error(`Failed to set AFK nickname: ${err}`);
                }
            }
            
            // Send response
            await interaction.reply({ embeds: [embed] });
            console.log(`[AFK] ${interaction.user.tag} set AFK status: ${reason}`);
        } catch (error) {
            console.error('[AFK] Error in slash command:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'There was an error executing this command!',
                    ephemeral: true 
                });
            }
        }
    }
};