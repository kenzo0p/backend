import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const user = req.user._id;
  const likeVideo = await Like.findOne({
    $and: [{ video: videoId }, { likedBy: user }],
  });

  if (!likeVideo) {
    const like = await Like.create({
      video: videoId,
      likedBy: user,
    });
    if (!like) {
      throw new ApiError(500, "Error while liking the video");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, like, "User liked the video"));
  }
  const unlikeVideo = await Like.findByIdAndDelete(likeVideo._id);
  if (!unlikeVideo) {
    throw new ApiError(500, "Error while unliking the video");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, unlikeVideo, "User Unliked the video"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Commenyt id");
  }
  const user = req.user._id;
  const likeComment = await Like.findOne({
    $and: [{ comment: commentId }, { likedBy: user }],
  });
  if (!likeComment) {
    const comment = await Like.create({
      comment: commentId,
      likedBy: user,
    });
    if (!comment) {
      throw new ApiError(500, "Error while liking the comment");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Comment Liked Successfully"));
  }
  const unlikeComment = await findByIdAndDelete(likeComment._id);
  if (!unlikeComment) {
    throw new ApiError(500, "Error while unliking the comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, unlikeComment, "like removed successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID");
  }
  const user = req.user._id;
  const likeTweet = await Like.findOne({
    $and: [{ tweet: tweetId }, { likedBy: user }],
  });
  if (!likeTweet) {
    const like = await Like.create({
      tweet: tweetId,
      likedBy: user,
    });
    if (!like) {
      throw new ApiError(500, "Error while Liking the Tweet");
    }
    return res.status(200).json(new ApiResponse(200, like, "Tweet liked"));
  }

  const unlikeTweet = await Like.findByIdAndDelete(likeTweet._id);
  if (!unlikeTweet) {
    throw new ApiError(500, "Error while unliking the tweet");
  }
  return res.status(200, unlikeTweet, "Tweet Unliked");
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true, $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    avatar: 1,
                    username: 1,
                    fullName: 1,
                  },
                },
              ],
            },
          },
          {
            $addFileds: {
              owner: {
                $first: "$owner",
              },
            },
          },
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              duration: 1,
              viewes: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$video",
    },
    {
      $project: {
        video: 1,
        likedBy: 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Fethched Liked Videos"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

