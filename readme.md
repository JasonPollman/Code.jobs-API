# Code.jobs API Server

## Commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| *npm run start*     | Compiles the source code, then starts the server with the environment set to ``production`` |
| *npm run start-dev* | Starts the server using ``babel-node`` and with the environment set to ``development`` |
| *npm run watch*     | Runs ``npm run start-dev`` and restarts on file changes using ``nodemon`` |
| *npm run compile*   | Compiles the source code to the ``dist`` directory |
| *npm run lint*      | Runs ``eslint`` against the ``src`` directory |


## CLI Flags

| Flag          | Description                              |
| ------------- | ---------------------------------------- |
| ``--workers`` | The number of cluster worker processes to spawn. Default is *os.cpus().length* |


## Environment Variables

| Variable     | Description                              |
| ------------ | ---------------------------------------- |
| **NODE_ENV** | The environment to run                   |
| **DEBUG**    | Used by the *debug* module to determine whether or not to output debug logs. For this application *DEBUG=api.\** will output all debugging information. Each file has it's own debug name, for example, in *cluster.js* it's *api-cluster*. |


## Technologies


### Cluster
The native node *cluster* module for distributing the http load across multiple processes. By default the server will launch *os.cpus().length* workers, you can change this behavior by setting the ``--workers`` flag.


### Express
This API uses the ``express`` module and a number of popular middlewares, including:

##### Morgan
Request file and stdout logging.

##### Connect Roles
For route based permissions.