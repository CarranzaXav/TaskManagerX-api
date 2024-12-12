const User = require("../models/User");
const Task = require("../models/Task");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const getAllTasks = async (req, res) => {
  const tasks = await Task.find().lean();

  if (!tasks?.length) {
    return res.status(400).json({ message: "No task found" });
  }

  // add username to each task before sending the response
  const tasksWithUser = await Promise.all(
    tasks.map(async (task) => {
      const user = await User.findById(task.user).lean().exec();
      return { ...task, username: user.username };
    })
  );
  res.json(tasksWithUser);
};

// Create Task Controller
const createNewTask = asyncHandler(async (req, res) => {
  const { user, areas, text } = req.body

  console.log("Received Data:", {user,areas,text})

  if (!user || !areas || !text) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const taskObject = { user, areas, text };

  const task = await Task.create(taskObject);
  if (task) {
    res.status(201).json({ message: "New task created" });
  } else {
    res.status(400).json({ message: "Invalid user data recieved" });
  }
});

// Update Task Controller
const updateTask = asyncHandler(async (req, res) => {
  const { id, user, areas, text, completed } = req.body;
  if (!id || !user || !areas || !text || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields required" });
  }

  //No Task Found
  const task = await Task.findById(id).exec();
  if (!task) {
    return res.status(400).json({ message: "No Task found" });
  }
  task.user = user;
  task.areas = areas;
  task.text = text;
  task.completed = completed;

  const updateTask = await task.save();

  res.json({ message: `${updateTask.user} updated` });
});

// Delete Task Controller
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "Task ID Required" });
  }

  const task = await Task.findById(id).exec();

  if (!task) {
    return res.status(400).json({ message: "Task does not exist" });
  }
  const result = await task.deleteOne();

  const reply = `Task ${result.id} deleted`;

  res.json(reply);
});

module.exports = {
  getAllTasks,
  createNewTask,
  updateTask,
  deleteTask,
};
