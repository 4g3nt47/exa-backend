// Controller funcs for the main index.js file

import fs from 'fs';

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
