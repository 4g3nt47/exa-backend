/**
 * @file This file implements functions used for logging events.
 * @author Umar Abdul (https://github.com/4g3nt47)
 */

import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  date: {
    type: Number,
    required: true,
  },
  logType: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    required: true
  }
});

// Apply and export.
export const EventLog = mongoose.model("event_logs", logSchema);
export default EventLog;

/**
 * Create a status log.
 * @param {string} message - The log message.
 */
export const logStatus = async (message) => {

  const log = new EventLog({
    date: Date.now(),
    logType: 0,
    message: message.toString()
  });
  return (await log.save());
};

/**
 * Create a warning log.
 * @param {string} message - The log message.
 */
export const logWarning = async (message) => {

  const log = new EventLog({
    date: Date.now(),
    logType: 1,
    message: message.toString()
  });
  return (await log.save());
};

/**
 * Create an error log.
 * @param {string} message - The log message.
 */
export const logError = async (message) => {

  const log = new EventLog({
    date: Date.now(),
    logType: 2,
    message: message.toString()
  });
  return (await log.save());
};

/**
 * Get an array of event logs, sorted from newest to oldest.
 * @param {number} limit - The max number of logs to fetch.
 * @return {object} An array of event logs.
 */
export const getLogs = async (limit) => {
  return (await EventLog.find({}, null, {limit: parseInt(limit), sort: {date: -1}}));
};
