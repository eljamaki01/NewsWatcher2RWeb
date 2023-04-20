# NewsWatcher2RWeb
Sample application for new book titled - "JavaScript Three-Tier Architectures in AWS with React, Node and MongoDB"
Code was updated also to help readers of the older book titled - "Node.js, MongoDB, React, React Native Full-Stack Fundamentals and Beyond"

To build, go to Lambda directory and run:
```
npm install
npm run zipLambda
```

Then in the root directory run:
```
npm install
npm run build-react
npm run zipForEB
```

You now have the zip file to upload for the AWS Lambda and the zip file to upload to AWS Elastic Beanstalk.
Note that for Elastic beanstalk, you must choose the appropriate instance size.
For example `t4g.medium`
