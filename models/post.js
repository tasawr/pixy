var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var PostSchema = new Schema({
    title:String,
    description:String,
    place:{type:ObjectId, ref:"Place"},
    updated:{ type:Date, default:new Date() },
    profileId:Number,
    meta:{
        visitors:Number
    }
});

PostSchema.path('updated').default(function () {
    return new Date()
}).set(function (v) {
    return v == 'now' ? new Date() : v;
});

module.exports = mongoose.model('Post', PostSchema);