const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const DEFAULT_VOTE_OPTIONS = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

// In-memory storage for all session data.
// This will be reset if the server restarts.
// Structure: { sessionId: { moderatorId, participants: [], stories: [], ... } }
const sessions = {};

// Serve the frontend file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // --- Session Management ---

    socket.on('create_session', ({ userName, deck }, callback) => {
        const sessionId = `sess_${Math.random().toString(36).substr(2, 9)}`;
        const moderatorId = socket.id;

        const finalDeck = (deck && deck.length > 0) ? deck : DEFAULT_VOTE_OPTIONS;

        sessions[sessionId] = {
            moderatorId: moderatorId,
            participants: [{ id: socket.id, name: userName, vote: null }],
            stories: [],
            activeStoryId: null,
            votesRevealed: false,
            deck: finalDeck,
        };

        socket.join(sessionId);
        console.log(`Session created: ${sessionId} by ${userName}`);
        callback({ success: true, sessionId });
        io.to(sessionId).emit('session_updated', sessions[sessionId]);
    });

    socket.on('join_session', ({ sessionId, userName }, callback) => {
        if (!sessions[sessionId]) {
            return callback({ success: false, message: 'Session not found.' });
        }

        const session = sessions[sessionId];
        // Avoid duplicate participants
        if (!session.participants.some(p => p.id === socket.id)) {
            session.participants.push({ id: socket.id, name: userName, vote: null });
        }

        socket.join(sessionId);
        console.log(`${userName} (${socket.id}) joined session: ${sessionId}`);
        callback({ success: true });
        io.to(sessionId).emit('session_updated', session);
    });
    
    // --- Story & Voting Workflow ---

    socket.on('add_story', ({ sessionId, title, link }) => {
        const session = sessions[sessionId];
        if (session && session.moderatorId === socket.id) {
            const newStory = { id: `story-${Date.now()}`, title, link, result: null };
            session.stories.push(newStory);
            io.to(sessionId).emit('session_updated', session);
        }
    });
    
    socket.on('delete_story', ({ sessionId, storyId }) => {
        const session = sessions[sessionId];
        if (session && session.moderatorId === socket.id) {
            session.stories = session.stories.filter(s => s.id !== storyId);
            if (session.activeStoryId === storyId) {
                session.activeStoryId = null; // De-select if it was active
            }
            io.to(sessionId).emit('session_updated', session);
        }
    });

    socket.on('select_story', ({ sessionId, storyId }) => {
        const session = sessions[sessionId];
        if (session && session.moderatorId === socket.id) {
            session.activeStoryId = storyId;
            session.votesRevealed = false;
            // Reset votes for the new round
            session.participants.forEach(p => p.vote = null);
            io.to(sessionId).emit('session_updated', session);
        }
    });

    socket.on('cast_vote', ({ sessionId, vote }) => {
        const session = sessions[sessionId];
        if (session && !session.votesRevealed) {
            const participant = session.participants.find(p => p.id === socket.id);
            if (participant) {
                participant.vote = vote;
                io.to(sessionId).emit('session_updated', session);
            }
        }
    });

    socket.on('reveal_votes', ({ sessionId }) => {
        const session = sessions[sessionId];
        if (session && session.moderatorId === socket.id) {
            const activeStory = session.stories.find(s => s.id === session.activeStoryId);
            if (activeStory) {
                // Average is calculated based on currently connected participants who voted
                const numericVotes = session.participants
                    .filter(p => !p.disconnected && p.vote !== null)
                    .map(p => p.vote)
                    .filter(v => !isNaN(Number(v)))
                    .map(v => parseFloat(v));
                
                const average = numericVotes.length > 0
                    ? (numericVotes.reduce((acc, v) => acc + v, 0) / numericVotes.length).toFixed(2)
                    : 'N/A';

                // Store all votes from participants who voted, including those who may have disconnected
                const individualVotes = session.participants
                    .filter(p => p.vote !== null)
                    .map(p => ({ name: p.name, vote: p.vote, id: p.id, disconnected: !!p.disconnected }));

                activeStory.result = {
                    average,
                    votes: individualVotes,
                };
            }
            session.votesRevealed = true;
            io.to(sessionId).emit('session_updated', session);
        }
    });

    socket.on('reset_votes', ({ sessionId }) => {
        const session = sessions[sessionId];
        if (session && session.moderatorId === socket.id) {
            const activeStory = session.stories.find(s => s.id === session.activeStoryId);
            if (activeStory) {
                activeStory.result = null; // Clear the stored result
            }
            session.votesRevealed = false;
            session.participants.forEach(p => p.vote = null);
            io.to(sessionId).emit('session_updated', session);
        }
    });

    // --- Disconnection Handling ---

    socket.on('disconnect', () => {
        console.log(`A user disconnected: ${socket.id}`);
        for (const sessionId in sessions) {
            const session = sessions[sessionId];
            const participantIndex = session.participants.findIndex(p => p.id === socket.id);

            if (participantIndex !== -1) {
                const participant = session.participants[participantIndex];

                if (participant.vote !== null) {
                    // If participant has voted, mark them as disconnected
                    participant.disconnected = true;
                } else {
                    // Otherwise, remove them from the session
                    session.participants.splice(participantIndex, 1);
                }

                // If the disconnected user was the moderator, find a new one
                if (session.moderatorId === socket.id) {
                    const newModerator = session.participants.find(p => !p.disconnected);
                    if (newModerator) {
                        session.moderatorId = newModerator.id;
                    } else {
                        // If no active participants are left, close the session
                        delete sessions[sessionId];
                        console.log(`Session ${sessionId} closed.`);
                        return;
                    }
                }
                
                // If there are no participants left at all, close the session
                if (session.participants.length === 0) {
                    delete sessions[sessionId];
                    console.log(`Session ${sessionId} closed.`);
                    return;
                }

                io.to(sessionId).emit('session_updated', session);
                break;
            }
        }
    });
});

server.listen(PORT, () => {
  console.log(`Team Pointer server running on http://localhost:${PORT}`);
}); 