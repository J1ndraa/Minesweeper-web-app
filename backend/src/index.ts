/**
 * @file   index.ts
 * @brief
 *
 * @details
 *
 * @author Marek Čupr
 * @date   2024-
 */

import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { GameBoard, Difficulty, BoardCell } from "./../../shared/types/game/";
import { generateBoard, updateBoard, getDifficulty } from "./utils/";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  Timestamp,
  updateDoc,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { app as firebaseApp } from "./firebase/index";
import { useHint } from "./utils/game/useHint";

// Initialize Firestore database connection
const db = getFirestore(firebaseApp);

// Create and configure Express backend
const app = express();
const port = process.env.PORT || 5000; // Set server port

// Configure CORS to allow cross-origin requests with credentials
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true, // Allow cookies and authorization headers
  })
);

// Enable parsing of JSON requests
app.use(express.json());

// Enable parsing of cookies in requests
app.use(cookieParser());

// POST request to handle user creation and authentication
app.post("/api/user", async (req: Request, res: Response) => {
  try {
    // Extract user nickname from request body
    const { nickname } = req.body;

    // Check if the user is already authenticated via cookies
    const currentNickname = req.cookies.nickname;
    if (currentNickname && nickname === currentNickname) {
      // Refresh the authentication cookie for already authenticated user
      res.cookie("nickname", nickname, {
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        httpOnly: true, // Prevent client-side access to cookie
        maxAge: 24 * 60 * 60 * 1000 * 7, // 7 days expiration
      });

      // Respond with the authenticated user's nickname
      res.json({
        message: "User already authenticated.",
      });

      return;
    }

    // Get the user document reference from Firestore
    const userDocRef = doc(db, "users", nickname);

    // Fetch the user document snapshot from Firestore
    const userDocSnapshot = await getDoc(userDocRef);
    if (userDocSnapshot.exists()) {
      // User document doesn't exist
      res
        .status(400)
        .json({ error: "Username already exists! Choose another." });

      return;
    }

    // Create a new user document in Firestore
    await setDoc(userDocRef, {
      nickname: nickname,
      lastBoard: null,
      fastestTimes: {
        easy: null,
        medium: null,
        hard: null,
      },
      lastTime: null,
      createdAt: Timestamp.fromDate(new Date()), // Set account creation timestamp
    });

    // Set the authentication cookie for the newly created user
    res.cookie("nickname", nickname, {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true, // Prevent client-side access to cookie
      maxAge: 24 * 60 * 60 * 1000 * 7, // 7 days expiration
    });

    // Respond with success message
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    // Handle errors during the request processing
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

// GET request to fetch the current authenticated user
app.get("/api/user", (req: Request, res: Response) => {
  try {
    // Check if the user is already authenticated via cookies
    const nickname = req.cookies.nickname;
    if (nickname) {
      // The user is authenticated
      res.json({ nickname });
    } else {
      // The user is not authenticated
      res
        .status(404)
        .json({ error: "User not authenticated! Choose a nickname." });
    }
  } catch (error) {
    // Handle errors during the request processing
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

// POST request to create or retrieve a game board for the user
app.post("/api/board", async (req: Request, res: Response) => {
  try {
    // Check if the user is already authenticated via cookies
    const nickname = req.cookies.nickname;
    if (!nickname) {
      // The user is not authenticated
      res
        .status(401)
        .json({ error: "User not authenticated! Choose a nickname." });
      return;
    }

    // Get the user document reference from Firestore
    const userDocRef = doc(db, "users", nickname);

    // Fetch the user document snapshot from Firestore
    const userDocSnapshot = await getDoc(userDocRef);
    if (!userDocSnapshot.exists()) {
      // User document doesn't exist
      res.status(404).json({ error: "User not found! Choose a nickname." });
      return; // Return if user document doesn't exist
    }

    // Extract the user data from the document snapshot
    const userData = userDocSnapshot.data();

    let gameBoardData;
    // Check if the user has a previously saved board
    if (userData?.lastBoard !== null) {
      // Retrieve the previously saved board (flattened format)
      const flattenedBoard = userData.lastBoard.board;

      // Get the board dimensions (rows and columns)
      const { rows, cols } = userData.lastBoard.details;

      // Initialize an empty 2D array for the board
      let board = Array.from({ length: rows }, () => Array(cols).fill(null));

      // Populate the board with data from the flattenedBoard
      flattenedBoard.forEach((cell: BoardCell, index: number) => {
        // Calculate the row and column index based on the flattened array
        const row = Math.floor(index / cols);
        const col = index % cols;

        // Assign the cell data to the correct position in the board
        board[row][col] = {
          value: cell.value,
          isRevealed: cell.isRevealed,
          isFlagged: cell.isFlagged,
          isHintUsed: cell.isHintUsed,
        };
      });

      // Prepare the game board data to be returned to the user
      gameBoardData = {
        details: userData.lastBoard.details,
        board: board, // Reconstructed 2D board
        status: userData.lastBoard.status,
        difficulty: userData.lastBoard.difficulty,
      };

      // Retrieve the time field from user data
      const time = userData.lastTime;

      // Send the game board data as a response
      res.json({ board: gameBoardData, lastTime: time });
    } else {
      // Generate a new board with medium difficulty
      const gameBoard = generateBoard(Difficulty.Medium);

      // Flatten the 2D board array into a 1D array (for Firebase)
      const flattenedBoard = gameBoard.board.flatMap((row, rowIndex) =>
        row.map((cell) => ({
          value: cell.value,
          isRevealed: cell.isRevealed,
          isFlagged: cell.isFlagged,
          isHintUsed: cell.isHintUsed,
        }))
      );

      // Prepare the game board data for Firebase
      gameBoardData = {
        details: gameBoard.details,
        board: flattenedBoard, // Flattened 1D array board
        status: gameBoard.status,
        difficulty: gameBoard.difficulty,
      };

      // Save the newly generated game board to Firestore
      await updateDoc(userDocRef, {
        lastBoard: gameBoardData,
        lastTime: null,
      });

      // Respond with the newly generated game board to the client
      res.json({ board: gameBoard });
    }
  } catch (error) {
    // Handle errors during the request processing
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

// POST request to reset the game board and generate a new one
app.post("/api/reset", async (req: Request, res: Response) => {
  try {
    // Extract the difficulty from the request body
    const { difficulty } = req.body;

    // Convert the difficulty to an enum value
    let difficultyEnum: Difficulty = getDifficulty(difficulty.toLowerCase());

    // Check if the user is authenticated via cookies
    const nickname = req.cookies.nickname;
    if (!nickname) {
      // The user is not authenticated
      res
        .status(401)
        .json({ error: "User not authenticated! Choose a nickname." });
      return;
    }

    // Get the user document reference from Firestore
    const userDocRef = doc(db, "users", nickname);

    // Fetch the user document snapshot from Firestore
    const userDocSnapshot = await getDoc(userDocRef);
    if (!userDocSnapshot.exists()) {
      // User document doesn't exist
      res.status(404).json({ error: "User not found! Choose a nickname." });
      return; // Return if user document doesn't exist
    }

    // Generate a new board based on the selected difficulty
    const gameBoard = generateBoard(difficultyEnum);

    // Flatten the 2D board array into a 1D array (for Firebase)
    const flattenedBoard = gameBoard.board.flatMap((row) =>
      row.map((cell) => ({
        value: cell.value,
        isRevealed: cell.isRevealed,
        isFlagged: cell.isFlagged,
        isHintUsed: cell.isHintUsed,
      }))
    );

    // Prepare the game board data for Firebase
    const gameBoardData = {
      details: gameBoard.details,
      board: flattenedBoard, // Flattened 1D array board
      status: gameBoard.status,
      difficulty: gameBoard.difficulty,
    };

    // Save the newly generated game board to Firestore
    await updateDoc(userDocRef, {
      lastBoard: gameBoardData,
    });

    // Respond with the newly generated game board to the client
    res.json(gameBoard);
  } catch (error) {
    // Handle errors during the request processing
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

app.patch("/api/action", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated via cookies
    const nickname = req.cookies.nickname;
    if (!nickname) {
      // The user is not authenticated
      res
        .status(401)
        .json({ error: "User not authenticated! Choose a nickname" });
      return;
    }

    // Get the user document reference from Firestore
    const userDocRef = doc(db, "users", nickname);

    // Fetch the user document snapshot from Firestore
    const userDocSnapshot = await getDoc(userDocRef);
    if (!userDocSnapshot.exists()) {
      // User document doesn't exist
      res.status(404).json({ error: "User not found! Choose a nickname." });
      return;
    }

    // Extract the user data from the document snapshot
    const userData = userDocSnapshot.data();

    let gameBoardData;
    // Retrieve the previously saved board (flattened format)
    const flattenedBoard = userData.lastBoard.board;

    // Get the board dimensions (rows and columns)
    const { rows, cols } = userData.lastBoard.details;

    // Initialize an empty 2D array for the board
    let board = Array.from({ length: rows }, () => Array(cols).fill(null));

    // Populate the board with data from the flattenedBoard
    flattenedBoard.forEach((cell: BoardCell, index: number) => {
      // Calculate the row and column index based on the flattened array
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Assign the cell data to the correct position in the board
      board[row][col] = {
        value: cell.value,
        isRevealed: cell.isRevealed,
        isFlagged: cell.isFlagged,
        isHintUsed: cell.isHintUsed,
      };
    });

    // Prepare the game board data to be returned to the user
    gameBoardData = {
      details: userData.lastBoard.details,
      board: board, // Reconstructed 2D board
      status: userData.lastBoard.status,
      difficulty: userData.lastBoard.difficulty,
    };

    // Get the clicked row and column from the request body
    const { row, col, action }: { row: number; col: number; action: string } =
      req.body;

    // Validate action type
    if (action !== "reveal" && action !== "flag") {
      res
        .status(400)
        .json({ error: "Invalid action. Must be 'reveal' or 'flag'." });
      return;
    }

    let gameBoardUpdated: GameBoard;
    // Update the game board data
    gameBoardUpdated = updateBoard(gameBoardData, row, col, action);

    // Flatten the updated 2D board array into a 1D array (for Firebase)
    const flattenedBoardUpdated = gameBoardUpdated.board.flatMap((row) =>
      row.map((cell) => ({
        value: cell.value,
        isRevealed: cell.isRevealed,
        isFlagged: cell.isFlagged,
        isHintUsed: cell.isHintUsed,
      }))
    );

    // Prepare updated the game board data for Firebase
    const gameBoardDataUpdated = {
      details: gameBoardUpdated.details,
      board: flattenedBoardUpdated, // Flattened updated 1D array board
      status: gameBoardUpdated.status,
      difficulty: gameBoardUpdated.difficulty,
    };

    // Save the updated game board to Firestore
    await updateDoc(userDocRef, {
      lastBoard: gameBoardDataUpdated,
    });

    // Respond with the updated game board to the client
    res.json(gameBoardUpdated);
  } catch (error) {
    // Handle errors during the request processing
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

app.patch("/api/hint", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated via cookies
    const nickname = req.cookies.nickname;
    if (!nickname) {
      // The user is not authenticated
      res
        .status(401)
        .json({ error: "User not authenticated! Choose a nickname" });
      return;
    }

    // Get the user document reference from Firestore
    const userDocRef = doc(db, "users", nickname);

    // Fetch the user document snapshot from Firestore
    const userDocSnapshot = await getDoc(userDocRef);
    if (!userDocSnapshot.exists()) {
      // User document doesn't exist
      res.status(404).json({ error: "User not found! Choose a nickname." });
      return;
    }

    // Extract the user data from the document snapshot
    const userData = userDocSnapshot.data();

    let gameBoardData;
    // Retrieve the previously saved board (flattened format)
    const flattenedBoard = userData.lastBoard.board;

    // Get the board dimensions (rows and columns)
    const { rows, cols } = userData.lastBoard.details;

    // Initialize an empty 2D array for the board
    let board = Array.from({ length: rows }, () => Array(cols).fill(null));

    // Populate the board with data from the flattenedBoard
    flattenedBoard.forEach((cell: BoardCell, index: number) => {
      // Calculate the row and column index based on the flattened array
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Assign the cell data to the correct position in the board
      board[row][col] = {
        value: cell.value,
        isRevealed: cell.isRevealed,
        isFlagged: cell.isFlagged,
        isHintUsed: cell.isHintUsed,
      };
    });

    // Prepare the game board data to be returned to the user
    gameBoardData = {
      details: userData.lastBoard.details,
      board: board, // Reconstructed 2D board
      status: userData.lastBoard.status,
      difficulty: userData.lastBoard.difficulty,
    };

    // Get the clicked row and column from the request body
    const { action }: { action: string } = req.body;

    // Validate action type
    if (action !== "reveal" && action !== "flag") {
      res
        .status(400)
        .json({ error: "Invalid action. Must be 'reveal' or 'flag'." });
      return;
    }

    let gameBoardUpdated: GameBoard;
    // Update the game board data
    gameBoardUpdated = useHint(gameBoardData, action);

    // Flatten the updated 2D board array into a 1D array (for Firebase)
    const flattenedBoardUpdated = gameBoardUpdated.board.flatMap((row) =>
      row.map((cell) => ({
        value: cell.value,
        isRevealed: cell.isRevealed,
        isFlagged: cell.isFlagged,
        isHintUsed: cell.isHintUsed,
      }))
    );

    // Prepare updated the game board data for Firebase
    const gameBoardDataUpdated = {
      details: gameBoardUpdated.details,
      board: flattenedBoardUpdated, // Flattened updated 1D array board
      status: gameBoardUpdated.status,
      difficulty: gameBoardUpdated.difficulty,
    };

    // Save the updated game board to Firestore
    await updateDoc(userDocRef, {
      lastBoard: gameBoardDataUpdated,
    });

    // Respond with the updated game board to the client
    res.json(gameBoardUpdated);
  } catch (error) {
    // Handle errors during the request processing
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

app.patch("/api/chat", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated via cookies
    const nickname = req.cookies.nickname;
    if (!nickname) {
      // The user is not authenticated
      res
        .status(401)
        .json({ error: "User not authenticated! Choose a nickname" });
      return;
    }

    const message = req.body.message;

    // Set the expiration time (e.g., 24 hours from now)
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 24); // Adjust to your desired expiration duration

    // Reference to the "messages" collection
    const messagesCollectionRef = collection(db, "messages");

    // Add the new message with an automatically generated ID
    const newMessageRef = await addDoc(messagesCollectionRef, {
      sender: nickname,
      content: message,
      timestamp: Timestamp.fromDate(new Date()), // Current time
      expiresAt: Timestamp.fromDate(expirationTime), // Expiration time
    });

    res.json({
      message: "Message sent successfully",
      messageId: newMessageRef.id,
    }); // Return the auto-generated message ID
  } catch (error) {
    // Handle errors during the request processing
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

app.get("/api/chat", async (req: Request, res: Response) => {
  try {
    // Fetch all messages from the "messages" collection
    const messagesCollectionRef = collection(db, "messages");
    const querySnapshot = await getDocs(messagesCollectionRef);

    // Map the documents into an array of message objects
    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(), // This will include sender, content, timestamp, etc.
    }));

    res.json(messages); // Return the messages array
  } catch (error) {
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

// PATCH request to submit a new fastest time for the leaderboard
app.patch("/api/leaderboard", async (req: Request, res: Response) => {
  try {
    // Extract the elapsed time and difficulty from the request body
    const { elapsedTime, difficulty } = req.body;

    // Check if the user is authenticated via cookies
    const nickname = req.cookies.nickname;
    if (!nickname) {
      // The user is not authenticated
      res
        .status(401)
        .json({ error: "User not authenticated! Choose a nickname" });
      return;
    }

    // Get the user document reference from Firestore
    const userDocRef = doc(db, "users", nickname);

    // Fetch the user document snapshot from Firestore
    const userDocSnapshot = await getDoc(userDocRef);
    if (!userDocSnapshot.exists()) {
      // User document doesn't exist
      res.status(404).json({ error: "User not found! Choose a nickname." });
      return; // Return if user document doesn't exist
    }

    // Extract the user data from the document snapshot
    const userData = userDocSnapshot.data();

    // Retrieve the fastest times based on the selected difficulty
    const fastestTimes = userData.fastestTimes || {};

    // Retrieve the user's current fastest time for the chosen difficulty
    const currentFastest = fastestTimes[difficulty];

    // Reset the previously saved board
    await updateDoc(userDocRef, { lastBoard: null, lastTime: null });

    // Check if the current fastest time is not set or if the new elapsed time is faster
    if (currentFastest === null || elapsedTime < currentFastest) {
      // Update the fastest time for the selected difficulty
      fastestTimes[difficulty] = elapsedTime;

      // Save the updated fastestTimes to Firestore
      await updateDoc(userDocRef, { fastestTimes });

      // Respond with a success message
      res.json({
        message: "Fastest time updated!",
      });

      return;
    }

    // Respond with a message
    res.json({
      message: "Time is not faster than the fastest time.",
    });
  } catch (error) {
    // Handle errors during the request processing
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

// GET request to fetch the leaderboard based on difficulty
app.get("/api/leaderboard", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated via cookies
    const nickname = req.cookies.nickname;
    if (!nickname) {
      // The user is not authenticated
      res
        .status(401)
        .json({ error: "User not authenticated! Choose a nickname" });

      return;
    }

    // Extract the difficulty level from the query parameters
    const { difficulty } = req.query;

    // Validate the 'difficulty' parameter
    if (!difficulty || typeof difficulty !== "string") {
      res.status(400).json({
        error: "Invalid difficulty parameter!",
      });

      return;
    }

    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty.toLowerCase())) {
      res.status(400).json({ error: "Invalid difficulty level provided" });

      return;
    }

    // Fetch all users from Firestore
    const usersCollectionRef = collection(db, "users"); // Assuming your users are in a 'users' collection
    const usersSnapshot = await getDocs(usersCollectionRef);

    let leaderboard: { nickname: string; fastestTime: number }[] = [];
    let userFastestTime: number | null = null; // Store current user's fastest time
    let userPosition: number | null = null; // Store current user's position if they're outside top 10

    // Loop through all user documents and build the leaderboard
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const fastestTimes = userData?.fastestTimes || {};
      const time = fastestTimes[difficulty.toLowerCase()];

      // Only include users who have a valid fastest time for the chosen difficulty
      if (time !== null && time !== undefined) {
        leaderboard.push({ nickname: userData.nickname, fastestTime: time });

        // If this user is the current one, store their fastest time
        if (userData.nickname === nickname) {
          userFastestTime = time;
        }
      }
    });

    // Sort leaderboard by fastest time in ascending order
    leaderboard.sort((a, b) => a.fastestTime - b.fastestTime);

    // Get the top 10 fastest times
    const top10Leaderboard = leaderboard.slice(0, 10);

    // Check if the current user's fastest time exists in the leaderboard
    if (userFastestTime !== null) {
      const userIndex = leaderboard.findIndex(
        (entry) => entry.nickname === nickname
      );
      if (userIndex !== -1 && userIndex >= 10) {
        userPosition = userIndex + 1; // Position is index + 1
      }
    }

    // Respond with the top 10 leaderboard entries and the current user's details
    // Send the response with leaderboard and user data
    res.json({
      leaderboard: top10Leaderboard, // List of top players with their fastest times
      user: {
        nickname, // User's nickname
        fastestTime: userFastestTime, // User's fastest time for the chosen difficulty
        position: userPosition, // User's position on the leaderboard (null if not in the top 10)
      },
    });
  } catch (error) {
    // Handle errors during the request processing
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

app.post("/api/time", async (req, res) => {
  // Check if the user is already authenticated via cookies
  const nickname = req.cookies.nickname;
  if (!nickname) {
    // The user is not authenticated
    res
      .status(401)
      .json({ error: "User not authenticated! Choose a nickname." });
    return;
  }

  // Get the user document reference from Firestore
  const userDocRef = doc(db, "users", nickname);

  // Fetch the user document snapshot from Firestore
  const userDocSnapshot = await getDoc(userDocRef);
  if (!userDocSnapshot.exists()) {
    // User document doesn't exist
    res.status(404).json({ error: "User not found! Choose a nickname." });
    return; // Return if user document doesn't exist
  }

  // Extract the user data from the document snapshot
  const userData = userDocSnapshot.data();

  //
  const { time } = req.body;

  // Save the newly generated game board to Firestore
  await updateDoc(userDocRef, {
    lastTime: time,
  });

  // Respond back to acknowledge the request
  res.json({ message: "Time saved successfully!" });
});

// PATCH request to submit a new fastest time for the leaderboard
app.delete("/api/leaderboard", async (req: Request, res: Response) => {
  try {
    // Extract the elapsed time and difficulty from the request body
    const { difficulty } = req.body;

    // Check if the user is authenticated via cookies
    const nickname = req.cookies.nickname;
    if (!nickname) {
      // The user is not authenticated
      res
        .status(401)
        .json({ error: "User not authenticated! Choose a nickname" });
      return;
    }

    // Get the user document reference from Firestore
    const userDocRef = doc(db, "users", nickname);

    // Fetch the user document snapshot from Firestore
    const userDocSnapshot = await getDoc(userDocRef);
    if (!userDocSnapshot.exists()) {
      // User document doesn't exist
      res.status(404).json({ error: "User not found! Choose a nickname." });
      return; // Return if user document doesn't exist
    }

    // Extract the user data from the document snapshot
    const userData = userDocSnapshot.data();

    // Retrieve the fastest times based on the selected difficulty
    const fastestTimes = userData.fastestTimes || {};

    // Update the fastest time for the selected difficulty
    fastestTimes[difficulty] = null;

    // Save the updated fastestTimes to Firestore
    await updateDoc(userDocRef, { fastestTimes });

    // Respond with a success message
    res.json({
      message: "Fastest time deleted!",
    });
  } catch (error) {
    // Handle errors during the request processing
    res.status(500).json({ error: "Internal server error! Try again." });
  }
});

// Listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
