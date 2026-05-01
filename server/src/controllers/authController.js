import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";
import Simulator from "../models/Simulator.js";
import { generateToken } from "../utils/generateToken.js";

// @desc   Register new user
// @route  POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    await Portfolio.create({ user: user._id });
    await Simulator.create({ user: user._id });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      disciplineScore: user.disciplineScore,
      watchlist: user.watchlist,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error("REGISTER ERROR ❌", error);

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
};

// @desc   Login user
// @route  POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    disciplineScore: user.disciplineScore,
    riskTolerance: user.riskTolerance,
    watchlist: user.watchlist,
    token: generateToken(user._id),
  });
};

// @desc   Get current user profile
// @route  GET /api/auth/me
export const getMe = async (req, res) => {
  res.json(req.user);
};

// @desc   Update profile
// @route  PUT /api/auth/me
export const updateProfile = async (req, res) => {
  const { name, tradingGoal, riskTolerance, watchlist } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (tradingGoal) user.tradingGoal = tradingGoal;
  if (riskTolerance) user.riskTolerance = riskTolerance;
  if (watchlist) user.watchlist = watchlist;

  await user.save();
  res.json(user);
};

// @desc   Change password
// @route  PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: "Password updated successfully" });
};