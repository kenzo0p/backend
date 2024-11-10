import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnClodinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiReasponse.js"
import jwt from 'jasonwebtoken'

const generateAccessAnsRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }




    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");

    }
}

const registerUser = asyncHandler(async (req, res) => {
    /* 
     
     get user details from frontend
     validation - not empty
     check if user already exist:username ,email
     check for images , check for avvatar
     upload them to cludinary
     create user object  - create entry in db
     remove password and refresh token field from response
     check for user creation
     return res

     */



    const { fullName, username, email, password } = req.body
    console.log("email:", email)
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    // if(fullName === ""){
    //     throw new ApiError(400 ,"Full name is required")
    // }

    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are compulsory");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email and username already exist");
    }



    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");

    }

    const avatar = await uploadOnClodinary(avatarLocalPath)
    const coverImage = await uploadOnClodinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }



    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username ,email
    // find the user
    // password check
    // access and refresh token

    // cookies send


    const { email, username, password } = req.body
    console.log(email);
    if (!username && !email) {
        throw new ApiError(400, "username or password is reqired")
    }

    // Here is an alternative of above code based on logic disscuss
    // if(!(username || email)) {
    //    throw new ApiError(400, "username or password is reqired")    
    // }



    const user = await User.findOne({
        $or: [{ username }, { email }] //mongodb method
    })
    if (!user) {
        throw new ApiError(404, "user doest not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "password incorrect")
    }

    const { accessToken, refreshToken } = await generateAccessAnsRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
    select("-password -refreshToken")


    // cookies sending
    // and in this we use httponly and secure true so that this cookies only modified by server 
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200).cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Loggedin Successfully"
            )
        )
})


const logOutUser = asyncHandler(async (req, res) => {
    // find user
    // remove cookies
    // reset refresh token and access token

    await User.findByIdAndUpdate(
        req.user._id, {
        $set: { refreshToken: undefined }
    },
        {
            new: true
        }
    )

    // cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options)
        .clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User Logged Out"))




})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Umauthorized request");
    }
    try {

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken  == user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }

const options = {
    httpOnly: true,
    secure: true
}

const { accessToken, newRefreshToken } = await generateAccessAnsRefreshToken(user._id)

return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiReasponse(
            200,
            { accessToken, refreshToken: newRefreshToken },
            "Access token refreshed successfully"
        )
    )
} catch (error) {
    throw new ApiError(401 ,error?.message || "Invalid refresh token")
}

})


export { registerUser, loginUser, logOutUser ,refreshAccessToken }