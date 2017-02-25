/**
 * Sets up the bunyan logger.
 * @file
 */

import _ from 'lodash';
import { createLogger } from 'bunyan';
import BunyanSlack from 'bunyan-slack';
import config from '../config';

const {
  LEVEL,
  ENABLED,
  WEBHOOK_URL,
  USERNAME,
  CHANNEL,
} = config.SLACK_LOGGING;

const {
  IS_MASTER,
  IS_WORKER,
} = config;

/**
 * A mapping of log levels to hex colors.
 * @type {object<string>}
 */
const colors = {
  FATAL: '#c63012',
  ERROR: '#e59e12',
  INFO: '#1281c6',
  DEBUG: '#36a64f',
  TRACE: '#d6d6d6',
};

/**
 * Formats messages for slack output.
 * @see https://api.slack.com/docs/message-formatting
 * @param {string} message The bunyan JSON message.
 * @param {string} lvl The log level of "message".
 * @returns {object} A slack formatted JSON message.
 * @export
 */
export function slackMessageFormatter(message, lvl) {
  const { hostname, name, msg, pid, err } = message;
  const level = lvl.toUpperCase();
  const color = colors[level] || colors.INFO;
  const text = _.isObject(err) && err.stack ? err.stack : msg;

  return {
    text: `*${hostname}*\n_${name}_ \`${pid}\``,
    attachments: [{ title: level, text, color }],
  };
}

/**
 * A list of streams to pipe log messages to.
 * @type {Array<object>}
 */
const streams = [
  {
    level: process.env.LOG_LEVEL || 'debug',
    stream: process.stdout,
  },
];

// If slack logging is enabled, add the slack stream.
if (ENABLED && IS_MASTER) {
  streams.push({
    type: 'raw',
    level: LEVEL,
    stream: new BunyanSlack({
      webhook_url: WEBHOOK_URL,
      channel: CHANNEL,
      username: USERNAME,
      customFormatter: slackMessageFormatter,
    }),
  });
}

export default createLogger({
  name: IS_WORKER ? `Worker ${config.WORKER_NUM}` : 'Master',
  streams,
});
