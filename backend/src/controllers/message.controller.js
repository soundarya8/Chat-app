import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId ,io} from "../lib/socket.js";

export const getUsersForSideBar =async(req,res)=>{
    try {
        const loggedInUserId = req.user._id;
       const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
       res.status(200).json(filteredUsers)
    } catch (error) {
        console.log("Error in getUsersForSideBar: ",error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}
export const getMessages = async (req,res)=>{
    try {
        const {id:userToChatId} = req.params;
        const myId= req.user._id;
        const messages = await Message.find({
            $or:[//finds messages between both of us
                {senderId:myId, receiverId:userToChatId},
                {senderId:userToChatId, receiverId:myId}
            ]
        })
        res.status(200).json(messages)
    } catch (error) {
        console.log(" error in getMessages function",error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
}
export const sendMessages = async(req,res)=>{
    try {
        const {text,image} = req.body;
        const {id:receiverId}=req.params;
        const senderId = req.user._id;
        let imageUrl;
        if(image){
            //uploads image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url
        }
        //creating a message
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image:imageUrl,
        });
        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }
        
        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage Controller",error.message);
        res.status(500).json({error : "Internal server error"});
    }
}