var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var PlaceSchema = new Schema({
    title:String,
    description:String,
    geo:{type:[Number], index:"2d"},
    updated:Date
});

PlaceSchema.path('updated').default(function () {
    return new Date()
}).set(function (v) {
        return v == 'now' ? new Date() : v;
    });

module.exports = mongoose.model('Place', PlaceSchema);