import React, { useEffect } from 'react'
import "./Join.css"
import { useState } from 'react';
import { Link } from "react-router-dom";
export default function Join() {
    const [userName, setuserName] = useState("")
    // const [room, setroom] = useState("");
    const handleJoinRoom = () => {
        if (userName === "") {
            window.alert("Please fill all fields");
            return;
        }
    }
    const room =1;
    useEffect(() => {
        localStorage.removeItem("userPresent");
    }, [])
    return (
        <>
            <center className='join_main' >
                <h1 style={{ fontSize: "70px" }}>Sketch.IO</h1>
                <h2 style={{ fontSize: "40px" }}>Draw It. Guess It. Win It!</h2>
                <input onChange={(event) => setuserName(event.target.value)} placeholder='Enter Name' type="text"  style={{textAlign:"center"}}/>
                <br />
                <br />
                {/* <input onChange={(event) => setroom(event.target.value)} type="text" placeholder='Join a room' style={{textAlign:"center"}}/> */}
                {/* <input type="text" placeholder='Join a room' style={{textAlign:"center"}}/>  */}
                <br />
                <br />
                <button onClick={handleJoinRoom} >
                    <Link style={{
                        color: "black",
                        fontStyle: "none",
                        textDecoration:"none"
                    }} to={`/room?roomID=${room}&name=${userName}`} >Join Room</Link>
                </button>
            </center>
            <br />
        </>
    )
}
