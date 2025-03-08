const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    name: 'ticket',
    description: 'Set up and manage a ticket system',
    usage: 'ticket [setup/close/add/remove]',
    category: 'utility',
    aliases: ['tickets'],
    permissions: PermissionFlagsBits.ManageGuild,
    cooldown: 5,
    examples: [
        'ticket setup #tickets',
        'ticket close',
        'ticket add @user',
        'ticket remove @user'
    ],
    async execute(client, message, args) {
        // Initialize tickets collection if it doesn't exist
        if (!client.tickets) {
            client.tickets = {
                channels: new Map(),
                configs: new Map(),
                count: new Map()
            };
        }
        
        const subCommand = args[0]?.toLowerCase();
        
        if (!subCommand || !['setup', 'close', 'add', 'remove', 'panel'].includes(subCommand)) {
            const embed = new EmbedBuilder()
                .setTitle('Ticket System Help')
                .setDescription('Set up and manage a ticket system')
                .addFields(
                    { name: 'Setup Ticket System', value: `\`${client.prefix}ticket setup #channel\`` },
                    { name: 'Create Ticket Panel', value: `\`${client.prefix}ticket panel\`` },
                    { name: 'Close a Ticket', value: `\`${client.prefix}ticket close [reason]\`` },
                    { name: 'Add User to Ticket', value: `\`${client.prefix}ticket add @user\`` },
                    { name: 'Remove User from Ticket', value: `\`${client.prefix}ticket remove @user\`` }
                )
                .setColor('#00FFFF')
                .setFooter({ text: 'Ticket System' });
            
            return message.reply({ embeds: [embed] });
        }
        
        // Handle setup subcommand
        if (subCommand === 'setup') {
            // Check if user has permission to manage guild
            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply('You need the `Manage Server` permission to set up the ticket system.');
            }
            
            // Get channel from mention or ID
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
            
            if (!channel) {
                return message.reply(`Please specify a channel. Usage: \`${client.prefix}ticket setup #channel\``);
            }
            
            // Check if channel is a text channel
            if (channel.type !== ChannelType.GuildText) {
                return message.reply('The specified channel must be a text channel.');
            }
            
            // Save ticket configuration
            client.tickets.configs.set(message.guild.id, {
                channelId: channel.id,
                supportRoleIds: [],
                categoryId: null,
                createdAt: Date.now(),
                lastUpdated: Date.now()
            });
            
            // Initialize ticket count for this guild
            if (!client.tickets.count.has(message.guild.id)) {
                client.tickets.count.set(message.guild.id, 0);
            }
            
            const embed = new EmbedBuilder()
                .setTitle('Ticket System Setup')
                .setDescription(`Ticket system has been set up successfully. Ticket panel channel: ${channel}`)
                .setColor('#00FF00')
                .setFooter({ text: `Setup by ${message.author.tag}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Handle panel subcommand
        if (subCommand === 'panel') {
            // Check if user has permission to manage guild
            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply('You need the `Manage Server` permission to create a ticket panel.');
            }
            
            // Check if ticket system is set up
            if (!client.tickets.configs.has(message.guild.id)) {
                return message.reply(`Ticket system is not set up. Use \`${client.prefix}ticket setup #channel\` to set it up.`);
            }
            
            const config = client.tickets.configs.get(message.guild.id);
            const channel = message.guild.channels.cache.get(config.channelId);
            
            if (!channel) {
                return message.reply('The ticket channel no longer exists. Please set up the ticket system again.');
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
                .setFooter({ text: `${message.guild.name} Support` })
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
            
            return message.reply(`Ticket panel has been created in ${channel}.`);
        }
        
        // Handle close subcommand
        if (subCommand === 'close') {
            // Check if the current channel is a ticket
            if (!client.tickets.channels.has(message.channel.id)) {
                return message.reply('This command can only be used in a ticket channel.');
            }
            
            const ticketData = client.tickets.channels.get(message.channel.id);
            
            // Get reason if provided
            const reason = args.slice(1).join(' ') || 'No reason provided';
            
            // Create log embed
            const logEmbed = new EmbedBuilder()
                .setTitle(`Ticket #${ticketData.number} Closed`)
                .setDescription(`Ticket created by <@${ticketData.userId}> has been closed.`)
                .addFields(
                    { name: 'Closed By', value: `<@${message.author.id}>` },
                    { name: 'Reason', value: reason }
                )
                .setColor('#FF0000')
                .setFooter({ text: `Ticket ID: ${message.channel.id}` })
                .setTimestamp();
            
            // Notify the user that the ticket is being closed
            await message.reply({ 
                content: 'This ticket will be closed in 5 seconds...',
                embeds: [logEmbed]
            });
            
            // Remove from tickets collection
            client.tickets.channels.delete(message.channel.id);
            
            // Wait 5 seconds then delete the channel
            setTimeout(async () => {
                try {
                    await message.channel.delete();
                } catch (error) {
                    console.error(`Error deleting ticket channel: ${error}`);
                }
            }, 5000);
            
            return;
        }
        
        // Handle add subcommand
        if (subCommand === 'add') {
            // Check if the current channel is a ticket
            if (!client.tickets.channels.has(message.channel.id)) {
                return message.reply('This command can only be used in a ticket channel.');
            }
            
            // Get user from mention
            const user = message.mentions.users.first();
            
            if (!user) {
                return message.reply(`Please mention a user to add. Usage: \`${client.prefix}ticket add @user\``);
            }
            
            // Add user to the ticket channel
            try {
                await message.channel.permissionOverwrites.edit(user.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
                
                return message.reply(`Added ${user} to the ticket.`);
            } catch (error) {
                console.error(`Error adding user to ticket: ${error}`);
                return message.reply(`Failed to add ${user} to the ticket. Error: ${error.message}`);
            }
        }
        
        // Handle remove subcommand
        if (subCommand === 'remove') {
            // Check if the current channel is a ticket
            if (!client.tickets.channels.has(message.channel.id)) {
                return message.reply('This command can only be used in a ticket channel.');
            }
            
            // Get user from mention
            const user = message.mentions.users.first();
            
            if (!user) {
                return message.reply(`Please mention a user to remove. Usage: \`${client.prefix}ticket remove @user\``);
            }
            
            // Get ticket data
            const ticketData = client.tickets.channels.get(message.channel.id);
            
            // Don't allow removing the ticket creator
            if (user.id === ticketData.userId) {
                return message.reply('You cannot remove the ticket creator from the ticket.');
            }
            
            // Remove user from the ticket channel
            try {
                await message.channel.permissionOverwrites.delete(user.id);
                
                return message.reply(`Removed ${user} from the ticket.`);
            } catch (error) {
                console.error(`Error removing user from ticket: ${error}`);
                return message.reply(`Failed to remove ${user} from the ticket. Error: ${error.message}`);
            }
        }
    }
}; 