# Discord Bot Dashboard

A web-based dashboard for managing your Discord bot. This dashboard allows you to:

- View all servers your bot is in
- Configure server-specific settings
- Manage bot status and activity
- Send global announcements to all servers
- Monitor bot performance

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Make sure your `.env` file contains the following variables:
   ```
   TOKEN=your_discord_bot_token
   DASHBOARD_PORT=3000
   ```

3. Start the dashboard:
   ```
   npm start
   ```

4. For development with auto-restart:
   ```
   npm run dev
   ```

5. Access the dashboard at `http://localhost:3000`

## Features

### Server Management
- View all servers the bot is in
- Configure server-specific settings
- View server statistics

### Bot Status
- Change bot status (online, idle, dnd, invisible)
- Set custom activity and activity type
- Use preset statuses

### Announcements
- Send global announcements to all servers
- Preview announcements before sending
- View detailed results of sent announcements

## Folder Structure

```
dashboard/
├── index.js           # Main server file
├── package.json       # Dependencies
├── public/            # Static assets
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   └── img/           # Images
├── views/             # EJS templates
│   ├── home.ejs       # Home page
│   ├── server.ejs     # Server management page
│   ├── bot-status.ejs # Bot status page
│   └── announcements.ejs # Announcements page
└── README.md          # This file
```

## Security Note

This dashboard does not include authentication by default. It is intended for personal use only. If you plan to make this dashboard accessible over the internet, you should implement proper authentication to prevent unauthorized access.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 