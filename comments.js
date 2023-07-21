// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

// Create an express application
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create a port for the server
const port = 4001;

// Create an object to store the comments
const commentsByPostId = {};

// Create a function to handle events
const handleEvent = (type, data) => {
    if (type === 'CommentCreated') {
        const { id, content, postId, status } = data;

        // Create a new comment object
        const comment = {
            id,
            content,
            status
        };

        // Push the comment to the array of comments
        const comments = commentsByPostId[postId] || [];
        comments.push(comment);
        commentsByPostId[postId] = comments;
    }

    if (type === 'CommentUpdated') {
        const { id, content, postId, status } = data;

        // Find the comment with the given id
        const comment = commentsByPostId[postId].find(comment => {
            return comment.id === id;
        });

        // Update the status of the comment
        comment.status = status;
        comment.content = content;
    }
};

// Create a route to get the comments for a given post
app.get('/posts/:id/comments', (req, res) => {
    const comments = commentsByPostId[req.params.id] || [];
    res.send(comments);
});

// Create a route to handle events from the event bus
app.post('/events', (req, res) => {
    const { type, data } = req.body;

    // Handle the event
    handleEvent(type, data);

    // Send a response to the event bus
    res.send({});
});

// Start the server
app.listen(port, async () => {
    console.log(`Listening on port ${port}`);

    // Get all the events from the event bus
    const res = await axios.get('http://localhost:4005/events');

    // Handle all the events
    for (let event of res.data) {
        console.log('Processing event:', event.type);
        handleEvent(event.type, event.data);
    }
});