var mongoose = require('mongoose');

const friends = new mongoose.Schema({
    user1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    user2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    since: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Friends' , friends);