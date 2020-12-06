
let mongoose = require('mongoose');

let Poll = mongoose.model('Poll', {
    topic: String,
    type: String,
    choices: [
        {
            value: String,
            votes: Number
        }
    ]
});

module.exports = Poll;
