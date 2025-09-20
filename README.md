# pm2-restart-hook [![NPM Version](https://img.shields.io/npm/v/pm2-restart-hook?style=flat&logo=npm)](https://www.npmjs.com/package/pm2-restart-hook) [![License](https://img.shields.io/npm/l/pm2-restart-hook?style=flat)](LICENSE)

A simple and lightweight PM2 module that creates a parent-child dependency between your applications, automatically restarting child processes when their designated parent application is restarted

### Features

`pm2-restart-hook` offers several key features for better process management:

-   **Dependency Management**: Easily create a parent-child relationship between any PM2-managed applications
-   **Automated Cascading Restarts**: When a parent app restarts, all its children are automatically restarted
-   **Highly Configurable**: Customize behavior using environment variables, with sensible defaults for zero-configuration use
-   **Lightweight & Simple**: No external dependencies beyond PM2 itself

### Requirements

- PM2 v5.0.0+

### Installation

You can install the module directly from NPM:

```bash
pm2 install pm2-restart-hook
```

### How It Works

The hook identifies the parent-child relationship using a simple environment variable. When a parent application restarts, the hook finds all other applications that have their `PM2_PARENT_APP` environment variable set to the parent's name and restarts them

### Usage Example

The best way to manage parent-child applications is with an `ecosystem.config.js` file

1.  **Create your applications.** For this example, we'll use a placeholder script `dummy-app.js`
2.  **Define the relationship in `ecosystem.config.js`:**

```js
// ecosystem.config.js

module.exports = {
  apps: [
    // 1. The Parent Application
    {
      name: 'api-server',
      script: 'api.js',
      // Common reasons for automated restarts
      max_memory_restart: '500M',
      cron_restart: '0 2 * * *', // Restart every day at 2 AM
    },

    // 2. Child Worker #1
    {
      name: 'email-worker',
      script: 'worker.js',
      env: {
        // This links the worker to its parent.
        // The value MUST match the parent's 'name'.
        PM2_PARENT_APP: 'api-server',
      },
    },

    // 3. Child Worker #2
    {
      name: 'analytics-worker',
      script: 'worker.js',
      env: {
        PM2_PARENT_APP: 'api-server',
      },
    },
  ],
};
```

3.  **Start your applications:**

```bash
pm2 start ecosystem.config.js
```

Now, whenever `api-server` restarts (whether from its cron schedule, memory limit, or a manual command), `email-worker` and `analytics-worker` will be gracefully restarted one after another

### Configuration

You can configure the hook's behavior by setting variables on the module itself using the `pm2 set` command

| Environment Variable         | Description                                                                                             | Default            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------ |
| `PARENT_ENV_KEY`             | The environment variable key used to identify the parent app                                            | `PM2_PARENT_APP`   |
| `IGNORE_MANUAL_RESTARTS`     | If set to `true`, manual restarts (`pm2 restart <app>`) will be ignored                                 | `true`             |
| `CHILD_RESTART_DELAY_MS`     | The delay in milliseconds between restarting each child process to prevent system overload              | `200`              |

**Example of setting a configuration variable:**

```bash
# Make the hook to not ignore manual restarts
pm2 set pm2-restart-hook:IGNORE_MANUAL_RESTARTS false

# Change the restart delay to 1 second
pm2 set pm2-restart-hook:CHILD_RESTART_DELAY_MS 1000
```

### Thanks To

-   You for viewing or using this project
-   The Keymetrics team for creating and maintaining the powerful PM2 process manager

### License

This project is licensed under the MIT [License](LICENSE).
