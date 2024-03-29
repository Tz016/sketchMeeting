import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

// 定义 MeetingSchema
const MeetingSchema = new mongoose.Schema({
    meetingID: {type: String, required: true },
    meetingName: {type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// 应用 passportLocalMongoose 插件到 UserSchema
const UserSchema = new mongoose.Schema({
    // username provided by authentication plugin
    // password hash provided by authentication plugin
    meetings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' }]
});
UserSchema.plugin(passportLocalMongoose);
MeetingSchema.plugin(passportLocalMongoose);
// 创建 User 和 Meeting 模型
mongoose.model('User', UserSchema);
mongoose.model('Meeting', MeetingSchema);
mongoose.connect(process.env.DSN ?? 'mongodb://localhost/AIT')