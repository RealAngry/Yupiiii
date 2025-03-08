const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Set up and manage a ticket system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up the ticket system')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel where the ticket panel will be displayed')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Create a ticket panel in the configured channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close the current ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('The reason for closing the ticket')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the current ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add to the ticket')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the current ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from the ticket')
                        .setRequired(true))),
    
    async execute(interaction, client) {
        // Initialize tickets collection if it doesn't exist
        if (!client.tickets) {
            client.tickets = {
                channels: new Map(),
                configs: new Map(),
                count: new Map()
            };
        }
        
        const subCommand = interaction.options.getSubcommand();
        
        // Handle setup subcommand
        if (subCommand === 'setup') {
            // Check if user has permission to manage guild
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ 
                    content: 'You need the `Manage Server` permission to set up the ticket system.',
                    ephemeral: true 
                });
            }
            
            // Get channel from option
            const channel = interaction.options.getChannel('channel');
            
            // Save ticket configuration
            client.tickets.configs.set(interaction.guild.id, {
                channelId: channel.id,
                supportRoleIds: [],
                categoryId: null,
                createdAt: Date.now(),
                lastUpdated: Date.now()
            });
            
            // Initialize ticket count for this guild
            if (!client.tickets.count.has(interaction.guild.id)) {
                client.tickets.count.set(interaction.guild.id, 0);
            }
            
            const embed = new EmbedBuilder()
                .setTitle('Ticket System Setup')
                .setDescription(`Ticket system has been set up successfully. Ticket panel channel: ${channel}`)
                .setColor('#00FF00')
                .setFooter({ text: `Setup by ${interaction.user.tag}` })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        }
        
        // Handle panel subcommand
        if (subCommand === 'panel') {
            // Check if user has permission to manage guild
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ 
                    content: 'You need the `Manage Server` permission to create a ticket panel.',
                    ephemeral: true 
                });
            }
            
            // Check if ticket system is set up
            if (!client.tickets.configs.has(interaction.guild.id)) {
                return interaction.reply({ 
                    content: 'Ticket system is not set up. Use `/ticket setup` to set it up.',
                    ephemeral: true 
                });
            }
            
            const config = client.tickets.configs.get(interaction.guild.id);
            const channel = interaction.guild.channels.cache.get(config.channelId);
            
            if (!channel) {
                return interaction.reply({ 
                    content: 'The ticket channel no longer exists. Please set up the ticket system again.',
                    ephemeral: true 
                });
            }
            
            // Create ticket panel embed
            const embed = new EmbedBuilder()
                .setTitle('🎫 Support Ticket System')
                .setDescription('Click the button below to create a support ticket. Our team will assist you as soon as possible.')
                .setColor('#00FFFF')
                .addFields(
                    { name: 'Guidelines', value: 'Please provide a clear description of your issue when creating a ticket.' },
                    { name: 'Response Time', value: 'Our team typically responds within 24 hours.' }
                )
                .setFooter({ text: `${interaction.guild.name} Support` })
                .setTimestamp();
            
            // Create button for ticket creation
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_create')
                        .setLabel('Create Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );
            
            // Send panel to the configured channel
            await channel.send({ embeds: [embed], components: [row] });
            
            return interaction.reply({ 
                content: `Ticket panel has been created in ${channel}.`,
                ephemeral: true 
            });
        }
        
        // Handle close subcommand
        if (subCommand === 'close') {
            // Check if the current channel is a ticket
            if (!client.tickets.channels.has(interaction.channel.id)) {
                return interaction.reply({ 
                    content: 'This command can only be used in a ticket channel.',
                    ephemeral: true 
                });
            }
            
            const ticketData = client.tickets.channels.get(interaction.channel.id);
            
            // Get reason if provided
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            // Create log embed
            const logEmbed = new EmbedBuilder()
                .setTitle(`Ticket #${ticketData.number} Closed`)
                .setDescription(`Ticket created by <@${ticketData.userId}> has been closed.`)
                .addFields(
                    { name: 'Closed By', value: `<@${interaction.user.id}>` },
                    { name: 'Reason', value: reason }
                )
                .setColor('#FF0000')
                .setFooter({ text: `Ticket ID: ${interaction.channel.id}` })
                .setTimestamp();
            
            // Notify the user that the ticket is being closed
            await interaction.reply({ 
                content: 'This ticket will be closed in 5 seconds...',
                embeds: [logEmbed]
            });
            
            // Remove from tickets collection
            client.tickets.channels.delete(interaction.channel.id);
            
            // Wait 5 seconds then delete the channel
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    console.error(`Error deleting ticket channel: ${error}`);
                }
            }, 5000);
            
            return;
        }
        
        // Handle add subcommand
        if (subCommand === 'add') {
            // Check if the current channel is a ticket
            if (!client.tickets.channels.has(interaction.channel.id)) {
                return interaction.reply({ 
                    content: 'This command can only be used in a ticket channel.',
                    ephemeral: true 
                });
            }
            
            // Get user from option
            const user = interaction.options.getUser('user');
            
            // Add user to the ticket channel
            try {
                await interaction.channel.permissionOverwrites.edit(user.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
                
                return interaction.reply(`Added ${user} to the ticket.`);
            } catch (error) {
                console.error(`Error adding user to ticket: ${error}`);
                return interaction.reply({ 
                    content: `Failed to add ${user} to the ticket. Error: ${error.message}`,
                    ephemeral: true 
                });
            }
        }
        
        // Handle remove subcommand
        if (subCommand === 'remove') {
            // Check if the current channel is a ticket
            if (!client.tickets.channels.has(interaction.channel.id)) {
                return interaction.reply({ 
                    content: 'This command can only be used in a ticket channel.',
                    ephemeral: true 
                });
            }
            
            // Get user from option
            const user = interaction.options.getUser('user');
            
            // Get ticket data
            const ticketData = client.tickets.channels.get(interaction.channel.id);
            
            // Don't allow removing the ticket creator
            if (user.id === ticketData.userId) {
                return interaction.reply({ 
                    content: 'You cannot remove the ticket creator from the ticket.',
                    ephemeral: true 
                });
            }
            
            // Remove user from the ticket channel
            try {
                await interaction.channel.permissionOverwrites.delete(user.id);
                
                return interaction.reply(`Removed ${user} from the ticket.`);
            } catch (error) {
                console.error(`Error removing user from ticket: ${error}`);
                return interaction.reply({ 
                    content: `Failed to remove ${user} from the ticket. Error: ${error.message}`,
                    ephemeral: true 
                });
            }
        }
    }
};