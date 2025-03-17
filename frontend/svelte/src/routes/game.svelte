<!-- 
    File: game.svelte
    Author: Dominik Šmíd
    Date: 11.12.2024
    Description: 
        This file implements the main game interface using the Svelte framework. 
        It includes the game chat functionality, allowing players to send and 
        receive messages in real time, as well as other game-related UI components.
-->

<script>
    import { onMount } from 'svelte';
    import { tick } from "svelte";
    import { getUser } from "../services/getUser";
    import { generateBoard } from "../services/generateBoard";
    import { flagCell } from "../services/flagCell";
    import { revealCell } from "../services/revealCell";
    import { changeDifficulty } from "../services/changeDifficulty";
    import { sendTime } from "../services/sendTime";
    import { saveTime } from "../services/saveTime";
    import { getChat } from "../services/getChat"
    import { sendMessage } from "../services/sendMessage";
    import { each } from 'svelte/internal';
    
    let data;
    let chat;
    let gameboard;
    let nickname;
    let mines = 0;
    let numofflags = mines;
    let interval;
    let seconds = 0;

    let Easyoption = false;
    let Mediumoption = false;
    let Hardoption = false;

    let gameWon = false;
    let gameLost = false;

    let showChat = false;
    let message;
    let chatInterval = 1000;


    let getdata = async() => {
        try {
            chat = await getChat();
            nickname = await getUser();
            data = await generateBoard();
            gameboard = data.board;
            if (data.lastTime) {
                seconds = data.lastTime;
            }
            mines = gameboard.details.mines;
            // set correct number of mines
            numofflags = (mines - getmines(gameboard));
            // get difficulty
            if (gameboard.difficulty == "easy") {
                Easyoption = true;
                Mediumoption = false;
                Hardoption = false;
            }
            else if (gameboard.difficulty == "medium") {
                Easyoption = false;
                Mediumoption = true;
                Hardoption = false;
            }
            else {
                Easyoption = false;
                Mediumoption = false;
                Hardoption = true;
            }
            // manage start of time
            if (gameboard.status.isLost || gameboard.status.isWon) {
                handleTime(false);
            }
            else if (gameboard.status.isStarted) {
                handleTime(true);
            }
            // manage you won/lost text
            if (gameboard.status.isWon) {
                gameWon = true;
            }
            else if (gameboard.status.isLost) {
                gameLost = true
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }
    
    onMount(() => {
        if (showChat) {
            scrollToBottom();
        }
        document.body.classList.add('dark-bg');
        getdata();
        return () => {
            console.log("saving time");
            saveTime(seconds);
        };
    });

    let getmines = (board) => {
        const rows = board.details.rows;
        const cols = board.details.cols;
        let count = 0;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (board.board[i][j].isFlagged) {count++;}
            }
        }
        return count;
    }

    let handleTime = (started) => {
        if (started) {
            interval = setInterval(() => {
                seconds++;
            }, 1000);
        }
        else {
            seconds = 0;
            clearInterval(interval);
        }
    }

    let handleLeftClick = async(row, col) => {
        if (!gameboard.status.isStarted) {
            handleTime(true);
        }
        try {
            gameboard = await revealCell(row, col, gameboard);
            if (gameboard.status.isWon) {
                sendTime(seconds, gameboard.difficulty);
            }
        }
        catch {}
        if (gameboard.status.isLost || gameboard.status.isWon) {
            if (gameboard.status.isLost) {
                gameLost = true
            }
            else if (gameboard.status.isWon) {
                gameWon = true;
            }
            else {
                gameLost = false;
                gameWon = false;
            }
            clearInterval(interval);
        }
    };

    let handleRightClick = async(event, row, col) => {
        if (event) {
            event.preventDefault();
        }

        try {
            gameboard = await flagCell(row, col, gameboard);
            if (gameboard.board[row][col].isFlagged) {
                decrement(gameboard.status);
            }
            else {
                increment(gameboard.status);
            }
        } catch {}
    };

    let resetboard = async() => {
        try {
            gameboard = await changeDifficulty(gameboard.difficulty);
            mines = gameboard.details.mines;
            numofflags = mines;
            handleTime(false);
        } catch {}
        gameLost = false;
        gameWon = false;
    }

    let difficultyChange = async(option) => {
        try {
            gameboard = await changeDifficulty(option)
            mines = gameboard.details.mines;
            numofflags = mines;
            handleTime(false);
        } catch {}
        gameLost = false;
        gameWon = false;
    }

    let increment = (state) => {
        if (!state.isWon && !state.isLost) {
            numofflags += 1;
        }
    }

    let decrement = (state) => {
        if (!state.isWon && !state.isLost) {
            numofflags -= 1;
        }
    }

    let handleHintEye = async () => {
        for (let r = 0; r < gameboard.details.rows; r++) {
            for (let c = 0; c < gameboard.details.cols; c++) {
                if ((!gameboard.board[r][c].isRevealed) && gameboard.board[r][c].value >= 0) {
                    await handleLeftClick(r, c);
                    seconds += 15;
                    return;
                }
            }
        }
    }

    let handleHintFlag = async() => {
        for (let r = 0; r < gameboard.details.rows; r++) {
            for (let c = 0; c < gameboard.details.cols; c++) {
                if (gameboard.board[r][c].value == -1 && !gameboard.board[r][c].isFlagged) {
                    try {
                        await handleRightClick(null, r, c);
                        seconds += 15;
                        return;
                    }
                    catch (error){
                        console.log(error);
                    }
                }
            }
        }
    }

    let handleEscape = (event) => {
        if (event.key == "Escape") {
            toggleChat();
        }
    };


    let toggleChat = async() => {
        showChat = !showChat;
        await updateChat();
        scrollToBottom();
    }

    let updateChat = async() => {
        if (showChat) {
            chatInterval = setInterval(async() => {
                chat = await getChat();
            }, 1000);
        }
        else {
            clearInterval(chatInterval);
        }
    }

    let handleSubmit = async () => {
        if (message == "") {
            return;
        }
        await sendMessage(message);
        chat = await getChat();
        message = "";

        await tick();
        scrollToBottom();
    }

    let handleEnter = (event) => {
        if (event.key === "Enter") {
            handleSubmit(message);
        }
    }

    let scrollToBottom = () => {
        const chatbox = document.querySelector('.chatbox');
        if (chatbox) {
            chatbox.scrollTop = chatbox.scrollHeight;
        }
    }

</script>

{#if showChat}
    <div class="backdrop" on:click|self={toggleChat} on:keydown={handleEscape}>
        <div class="chatcontainer" on:keydown={handleEscape}>
            <div class="chatheader">
                <div class="greet">Welcome to the game chat!</div>
                <button class="x-btn" on:click={toggleChat}>X</button>
            </div>
            <div class="chatbox">
                {#each chat as messages}
                    <div class="name">{messages.sender}:</div>
                    <div class="message">{messages.content}</div>
                    <div class="date">{new Date(messages.timestamp.seconds * 1000).toUTCString()}</div>
                    <br>
                {/each}
            </div>
            <div class="chatfooter">
                <input class="messageinput" type="text" placeholder="message" bind:value={message} on:keydown={handleEnter}>
                <button class="send-btn" on:click={handleSubmit}>send</button>
            </div>
        </div>
    </div>
{/if}


<main>
    <div class="container">
        <div class="header">
            <a href="#/"><button class="Menu-button">Menu</button></a>
            <h1 class="headline">MINESWEEPER</h1>
            <button class="Reset-button" on:click={resetboard}>Reset</button>
        </div>
        <!-- <div class="headline">{nickname}</div> -->
        <div class="board">
            {#if gameWon || gameLost}
                <div class="sidelabel">Y<br>O<br>U</div>                
            {/if}
            <div class="grid">
                {#if gameboard}
                    {#each gameboard.board as row, rowIndex}
                    <div class="row">
                        {#each row as cell, colIndex}
                            <!-- bomb -->
                            {#if cell.value == -1}
                                {#if cell.isFlagged}
                                    <button
                                        class={gameboard.difficulty == 'hard' ? "lightcellsmall" : "lightcellbig"}
                                        on:contextmenu={(event) => handleRightClick(event, rowIndex, colIndex)}
                                    >🚩</button>
                                {:else if cell.isRevealed}
                                    <button class={gameboard.difficulty == 'hard' ? "redcellsmall" : "redcellbig"}>💣</button>
                                {:else}
                                    {#if gameboard.status.isLost}
                                        <button class={gameboard.difficulty == 'hard' ? "lightcellsmall" : "lightcellbig"}>💣</button>
                                    {:else}
                                    <button
                                        class={gameboard.difficulty == 'hard' ? "lightcellsmall" : "lightcellbig"}
                                        aria-label="emptycell"
                                        on:click={() => handleLeftClick(rowIndex, colIndex)}
                                        on:contextmenu={(event) => handleRightClick(event, rowIndex, colIndex)}
                                    ></button>
                                    {/if}
                                {/if}
                            <!-- number -->
                            {:else}
                                {#if cell.isFlagged}
                                    {#if gameboard.status.isLost}
                                        <button class={gameboard.difficulty == 'hard' ? "redcellsmall" : "redcellbig"}>🚩</button>
                                    {:else}
                                        <button
                                            class={gameboard.difficulty == 'hard' ? "lightcellsmall" : "lightcellbig"}
                                            on:contextmenu={(event) => handleRightClick(event, rowIndex, colIndex)}
                                        >🚩</button>
                                    {/if}
                                {:else if cell.isRevealed}
                                    {#if cell.value == 0}
                                        <button class={gameboard.difficulty == 'hard' ? "zerodarksmall" : "zerodarkbig"} aria-label="emptycell"></button>
                                    {:else}
                                        <button class={gameboard.difficulty == 'hard' ? "darkcellsmall" : "darkcellbig"}>{cell.value}</button>
                                    {/if}
                                {:else}
                                    <button
                                        class={gameboard.difficulty == 'hard' ? "lightcellsmall" : "lightcellbig"}
                                        aria-label="emptycell"
                                        on:click={() => handleLeftClick(rowIndex, colIndex)}
                                        on:contextmenu={(event) => handleRightClick(event, rowIndex, colIndex)}
                                    ></button>
                                {/if}
                            {/if}
                        {/each}
                    </div>
                    {/each}
                {:else}
                    <div class="nick">loading gameboard</div>
                {/if}
            </div>
            {#if gameWon}
                <div class="sidelabel">W<br>O<br>N</div>                
            {:else if gameLost}
                <div class="sidelabel">L<br>O<br>S<br>T</div>
            {/if}
        </div>

        <div class="hints">
            <button class="hint-btn" on:click={handleHintEye}><img class="eye" src="img/eye.png" alt="eye icon"></button>
            <button class="hint-btn" on:click={handleHintFlag}><img class="hintflag" src="img/hintflag.png" alt="hint flag"></button>
        </div>

        <div class="footer">
            <button class="Time">Time: {Math.floor(seconds / 60)}:{seconds % 60 < 10 ? "0"+ seconds%60 : seconds%60}</button>
            <button class="MinesLeft">Mines left: {numofflags}/{mines}</button>
            <select>
                <option on:click={() => difficultyChange("easy")} value="easy" selected={Easyoption}>Easy</option>
                <option on:click={() => difficultyChange("medium")} value="medium" selected={Mediumoption}>Medium</option>
                <option on:click={() => difficultyChange("hard")} value="hard" selected={Hardoption}>Hard</option>
            </select>
        </div>
    </div>
    <button class="chat-btn" on:click={toggleChat}>Open Chat</button>
</main>

<style>
    /* CHAT */
    .chat-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        font-size: 1.2rem;
        height: fit-content;
    }

    .backdrop {
        width: 100%;
        height: 100%;
        position: fixed;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1;
        display: flex;
        justify-content: flex-end;
    }

    .chatcontainer {
        width: 500px;
        min-width: 20%;
        height: 100%;
        background-color: rgba(10, 10, 10, 0.8);
        color: white;
        border-left: 2px solid white;
        display: flex;
        flex-direction: column;
    }

    .chatbox {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 80px;
        padding: 0 15px;
    }

    .chatheader {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        border-bottom: 2px solid white;
        padding: 15px 15px;
        background-color: black;
    }

    .chatfooter {
        position: fixed;
        bottom: 0;
        width: 100%;
        background-color: black;
        border-top: 2px solid white;
        padding: 15px 15px;
    }

    .greet {
        font-size: 1.7rem;
    }

    .x-btn {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 1rem;
        padding: 5px;
        width: 30px;
        height: 30px;
        border-radius: 5px;
        background-color: black;
        color: white;
        margin: 0;
        right: 20px;
        top: 20px;
        position: absolute;
    }

    .name {
        font-size: 1.3rem;
        font-weight: bold;
    }

    .message {
        font-size: 1rem;
    }

    .date {
        font-size: 0.8rem;
        display: flex;
        justify-content: end;
        margin: 0 10px 10px 0;
    }

    .messageinput {
        width: 20%;
    }

    .send-btn {
        font-size: 1.2rem;
        border-radius: 8px;
        margin: 0 0 0 10px;
    }

    /* HINTS */
    .hint-btn {
        font-size: 0;
        margin: 0;
        padding: 0;
        background-color: #0A0B20;
        border: none;
    }

    .hint-btn:active {
        background-color:#0A0B20;
    }
    
    .hints {
        display: flex;
        justify-content: center;
        gap: 100px;
        margin: 1rem 0;
    }

    .eye {
        color: white;
        height: 40px;
        cursor: pointer;
    }

    .hintflag {
        filter: brightness(0) invert(1);
        width: 40px;
        cursor: pointer;
    }

    .footer {
        display: flex;
        justify-content: center;
        gap: 5rem;
        margin: 0;
    }

    select {
        font-size: 2rem;
        border-radius: 10pt;
        margin: 1rem;
        cursor: pointer;
        text-align: center;
    }

    option {
        font-size: 25px;
        font-weight: bold;
        cursor: pointer;
        color: black;
    }

    main {
        display: flex;
        justify-content: center;
        height: 100%;
        position: relative;
        overflow: scroll;
    }

    .container {
        display: flex;
        flex-direction: column;
    }

    .board {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: auto;
        position: relative;
    }

    .grid {
        display: flex;
        flex-direction: column;
    }

    .sidelabel {
        margin: 0 5rem;
        font-size: 5rem;
        font-weight: bold;
        color: white;
        text-align: center;
        display: flex;
        align-self: center;
    }

    .row {
        display: flex;
    }

    /* BIG CELLS */
    .redcellbig {
        font-size: 1.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        background-color: #FF7373;
        border: none;
        width: 3rem;
        height: 3rem;
        margin: 1px;
        border-radius: 5px;
        box-shadow: inset 6px 6px 2px rgba(0, 0, 0, 0.2)
    }

    .lightcellbig {
        font-size: 1.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        background-color: #7CD3E7;
        border-color: #0A0B20;
        width: 3rem;
        height: 3rem;
        margin: 1px;
        border-radius: 5px;
        box-shadow: inset 6px 6px 2px rgba(0, 0, 0, 0.2)
    }

    .zerodarkbig {
        background-color: #0A0B20;
        width: 3rem;
        height: 3rem;
        margin: 1px;
        border: solid 4px black;
        border-radius: 5px;
    }

    .darkcellbig {
        font-size: 1.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        background-color: #0A0B20;
        border-color: white;
        color: white;
        width: 3rem;
        height: 3rem;
        margin: 1px;
        border-radius: 5px;
        box-shadow: inset -6px -6px 3px rgba(255, 255, 255, 0.4)
    }

    /* SMALL CELLS */
    .redcellsmall {
        font-size: 1.2rem;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        background-color: #FF7373;
        border: none;
        width: 2rem;
        height: 2rem;
        margin: 0px;
        border-radius: 5px;
        box-shadow: inset 4px 4px 2px rgba(0, 0, 0, 0.2)
    }

    .lightcellsmall {
        font-size: 1.2rem;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        background-color: #7CD3E7;
        border-color: #0A0B20;
        width: 2rem;
        height: 2rem;
        margin: 0px;
        border-radius: 5px;
        box-shadow: inset 4px 4px 2px rgba(0, 0, 0, 0.2)
    }

    .zerodarksmall {
        background-color: #0A0B20;
        width: 2rem;
        height: 2rem;
        margin: 0px;
        border-color: black;
        border-radius: 5px;
    }

    .darkcellsmall {
        font-size: 1.2rem;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        background-color: #0A0B20;
        border-color: white;
        color: white;
        width: 2rem;
        height: 2rem;
        margin: 0px;
        border-radius: 5px;
        box-shadow: inset -4px -4px 3px rgba(255, 255, 255, 0.4)
    }

    .Menu-button {
    position: absolute;
    top: 5%;
    left: 5%;
    }

    .Reset-button {
    position: absolute;
    top: 5%;
    right: 5%;
    }

    .headline {
    color: white;
    font-size: 4rem;
    text-align: center;
    }

    .nick {
        color: white;
        font-size: 3rem;
    }

    /* width < 900 */
    @media (max-width: 900px) {
        .container {
            align-self: center;
        }
        
        .headline {
            font-size: 2rem;
        }

        .Reset-button {
            font-size: 1.2rem;
            top: 0.5rem;
            right: 0.5rem;
        }

        .Menu-button {
            font-size: 1.2rem;
            top: 0.5rem;
            left: 0.5rem;
        }

        .board {
            margin-top: 1rem;
            margin-bottom: 1rem;
        }

        /* BIG CELLS */
        .redcellbig {
            font-size: 1rem;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            background-color: #FF7373;
            border: none;
            width: 1.5rem;
            height: 1.5rem;
            margin: 0px;
            border-radius: 5px;
        }

        .lightcellbig {
            font-size: 1rem;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            background-color: #7CD3E7;
            border-color: #0A0B20;
            width: 1.5rem;
            height: 1.5rem;
            margin: 0px;
            border-radius: 5px;
        }

        .zerodarkbig {
            font-size: 1rem;
            background-color: #0A0B20;
            width: 1.5rem;
            height: 1.5rem;
            margin: 0px;
            border: none;
            border-radius: 5px;
        }

        .darkcellbig {
            font-size: 1rem;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            background-color: #0A0B20;
            width: 1.5rem;
            height: 1.5rem;
            margin: 0px;
        }

        /* SMALL CELLS */
        .redcellsmall {
            font-size: 0.7rem;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            background-color: #FF7373;
            border: none;
            width: 1.2rem;
            height: 1.2rem;
            margin: 0px;
            border-radius: 5px;
            box-shadow: inset 4px 4px 2px rgba(0, 0, 0, 0.2)
        }

        .lightcellsmall {
            font-size: 0.7rem;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            background-color: #7CD3E7;
            border-color: #0A0B20;
            width: 1.2rem;
            height: 1.2rem;
            margin: 0px;
            border-radius: 5px;
            box-shadow: inset 4px 4px 2px rgba(0, 0, 0, 0.2)
        }

        .zerodarksmall {
            font-size: 0px;
            background-color: #0A0B20;
            width: 1.2rem;
            height: 1.2rem;
            margin: 0px;
            border: solid 0px black;
            border-radius: 5px;
        }

        .darkcellsmall {
            font-size: 1rem;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            background-color: #0A0B20;
            border-color: white;
            color: white;
            width: 1.2rem;
            height: 1.2rem;
            margin: 0px;
            border-radius: 5px;
            box-shadow: inset -4px -4px 3px rgba(255, 255, 255, 0.4)
        }

        .sidelabel{
            margin: 1rem;
            font-size: 3rem;
            font-weight: bold;
            color: white;
            text-align: center;
            display: flex;
            align-self: center;
        }

        .Time, .MinesLeft, select, option {
            font-size: 1.2rem;
            margin: 0px;
        }

        .footer {
            gap: 1rem;
        }
    }  
</style>