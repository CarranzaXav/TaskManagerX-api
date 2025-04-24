const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcrypt");

const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").lean();

  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }
  res.json(users);
};

//Create Controller
const createNewUser = async (req, res) => {
  const { username, password, email, roles } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  const hashedPwd = await bcrypt.hash(password, 10);

  const userObject =
    !Array.isArray(roles) || !roles.length
      ? { username, password: hashedPwd, email }
      : { username, password: hashedPwd, email, roles };

  const user = await User.create(userObject);

  if (user) {
    res.status(201).json({ message: `New user ${username} created` });
  } else {
    res.status(400).json({ message: "Invalid user data recieved" });
  }
};

//Update controller
const updateUser = async (req, res) => {
  const { id, username, email, roles, active, password } = req.body;
  // Confirm data
  if (
    !id ||
    !username ||
    !email ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    console.log("Validation Failed: ", req.body);
    return res
      .status(400)
      .json({ message: "All fields except password required" });
  }

  //No User found
  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  //Check for Duplicates
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(400).json({ message: "Duplicate username" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;
  user.email = email;

  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }

  const updateUser = await user.save();

  res.json({ message: `${updateUser.username} updated` });
};

// Delete Controller
const deleteUser = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
  }
  // Check for remaining active Tasks
  const task = await Task.findOne({ user: id }).lean().exec();
  if (task) {
    return res.status(400).json({ message: "User still has active Tasks" });
  }
  // Verify User exist
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User does not exist" });
  }

  const result = await user.deleteOne();

  const reply = `Username ${result.username} with ID ${result._id} deleted`;

  res.json(reply);
};

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
