# Code.jobs API Server



## Commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| *npm run start*     | Compiles the source code, then starts the server with the environment set to ``production`` |
| *npm run start-dev* | Starts the server using ``babel-node`` and with the environment set to ``development`` |
| *npm run watch*     | Runs ``npm run start-dev`` and restarts on file changes using ``nodemon`` |
| *npm run compile*   | Compiles the source code to the ``dist`` directory |
| *npm run lint*      | Runs ``eslint`` against the ``src`` directory |



## Environment Variables

See ``config.json`` for descriptions and usage for available environment variables.



## Features

- **Automatic Database Setup**    
  Powered by *Sequelize*, a ``setup.js`` file is provided to make setup easy.
- **Clustering**    
  A fully functional node cluster with per environment configuration.
- **Configuration Based Route/Middleware Disabling**    
  Disable routes/middleware for certain environments and enable them in others, all within ``config.json``.
- **Redis Caching**    
  Database ``SELECT`` statements are cached for each data model using *redis* and automagically invalidated when the model record is updated or deleted.
- **Automatic Route generation**    
  Cachable CRUD routes for data models can be automatically generated using the ``createCachableCRUDRoutes()``
  method in ``/src/lib/auto-route.js``.
- **Heartbeat Statuses**    
  The master and each worker will emit a *heartbeat* *status* every ``HEARTBEAT_INTERVAL`` milliseconds to *redis*, containing valuable memory and cpu usage information. This information can be viewed by **admin users** by visiting the ``/ping`` route.
- **Request Limiter**    
  Limit the number of requests per minute per IP using ``SERVER_REQUESTS_PER_MINUTE_LIMIT``. However, you can set this to to zero (0) to disable request limits.
- **Slack Notifications**    
  If enabled, ``SLACK_LOGGING`` will send log messages with a specificity ``>= SLACK_LOGGING_LEVEL``
  to the specified slack webhook url.
- **Application Validation**    
  Each application that uses the API must be registered in the database and submit their *uuid* with each request within the ``X-Application-Identifier`` header. For unauthorized apps, all responses sent back are ``401`` (unauthorized).
- **Database Request/Response Logging**




## Database Setup

1. Create a database *service account* with basic CRUD credentials for the desired schema (database).
2. Add the account information and schema name to ``config.json`` under ``[ENV|*].DATABASE``.
3. Run ``FIRST_RUN=true DATABASE_SYNC='force' npm run start-dev``




**Note: The ``FIRST_RUN`` script will not run in a production ``NODE_ENV``**



#### The setup script will…

- **Create the *roles*, *permissions*, and *rolePermissions* tables and populate them with all the records needed by the API.** 

  Additional roles/permissions can be added for front-end use. However, it's imperative that your run this setup for the API to function properly—otherwise **routes won't work for any non-admin user**.


- **The *Code Jobs Frontend* application will also be inserted into the *applications* table.**    

  An application is an authorized program that can use the API. Each request must have an ``X-Application-Identifier`` header with the value of the *uuid* stored in the database for the respective application. If this header isn't present, then the response status will be ``401`` and **an unauthorized message will be sent back to the user.**