import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";

export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOneAndUpdate({ clerkId: userId }, req.body, {
    new: true,
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const syncUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ clerkId: userId });
    if (existingUser) {
      console.log(`User already exists for Clerk ID: ${userId}`);
      return res
        .status(200)
        .json({ user: existingUser, message: "User already exists" });
    }

    // 2. Fetch user data from Clerk
    console.log(`Fetching Clerk user data for ID: ${userId}`);
    const clerkUser = await clerkClient.users.getUser(userId);

    if (!clerkUser) {
      console.error(`Clerk user data not found for ID: ${userId}`);
      return res.status(404).json({ error: "Clerk user data not found" });
    }

    // 3. Prepare user data for MongoDB
    const userData = {
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      // Use a more robust way to create a username,
      // as email might not always be present or valid
      username:
        clerkUser.username ||
        clerkUser.emailAddresses[0]?.emailAddress.split("@")[0],
      profilePicture: clerkUser.imageUrl || "",
    };

    console.log("Creating new user in database with data:", userData);

    // 4. Create the new user in MongoDB
    const newUser = await User.create(userData);

    res
      .status(201)
      .json({ user: newUser, message: "User created successfully" });
  } catch (error) {
    console.error("Error in syncUser controller:", error);
    // This will send the specific error message back, which is crucial for debugging
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const followUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { targetUserId } = req.params;

  if (userId === targetUserId)
    return res.status(400).json({ error: "You cannot follow yourself" });

  const currentUser = await User.findOne({ clerkId: userId });
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser)
    return res.status(404).json({ error: "User not found" });

  const isFollowing = currentUser.following.includes(targetUserId);

  if (isFollowing) {
    // unfollow
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUser._id },
    });
  } else {
    // follow
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $push: { followers: currentUser._id },
    });

    // create notification
    await Notification.create({
      from: currentUser._id,
      to: targetUserId,
      type: "follow",
    });
  }

  res.status(200).json({
    message: isFollowing
      ? "User unfollowed successfully"
      : "User followed successfully",
  });
});
