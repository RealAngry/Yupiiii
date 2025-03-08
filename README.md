# Discord Bot with Dashboard

A powerful Discord bot with a web-based dashboard for easy management.

## Features

- **Discord Bot**: Full-featured Discord bot with moderation, fun, utility commands, and more
- **Web Dashboard**: Easy-to-use web interface for managing your bot
- **Single Launcher**: Start both the bot and dashboard with a single command

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure your `.env` file with the following variables:
   ```
   TOKEN=your_discord_bot_token
   PREFIX=-
   MONGODB_URI=your_mongodb_connection_string
   DASHBOARD_PORT=3000
   OWNER_ID=your_discord_user_id
   OPENWEATHER_API_KEY=your_openweather_api_key
   ```

3. Start the bot and dashboard:
   ```
   npm start
   ```
   
   Or on Windows, simply double-click the `start.bat` file.

## Available Commands

### Using npm

- `npm start` - Start both the bot and dashboard
- `npm run bot` - Start only the bot
- `npm run dashboard` - Start only the dashboard
- `npm run dev` - Start both with auto-restart on file changes (for development)

### Using the Launcher

The launcher provides a convenient way to start both the bot and dashboard with a single command:

```
node start.js
```

The launcher will:
- Start both the bot and dashboard
- Automatically restart them if they crash
- Provide a clean interface with status information

## Dashboard

The dashboard runs on `http://localhost:3000` (or the port you specified in your `.env` file) and provides:

- Server management
- Bot status control
- Global announcements
- Settings configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details. 