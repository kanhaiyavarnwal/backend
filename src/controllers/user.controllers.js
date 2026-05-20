import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import {uploadOnCloudinary} from "../utils/claudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import jwt from "jsonwebtoken"

 const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken()
         console.log( "user infoline no 13 usercontrollers  : ",user)
        user.refreshToken = refreshToken;
     const saveUser =  await user.save({validateBeforeSave:false}) // validation nhi krna hai save krdo 
     console.log(saveUser)
       return {accessToken , refreshToken};
    }
   
    catch(err){
        
        throw new ApiError(500 ,
         "Something went wrong while generating access and refresh token")
    }
 }

const registerUser = asyncHandler ( async (req , res) =>{
     // get user from frontend
  // validations - not empty
  // check if user already exist  - . through email username
  // check for images check for avatar
  //upload them to cloudinary  , avatar 
 // create user object - create entry in db 
 // remove password and refresh token field from response
 // check for user creation
 //  return response

   const {fullname , email, username , password} = req.body;    
  //  console.log("email" ,email);
  //  console.log("fullname" ,fullname);
  //  console.log("username" ,username);
//    console.log("password" ,password);
// console.log(req.body)

   if(
    [fullname , email , username , password].some((field) => 
    field?.trim()===""
  )
   ){
    throw new ApiError(400, "All fieds are required")
   }

  const existingUser = await User.findOne({
    $or: [{username} , {email}]
   })
   if(existingUser){
    throw new ApiError(409 , "User with email or username already exists")
   }
  // console.log(req.files)
  const avatarLocalPath =   req.files?.avatar[0]?.path;
//   const coverLocalPath =  req.files?.coverImage?.path;

let coverImageLocalPath;

if(req.files && Array.isArray(req.files.coverImage) 
    && req.files.coverImage.length >0){
   coverImageLocalPath = req.files.coverImage[0]?.path;
}

  if(!avatarLocalPath){
    throw new ApiError(400 , "Avatar file is required")
  }


  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400 , "Avatar file is required")
  }

  const user =  await  User.create({
    fullname,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
   })
    const createdUser =  await  User.findById(user._id).select(
        "-password -refreshToken"   // jo jo nhi chahiye usko send kro with negetive sign
    )

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering user")
    }
    // console.log(req.file)

   return res.status(201).json(
    new ApiResponse(200, createdUser , "User register Successfully")
   )
 


})

const loginUser = asyncHandler(async (req,res) =>{
     // req body data
    // username or email 
    // find the user
    // password and refresh token
    // access and refresh token
    //  send cookies
    const {email,username,password}  = req.body
    console.log("body: ",req.body)
    if(!(username || email) || !password){
        throw new ApiError(400 , "username or password is required")
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })
 if(!user){
    throw new ApiError(404, "User does not exists")
 }
 // user se password check krenge ki jo password dala hai login ke liye wo kya shi hai isliye yha user ka use krrhe hai insted ki User (User tumhara mongodb ka object hai) user jo register kr chukahai but wo login krna chahta hai line no 124
  const isPasswordValid = await user.isPasswordCorrect(password)  // instance method of user model
 console.log("user", user)
 console.log("isPassword :", isPasswordValid)
  if(!isPasswordValid){
    throw new ApiError(401 , "Invalid password")
  }
const {accessToken,refreshToken} = await 
generateAccessAndRefreshTokens(user._id)  


const logedInUser = await User.findById(user._id).select
("-password -refreshToken")

 const options = {
   httpOnly : true,
   secure : true
 }
 console.log("res from login user" , res)
 return res
 .status(200)
 .cookie("accessToken" , accessToken , options)
 .cookie("refreshToken" , refreshToken , options)
 .json(
  new ApiResponse(
    200, 
    {
       user : logedInUser , accessToken , refreshToken
    },
    "User loged in successfully"
  )
 )

})

 const logOutUser = asyncHandler(async (req,res) =>{ 
   const logOutUser =  await  User.findByIdAndUpdate(
        req.user._id,    
        {
          $set : {
            refreshToken:undefined,
          }
        },
        {
          new:true,
        }
      )
      const options = {
        httpOnly: true,
        secure : true
      }
      console.log("logoutUser :",logOutUser)
      console.log("logoutUser res:",res)
      return res.status(200)
      .clearCookie("accessToken" , options)
      .clearCookie("refreshToken" , options)
      .json(new ApiResponse(200 , {} , "user loged out"))

 })

 const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken =    req.cookies.refreshToken || req.body.refreshToken
    
    if(!incomingRefreshToken){
      throw new ApiError(401, "unothorzed response")
    }
 try {
   const decodedToken = jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
     )
    const user =  await User.findById(decodedToken?._id)
 
    if(!user){
       throw new ApiError(401, "invalid refresh token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
       throw new ApiError(401 , "Refresh TOken is expire or used")
     }
 
     const options = {
       httpOnly:true,
       secure:true
     }
    const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken" , accessToken , options)
     .cookie("refreshToken", newRefreshToken , options)
     .json(
       new ApiResponse(
         200,{ accessToken , refreshToken: newRefreshToken },
         "Access token refreshed"
       )
     )
 } catch (err) {
     throw new ApiError(401, err?.message || "invalid refresh Token")
 }

 })

export {registerUser,loginUser,logOutUser,refreshAccessToken}

