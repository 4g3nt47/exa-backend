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

export const EventLog = mongoose.model("event_logs", logSchema);
export default EventLog;

export const logStatus = async (message) => {

  const log = new EventLog({
    date: Date.now(),
    logType: 0,
    message: message.toString()
  });
  return (await log.save());
};

export const logWarning = async (message) => {

  const log = new EventLog({
    date: Date.now(),
    logType: 1,
    message: message.toString()
  });
  return (await log.save());
};

export const logError = async (message) => {

  const log = new EventLog({
    date: Date.now(),
    logType: 2,
    message: message.toString()
  });
  return (await log.save());
};

export const getLogs = async (limit) => {
  return (await EventLog.find({}, null, {limit: parseInt(limit), sort: {date: -1}}));
};
