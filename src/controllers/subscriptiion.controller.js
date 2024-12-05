import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }
  const user = req.user._id;
  const subscription = await Subscription.findOne({
    $and: [{ channel: channelId }, { subscriber: user }],
  });

  if (!subscription) {
    const newSubscription = await Subscription.create({
      subscriber: user,
      channel: channelId,
    });
    if (!newSubscription) {
      throw new ApiError(500, "Error while subscribing");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, newSubscription, "Subscribed Successfully"));
  }

  const unsbuscribe = await Subscription.findByIdAndDelete(subscription._id);
  if (!unsbuscribe) {
    throw new ApiError(500, "error during unsubscribing the channel");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, unsbuscribe, "Channel unsubscribed successfully")
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Subscriber ID");
  }
  const subscribersList = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: {
          $first: "$subscriber",
        },
      },
    },
    {
      $project: {
        subscriber: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!subscribersList) {
    throw new ApiError(400, "Error Fetching Subscribers List");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribersList, "Subscribers Fetched Successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
      throw new ApiError(400, "Invalid Channel ID");
    }
  
    const channelList = await Subscription.aggregate([
      {
        $match: {
          subscriber: channelId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channel",
          pipeline: [
            {
              $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          channel: {
            $first: "$channel",
          },
        },
      },
      {
        $project: {
          channel: 1,
          createdAt: 1,
        },
      },
    ]);
  
    if (!channelList) {
      throw new ApiError(400, "Error Fetching Subscribed Channels");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, channelList, "Subscribed Channels Fetched"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
