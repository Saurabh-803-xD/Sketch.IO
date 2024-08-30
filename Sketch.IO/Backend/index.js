const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { User } = require("./database/schema");
app.use(cors());

const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
    }
});


app.get('/userList', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
        console.log(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get("/" , (req , response)=>{
    response.send("Live Now")
})

io.on("connection", (client) => {
    console.log(`New user ::${client.id}`);

    client.on("disconnect",async () => { 
        console.log("user disconnected ::", client.id);

        client.on("disconnect", async () => {
            console.log("User disconnected ::", client.id);
            await handleUserDisconnection(client.id);
        });
    });


    client.on("join-room", async (info) => { 
        const { room, name } = info;
        console.log(`User ${client.id} joined room: ${room}`);
        client.join(room);
        try {
            await User.create({
                userName: name,
                userId: client.id,
                points: 0,
                room
            })
        }
        catch (error) {
            console.log("Something went wrong");
        }
        io.to(room).emit("newPlayer");
    });

    client.on("draw", ({ room, offsetX, offsetY, color }) => {
        io.to(room).emit("draw", { offsetX, offsetY, color });
    });


    client.on("stopDrawing", (room) => {
        io.to(room).emit("stopDrawing", room);
    });

    client.on("clear", ({ room, width, height }) => {
        io.to(room).emit("clear", { width, height });
    });


    // todo :: chatting 
    client.on("sendMessage", (info) => {
        console.log("sending message", info);
        const room = info.room;
        console.log(typeof (room));
        io.emit("receiveMessage", info);
    })

    // todo :: choosing the players
    client.on('myEvent', (currentIteration) => {
        console.log(`Received from ${client.id}:`, currentIteration);
        io.emit('acknowledgement', currentIteration);
    });

    // todo :: word to find
    client.on("wordToGuess", (info) => {
        console.log("info is :: ", info)
        io.emit("wordToGuess", info);
    })

    // todo :: updating points
    client.on("updatePlayerPoints", async ({ name, drawTime }) => {
        console.log("in the server side for updating with :: ", name, drawTime);
        try {
            const updatedUser = await User.findOneAndUpdate(
                { userName: name },
                { $inc: { points: 10 * drawTime } },
                { new: true }
            );

            if (!updatedUser) {
                console.log("User not found :: ", name);
                return;
            }
            console.log("Updated user:", updatedUser);
        } catch (error) {
            console.error("Error updating user:", error.message);
        }
        io.emit("updatePlayerPoints", "info");
    })

    // todo :: client reloaded, moved back, closed the page
    client.on("disconnectUser", async ({ name, room }) => {
       await handleUserDisconnection(client.id)
    })

    const handleUserDisconnection = async (userId) => {
        try {
            const user = await User.findOneAndDelete({ userId });
            if (user) {
                console.log(`User ${user.userName} has been deleted from room ${user.room}`);
                io.to(user.room).emit("newPlayer");
            }
        } catch (error) {
            console.log('Error deleting user:', error);
        }
    };

    client.on("endGame", async () => {
        try {
            await User.deleteMany({});
            console.log('All users have been deleted as the game ended.');
            io.emit("newPlayer");
        } catch (error) {
            console.log('Error deleting users:', error);
        }
    });

});

const PORT = process.env.PORT || 8000;
server.listen(8000 , () => {
    console.log("Server Running on port 8000");
});
