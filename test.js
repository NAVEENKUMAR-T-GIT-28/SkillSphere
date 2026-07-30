const mongoose = require('mongoose');
const Student = require('./backend/models/Student');
const User = require('./backend/models/User');
const Class = require('./backend/models/Class');

mongoose.connect('mongodb://127.0.0.1:27017/skillsphere')
  .then(async () => {
    console.log('Connected to DB');
    const classes = await Class.find();
    if(classes.length === 0) { console.log('no classes'); return process.exit(0); }
    const cls = classes[0];
    
    console.log('Class:', cls._id.toString());
    
    const students = await Student.find({ class_id: cls._id }).populate('user_id');
    console.log('Students count:', students.length);
    if(students.length > 0) {
      console.log('User obj:', students[0].user_id);
    }
    
    const statsResult = await Student.aggregate([
      { $match: { class_id: cls._id } },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: [{ $ifNull: ['$user.account_status', 'ACTIVE'] }, 'ACTIVE'] }, 1, 0] } }
      }}
    ]);
    console.log('Stats:', statsResult);

    process.exit(0);
  })
  .catch(console.error);
