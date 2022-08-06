/**
 * @file Controllers for handling download of exported files.
 * @author Umar Abdul (https://github.com/4g3nt47)
 */

import fs from 'fs';

/**
 * Download an exported file, which could be course questions (.json) or results data (.xlsx).
 * @param req - The request object
 * @param res - The response object
 */
export const downloadExport = (req, res) => {

  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  let filename = req.params.filename;
  let path = `exports/${filename}`;
  res.download(path, filename, (err) => {
    if (!err)
      fs.unlink(path, () => {});
  });
};
