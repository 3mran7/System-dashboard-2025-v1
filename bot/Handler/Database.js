const mongoose = require('mongoose');
module.exports = async () => {
mongoose.connect('هنا تحط رابط المونجو', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Database connection established successfully');
})
.catch((error) => {
    console.error('Database connection failed:', error.message);
});
}