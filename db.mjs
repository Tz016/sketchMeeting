import './config.mjs';
import mongoose from 'mongoose';
import { MongoClient, ServerApiVersion } from 'mongodb';
import passportLocalMongoose from 'passport-local-mongoose';
import { Console } from 'console';

mongoose.set('strictQuery', false);
// 定义 MeetingSchema

const MeetingSchema = new mongoose.Schema({
    meetingID: {type: String, required: true,unique: false },
    meetingName: {type: String, required: true, unique: false},
    startAt: { type: Date, required: true, unique: false },
    endAt: { type: Date, required: false },
    meetingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: false}],
    currentUsers:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' , unique: false}]
});

// 应用 passportLocalMongoose 插件到 UserSchema
const UserSchema = new mongoose.Schema({
    // username provided by authentication plugin
    // password hash provided by authentication plugin
    username: {type: String, required: true,},
    password: {type: String, required: true,unique: false},
    meetings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meeting',unique: false }]
});

// UserSchema.plugin(passportLocalMongoose);
// MeetingSchema.plugin(passportLocalMongoose);
// 创建 User 和 Meeting 模型
const User=mongoose.model('User', UserSchema);
const Meeting=mongoose.model('Meeting', MeetingSchema);


export async function run() {

     // Connect the client to the server	(optional starting in v4.7)
      await mongoose.connect(process.env.uri ?? 'mongodb://localhost/AIT');
      // Send a ping to confirm a successful connection
      
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
export async function createUser(data){
    const newUser=new User(data);
    await newUser.save();
};
export async function findCurrentMeet(roomNumber){
    return await Meeting.findOne({
        meetingID: roomNumber,
        endAt: { $exists: false }
      },'_id meetingName currentUsers').exec();
};

export async function findPastMeet(_id){
    const history=await Meeting.findOne({
        _id: _id,
        endAt: { $exists: true }
      }).exec();
   return history;
};

export async function findUser(username){
   const user=await User.findOne({
    username: username
  }).exec();
  if (user) {
    console.log('User found:', user);
    // 对找到的用户执行操作
  } else {
    console.log('User not found');
    // 处理用户不存在的情况
  }
    return user
};



export async function createMeet(username,data){
    try {
        const user=await User.findOne({username:username},"_id").exec();
        data.meetingUsers.push(user._id);
        data.currentUsers.push(user._id);
        const newMeet = new Meeting(data);
        await newMeet.save();
        await User.updateOne(
            {
            username:username
            },
            {$push:{meetings:newMeet._id}
            }
        )
        return newMeet;
      } catch (error) {
        console.error('Error when creating the meeting:', error);
        throw error;
      }
}
export async function addUserToMeeting(username,roomNumber){
  const meeting=await findCurrentMeet(roomNumber);
  const user=await User.findOne({username:username},"_id").exec();
  await User.updateOne(
    {
    username:username
    },
    {$push:{meetings:meeting._id}
    }
) 
await Meeting.updateOne(
  {
  _id:meeting._id,
  },
  {$push:{currentUsers:user._id},
  $addToSet:{meetingUsers:user.id}
  }
)
}
export async function deletePastMeet(username,meetingID){
    const deletedMeetingID=await Meeting.findOne({_id:meetingID},"_id").exec();
    await User.updateOne(
        { username: username },
        { $pull: { meetings: { $eq: deletedMeetingID._id } } }
      )
    console.log(`Meeting is successfully deleted from ${username}\'s history`);
};

export async function addMeetHistory(meet){

}

export async function check_closeRoom(username,roomNumber) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const meeting = await Meeting.findOne(
        { meetingID: roomNumber, endAt: { $exists: false } },
      )
        .session(session)
        .exec();
  
      let meetingClosed = false;
      let lastUserLeft = false;
      if (meeting) {
        if (meeting.currentUsers.length === 1) {
          await Meeting.updateOne(
            { _id: meeting._id },
            {
              $set: { endAt: Date.now() },
              $pull: { currentUsers: meeting.currentUsers[0] }
            },
            { session }
          );
          meetingClosed = true;
          lastUserLeft = true;
        }else{
        const userID=await findUser(username); 
        if(userID){
       
        await Meeting.updateOne(
        { _id: meeting._id },
        {
          $pull: { currentUsers: userID._id }
        },
        { session }
      );
      }
      }
    }
    
  
      await session.commitTransaction();
  
      return { meetingClosed, lastUserLeft };
    } catch (error) {
      await session.abortTransaction();
      console.error('Error checking or closing the room:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }