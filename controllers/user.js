const model = require('../models/user');

exports.registerUser = (req, res) => {
  
  let {username, password} = req.body;
  if (!(username && password))
    return res.status(404).json({error: "Required params not defined!"});
  model.createUser(username, password).then(user => {
    return res.json({success: "Account created!"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

exports.loginUser = (req, res) => {

  let {username, password} = req.body;
  if (!(username && password))
    return res.status(404).json({error: "Required params not defined!"});
  model.loginUser(username, password).then(user => {
    model.setupSession(req.session, user);
    return res.json({success: "Authentication successful!"});
  }).catch(error => {
    console.log(error);
    return res.status(403).json({error: error.message});
  });
};

exports.userProfile = (req, res) => {

  if (req.session.loggedIn !== true)
    return res.status(403).json({error: "Permission denied!"});
  return res.json(req.session.user);
};
