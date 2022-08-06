/**
 * @file The routes for the event logs API endpoints.
 * @author Umar Abdul (https://github.com/4g3nt47)
 */

import {Router} from 'express';
import {getLogs} from '../models/event-log.js';

const router = Router();

router.get("/:limit", (req, res) => {
  
  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  getLogs(parseInt(req.params.limit)).then(logs => {
    return res.json(logs);
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
});

export default router;
