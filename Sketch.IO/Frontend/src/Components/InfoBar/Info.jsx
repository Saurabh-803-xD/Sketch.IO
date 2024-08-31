import React, { useRef, useState, useEffect } from 'react';
import './Info.css';
import axios from 'axios';
import WinnerModal from '../WinnerModal/WinnerModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import backendLink from '../../backendLink';

export default function Info(props) {
  const { socket, player, name, setplayer } = props;
  const newSocket = useRef(socket.current);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      try {
        await axios.post(`${backendLink}removeUser`, { userName: name });
      } catch (error) {
        console.error("Error removing user from the database:", error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [name]);

  const [answer, setAnswer] = useState("");
  const [item, setItem] = useState("");
  const [random, setrandom] = useState(0);

  const [countdown, setCountdown] = useState(0);
  const [drawTime, setDrawTime] = useState(0);

  const [players, setPlayers] = useState([]);
  const [playerDrawing, setPlayerDrawing] = useState("");

  const questions = useRef(null);
  const whoDrawingNow = useRef(null);

  const [userWithGuess, setUserWithGuess] = useState("");
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const wordArray = [
    { 1: "mango", 2: "banana", 3: "cherry" },
    { 1: "lamp", 2: "elephant", 3: "fox" },
    { 1: "guitar", 2: "harp", 3: "instrument" },
    { 1: "kite", 2: "valley", 3: "lamp" },
    { 1: "cat", 2: "dog", 3: "rabbit" },
    { 1: "car", 2: "bicycle", 3: "train" },
    { 1: "book", 2: "pen", 3: "paper" },
    { 1: "computer", 2: "keyboard", 3: "mouse" },
    { 1: "flower", 2: "tree", 3: "grass" },
    { 1: "house", 2: "apartment", 3: "cabin" },
    { 1: "apple", 2: "orange", 3: "grape" },
    { 1: "ship", 2: "boat", 3: "submarine" },
    { 1: "pencil", 2: "eraser", 3: "ruler" },
    { 1: "airplane", 2: "helicopter", 3: "drone" },
    { 1: "shirt", 2: "pants", 3: "hat" },
    { 1: "camera", 2: "lens", 3: "tripod" },
    { 1: "guitar", 2: "piano", 3: "drum" },
    { 1: "tree", 2: "notebook", 3: "ocean" }
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let response = await axios.get(`${backendLink}userList`);
        setPlayers(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUsers();
  }, [player, name]);

  // Timers
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((time) => time - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    let timer;
    if (drawTime > 0) {
      timer = setTimeout(() => setDrawTime((time) => time - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [drawTime]);

  async function chooseWordWait() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 20000);
    });
  }

  useEffect(() => {
    const handleAcknowledgement = async (index) => {
      const currentPlayer = players[index];
      setrandom(Math.floor(Math.random() * 5));

      if (currentPlayer.userName === name) {
        setCountdown(5);
        setDrawTime(25);
        whoDrawingNow.current.style.display = "none";
        questions.current.style.display = "flex";
        await chooseWordWait(); // Wait for 25 seconds
        questions.current.style.display = "none";
      } else {
        setDrawTime(25);
        setPlayerDrawing(currentPlayer.userName);
        questions.current.style.display = "none";
        whoDrawingNow.current.style.display = "flex";
        whoDrawingNow.current.style.justifyContent = "center";
      }
    };

    const socket = newSocket.current;
    const dummy = async () => {
      socket.on('acknowledgement', handleAcknowledgement);
    };
    dummy();

    return () => {
      socket.off('acknowledgement');
    };
  }, [players, name, setplayer]);

  const StartGame = async () => {
    let loopCount = players.length;
    let currentIteration = 0;

    await newSocket.current.emit('myEvent', currentIteration);

    const interval = setInterval(async () => {
      if (currentIteration < loopCount - 1) {
        currentIteration++;
        await newSocket.current.emit('myEvent', currentIteration);
      } else {
        clearInterval(interval);
        determineWinner();
      }
    }, 25000);
  };

  const handleEnter = async (e) => {
    setUserWithGuess(name);
    if (e.key === 'Enter') {
      if (item === answer) {
        toast("Right Answer, points updated")
        newSocket.current.emit("updatePlayerPoints", { name, drawTime });
      } else {
        toast("Wrong Guess");
      }
    }
  };

  useEffect(() => {
    const socket = newSocket.current;
    const handleGuesstingWord = async (info) => {
      setItem(info[0]);
    };
    socket.on("wordToGuess", handleGuesstingWord);
    return () => {
      socket.off("wordToGuess", handleGuesstingWord);
    };
  }, [item]);

  useEffect(() => {
    const socket = newSocket.current;
    const handleNewPlayer = async (player) => {
      let response = await axios.get(`${backendLink}userList`);
      setplayer(response.data);
    };

    socket.on('updatePlayerPoints', handleNewPlayer);
    return () => {
      socket.off('updatePlayerPoints', handleNewPlayer);
    };
  }, [userWithGuess, setplayer]);

  // Emit winner info to all clients and show winner modal
  const determineWinner = () => {
    const highestScorer = players.reduce((prev, current) => {
      return prev.score > current.score ? prev : current;
    });

    setWinner(highestScorer);
    setShowWinnerModal(true);

    // Emit the winner to all connected clients
    newSocket.current.emit('gameOver', highestScorer);
  };

  useEffect(() => {
    const socket = newSocket.current;

    const handleGameOver = (winner) => {
      setWinner(winner);
      setShowWinnerModal(true);
    };

    socket.on('gameOver', handleGameOver);

    return () => {
      socket.off('gameOver', handleGameOver);
    };
  }, []);

  return (
    <>
      <center className='main_Info' style={{ marginTop: "-13px" }}>
        <ToastContainer />
        <small ref={whoDrawingNow} className='whoDrawing'>{playerDrawing} is drawing...</small>
        <main className='info_Main'>
          <section className="time">
            {drawTime}
          </section>
          <section>
            <input onChange={(e) => setAnswer(e.target.value)} type="text" onKeyDown={handleEnter} placeholder='Enter your answer here' />
          </section>
          <section className='start'><button onClick={StartGame}>Start</button></section>
        </main>
        <section ref={questions} className="askQuestions" style={{ display: 'none' }}>
          <center>
            <h4>Select the word</h4>
            <small className="choosingTime">{countdown}</small>
            <span className="select">
              <div onClick={async () => {
                await newSocket.current.emit("wordToGuess", [wordArray[random]["1"]]);
                setItem(wordArray[random]["1"]);
                questions.current.style.display = "none";
              }}>
                {wordArray[random]["1"]}
              </div>
              <div onClick={async () => {
                await newSocket.current.emit("wordToGuess", [wordArray[random]["2"]]);
                setItem(wordArray[random]["2"]);
                questions.current.style.display = "none";
              }}>
                {wordArray[random]["2"]}
              </div>
              <div onClick={async () => {
                await newSocket.current.emit("wordToGuess", [wordArray[random]["3"]]);
                setItem(wordArray[random]["3"]);
                questions.current.style.display = "none";
              }}>
                {wordArray[random]["3"]}
              </div>
            </span>
          </center>
        </section>
      </center>
      <WinnerModal show={showWinnerModal} winner={winner} onClose={() => setShowWinnerModal(false)} />
    </>
  );
}
