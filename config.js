var config = {}

config.MONGODB_CONNECT_URL = "<replace>";
config.JWT_SECRET = "<replace>";
config.NEWYORKTIMES_API_KEY = "<replace>"
config.NEWYORKTIMES_CATEGORIES = ["world", "national", "business", "technology"];
config.GLOBAL_STORIES_ID = "MASTER_STORIES_DO_NOT_DELETE";
config.MAX_SHARED_STORIES = 30;
config.MAX_COMMENTS = 30;
config.MAX_FILTERS = 5;
config.MAX_FILTER_STORIES = 15;

module.exports = config;